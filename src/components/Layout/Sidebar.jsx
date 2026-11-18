
import React from 'react';
import { CompanyLogo } from '../Common/CompanyLogo';
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
  MessageSquare,
  MapPin,
  Ticket,
} from 'lucide-react';

export function Sidebar({ currentTab, setTab }) {
  const { isHR, isSuperAdmin } = useAuth();

  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'responses', label: 'Responses', icon: MessageSquare },
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
    { id: 'tickets', label: 'Tickets', icon: Ticket, badge: 'HR' },
    { id: 'holidays', label: 'Holidays', icon: CalendarDays },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const superAdminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'holidays', label: 'Holidays', icon: CalendarDays },
    { id: 'tickets', label: 'HR-Requests', icon: Ticket },
    { id: 'hr-employees', label: 'Team', icon: Users },
    { id: 'admin-approvals', label: 'Approvals', icon: Shield },
    { id: 'hr-attendance', label: 'Reports', icon: Clock },
    { id: 'office-location', label: 'Office Location', icon: MapPin },
  ];

  const navItems = isSuperAdmin
    ? superAdminNavItems
    : isHR
      ? hrNavItems
      : employeeNavItems;

  return (
    <aside className={`app-sidebar ${isSuperAdmin ? 'sa-sidebar' : ''}`}>
      <div className="sidebar-company-brand"><CompanyLogo variant="sidebar" /></div>
      <div className="sidebar-portal">
        <span>Your workspace</span>
        <strong>{isSuperAdmin ? 'Super Admin' : isHR ? 'HR Admin Portal' : 'Employee Portal'}</strong>
        {isHR && <p>Company visibility · Correction tickets</p>}
      </div>
      <nav aria-label="Main navigation" className="sidebar-navigation">
        {navItems.map((item, index) => {
          if (item.section) return <div key={index} className="sidebar-section">{item.section}</div>;
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-current={currentTab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)} className="sidebar-nav-item">
            <span className="sidebar-nav-content"><Icon strokeWidth={1.8} /><span className="sidebar-nav-label">{item.label}</span></span>
            {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
          </button>;
        })}
      </nav>
      <div className="sidebar-company-footer">
        <CompanyLogo variant="footer" />
        <p>Workforce Attendance</p>
        <p>Attendance &amp; time management</p>
      </div>
    </aside>
  );
}
