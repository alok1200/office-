import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/Common/StatusBadge';
import { RequestFormModal } from '../components/Employee/RequestFormModal';
import { Plus, Send, CheckCircle2, RefreshCw } from 'lucide-react';

export function MyRequestsPage() {
  const { currentUserId, isHR, isSuperAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [bannerMessage, setBannerMessage] = useState(null);

  // Super Admin does not have personal requests UI
  if (isSuperAdmin) { return null; }

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getMyRequests(currentUserId);
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load my requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [currentUserId]);

  const handleSuccess = (msg) => {
    setBannerMessage(msg || 'Request submitted successfully.');
    fetchMyRequests();
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const filtered = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            <span>My Requests</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {isHR
              ? "Requests submitted by you for your own employee account. Separate from company employee requests."
              : "Submit and track your leave, holiday, WFH, and attendance regularization requests."}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="ui-button-primary"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>New Request</span>
        </button>
      </div>

      {bannerMessage && (
        <div className="p-4 rounded-xl bg-white border border-blue-200 text-black text-xs flex items-center gap-2 animate-in fade-in shadow-2xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterStatus === st
                  ? 'bg-blue-50 text-black border-2 border-blue-600 shadow-2xs'
                  : 'bg-white border border-slate-200 text-black hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Submissions' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          onClick={fetchMyRequests}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 transition-colors shadow-2xs"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">
            Loading your requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">
            No requests found in this category. Click <strong>"New Request"</strong> above to submit one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white">
            {filtered.map((req) => (
              <div key={req.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-white text-black border border-slate-300 shadow-2xs">
                      {req.request_type}
                    </span>
                    <span className="text-xs font-black text-black">
                      {req.start_date === req.end_date ? req.start_date : `${req.start_date} → ${req.end_date}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Submitted {new Date(req.submission_date).toLocaleDateString()}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                </div>

                <p className="text-xs text-black font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  {req.reason}
                </p>

                {req.decision_remarks && (
                  <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs shadow-2xs">
                    <span className="font-black text-blue-600 block mb-0.5">Decision Remarks:</span>
                    <p className="text-black font-medium">{req.decision_remarks}</p>
                    {req.decision_date && (
                      <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                        Reviewed on {new Date(req.decision_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <RequestFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
