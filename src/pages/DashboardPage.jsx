import React from 'react';
import { Calendar, FileText } from 'lucide-react';
import { DashboardHeader, DashboardShortcut, dashboardDate } from '../components/Dashboard/DashboardElements';
import { PersonalAttendance } from '../components/Employee/PersonalAttendance';
import { SuperAdminDashboard } from '../components/SuperAdmin/SuperAdminDashboard';
import { useAuth } from '../context/AuthContext';
import { HRDashboardPage } from './HRDashboardPage';

export function DashboardPage({ setTab }) {
  const { isHR, isSuperAdmin } = useAuth();
  if (isSuperAdmin) return <SuperAdminDashboard setTab={setTab} />;
  if (isHR) return <HRDashboardPage setTab={setTab} />;

  return (
    <div className="dashboard-page">
      <DashboardHeader title="Today’s attendance" context={dashboardDate()} description="Record your shift and breaks, or check your office connection." />
      <PersonalAttendance />
      <section className="dashboard-section" aria-labelledby="workday-shortcuts">
        <h2 id="workday-shortcuts" className="dashboard-section-title">Your workday</h2>
        <div className="dashboard-shortcuts">
          <DashboardShortcut icon={Calendar} title="My attendance calendar" description="Review monthly attendance and past punches." onClick={() => setTab('calendar')} />
          <DashboardShortcut icon={FileText} tone="indigo" title="My requests" description="Submit or track leave, WFH, and attendance corrections." onClick={() => setTab('my-requests')} />
        </div>
      </section>
    </div>
  );
}
