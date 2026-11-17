import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { Bell, CheckCircle, Clock, Sparkles, MessageSquare, Check, RefreshCw } from 'lucide-react';

export function NotificationsPage() {
  const { notifications, loading, error, refresh, markAsRead } = useNotifications();
  const [actionError, setActionError] = useState('');
  const [marking, setMarking] = useState(null);
  const fetchNotifications = () => refresh();
  const handleMarkAsRead = async id => {
    setMarking(id); setActionError('');
    try { await markAsRead(id); }
    catch (error) { setActionError(error.message); }
    finally { setMarking(null); }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ATTENDANCE': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'REQUEST': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'HOLIDAY': return <Sparkles className="w-4 h-4 text-blue-600" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-black flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Notifications & Company Announcements</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Stay informed with attendance updates, request status approvals, and announcements
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 transition-colors shadow-2xs"
          title="Refresh Notifications"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {(error || actionError) && <p role="alert" className="text-sm">{actionError || error} <button onClick={fetchNotifications} className="underline">Retry</button></p>}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.is_read ? 'bg-white' : 'bg-blue-50/20'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                  {getCategoryIcon(n.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-black">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">{n.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1.5 block font-medium">
                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  disabled={marking !== null}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-blue-50 text-[11px] font-bold text-black flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <Check className="w-3 h-3 text-blue-600" />
                  <span>{marking === n.id ? 'Saving…' : 'Mark read'}</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
