import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Ticket,
  Check,
  X,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Filter,
  User,
  ShieldCheck,
  Edit3,
  CalendarDays,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export function SuperAdminTicketsPage() {
  const { currentUserId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [attendanceEditModal, setAttendanceEditModal] = useState(null); // { employee_id, employee_name, work_date, check_in, check_out, status, notes, request_id }
  const [directEditModalOpen, setDirectEditModalOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // { request }
  const [rejectNote, setRejectNote] = useState('');
  const [savingAction, setSavingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  // Employees list for Direct Attendance Edit
  const [companyEmployees, setCompanyEmployees] = useState([]);

  const fetchAllRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAllSuperAdminRequests(currentUserId, {
        status: statusFilter,
        type: typeFilter,
        role: roleFilter,
        search
      });
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        setError(res.error || 'Failed to fetch tickets.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, statusFilter, typeFilter, roleFilter, search]);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  useEffect(() => {
    // Load company employees for direct attendance editing
    api.getCompanyEmployees(currentUserId).then((res) => {
      if (res.success && res.data) {
        setCompanyEmployees(res.data);
      }
    }).catch(() => {});
  }, [currentUserId]);

  // Open Edit Attendance for a request
  const openEditAttendanceForRequest = (req) => {
    const day = String(req.start_date).slice(0, 10);
    // Parse requested times or existing recorded times
    let defaultIn = '09:30';
    let defaultOut = '18:30';

    if (req.metadata?.correction?.in_time) {
      defaultIn = req.metadata.correction.in_time;
    } else if (req.recorded_check_in) {
      try {
        const d = new Date(req.recorded_check_in);
        defaultIn = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      } catch {}
    }

    if (req.metadata?.correction?.out_time) {
      defaultOut = req.metadata.correction.out_time;
    } else if (req.recorded_check_out) {
      try {
        const d = new Date(req.recorded_check_out);
        defaultOut = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      } catch {}
    }

    setAttendanceEditModal({
      employee_id: req.employee_id,
      employee_name: `${req.first_name} ${req.last_name}`,
      emp_code: req.emp_code,
      department_name: req.department_name,
      employee_role: req.employee_role,
      work_date: day,
      check_in: defaultIn,
      check_out: defaultOut,
      status: req.recorded_status || 'PRESENT',
      notes: req.request_type === 'REGULARIZATION'
        ? `Regularized attendance for ticket #${req.id} (${req.reason})`
        : `Attendance approved/edited for ticket #${req.id}`,
      request_id: req.id
    });
    setActionError('');
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceEditModal || savingAction) return;

    setSavingAction(true);
    setActionError('');

    try {
      const payload = {
        employee_id: attendanceEditModal.employee_id,
        work_date: attendanceEditModal.work_date,
        check_in: attendanceEditModal.check_in,
        check_out: attendanceEditModal.check_out,
        status: attendanceEditModal.status,
        notes: attendanceEditModal.notes,
        request_id: attendanceEditModal.request_id || null
      };

      const res = await api.editAttendanceBySuperAdmin(currentUserId, payload);
      if (res.success) {
        setNotice(
          `Attendance for ${attendanceEditModal.employee_name} on ${attendanceEditModal.work_date} successfully updated in database.`
        );
        setAttendanceEditModal(null);
        await fetchAllRequests();
        setTimeout(() => setNotice(''), 6000);
      } else {
        setActionError(res.error || 'Failed to edit attendance.');
      }
    } catch (err) {
      setActionError(err.message || 'Error updating attendance.');
    } finally {
      setSavingAction(false);
    }
  };

  const handleRejectRequest = async (e) => {
    e.preventDefault();
    if (!rejectModal || savingAction) return;
    if (rejectNote.trim().length < 5) {
      setActionError('Please provide a rejection note of at least 5 characters.');
      return;
    }

    setSavingAction(true);
    setActionError('');

    try {
      const res = await api.reviewSuperAdminRequest(currentUserId, rejectModal.request.id, {
        status: 'REJECTED',
        note: rejectNote.trim()
      });
      if (res.success) {
        setNotice(`Ticket #${rejectModal.request.id} rejected.`);
        setRejectModal(null);
        setRejectNote('');
        await fetchAllRequests();
        setTimeout(() => setNotice(''), 6000);
      } else {
        setActionError(res.error || 'Failed to reject request.');
      }
    } catch (err) {
      setActionError(err.message || 'Error rejecting request.');
    } finally {
      setSavingAction(false);
    }
  };

  const formatIST = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return '—';
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const regCount = requests.filter((r) => r.request_type === 'REGULARIZATION').length;
  const hrCount = requests.filter((r) => r.employee_role === 'HR_ADMIN').length;

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">HR-Requests &amp; Tickets</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Every request and attendance correction ticket is listed here. Super Admin has full write authority to edit attendance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllRequests}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setDirectEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            <Edit3 size={15} />
            <span>Direct Attendance Edit</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between shadow-2xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="text-blue-500 hover:text-blue-700">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Requests</span>
          <p className="text-2xl font-black text-black mt-1">{requests.length}</p>
          <span className="text-[10px] text-slate-500 font-bold">{hrCount} from HR Admin</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Awaiting Super Admin</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-amber-700 font-bold">Needs action</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Attendance Tickets</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{regCount}</p>
          <span className="text-[10px] text-blue-700 font-bold">Missed punches / regularization</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Approved &amp; Updated</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
          <span className="text-[10px] text-emerald-700 font-bold">Attendance resolved</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                  statusFilter === st
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL'
                  ? `All Statuses`
                  : `${st.charAt(0) + st.slice(1).toLowerCase()} (${requests.filter((r) => r.status === st).length})`}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, ID, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Second Row: Role and Type Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white font-bold text-black focus:outline-none"
            >
              <option value="ALL">All Roles (HR Admin + Employees)</option>
              <option value="HR_ADMIN">HR Admin Only</option>
              <option value="EMPLOYEE">Employees Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white font-bold text-black focus:outline-none"
            >
              <option value="ALL">All Request / Ticket Types</option>
              <option value="REGULARIZATION">Attendance Correction (Missed Punch)</option>
              <option value="LEAVE">Leave</option>
              <option value="WFH">WFH</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Request Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading all tickets and requests…</p>
        </div>
      ) : !requests.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-black">No requests found</h3>
          <p className="text-xs text-slate-500">
            {statusFilter === 'ALL'
              ? 'No requests or attendance correction tickets have been submitted.'
              : `No requests with status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-colors space-y-3.5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-black">
                      {req.first_name} {req.last_name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                        req.employee_role === 'HR_ADMIN'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {req.employee_role === 'HR_ADMIN' ? 'HR Admin' : 'Employee'}
                    </span>
                  </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {req.emp_code} · {req.designation || 'Staff'} ({req.department_name})
                    </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : req.status === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {req.status === 'APPROVED' && <CheckCircle2 size={13} />}
                    {req.status === 'REJECTED' && <XCircle size={13} />}
                    {req.status === 'PENDING' && <Clock size={13} />}
                    <span>{req.status.charAt(0) + req.status.slice(1).toLowerCase()}</span>
                  </span>
                </div>
              </div>

              {/* Body: Comparison of system attendance vs requested attendance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* 1. Request details */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px]">
                    Ticket / Request Info
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-black text-blue-700">
                      {req.request_type === 'REGULARIZATION'
                        ? 'Attendance Correction'
                        : req.request_type}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        Work Date: <strong>{String(req.start_date).slice(0, 10)}</strong>
                        {String(req.start_date).slice(0, 10) !== String(req.end_date).slice(0, 10) &&
                          ` – ${String(req.end_date).slice(0, 10)}`}
                      </span>
                    </p>
                    {req.metadata?.missed_punch_type && (
                      <p className="text-[11px] text-slate-500">
                        Type: <span className="font-bold text-slate-700">{req.metadata.missed_punch_type}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. System recorded attendance vs Requested correction */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px]">
                    {req.request_type === 'REGULARIZATION' ? 'Attendance Time Comparison' : 'Requested Details'}
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                    {req.request_type === 'REGULARIZATION' ? (
                      <>
                        <div className="text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700">Current in System: </span>
                          <span>In: {formatIST(req.recorded_check_in)}</span> ·{' '}
                          <span>Out: {formatIST(req.recorded_check_out)}</span>
                          <span className="ml-1 text-[10px] text-slate-400 font-mono">
                            ({req.recorded_status || 'ABSENT'})
                          </span>
                        </div>
                        <div className="text-[11px] text-blue-800 bg-blue-50/70 p-1.5 rounded-lg border border-blue-100 font-semibold">
                          <span className="font-bold">Requested Correction (IST): </span>
                          <span className="font-mono font-bold">
                            {req.metadata?.correction?.in_time || '09:30'}
                          </span>{' '}
                          to{' '}
                          <span className="font-mono font-bold">
                            {req.metadata?.correction?.out_time || '18:30'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-700">{req.metadata?.label || req.request_type}</p>
                    )}
                  </div>
                </div>

                {/* 3. Reason submitted */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px]">
                    Reason Provided by Employee
                  </span>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800 line-clamp-3">
                    {req.reason}
                  </p>
                </div>
              </div>

              {/* Decision remarks if resolved */}
              {req.decision_remarks && (
                <div className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px] mb-0.5">
                    Super Admin Review Remarks
                  </span>
                  <p className="text-slate-800 font-medium">{req.decision_remarks}</p>
                  {req.decision_date && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Processed on {new Date(req.decision_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons: Super Admin Write Authority */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Ticket #{req.id} · Submitted on{' '}
                  {new Date(req.submission_date || req.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>

                <div className="flex items-center gap-2">
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => openEditAttendanceForRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95"
                      >
                        <Edit3 size={14} /> Edit Attendance &amp; Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectModal({ request: req });
                          setRejectNote('');
                          setActionError('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openEditAttendanceForRequest(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Edit3 size={13} className="text-blue-600" /> Edit Attendance
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Edit Attendance & Approve Ticket (or direct edit for a ticket) */}
      {attendanceEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-black">Edit Attendance (Super Admin)</h2>
                  <p className="text-xs text-slate-500">
                    {attendanceEditModal.employee_name} ({attendanceEditModal.emp_code}) · {attendanceEditModal.work_date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttendanceEditModal(null)}
                disabled={savingAction}
                className="p-1 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-semibold">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs font-semibold">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900 text-[11px]">
                <span>
                  Super Admin write authority will update the actual attendance record for <strong>{attendanceEditModal.work_date}</strong> in the database.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
                    Check-in Time (IST)
                  </label>
                  <input
                    type="time"
                    value={attendanceEditModal.check_in}
                    onChange={(e) =>
                      setAttendanceEditModal((prev) => ({ ...prev, check_in: e.target.value }))
                    }
                    required
                    disabled={savingAction}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
                    Check-out Time (IST)
                  </label>
                  <input
                    type="time"
                    value={attendanceEditModal.check_out}
                    onChange={(e) =>
                      setAttendanceEditModal((prev) => ({ ...prev, check_out: e.target.value }))
                    }
                    required
                    disabled={savingAction}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
                  Attendance Status
                </label>
                <select
                  value={attendanceEditModal.status}
                  onChange={(e) =>
                    setAttendanceEditModal((prev) => ({ ...prev, status: e.target.value }))
                  }
                  disabled={savingAction}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PRESENT">PRESENT (Full Day)</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LEAVE">LEAVE</option>
                  <option value="WEEKLY_OFF">WEEKLY_OFF</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
                  Super Admin Decision Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={attendanceEditModal.notes}
                  onChange={(e) =>
                    setAttendanceEditModal((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  required
                  disabled={savingAction}
                  placeholder="Explain why this attendance was corrected or approved…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAttendanceEditModal(null)}
                  disabled={savingAction}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-sm transition-all"
                >
                  {savingAction ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{savingAction ? 'Saving…' : 'Save Attendance & Approve'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Direct Attendance Edit (Standalone for ANY employee and date) */}
      {directEditModalOpen && (
        <DirectAttendanceEditModal
          employees={companyEmployees}
          onClose={() => setDirectEditModalOpen(false)}
          onSuccess={(msg) => {
            setDirectEditModalOpen(false);
            setNotice(msg);
            fetchAllRequests();
            setTimeout(() => setNotice(''), 6000);
          }}
        />
      )}

      {/* Modal 3: Reject Confirmation */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <X size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-black">Reject Request</h2>
                  <p className="text-xs text-slate-500">
                    From {rejectModal.request.first_name} {rejectModal.request.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModal(null)}
                disabled={savingAction}
                className="p-1 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-semibold">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleRejectRequest} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
                  Reason for Rejection (5–1000 characters)
                </label>
                <textarea
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  minLength={5}
                  maxLength={1000}
                  required
                  disabled={savingAction}
                  placeholder="Explain why this request is rejected…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  disabled={savingAction}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction || rejectNote.trim().length < 5}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-sm transition-all"
                >
                  {savingAction ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                  <span>{savingAction ? 'Rejecting…' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectAttendanceEditModal({ employees, onClose, onSuccess }) {
  const { currentUserId } = useAuth();
  const [selectedEmpId, setSelectedEmpId] = useState(() => (employees[0]?.id ? String(employees[0].id) : ''));
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState('09:30');
  const [checkOut, setCheckOut] = useState('18:30');
  const [status, setStatus] = useState('PRESENT');
  const [notes, setNotes] = useState('Direct attendance adjustment by Super Admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setError('Please choose an employee.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        employee_id: Number(selectedEmpId),
        work_date: workDate,
        check_in: checkIn,
        check_out: checkOut,
        status,
        notes: notes.trim()
      };

      const res = await api.editAttendanceBySuperAdmin(currentUserId, payload);
      if (res.success) {
        onSuccess(`Attendance record for ${workDate} saved successfully.`);
      } else {
        setError(res.error || 'Failed to edit attendance.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Edit3 size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-black">Direct Attendance Edit</h2>
              <p className="text-xs text-slate-500">Edit or override any employee attendance record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-semibold">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
              Select Employee
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              required
              disabled={saving}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id} · {emp.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
              Work Date
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              required
              disabled={saving}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
                Check-in Time (IST)
              </label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                disabled={saving}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
                Check-out Time (IST)
              </label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                disabled={saving}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
              Attendance Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRESENT">PRESENT (Full Day)</option>
              <option value="HALF_DAY">HALF_DAY</option>
              <option value="ABSENT">ABSENT</option>
              <option value="LEAVE">LEAVE</option>
              <option value="WEEKLY_OFF">WEEKLY_OFF</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1">
              Super Admin Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              disabled={saving}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-sm transition-all"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              <span>{saving ? 'Updating…' : 'Save Attendance Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
