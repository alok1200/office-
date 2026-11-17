import React from 'react';

// Keep the original overview separate from the existing HR feature pages.
export function HRDashboardPage() {
  return (
    <div className="space-y-4 bg-white text-black">
      <h1 className="text-2xl font-semibold">HR Overview Dashboard</h1>
      <p className="text-sm text-slate-600 flex gap-4">
        <button className='bg-blue-600 text-white px-2 py-1 rounded-md cursor-pointer' onClick={() => { navigate('HRTeamPage.jsx') }}>Team</button>
        <button className='bg-blue-600 text-white px-2 py-1 rounded-md cursor-pointer' onClick={() => { navigate('/HREmployeesPage.jsx') }}>Employee REquest</button>
        <button className='bg-blue-600 text-white px-2 py-1 rounded-md cursor-pointer' onClick={() => { navigate('/HRAttendancePage') }}>Attendance</button>
      </p>
    </div>
  );
}
