import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PersonalAttendance } from '../components/Employee/PersonalAttendance';
import { HRSummaryCards } from '../components/HR/HRSummaryCards';
import { CompanyAttendanceTable } from '../components/HR/CompanyAttendanceTable';
import { Calendar, FileText, ArrowRight } from 'lucide-react';
import { SuperAdminDashboard } from '../components/SuperAdmin/SuperAdminDashboard';

export function DashboardPage({ setTab }) {
  const { isHR, isSuperAdmin } = useAuth();

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Employee Workday Section */}
      {isSuperAdmin && <SuperAdminDashboard setTab={setTab} />}
      {!isSuperAdmin && !isHR && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-black">
                {isHR ? "My Personal Workday Attendance" : "Today's Workday Overview"}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {isHR
                  ? "Your own employee attendance record and daily punch controls"
                  : "Real-time punch controls, active timers, and workday logs"}
              </p>
            </div>
            {isHR && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-black border border-slate-300 shadow-2xs">
                Self Workday
              </span>
            )}
          </div>
          <PersonalAttendance />
          {/* Quick Links for Employee */}
          {!isHR && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setTab('calendar')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black">My Attendance Calendar</h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">View your monthly attendance, color-coded days, and punch history</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => setTab('my-requests')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black">Submit / Track Requests</h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">Apply for leaves, WFH, attendance regularization, or holiday adjustments</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* HR Admin Portal Dashboard Top Section */}
      {isHR && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-black tracking-tight">HR Operations & Attendance Overview</h2>
              <p className="text-xs text-slate-600 font-medium">Real-time company-wide headcount, attendance and employee status</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab('hr-company-requests')}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-black flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>View All Requests</span>
              </button>
            </div>
          </div>
          <HRSummaryCards />
          <CompanyAttendanceTable />
        </section>
      )}
    </div>
  );
}
