import {useDataRefresh} from '../hooks/useDataRefresh';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
const NotificationsContext = createContext(null);
export function NotificationsProvider({ children }) {
  const { currentUserId } = useAuth();
  const [state, setState] = useState({ owner: null, notifications: [], loading: false, error: '' });
  const request = useRef(null), version = useRef(0), owner = useRef(currentUserId);
  owner.current = currentUserId;
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!currentUserId || owner.current !== currentUserId) return;
    const sequence = ++version.current;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    if (!silent) setState(old => ({ ...old, loading: true, error: '' }));
    try {
      const res = await api.getNotifications(currentUserId, controller.signal);
      if (!res.success) throw new Error(res.error || 'Could not load notifications.');
      if (sequence === version.current) setState({ owner: currentUserId, notifications: res.data || [], loading: false, error: '' });
    } catch (error) {
      if (error.name !== 'AbortError' && sequence === version.current) setState(old => ({ owner: currentUserId, notifications: old.owner === currentUserId ? old.notifications : [], loading: false, error: error.message }));
    }
  }, [currentUserId]);
  useEffect(() => {
    if (!currentUserId) { setState({ owner: null, notifications: [], loading: false, error: '' }); return; }
    refresh();
    const visibleRefresh = () => { if (document.visibilityState === 'visible') refresh({ silent: true }); };
    const timer = setInterval(visibleRefresh, 5000);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => { ++version.current; request.current?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visibleRefresh); };
  }, [currentUserId, refresh]);
  useDataRefresh(()=>refresh({silent:true}),['requests','attendance','holidays','employees'],{intervalMs:0});
  const markAsRead = async id => {
    const res = await api.markNotificationRead(currentUserId, id);
    if (!res.success) throw new Error(res.error || 'Could not mark notification as read.');
    if (owner.current !== currentUserId) return;
    ++version.current; request.current?.abort();
    setState(old => old.owner !== currentUserId ? old : { ...old, notifications: old.notifications.map(n => n.id === id ? { ...n, is_read: true } : n) });
    refresh({ silent: true });
  };
  const notifications = state.owner === currentUserId ? state.notifications : [];
  const value = { notifications, unreadCount: notifications.filter(n => !n.is_read).length, loading: !!currentUserId && (state.owner !== currentUserId || state.loading), error: state.owner === currentUserId ? state.error : '', refresh, markAsRead };
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications requires NotificationsProvider');
  return value;
}
