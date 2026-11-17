import React from 'react';
import { FileText } from 'lucide-react';
import { HRSummaryCards } from '../components/HR/HRSummaryCards';
import { CompanyAttendanceTable } from '../components/HR/CompanyAttendanceTable';

export function HRDashboardPage({ setTab }) {
  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h1 className="text-2xl font-semibold text-black">HR overview</h1><p className="text-sm text-slate-600 mt-1">Your team’s attendance and daily activity, in one view.</p></div>
      <button type="button" className="ui-button-primary" onClick={() => setTab('hr-company-requests')}><FileText size={18} />Employee requests</button>
    </div>
    <HRSummaryCards />
    <CompanyAttendanceTable />
  </div>;
}
