import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Ticket,
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
  ShieldCheck,
  UserCheck,
  Info
} from 'lucide-react';

export function TicketsPage() {
  const { currentUserId, currentUser, isHR } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [bannerMessage, setBannerMessage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.getMyRequests(currentUserId);
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to load tickets.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCancelTicket = async (id) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const res = await api.cancelMyRequest(currentUserId, id);
      if (res.success) {
        setBannerMessage('Ticket has been cancelled.');
        setCancellingId(null);
        await fetchTickets();
      } else {
        setErrorMessage(res.error || 'Could not cancel ticket.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel ticket.');
    } finally {
      setActionBusy(false);
    }
  };

  const filteredTickets = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} /> Approved &amp; Attendance Updated
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

  const getTicketLabel = (row) => {
    if (row.request_type === 'REGULARIZATION') {
      const sub = row.metadata?.missed_punch_type;
      return sub ? `Attendance Correction (${sub})` : 'Attendance Correction';
    }
    const map = {
      LEAVE: 'Leave Ticket',
      WFH: 'Remote Work (WFH)',
      HOLIDAY: 'Holiday Ticket',
      OTHER: 'Special Ticket'
    };
    return map[row.request_type] || row.request_type;
  };

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">
                {isHR ? 'HR Attendance Tickets' : 'My Attendance Tickets'}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Raise tickets to Super Admin for attendance correction (missed punch-in/out, hours correction) or leave/WFH.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh tickets"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Raise Attendance Ticket</span>
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

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-black block mb-0.5">How Attendance Correction Tickets Work</strong>
          <span>
            When you miss a check-in or check-out punch, raise a ticket here with your actual working hours and reason. Super Admin has full write authority to review and update your attendance record.
          </span>
        </div>
      </div>

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
                ? `All Tickets (${requests.length})`
                : `${st.charAt(0) + st.slice(1).toLowerCase()} (${requests.filter((r) => r.status === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading attendance tickets…</p>
        </div>
      ) : !filteredTickets.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-black">No tickets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === 'ALL'
              ? 'You have not raised any attendance correction tickets yet. Click "Raise Attendance Ticket" to request a correction from Super Admin.'
              : `No tickets with status "${filterStatus}".`}
          </p>
          {filterStatus === 'ALL' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-black transition-colors"
            >
              <Plus size={14} /> Raise Attendance Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-colors space-y-3"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    {getTicketLabel(row)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      {String(row.start_date).slice(0, 10)}
                      {String(row.start_date).slice(0, 10) !== String(row.end_date).slice(0, 10) &&
                        ` to ${String(row.end_date).slice(0, 10)}`}
                    </span>
                  </span>
                </div>
                <div>{getStatusBadge(row.status)}</div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                    Reason Given to Super Admin
                  </span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {row.reason}
                  </p>
                </div>

                {row.request_type === 'REGULARIZATION' && row.metadata?.correction && (
                  <div>
                    <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                      Requested Correction Times (IST)
                    </span>
                    <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-blue-900 font-semibold space-y-0.5">
                      <p>
                        In: <span className="font-mono font-bold">{row.metadata.correction.in_time || '—'}</span> ·
                        Out: <span className="font-mono font-bold">{row.metadata.correction.out_time || '—'}</span>
                      </p>
                      {row.metadata?.missed_punch_type && (
                        <p className="text-[11px] text-blue-700">
                          Missed Punch: {row.metadata.missed_punch_type}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Super Admin Decision remarks */}
                {row.decision_remarks && (
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-500 block uppercase tracking-wider text-[11px] mb-1">
                      Super Admin Review &amp; Remarks
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                      <p>{row.decision_remarks}</p>
                      {row.decision_date && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Processed on {new Date(row.decision_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Ticket #{row.id} · Submitted on{' '}
                  {new Date(row.submission_date || row.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>

                {row.status === 'PENDING' && (
                  <div>
                    {cancellingId === row.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-rose-700 font-semibold">Cancel this ticket?</span>
                        <button
                          onClick={() => handleCancelTicket(row.id)}
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
                        onClick={() => setCancellingId(row.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                      >
                        Cancel Ticket
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to raise new Attendance Ticket */}
      {isModalOpen && (
        <RaiseAttendanceTicketModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(msg) => {
            setIsModalOpen(false);
            setBannerMessage(msg || 'Attendance ticket raised to Super Admin.');
            fetchTickets();
            setTimeout(() => setBannerMessage(null), 6000);
          }}
        />
      )}
    </div>
  );
}

function RaiseAttendanceTicketModal({ onClose, onSuccess }) {
  const { currentUserId } = useAuth();
  const [ticketType, setTicketType] = useState('REGULARIZATION'); // REGULARIZATION is Attendance Correction
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

    const isReg = ticketType === 'REGULARIZATION';
    if (isReg && (!inTime || !outTime)) {
      setError('Please provide both expected In-time and Out-time.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      request_type: ticketType,
      start_date: date,
      end_date: isReg ? date : endDate,
      reason: reason.trim(),
      metadata: isReg
        ? {
            ticket_type: 'ATTENDANCE_CORRECTION',
            label: 'Attendance Correction',
            missed_punch_type: missedPunchType.replace(/_/g, ' '),
            correction: {
              in_time: inTime,
              out_time: outTime
            }
          }
        : {
            ticket_type: ticketType,
            label: ticketType === 'LEAVE' ? 'Leave' : ticketType === 'WFH' ? 'Remote Work' : 'Ticket'
          }
    };

    try {
      const res = await api.submitMyRequest(currentUserId, payload);
      if (res.success) {
        onSuccess(res.message || 'Attendance ticket raised to Super Admin for approval and update.');
      } else {
        setError(res.error || 'Failed to submit ticket.');
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
              <Ticket size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-black">Raise Ticket for Super Admin</h2>
              <p className="text-xs text-slate-500">Attendance correction, missed punch, or leave approval</p>
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
          {/* Ticket Category */}
          <div>
            <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
              Ticket Type
            </label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="REGULARIZATION">Attendance Correction (Missed Punch In / Out / Both)</option>
              <option value="LEAVE">Leave Request (Casual / Sick / Earned)</option>
              <option value="WFH">Work From Home (WFH)</option>
              <option value="HOLIDAY">Holiday-Related Request</option>
              <option value="OTHER">Other Custom Request</option>
            </select>
          </div>

          {ticketType === 'REGULARIZATION' ? (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                  Missed Punch Type
                </label>
                <select
                  value={missedPunchType}
                  onChange={(e) => setMissedPunchType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MISSED_PUNCH_IN">Missed Punch-In Only</option>
                  <option value="MISSED_PUNCH_OUT">Missed Punch-Out Only</option>
                  <option value="MISSED_FULL_DAY">Missed Entire Day / Both Punches</option>
                  <option value="TIME_CORRECTION">Wrong Time Recorded / Hours Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                  Work Date of Attendance
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                    Correct In Time (IST)
                  </label>
                  <input
                    type="time"
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black uppercase tracking-wider text-[11px] mb-1.5">
                    Correct Out Time (IST)
                  </label>
                  <input
                    type="time"
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              placeholder="Explain why punch was missed (e.g. forgot to punch out due to client emergency outage, network glitch) or reason for request…"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
            <span>Super Admin has write authority to review and update your attendance in the database.</span>
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
              <span>{loading ? 'Submitting…' : 'Submit Ticket to Super Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
