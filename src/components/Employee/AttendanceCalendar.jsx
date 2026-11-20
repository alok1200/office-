import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { calendarStatuses, getCalendarStatus } from '../Common/calendarStatus';
import { StatusBadge } from '../Common/StatusBadge';
import { Modal } from '../Common/Modal';
import {useDataRefresh} from '../../hooks/useDataRefresh';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Coffee,
  Info,
  LogIn,
  LogOut,
  AlertCircle
} from 'lucide-react';

export function AttendanceCalendar() {
  const { currentUserId,isSuperAdmin } = useAuth();
  const todayStr=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const [employee,setEmployee]=useState(''),[employees,setEmployees]=useState([]),[directoryError,setDirectoryError]=useState('');
  const [error,setError]=useState('');const sequence=useRef(0);
  const [currentYear, setCurrentYear] = useState(Number(todayStr.slice(0,4)));
  const [currentMonth, setCurrentMonth] = useState(Number(todayStr.slice(5,7)));
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchCalendar = async (silent=false) => {
    const ticket=++sequence.current;
    if(silent!==true)setLoading(true);setError('');
    try {
      const res = await api.getMyCalendar(currentUserId, currentYear, currentMonth, isSuperAdmin ? employee : undefined);
      if(ticket!==sequence.current)return;
      if(!res.success)throw new Error(res.error || 'Could not load calendar.');
      if (res.success && res.data) {
        setCalendarData(res.data);
        setSelectedDay(old=>old?res.data.days.find(day=>day.date===old.date)||null:null);
      }
    } catch (err) {
      if(ticket===sequence.current)setError(err.message || 'Could not load calendar.');
    } finally {
      if(ticket===sequence.current)setLoading(false);
    }
  };

  useEffect(() => {
    setCalendarData(null);setSelectedDay(null);fetchCalendar();
    return()=>{++sequence.current;};
  }, [currentUserId, currentYear, currentMonth, employee, isSuperAdmin]);
  const loadDirectory=async()=>{try{const response=await api.getCompanyEmployees(currentUserId);if(!response.success)throw new Error(response.error);setEmployees(response.data.filter(row=>row.role!=='SUPER_ADMIN'));setDirectoryError('');}catch(error){setDirectoryError(error.message || 'Could not load employees.');}};
  useEffect(()=>{if(isSuperAdmin)loadDirectory();},[isSuperAdmin,currentUserId]);
  useDataRefresh(()=>{fetchCalendar(true);if(isSuperAdmin)loadDirectory();},['attendance','requests','holidays','employees']);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];



  const getDayCardStyles = (dayItem) => {
    const isToday = dayItem.date === todayStr;
    const style = getCalendarStatus(dayItem.status);
    const todayRing = isToday ? 'ring-2 ring-blue-600 ring-offset-2' : '';
    if (style?.card) return `${todayRing} ${style.card}`;
    return `${todayRing} border border-slate-200 text-black bg-white hover:bg-slate-50`;
  };

  const getStatusDotColor = status => getCalendarStatus(status)?.dot;

  const days = calendarData?.days || [];
  const firstDayOfWeek = days.length > 0 ? days[0].dayOfWeek : 0;
  const blankCells = Array(firstDayOfWeek).fill(null);

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Month/Year */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>{isSuperAdmin ? 'Company Attendance Calendar' : 'My Attendance Calendar'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Monthly attendance breakdown, leaves, holidays, and punch details
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-blue-50 text-blue-600 transition-colors shadow-2xs"
            title="Previous Month" disabled={currentYear===2000 && currentMonth===1}
          >
            <ChevronLeft className="w-5 h-5 text-blue-600" />
          </button>
          <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-center min-w-[170px] shadow-2xs">
            <span className="text-base font-black text-black">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-blue-50 text-blue-600 transition-colors shadow-2xs"
            title="Next Month" disabled={currentYear===2100 && currentMonth===12}
          >
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {isSuperAdmin && <label className="flex flex-wrap items-center gap-3 text-sm font-bold">Employee<select value={employee} onChange={e=>setEmployee(e.target.value)} className="rounded-xl border border-blue-200 bg-white p-2 text-black"><option value="">Company holidays</option>{employees.map(person=><option key={person.id} value={person.id}>{person.first_name} {person.last_name} ({person.employee_id})</option>)}</select></label>}
      {directoryError && <p role="alert" className="sa-request-error">{directoryError}<button onClick={loadDirectory}>Retry employees</button></p>}
      {error && <p role="alert" className="sa-request-error">{error}<button onClick={()=>fetchCalendar()}>Retry calendar</button></p>}
      {/* Visual Legend */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Status Legend & Status Treatment
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(calendarStatuses).map(([status, style]) => (
            <div key={status} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${style.badge}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
              <span>{style.label} ({style.color})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dw, i) => (
            <div key={dw} className={`text-xs font-bold py-2 ${i === 0 || i === 6 ? 'text-slate-400' : 'text-black'}`}>
              {dw}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-2">
          {blankCells.map((_, idx) => (
            <div key={`blank-${idx}`} className="h-24 sm:h-28 rounded-xl bg-white border border-slate-100 opacity-40" />
          ))}

          {days.map((item) => {
            const isToday = item.date === todayStr;
            const style = getCalendarStatus(item.status);
            const solid = Boolean(style?.solid);
            return (
              <div
                key={item.date}
                onClick={() => setSelectedDay(item)}
                className={`h-24 sm:h-28 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between shadow-xs ${getDayCardStyles(item)}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${isToday ? (solid ? 'bg-white text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs' : 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs') : (solid ? 'text-white' : 'text-black')}`}>
                    {item.day}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.decision?.status === 'REJECTED' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white">Rejected</span>
                    )}
                    {getStatusDotColor(item.status) && <span className={`w-2 h-2 rounded-full ${getStatusDotColor(item.status)}`} />}
                  </div>
                </div>

                <div className="mt-1">
                  <p className={`text-[11px] font-bold truncate ${solid ? 'text-white' : 'text-black'}`}>
                    {style?.label || (item.status === 'NOT_APPLICABLE' ? '—' : item.status.replaceAll('_', ' '))}
                  </p>
                  {item.statusDetails && (
                    <p className={`text-[10px] truncate font-medium ${solid ? 'text-blue-100' : 'text-slate-500'}`} title={item.statusDetails}>
                      {item.statusDetails}
                    </p>
                  )}
                  {item.attendance?.total_work_minutes > 0 && (
                    <p className={`text-[10px] font-mono font-bold mt-0.5 ${solid ? 'text-white' : 'text-black'}`}>
                      {Math.floor(item.attendance.total_work_minutes / 60)}h {item.attendance.total_work_minutes % 60}m
                    </p>
                  )}
                </div>

                <div className={`text-[10px] flex items-center justify-between ${solid ? 'text-blue-100' : 'text-slate-500'}`}>
                  {isToday ? <span className={`font-bold ${solid ? 'text-white' : 'text-blue-600'}`}>Today</span> : <span />}
                  <span className={`${solid ? 'text-white' : 'text-blue-600'} hover:underline text-[9px] font-bold`}>Details &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDay(null)}
          title={`Attendance Details — ${selectedDay.date}`}
        >
          <div className="space-y-4 bg-white text-black">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="text-xs font-bold text-black">Calculated Status:</span>
              <StatusBadge status={selectedDay.status} variant="calendar" />
            </div>

            {selectedDay.holiday && (
              <div className="p-4 rounded-xl bg-white border-2 border-blue-300">
                <p className="text-xs font-black text-black">Company Holiday</p>
                <p className="text-sm font-bold text-black mt-1">{selectedDay.holiday.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedDay.holiday.description}</p>
              </div>
            )}

            {selectedDay.decision && (
              <div className={`p-3.5 rounded-xl border text-xs ${selectedDay.decision.status === 'APPROVED' ? 'bg-blue-50 border-blue-300 text-blue-950' : 'bg-red-50 border-red-300 text-red-950'}`}>
                <p className="font-black">
                  Super Admin Decision: {selectedDay.decision.status === 'APPROVED' ? 'Accepted' : 'Rejected'} ({selectedDay.decision.request_type})
                </p>
                {selectedDay.decision.remarks && (
                  <p className="mt-1 font-medium">{selectedDay.decision.remarks}</p>
                )}
              </div>
            )}

            {selectedDay.statusDetails && !selectedDay.holiday && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-black">
                <span className="font-bold text-black">Remarks: </span>
                {selectedDay.statusDetails}
              </div>
            )}

            {selectedDay.attendance ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-500 font-bold">Check-In</p>
                    <p className="text-sm font-black text-black mt-1">
                      {selectedDay.attendance.check_in
                        ? new Date(selectedDay.attendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'None'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-500 font-bold">Check-Out</p>
                    <p className="text-sm font-black text-black mt-1">
                      {selectedDay.attendance.check_out
                        ? new Date(selectedDay.attendance.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'None'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-blue-200 bg-white">
                    <p className="text-xs text-blue-600 font-bold">Working Duration</p>
                    <p className="text-sm font-black text-black mt-1 font-mono">
                      {Math.floor(selectedDay.attendance.total_work_minutes / 60)}h {selectedDay.attendance.total_work_minutes % 60}m
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-200 bg-white">
                    <p className="text-xs text-blue-600 font-bold">Break Duration</p>
                    <p className="text-sm font-black text-black mt-1 font-mono">
                      {Math.floor(selectedDay.attendance.total_break_minutes / 60)}h {selectedDay.attendance.total_break_minutes % 60}m
                    </p>
                  </div>
                </div>

                {selectedDay.attendance.breaks && selectedDay.attendance.breaks.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-black mb-2">Recorded Break Intervals:</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedDay.attendance.breaks.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-600 font-medium">Break #{i + 1}</span>
                          <span className="font-mono font-bold text-black">
                            {new Date(b.break_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' → '}
                            {b.break_end ? new Date(b.break_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                          </span>
                          <span className="text-blue-600 font-black">{b.duration_minutes || 0}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !selectedDay.holiday && selectedDay.status !== 'WEEKLY_OFF' && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                  No attendance punches recorded for this date.
                </div>
              )
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-black text-xs font-bold shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
