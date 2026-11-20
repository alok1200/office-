import {useDataRefresh} from '../../hooks/useDataRefresh';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../Common/StatusBadge';
import { Modal } from '../Common/Modal';
import { Search, Calendar, Eye, AlertCircle, RefreshCw } from 'lucide-react';

export function CompanyAttendanceTable() {
  const { currentUserId } = useAuth();
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,setError]=useState('');
  const sequence=useRef(0);
  const [targetDate, setTargetDate] = useState(() => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedRecord, setInspectedRecord] = useState(null);

  const fetchAttendance = async (silent=false) => {
    const ticket=++sequence.current;
    if(silent!==true){setLoading(true);setAttendanceList([]);}setError('');
    try {
      const res = await api.getCompanyAttendance(currentUserId, {
        date: targetDate,
        department: selectedDept,
        status: selectedStatus,
        search: searchQuery
      });
      if(ticket!==sequence.current)return;
      if(!res.success)throw new Error(res.error || 'Could not load company attendance.');
      if (res.success && res.data) {
        setAttendanceList(res.data);
        setInspectedRecord(old=>old?res.data.find(row=>row.employee_id===old.employee_id)||null:null);
      }
    } catch (err) {
      if(ticket===sequence.current)setError(err.message || 'Could not load company attendance.');
    } finally {
      if(ticket===sequence.current)setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    return ()=>{++sequence.current;};
  }, [currentUserId, targetDate, selectedDept, selectedStatus]);

  useDataRefresh(()=>fetchAttendance(true),['attendance','requests','employees','holidays']);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  };

  const formatDuration = (mins) => {
    if (!mins) return '0h 0m';
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Table Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-black">Company Attendance Overview</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Read-only company-wide attendance logs and punch duration records
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent font-bold text-black focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-black font-bold focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Product & Design">Product & Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance & Operations">Finance & Operations</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-black font-bold focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="LEAVE">Leave</option>
            <option value="ABSENT">Absent</option><option value="NOT_CHECKED_IN">Not checked in</option><option value="WFH">WFH</option><option value="OFFICIAL_WORK_OUTSIDE">Official work outside</option><option value="HOLIDAY">Holiday</option><option value="FUTURE">Future</option><option value="WEEKLY_OFF">Weekly off</option>
          </select>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
          </form>

          <button
            onClick={fetchAttendance}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 transition-colors shadow-2xs"
            title="Refresh Table"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>
      </div>

      {error && <p role="alert" className="sa-request-error">{error} <button type="button" onClick={fetchAttendance}>Retry</button></p>}
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-white text-black font-black uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5">Employee</th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Check-In</th>
              <th className="px-4 py-3.5">Check-Out</th>
              <th className="px-4 py-3.5">Work Time</th>
              <th className="px-4 py-3.5">Breaks</th>
              <th className="px-4 py-3.5">Break Time</th>
              <th className="px-4 py-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500 font-medium">
                  Loading attendance records...
                </td>
              </tr>
            ) : attendanceList.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500 font-medium">
                  No attendance records matching your criteria.
                </td>
              </tr>
            ) : (
              attendanceList.map((row) => {
                const breakCount = Array.isArray(row.breaks) ? row.breaks.length : 0;
                const onBreak = row.current_state === 'ON_BREAK' || (Array.isArray(row.breaks) && row.breaks.some(b => !b.break_end));
                return (
                <tr key={`${row.emp_code || row.employee_id}-${row.work_date || targetDate}`} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-black text-black">{row.first_name} {row.last_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono font-bold">{row.emp_code}</div>
                  </td>
                  <td className="px-4 py-3.5 text-black font-medium">{row.department_name}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-black">{formatTime(row.check_in)}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-black">{formatTime(row.check_out)}</td>
                  <td className="px-4 py-3.5 font-mono font-black text-black">
                    {formatDuration(row.total_work_minutes)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-black">
                        {breakCount} {breakCount === 1 ? 'break' : 'breaks'}
                      </span>
                      {onBreak && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                    {formatDuration(row.total_break_minutes)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setInspectedRecord(row)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-black font-bold flex items-center gap-1.5 ml-auto transition-colors shadow-2xs"
                      title="Inspect record details"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspection Modal */}
      {inspectedRecord && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedRecord(null)}
          title={`Punch Details: ${inspectedRecord.first_name} ${inspectedRecord.last_name} (${inspectedRecord.emp_code})`}
        >
          <div className="space-y-4 bg-white text-black">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>HR Admin View-Only: Editing punch times or regularizing is reserved for Super Admin.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Work Date</span>
                <p className="text-sm font-black text-black">{inspectedRecord.work_date}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Attendance Status</span>
                <div className="mt-0.5"><StatusBadge status={inspectedRecord.status} /></div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Check-In</span>
                <p className="text-sm font-black text-black font-mono">{formatTime(inspectedRecord.check_in)}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Check-Out</span>
                <p className="text-sm font-black text-black font-mono">{formatTime(inspectedRecord.check_out)}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-200">
                <span className="text-[11px] text-blue-600 font-bold">Net Working Time</span>
                <p className="text-sm font-black text-black font-mono">{formatDuration(inspectedRecord.total_work_minutes)}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-200">
                <span className="text-[11px] text-blue-600 font-bold">Breaks Taken / Duration</span>
                <p className="text-sm font-black text-black font-mono">
                  {Array.isArray(inspectedRecord.breaks) ? inspectedRecord.breaks.length : 0} ({formatDuration(inspectedRecord.total_break_minutes)})
                </p>
              </div>
            </div>

            {inspectedRecord.breaks && inspectedRecord.breaks.length > 0 && (
              <div>
                <p className="text-xs font-bold text-black mb-2">Recorded Breaks Breakdown:</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {inspectedRecord.breaks.map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-600 font-medium">Break #{i + 1}</span>
                      <span className="font-mono text-black font-bold">
                        {formatTime(b.break_start)} → {b.break_end ? formatTime(b.break_end) : 'Active'}
                      </span>
                      <span className="font-black text-blue-600">{b.duration_minutes || 0}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedRecord(null)}
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
