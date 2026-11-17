// src/components/SuperAdmin/PendingApprovalsCard.jsx
import React from 'react';
import { Check, X, Info } from 'lucide-react';

/*
  Placeholder Pending Approvals Card for Super Admin.
  Real data will be fetched from /api/super-admin/dashboard (pendingRequests).
  Design follows spec: header with "Pending Approvals" and action pills.
*/
export default function PendingApprovalsCard({ data }) {
  // Example static data when no prop provided
  const pending = data?.[0] || {
    employee: 'John Doe',
    id: 'E123',
    type: 'Leave',
    dates: '2024-12-20 – 2024-12-22',
    reason: 'Family event',
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[14px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">Pending Approvals</h3>
        <div className="flex gap-2">
          <span className="bg-[#FEF3C7] text-[#92400E] text-xs font-semibold px-2 py-0.5 rounded-full">Action Required</span>
          <span className="bg-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold px-2 py-0.5 rounded-full">Global Override</span>
        </div>
      </div>
      <div className="border-t border-[#E2E8F0] pt-3">
        <p className="text-sm text-[#64748B]">
          <strong>{pending.employee}</strong> ({pending.id}) – {pending.type}<br />
          {pending.dates}<br />
          {pending.reason}
        </p>
        <div className="flex gap-2 mt-3">
          <button className="flex items-center gap-1 px-3 py-1 bg-[#0F62FE] text-white text-xs rounded-md hover:bg-[#0353E9]">
            <Check size={14} /> Accept
          </button>
          <button className="flex items-center gap-1 px-3 py-1 border border-[#FCA5A5] text-[#B91C1C] text-xs rounded-md hover:bg-[#FEE2E2]">
            <X size={14} /> Reject
          </button>
          <button className="flex items-center gap-1 px-3 py-1 border border-[#CBD5E1] text-[#64748B] text-xs rounded-md hover:bg-[#F1F5F9]">
            <Info size={14} /> View All
          </button>
        </div>
      </div>
    </div>
  );
}
