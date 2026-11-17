import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { RoleSwitcher } from '../Common/RoleSwitcher';
import { Bell, Menu, LogOut } from 'lucide-react';

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

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header className="app-header">
      <div className="header-welcome">
        <button type="button" aria-label="Open navigation menu" onClick={onToggleMobileMenu} className="ui-icon-button md:hidden"><Menu size={20} /></button>
        <div>
          <h1>Welcome back, {currentUser?.first_name || 'User'}</h1>
          <p>{[currentUser?.designation, currentUser?.department_name].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <div className="header-controls">
        <div className="header-clock"><span>{formattedDate}</span><strong>{formattedTime}</strong></div>
        <button type="button" onClick={() => setTab('notifications')} className="ui-icon-button" title={`Notifications: ${unreadCount} unread`} aria-label={`Notifications, ${unreadCount} unread`}>
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-count" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        <RoleSwitcher onViewProfile={() => setTab('profile')} />
        <button type="button" onClick={logout} className="ui-icon-button" title="Sign out" aria-label="Sign out"><LogOut size={20} /></button>
      </div>
    </header>
  );
}
