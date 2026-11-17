
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
  MapPin,
} from 'lucide-react';

export function Sidebar({ currentTab, setTab }) {
  const { isHR, isSuperAdmin } = useAuth();

  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'my-requests', label: 'Requests', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: Shield },
    { id: 'reports', label: 'Reports', icon: Clock },
    { id: 'admin', label: 'Admin', icon: Building2 },
    { id: 'holidays', label: 'Holidays', icon: CalendarDays },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const hrNavItems = [
    { section: 'HR Overview' },
    { id: 'hr-dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Overview' },
    { id: 'hr-employees', label: 'Team', icon: Users, badge: 'Directory' },
    { id: 'hr-attendance', label: 'Attendance', icon: Clock, badge: 'Company' },
    { id: 'hr-company-requests', label: 'Employee Requests', icon: FileText, badge: 'Read‑only' },
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

  const navItems = isSuperAdmin
    ? superAdminNavItems
    : isHR
      ? hrNavItems
      : employeeNavItems;

  return (
    <aside className={`
      app-sidebar ${isSuperAdmin ? 'sa-sidebar' : ''}
      w-64 min-h-screen shrink-0
      flex flex-col
      bg-[#F7F9FC]
      border-r border-[#E2E8F0]
    `}>

      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center gap-3 bg-[#F7F9FC]">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
          <Building2 className="w-6 h-6 text-[#0560E8]" />
        </div>

        <div>
          <span className="text-lg font-black tracking-wider text-[#1E293B]">
            KNOOVIQ
          </span>
          <span className="block text-[10px] text-[#647895] font-bold uppercase tracking-widest">
            Attendance Hub
          </span>
        </div>
      </div>

      {/* Portal Information */}
      <div className="px-5 py-3 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#647895] font-medium">
            Active Portal:
          </span>

          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white text-[#334155] border border-[#DCE5F2]">
            {isHR
              ? 'HR Admin Portal'
              : isSuperAdmin
                ? 'Super Admin'
                : 'Employee Portal'}
          </span>
        </div>

        {isHR && (
          <p className="text-[10px] text-[#647895] mt-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#0560E8]" />
            Company-wide visibility (Read-only)
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 flex flex-col gap-1.5 px-2 py-5 overflow-y-auto bg-[#F7F9FC]"
      >
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={`section-${idx}`} className="pt-2 pb-2 px-2">
                <span className="text-[14px] font-bold text-[#647895] uppercase tracking-wide">
                  {item.section}
                </span>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`
                sidebar-nav-item w-full min-h-[53px]
                flex items-center justify-between
                gap-3 px-5 py-2
                rounded-[15px]
                border-0
                text-left  
                transition-all duration-200
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-[#0560E8]
                ${isActive
                  ? 'bg-[#0560E8] text-white shadow-sm'
                  : 'bg-transparent text-[#647895] hover:bg-[#EDF3FF]'
                }
              `}
            >
              <div className="sidebar-nav-content flex flex-1 items-center gap-4 min-w-0">
                <Icon
                  className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : 'text-[#647895]'
                    }`}
                  strokeWidth={2}
                />

                <span
                  className={`sidebar-nav-label min-w-0 text-[16px] font-medium ${isActive ? 'text-white' : 'text-[#647895]'
                    }`}
                >
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span
                  className={`
                    sidebar-nav-badge shrink-0 text-[10px] px-2 py-1 rounded-md border font-semibold
                    ${isActive
                      ? 'bg-white/15 text-white border-white/30'
                      : 'bg-white text-[#475569] border-[#DCE5F2]'
                    }
                  `}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0] text-center">
        <p className="text-xs font-bold text-[#334155]">
          KNOOVIQ Suite v1.0
        </p>
        <p className="text-[10px] text-[#647895] mt-1">
          Enterprise Time & Attendance
        </p>
      </div>
    </aside>
  );
}
