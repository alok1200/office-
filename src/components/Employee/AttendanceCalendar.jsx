import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { calendarStatuses, getCalendarStatus } from '../Common/calendarStatus';
import { StatusBadge } from '../Common/StatusBadge';
import { Modal } from '../Common/Modal';
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
  const { currentUserId } = useAuth();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(11); // November
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await api.getMyCalendar(currentUserId, currentYear, currentMonth);
      if (res.success && res.data) {
        setCalendarData(res.data);
      }
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentUserId, currentYear, currentMonth]);

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

  const todayStr = new Date().toISOString().split('T')[0];

  const getDayCardStyles = (dayItem) => {
    const isToday = dayItem.date === todayStr;
    const baseBorder = isToday ? 'ring-2 ring-blue-600 ring-offset-2' : 'border border-slate-200';

    const style = getCalendarStatus(dayItem.status);
    return `${baseBorder} text-black ${style?.card || 'bg-white hover:bg-slate-50'}`;
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
            <span>My Attendance Calendar</span>
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
            title="Previous Month"
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
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

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
            return (
              <div
                key={item.date}
                onClick={() => setSelectedDay(item)}
                className={`h-24 sm:h-28 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between shadow-xs ${getDayCardStyles(item)}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : 'text-black'}`}>
                    {item.day}
                  </span>
                  {getStatusDotColor(item.status) && <span className={`w-2 h-2 rounded-full ${getStatusDotColor(item.status)}`} />}
                </div>

                <div className="mt-1">
                  <p className="text-[11px] font-bold text-black truncate">
                    {getCalendarStatus(item.status)?.label || item.status.replaceAll('_', ' ')}
                  </p>
                  {item.statusDetails && (
                    <p className="text-[10px] text-slate-500 truncate font-medium" title={item.statusDetails}>
                      {item.statusDetails}
                    </p>
                  )}
                  {item.attendance?.total_work_minutes > 0 && (
                    <p className="text-[10px] text-black font-mono font-bold mt-0.5">
                      {Math.floor(item.attendance.total_work_minutes / 60)}h {item.attendance.total_work_minutes % 60}m
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  {isToday ? <span className="font-bold text-blue-600">Today</span> : <span />}
                  <span className="text-blue-600 hover:underline text-[9px] font-bold">Details &rarr;</span>
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
