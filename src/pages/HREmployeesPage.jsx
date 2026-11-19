import React from 'react';
import { EmployeeDirectory } from '../components/HR/EmployeeDirectory';

export function HREmployeesPage({ openAdd = false }) {
  return (
    <div className="space-y-6">
      <EmployeeDirectory openAdd={openAdd} />
    </div>
  );
}
