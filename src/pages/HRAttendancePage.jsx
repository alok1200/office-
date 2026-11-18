import React from 'react';
import { CompanyAttendanceTable } from '../components/HR/CompanyAttendanceTable';

export function HRAttendancePage({ setTab }) {
  return (
    <div className="space-y-6">
      {setTab && <div className="flex justify-end"><button className="ui-button-primary" onClick={()=>setTab('tickets')}>Raise attendance correction ticket</button></div>}
      <CompanyAttendanceTable />
    </div>
  );
}
