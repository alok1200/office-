import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Modal } from '../Common/Modal';
import { Send, AlertCircle, Loader2 } from 'lucide-react';

export function RequestFormModal({ isOpen, onClose, onSuccess }) {
  const { currentUserId } = useAuth();
  const [requestType, setRequestType] = useState('LEAVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please choose both start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason or description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.submitMyRequest(currentUserId, {
        request_type: requestType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      });

      if (res.success) {
        onSuccess(res.message);
        onClose();
        setReason('');
        setStartDate('');
        setEndDate('');
      } else {
        setError(res.error || 'Failed to submit request');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit New Request">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white text-black">
        {error && (
          <div className="p-3 bg-white border border-rose-300 rounded-xl text-black text-xs flex items-center gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-rose-700">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
            Request Type
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
          >
            <option value="LEAVE">Leave Request (Annual / Casual / Sick)</option>
            <option value="HOLIDAY">Holiday-related Request (Optional / Floating)</option>
            <option value="REGULARIZATION">Attendance Regularization (Missed Punch)</option>
            <option value="WFH">Work-from-Home (WFH) Request</option>
            <option value="OTHER">Other Custom Request</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
            Reason / Justification
          </label>
          <textarea
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please describe the context or purpose of your request..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
            required
          />
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600 font-medium">
          ℹ️ Your submission will be recorded and forwarded for Super Admin review. You can track status anytime under My Requests.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-black hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white border-2 border-blue-600 hover:bg-blue-50 text-black text-xs font-black shadow-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Send className="w-3.5 h-3.5 text-blue-600" />}
            <span>Submit Request</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
