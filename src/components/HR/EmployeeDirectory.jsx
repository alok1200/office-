import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { Search, Mail, Calendar, Eye, AlertCircle, Building } from 'lucide-react';

export function EmployeeDirectory() {
  const { currentUserId } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedEmp, setInspectedEmp] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.getCompanyEmployees(currentUserId, {
        department: selectedDept,
        search: searchQuery
      });
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentUserId, selectedDept]);

  const handleInspect = async (emp) => {
    setInspectedEmp(emp);
    setLoadingHistory(true);
    try {
      const res = await api.getEmployeeAttendanceHistory(currentUserId, emp.id, 2026, 11);
      if (res.success && res.data) {
        setAttendanceHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-black">Company Employee Directory</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Read-only company personnel list, contact info, and attendance records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchEmployees()}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 font-medium text-xs">
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 font-medium text-xs">
            No employees found.
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                      alt={emp.first_name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-100"
                    />
                    <div>
                      <h4 className="text-sm font-black text-black leading-tight">
                        {emp.first_name} {emp.last_name}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">{emp.designation}</p>
                      <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-black border border-slate-200 mt-1">
                        {emp.employee_id}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-black border border-slate-300">
                    {emp.role === 'HR_ADMIN' ? 'HR' : emp.role === 'SUPER_ADMIN' ? 'Admin' : 'Staff'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-black">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{emp.department_name}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Joined: {new Date(emp.joining_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-black font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Active Employee
                </span>
                <button
                  onClick={() => handleInspect(emp)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-black text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Inspect History</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Employee Profile & Attendance History Modal */}
      {inspectedEmp && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedEmp(null)}
          title={`Employee Record: ${inspectedEmp.first_name} ${inspectedEmp.last_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 bg-white text-black">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-black flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>HR Admin View-Only: Editing profile details or altering permissions is reserved for Super Admin.</span>
            </div>

            {/* Profile Summary */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <img
                src={inspectedEmp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                alt={inspectedEmp.first_name}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-200 shadow-xs"
              />
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-black">
                  {inspectedEmp.first_name} {inspectedEmp.last_name}
                </h3>
                <p className="text-xs text-slate-600 font-medium">{inspectedEmp.designation} • {inspectedEmp.department_name}</p>
                <div className="flex items-center gap-2 text-xs text-black pt-1 font-medium">
                  <span>ID: <strong className="font-mono text-black">{inspectedEmp.employee_id}</strong></span>
                  <span>•</span>
                  <span>{inspectedEmp.email}</span>
                </div>
              </div>
            </div>

            {/* Attendance History Section */}
            <div>
              <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">
                Recent Attendance History (November 2026)
              </h4>

              {loadingHistory ? (
                <div className="text-center py-6 text-xs text-slate-500 font-medium">Loading attendance history...</div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  No attendance history recorded for this month.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-black font-black border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Date</th>
                        <th className="px-3.5 py-2.5">Status</th>
                        <th className="px-3.5 py-2.5">Check-In</th>
                        <th className="px-3.5 py-2.5">Check-Out</th>
                        <th className="px-3.5 py-2.5">Work Time</th>
                        <th className="px-3.5 py-2.5">Break</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {attendanceHistory.map((att) => (
                        <tr key={att.id}>
                          <td className="px-3.5 py-2.5 font-bold text-black">{att.work_date}</td>
                          <td className="px-3.5 py-2.5">
                            <StatusBadge status={att.status} />
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-black font-medium">
                            {att.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-black font-medium">
                            {att.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-black font-black">
                            {Math.floor(att.total_work_minutes / 60)}h {att.total_work_minutes % 60}m
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-700 font-bold">
                            {att.total_break_minutes}m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedEmp(null)}
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
