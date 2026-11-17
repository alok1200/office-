import React from 'react';

// Keep the original overview separate from the existing HR feature pages.
export function HRDashboardPage() {
  return (
    <div className="space-y-4 bg-white text-black">
      <h1 className="text-2xl font-semibold">HR Overview Dashboard</h1>
      <p className="text-sm text-slate-600">
        Use Team, Attendance and Employee Requests to view company information.
        Your calendar and requests remain available under My Workday.
      </p>
    </div>
  );
}
