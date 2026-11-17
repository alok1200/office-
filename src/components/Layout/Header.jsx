import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { RoleSwitcher } from '../Common/RoleSwitcher';
import { Clock, Calendar, Bell, Menu, LogOut } from 'lucide-react';

export function Header({ onToggleMobileMenu, setTab }) {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          aria-label="Toggle navigation menu"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-blue-600 hover:bg-slate-50 border border-slate-200"
        >
          <Menu className="w-5 h-5 text-blue-600" />
        </button>

        {/* Greeting */}
        <div>
          <h1 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
            <span>Welcome back, {currentUser?.first_name || 'User'}</span>
            <span className="hidden sm:inline-block">👋</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium hidden sm:block">
            {currentUser?.designation} • {currentUser?.department_name}
          </p>
        </div>
      </div>

      {/* Right controls: Live time, notification, role switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Date & Time Display */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-black">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-black">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-black tracking-tight">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={() => setTab('notifications')}
          className="p-2 rounded-xl text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 relative transition-colors shadow-2xs"
          title={`Notifications: ${unreadCount} unread`}
          aria-label={`Notifications, ${unreadCount} unread`}
        >
          <Bell className="w-5 h-5 text-blue-600" />
          {unreadCount > 0 && <span className="notification-count" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>

        {/* Role Switcher */}
        <RoleSwitcher onViewProfile={() => setTab('profile')} />

        {/* Sign Out Button */}
        <button
          onClick={logout}
          className="p-2 rounded-xl text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 transition-colors shadow-2xs"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-blue-600" />
        </button>
      </div>
    </header>
  );
}
