import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle, Clock, Sparkles, MessageSquare, Check, RefreshCw, ArrowRight, Inbox } from 'lucide-react';

const categories = { ATTENDANCE: { icon: Clock, label: 'Attendance' }, REQUEST: { icon: CheckCircle, label: 'Request update' }, HOLIDAY: { icon: Sparkles, label: 'Holiday' }, ANNOUNCEMENT: { icon: MessageSquare, label: 'Announcement' } };
const timestamp = value => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};
export function NotificationsPage({ setTab }) {
  const { notifications, unreadCount, loading, error, refresh, markAsRead } = useNotifications();
  const { isHR, isSuperAdmin } = useAuth();
  const [actionError, setActionError] = useState('');
  const [marking, setMarking] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const handleMarkAsRead = async id => {
    setMarking(id); setActionError('');
    try { await markAsRead(id); }
    catch (error) { setActionError(error.message); }
    finally { setMarking(null); }
  };
  const shown = notifications.filter(item => filter !== 'UNREAD' || !item.is_read);
  return <div className="space-y-6">
    <header className="inbox-heading"><div><h1><Bell size={23} />Notifications <span className="inbox-count">{unreadCount} unread</span></h1><p>Your request responses, attendance updates and company announcements.</p></div><button type="button" className="ui-icon-button" onClick={() => refresh()} disabled={loading} aria-label="Refresh notifications"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button></header>
    <div className="inbox-toolbar" role="group" aria-label="Filter notifications"><button type="button" aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>All notifications <span>{notifications.length}</span></button><button type="button" aria-pressed={filter === 'UNREAD'} onClick={() => setFilter('UNREAD')}>Unread <span>{unreadCount}</span></button></div>
    {(error || actionError) && <p role="alert" className="sa-info">{actionError || error}<button type="button" className="sa-text-button" onClick={() => { setActionError(''); refresh(); }}>Retry</button></p>}
    <section className="notification-list" aria-label="Notification inbox" aria-busy={loading}>
      {loading ? <p role="status" className="sa-empty">Loading notifications…</p> : !shown.length ? <div className="inbox-empty"><Inbox size={32} /><h2>{filter === 'UNREAD' ? 'You’re all caught up' : 'No notifications yet'}</h2><p>{filter === 'UNREAD' ? 'You have no unread notifications.' : 'New updates will appear here automatically.'}</p></div> : shown.map(item => {
        const { icon: Icon, label } = categories[item.category] || categories.ANNOUNCEMENT;
        return <article key={item.id} className={`notification-item ${item.is_read ? '' : 'is-unread'}`}>
          <span className="inbox-category-icon"><Icon size={21} /></span>
          <div className="notification-content"><div className="notification-meta"><span>{label}</span><time dateTime={item.created_at}>{timestamp(item.created_at)}</time>{!item.is_read && <strong className="notification-unread-label">Unread</strong>}</div><h2>{item.title}</h2><p>{item.message}</p>{item.category === 'REQUEST' && setTab && <button type="button" className="sa-text-button mt-2" onClick={() => setTab(!isHR && !isSuperAdmin ? 'responses' : 'my-requests')}>{!isHR && !isSuperAdmin ? 'View my responses' : 'View my requests'}<ArrowRight size={15} /></button>}</div>
          {!item.is_read ? <button type="button" className="notification-read-button" onClick={() => handleMarkAsRead(item.id)} disabled={marking !== null} aria-label={`Mark as read: ${item.title}`}><Check size={15} />{marking === item.id ? 'Saving…' : 'Mark read'}</button> : <span className="notification-read-status"><Check size={14} />Read</span>}
        </article>;
      })}
    </section>
  </div>;
}
