import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  FileText,
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
  MessageSquare
} from 'lucide-react';

export function SuperAdminHRRequestsPage() {
  const { currentUserId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Review modal state
  const [activeReview, setActiveReview] = useState(null); // { request, action: 'APPROVED' | 'REJECTED' }
  const [reviewNote, setReviewNote] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchHRRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getSuperAdminHRRequests(currentUserId, {
        status: statusFilter,
        type: typeFilter
      });
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        setError(res.error || 'Failed to fetch HR requests.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, statusFilter, typeFilter]);

  useEffect(() => {
    fetchHRRequests();
  }, [fetchHRRequests]);

  const openReview = (req, action) => {
    setActiveReview({ request: req, action });
    setReviewNote(action === 'APPROVED' ? 'Approved HR attendance regularization / request.' : '');
    setActionError('');
    if (req.request_type === 'REGULARIZATION') {
      const proposedIn = req.metadata?.correction?.in_time || '09:30';
      const proposedOut = req.metadata?.correction?.out_time || '18:30';
      setCheckIn(proposedIn);
      setCheckOut(proposedOut);
    } else {
      setCheckIn('');
      setCheckOut('');
    }
  };

  const closeReview = () => {
    setActiveReview(null);
    setReviewNote('');
    setCheckIn('');
    setCheckOut('');
    setActionError('');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!activeReview || saving) return;
    if (reviewNote.trim().length < 5) {
      setActionError('Please provide a decision note of at least 5 characters.');
      return;
    }

    const { request, action } = activeReview;
    const isReg = request.request_type === 'REGULARIZATION' && action === 'APPROVED';

    if (isReg && (!checkIn || !checkOut)) {
      setActionError('Check-in and check-out times are required for attendance regularization.');
      return;
    }

    setSaving(true);
    setActionError('');

    try {
      const payload = {
        status: action,
        note: reviewNote.trim()
      };

      if (isReg) {
        const day = String(request.start_date).slice(0, 10);
        payload.correction = {
          check_in: new Date(`${day}T${checkIn}:00+05:30`).toISOString(),
          check_out: new Date(`${day}T${checkOut}:00+05:30`).toISOString()
        };
      }

      const res = await api.reviewSuperAdminRequest(currentUserId, request.id, payload);
      if (res.success) {
        setNotice(`HR Request #${request.id} has been ${action.toLowerCase()}.`);
        closeReview();
        await fetchHRRequests();
        setTimeout(() => setNotice(''), 6000);
      } else {
        setActionError(res.error || 'Failed to save decision.');
      }
    } catch (err) {
      setActionError(err.message || 'Error saving decision.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
    const empCode = (r.emp_code || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();
    return fullName.includes(q) || empCode.includes(q) || reason.includes(q);
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">HR Requests</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Review and approve requests submitted by HR Admin (missed punch attendance regularization, leave, and remote work).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchHRRequests}
          disabled={loading}
          className="self-start md:self-auto p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:bg-slate-50 transition-colors shadow-2xs"
          title="Refresh HR requests"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
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
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Awaiting Super Admin</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Approved</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Rejected</span>
          <p className="text-2xl font-black text-slate-700 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                ? `All (${requests.length})`
                : `${st.charAt(0) + st.slice(1).toLowerCase()} (${requests.filter((r) => r.status === st).length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search HR name, code, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-black focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="REGULARIZATION">Missed Attendance / Regularization</option>
            <option value="LEAVE">Leave</option>
            <option value="WFH">WFH</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading HR requests…</p>
        </div>
      ) : !filtered.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-black">No HR requests found</h3>
          <p className="text-xs text-slate-500">
            {statusFilter === 'ALL'
              ? 'No requests have been submitted by HR Admin yet.'
              : `No requests with status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-colors space-y-3"
            >
              {/* Top Row: Submitter & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {req.avatar_url ? (
                    <img
                      src={req.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                      {req.first_name?.[0]}
                      {req.last_name?.[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-black">
                        {req.first_name} {req.last_name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        HR Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {req.emp_code} · {req.designation || 'HR Operations'} ({req.department_name})
                    </p>
                  </div>
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

              {/* Request Type and Reason */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                    Request Type &amp; Dates
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-bold text-blue-700">
                      {req.request_type === 'REGULARIZATION'
                        ? 'Missed Attendance Regularization'
                        : req.request_type}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        {String(req.start_date).slice(0, 10)}
                        {String(req.start_date).slice(0, 10) !== String(req.end_date).slice(0, 10) &&
                          ` – ${String(req.end_date).slice(0, 10)}`}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                    {req.request_type === 'REGULARIZATION'
                      ? 'Missed Punch & Proposed Times (IST)'
                      : 'Request Information'}
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-slate-700">
                    {req.request_type === 'REGULARIZATION' ? (
                      <>
                        <p className="font-semibold text-black">
                          In: <span className="font-mono text-blue-700">{req.metadata?.correction?.in_time || '09:30'}</span> · Out:{' '}
                          <span className="font-mono text-blue-700">{req.metadata?.correction?.out_time || '18:30'}</span>
                        </p>
                        {req.metadata?.missed_punch_type && (
                          <p className="text-[11px] text-slate-500">
                            Type: {req.metadata.missed_punch_type}
                          </p>
                        )}
                      </>
                    ) : (
                      <p>{req.metadata?.label || req.request_type}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                    Reason Given by HR Admin
                  </span>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800 line-clamp-3">
                    {req.reason}
                  </p>
                </div>
              </div>

              {/* Decision Remarks (if already decided) */}
              {req.decision_remarks && (
                <div className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px] mb-0.5">
                    Super Admin Review Remarks
                  </span>
                  <p className="text-slate-800 font-medium">{req.decision_remarks}</p>
                  {req.decision_date && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Decided on {new Date(req.decision_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons for Pending Requests */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Submitted on{' '}
                  {new Date(req.submission_date || req.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>

                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openReview(req, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95"
                    >
                      <Check size={14} /> Approve HR Request
                    </button>
                    <button
                      onClick={() => openReview(req, 'REJECTED')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    activeReview.action === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {activeReview.action === 'APPROVED' ? <Check size={18} /> : <X size={18} />}
                </div>
                <div>
                  <h2 className="text-base font-black text-black">
                    {activeReview.action === 'APPROVED' ? 'Approve HR Request' : 'Reject HR Request'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    From {activeReview.request.first_name} {activeReview.request.last_name} ({activeReview.request.emp_code})
                  </p>
                </div>
              </div>
              <button
                onClick={closeReview}
                disabled={saving}
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

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs font-semibold">
              {/* Regularization Attendance Times Confirmation */}
              {activeReview.request.request_type === 'REGULARIZATION' && activeReview.action === 'APPROVED' && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2.5">
                  <p className="text-blue-900 font-bold text-xs">
                    Confirm Attendance Regularization Times (IST)
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Approving this will update the attendance record for {String(activeReview.request.start_date).slice(0, 10)}.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-bold text-[11px] mb-1">
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
                      <label className="block text-slate-700 font-bold text-[11px] mb-1">
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
                </div>
              )}

              {/* Review Note */}
              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                  Decision Remarks / Note for HR (5–1000 characters)
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  minLength={5}
                  maxLength={1000}
                  required
                  disabled={saving}
                  placeholder={
                    activeReview.action === 'APPROVED'
                      ? 'e.g., Verified missed punch reason. Regularization approved.'
                      : 'Explain the reason for rejecting this request…'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeReview}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || reviewNote.trim().length < 5}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl font-black text-white shadow-sm transition-all ${
                    activeReview.action === 'APPROVED'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : activeReview.action === 'APPROVED' ? (
                    <Check size={15} />
                  ) : (
                    <X size={15} />
                  )}
                  <span>
                    {saving
                      ? 'Saving…'
                      : activeReview.action === 'APPROVED'
                      ? 'Confirm Approval'
                      : 'Confirm Rejection'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
