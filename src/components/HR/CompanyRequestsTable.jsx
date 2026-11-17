import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../Common/StatusBadge';
import { Modal } from '../Common/Modal';
import { Search, ArrowUpDown, Eye, AlertCircle } from 'lucide-react';

export function CompanyRequestsTable() {
  const { currentUserId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [inspectedReq, setInspectedReq] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getCompanyRequests(currentUserId, {
        status: selectedStatus,
        type: selectedType,
        department: selectedDept,
        search: searchQuery,
        sortBy: sortOrder
      });
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load company requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUserId, selectedStatus, selectedType, selectedDept, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-black">Company-Wide Employee Requests</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Read-only inspection of leave, regularization, and WFH submissions across the company
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-black font-bold focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending (Awaiting Super Admin)</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-black font-bold focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Request Types</option>
            <option value="LEAVE">Leave</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="REGULARIZATION">Regularization</option>
            <option value="WFH">Work from Home</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Dept Filter */}
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

          {/* Sort order toggle */}
          <button
            onClick={toggleSort}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-black transition-colors shadow-2xs"
            title="Sort by Submission Date"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
            <span>{sortOrder === 'DESC' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search employee or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-black flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Decision Policy:</strong> HR Admin cannot approve or reject employee requests. Decision authority is reserved for Super Admin in the next phase.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider text-black">
          Decision controls omitted
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-white text-black font-black uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5">Employee</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Requested Dates</th>
              <th className="px-4 py-3.5">Reason</th>
              <th className="px-4 py-3.5">Submitted On</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500 font-medium">
                  Loading employee requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500 font-medium">
                  No employee requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-black text-black">{r.first_name} {r.last_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono font-bold">{r.emp_code} • {r.department_name}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-black px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">
                      {r.request_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-black">
                    {r.start_date === r.end_date ? r.start_date : `${r.start_date} → ${r.end_date}`}
                  </td>
                  <td className="px-4 py-3.5 text-black font-medium max-w-xs truncate" title={r.reason}>
                    {r.reason}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {new Date(r.submission_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={r.status} />
                    {r.status === 'PENDING' && (
                      <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Awaiting Super Admin</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setInspectedReq(r)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-black font-bold flex items-center gap-1.5 ml-auto transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspection Modal */}
      {inspectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedReq(null)}
          title={`Request Details #${inspectedReq.id}`}
        >
          <div className="space-y-4 bg-white text-black">
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-xs text-slate-500 font-medium">Requester</p>
                <p className="text-sm font-black text-black">
                  {inspectedReq.first_name} {inspectedReq.last_name} ({inspectedReq.emp_code})
                </p>
                <p className="text-xs text-slate-600 font-medium">{inspectedReq.department_name}</p>
              </div>
              <StatusBadge status={inspectedReq.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold">Request Type</span>
                <p className="font-black text-black mt-0.5">{inspectedReq.request_type}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold">Dates Requested</span>
                <p className="font-black text-black mt-0.5">
                  {inspectedReq.start_date === inspectedReq.end_date ? inspectedReq.start_date : `${inspectedReq.start_date} to ${inspectedReq.end_date}`}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-bold block mb-1">Reason / Description</span>
              <p className="text-black font-medium whitespace-pre-wrap">{inspectedReq.reason}</p>
            </div>

            {inspectedReq.decision_remarks && (
              <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs shadow-2xs">
                <span className="text-blue-600 font-black block mb-1">Super Admin Remarks</span>
                <p className="text-black font-medium">{inspectedReq.decision_remarks}</p>
                {inspectedReq.decision_date && (
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    Decided on {new Date(inspectedReq.decision_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {inspectedReq.status === 'PENDING' && (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-black font-bold shadow-2xs">
                ⏳ This request is currently pending review by Super Admin.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedReq(null)}
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
