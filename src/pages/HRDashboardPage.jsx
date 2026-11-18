import React from 'react';
export function HRDashboardPage({ setTab }) {
 return <div className="space-y-4 bg-white text-black"><h1 className="text-2xl font-semibold">HR Overview Dashboard</h1><p className="text-sm text-slate-600">Review company attendance and raise employee correction tickets. Super Admin reviews all corrections.</p><div className="flex flex-wrap gap-3"><button className="ui-button-primary" onClick={()=>setTab('hr-employees')}>Team</button><button className="ui-button-primary" onClick={()=>setTab('hr-company-requests')}>Employee requests</button><button className="ui-button-primary" onClick={()=>setTab('hr-attendance')}>Attendance</button><button className="ui-button-primary" onClick={()=>setTab('tickets')}>Correction tickets</button></div></div>;
}
