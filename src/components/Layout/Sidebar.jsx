import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Bell,
  User,
  Users,
  Clock,
  Send,
  CalendarDays,
  Shield,
  Building2,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ currentTab, setTab }) {
  const { currentUser, isHR, isSuperAdmin } = useAuth();

  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'My Calendar', icon: Calendar },
    { id: 'my-requests', label: 'My Requests', icon: FileText },
    { id: 'holidays', label: 'Holidays', icon: CalendarDays },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const hrNavItems = [
    { section: 'HR Overview' },
    { id: 'hr-dashboard', label: 'HR Dashboard', icon: LayoutDashboard, badge: 'Overview' },
    { id: 'hr-employees', label: 'Employees', icon: Users, badge: 'Directory' },
    { id: 'hr-attendance', label: 'Attendance', icon: Clock, badge: 'Company' },
    { id: 'hr-company-requests', label: 'Employee Requests', icon: FileText, badge: 'Read-only' },
    { section: 'My Workday' },
    { id: 'calendar', label: 'My Calendar', icon: Calendar },
    { id: 'my-requests', label: 'My Requests', icon: Send, badge: 'Self' },
    { id: 'holidays', label: 'Holidays', icon: CalendarDays },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];
    
  const superAdminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'my-requests', label: 'Requests', icon: FileText },
    { id: 'hr-employees', label: 'Team', icon: Users },
    { id: 'admin-approvals', label: 'Approvals', icon: Shield },
    { id: 'hr-attendance', label: 'Reports', icon: Clock },
    { id: 'admin', label: 'Admin', icon: Building2 },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : (isHR ? hrNavItems : employeeNavItems);

  return (
    <aside className={`${isSuperAdmin ? 'sa-sidebar' : ''} w-64 bg-white text-black flex flex-col shrink-0 border-r border-slate-200 min-h-screen`}>
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-black font-mono">KNOOVIQ</span>
            <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-widest leading-none">
              Attendance Hub
            </span>
          </div>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Active Portal:</span>
          <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase tracking-wide bg-white text-black border border-slate-300 shadow-2xs">
            {isHR ? 'HR Admin Portal' : isSuperAdmin ? 'Super Admin' : 'Employee Portal'}
          </span>
        </div>
        {isHR && (
          <p className="text-[10px] text-slate-700 mt-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Company-wide visibility (Read-only)</span>
          </p>
        )}
      </div>

      {/* Nav List */}
      <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto bg-white">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="pt-3 pb-1 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.section}</span>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 text-black border border-blue-200 shadow-xs'
                  : 'text-black hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-black font-semibold">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  isActive ? 'bg-white text-black border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-white text-[11px] text-center">
        <p className="font-bold text-black">KNOOVIQ Suite v1.0</p>
        <p className="text-slate-500">Enterprise Time & Attendance</p>
      </div>
    </aside>
  );
}
