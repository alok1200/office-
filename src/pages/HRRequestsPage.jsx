import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FileText,
  Plus,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Send,
  Loader2,
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export function HRRequestsPage() {
  const { currentUserId, currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [bannerMessage, setBannerMessage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.getMyRequests(currentUserId);
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to load requests.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCancelRequest = async (id) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const res = await api.cancelMyRequest(currentUserId, id);
      if (res.success) {
        setBannerMessage('Your request has been cancelled.');
        setCancellingId(null);
        await fetchRequests();
      } else {
        setErrorMessage(res.error || 'Could not cancel request.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel request.');
    } finally {
      setActionBusy(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} /> Approved by Super Admin
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} /> Rejected by Super Admin
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} /> Pending Super Admin Review
          </span>
        );
    }
  };

  const getRequestTypeLabel = (type, metadata) => {
    if (type === 'REGULARIZATION') {
      return metadata?.missed_punch_type
        ? `Missed Attendance (${metadata.missed_punch_type})`
        : 'Attendance Regularization';
    }
    const map = {
      LEAVE: 'Leave Request',
      WFH: 'Remote Work (WFH)',
      HOLIDAY: 'Holiday Request',
      OTHER: 'Special Request'
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">HR Requests to Super Admin</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Raise requests directly to Super Admin for missed attendance punch, regularization, leave, or remote work.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh requests"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Raise Request to Super Admin</span>
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between shadow-2xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="text-blue-500 hover:text-blue-700">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterStatus === st
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL'
                ? `All Requests (${requests.length})`
                : `${st.charAt(0) + st.slice(1).toLowerCase()} (${requests.filter((r) => r.status === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading your HR requests…</p>
        </div>
      ) : !filteredRequests.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-black">No requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === 'ALL'
              ? 'You have not raised any requests to Super Admin yet. Click "Raise Request to Super Admin" to submit a missed attendance regularization or leave request.'
              : `No requests matching status "${filterStatus}".`}
          </p>
          {filterStatus === 'ALL' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-black transition-colors"
            >
              <Plus size={14} /> Raise New Request
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    {getRequestTypeLabel(req.request_type, req.metadata)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      {String(req.start_date).slice(0, 10)}
                      {String(req.start_date).slice(0, 10) !== String(req.end_date).slice(0, 10) &&
                        ` to ${String(req.end_date).slice(0, 10)}`}
                    </span>
                  </span>
                </div>
                <div>{getStatusBadge(req.status)}</div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                    Reason provided to Super Admin
                  </span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {req.reason}
                  </p>
                </div>

                {req.request_type === 'REGULARIZATION' && req.metadata?.correction && (
                  <div>
                    <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                      Missed Attendance Proposed Times (IST)
                    </span>
                    <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-blue-900 font-semibold space-y-0.5">
                      <p>
                        In: <span className="font-mono font-bold">{req.metadata.correction.in_time || '—'}</span> ·
                        Out: <span className="font-mono font-bold">{req.metadata.correction.out_time || '—'}</span>
                      </p>
                      {req.metadata?.missed_punch_type && (
                        <p className="text-[11px] text-blue-700">
                          Punch Type: {req.metadata.missed_punch_type}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Super Admin Decision remarks */}
                {req.decision_remarks && (
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                      Super Admin Response Note
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                      <p>{req.decision_remarks}</p>
                      {req.decision_date && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Reviewed on {new Date(req.decision_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Submitted on{' '}
                  {new Date(req.submission_date || req.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>

                {req.status === 'PENDING' && (
                  <div>
                    {cancellingId === req.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-rose-700 font-semibold">Confirm cancellation?</span>
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={actionBusy}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700"
                        >
                          {actionBusy ? 'Cancelling…' : 'Yes, Cancel'}
                        </button>
                        <button
                          onClick={() => setCancellingId(null)}
                          disabled={actionBusy}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancellingId(req.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New HR Request Modal */}
      {isModalOpen && (
        <HRRequestModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(msg) => {
            setIsModalOpen(false);
            setBannerMessage(msg || 'Your request has been submitted to Super Admin.');
            fetchRequests();
            setTimeout(() => setBannerMessage(null), 6000);
          }}
        />
      )}
    </div>
  );
}

function HRRequestModal({ onClose, onSuccess }) {
  const { currentUserId } = useAuth();
  const [requestType, setRequestType] = useState('REGULARIZATION');
  const [missedPunchType, setMissedPunchType] = useState('MISSED_PUNCH_OUT');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [inTime, setInTime] = useState('09:30');
  const [outTime, setOutTime] = useState('18:30');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason or explanation for Super Admin.');
      return;
    }
    if (requestType === 'REGULARIZATION' && (!inTime || !outTime)) {
      setError('Please provide both expected In time and Out time.');
      return;
    }

    setLoading(true);
    setError(null);

    const isReg = requestType === 'REGULARIZATION';
    const payload = {
      request_type: requestType,
      start_date: date,
      end_date: isReg ? date : endDate,
      reason: reason.trim(),
      metadata: isReg
        ? {
            label: 'Attendance Regularization',
            missed_punch_type: missedPunchType.replace(/_/g, ' '),
            correction: {
              in_time: inTime,
              out_time: outTime
            }
          }
        : {
            label: requestType === 'LEAVE' ? 'Leave Request' : requestType === 'WFH' ? 'Remote Work' : 'Request'
          }
    };

    try {
      const res = await api.submitMyRequest(currentUserId, payload);
      if (res.success) {
        onSuccess(res.message || 'Request submitted to Super Admin for approval.');
      } else {
        setError(res.error || 'Failed to submit request.');
      }
    } catch (err) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Send size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-black">Raise Request to Super Admin</h2>
              <p className="text-xs text-slate-500">For HR missed attendance punch, leave, or remote work</p>
            </div>
          </div>
          <button
            onClick={onClose}
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
          {/* Request Type */}
          <div>
            <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="REGULARIZATION">Missed Attendance / Punch Regularization</option>
              <option value="LEAVE">Leave Request (Casual / Sick / Earned)</option>
              <option value="WFH">Work From Home (WFH)</option>
              <option value="HOLIDAY">Holiday-Related Request</option>
              <option value="OTHER">Other Custom Request</option>
            </select>
          </div>

          {/* Missed Attendance Specific Options */}
          {requestType === 'REGULARIZATION' ? (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                  Missed Punch Type
                </label>
                <select
                  value={missedPunchType}
                  onChange={(e) => setMissedPunchType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MISSED_PUNCH_IN">Missed Punch-In Only</option>
                  <option value="MISSED_PUNCH_OUT">Missed Punch-Out Only</option>
                  <option value="MISSED_FULL_DAY">Missed Both / Entire Day Attendance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                  Date of Missed Attendance
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                    Expected In Time (IST)
                  </label>
                  <input
                    type="time"
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                    Expected Out Time (IST)
                  </label>
                  <input
                    type="time"
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
              Reason / Explanation for Super Admin
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for missed attendance, forgot to punch, client meeting, or leave details…"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
            <UserCheck size={16} className="text-blue-600 shrink-0" />
            <span>This request will be routed directly to Super Admin for approval.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-sm transition-all"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>{loading ? 'Submitting…' : 'Submit to Super Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
