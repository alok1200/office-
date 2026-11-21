import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('knooviq_auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.getCurrentUser()
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.user) {
          setCurrentUser(res.user);
        } else {
          localStorage.removeItem('knooviq_auth_token');
          localStorage.removeItem('knooviq_user_id');
          setCurrentUser(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem('knooviq_auth_token');
        localStorage.removeItem('knooviq_user_id');
        setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);
  const login = async (identifier, password) => {
    try {
      const res = await api.login(identifier, password);
      if (!res.success || !res.user || !res.token) return { success: false, error: res.error || 'Could not sign in.' };
      localStorage.setItem('knooviq_auth_token', res.token);
      localStorage.setItem('knooviq_user_id', String(res.user.id));
      setCurrentUser(res.user);
      return { success: true, user: res.user };
    } catch { return { success: false, error: 'Sign-in could not be completed. Check your connection and try again.' }; }
  };
  const logout = async () => {
    try { await api.logout(); }
    finally { localStorage.removeItem('knooviq_auth_token'); localStorage.removeItem('knooviq_user_id'); setCurrentUser(null); }
  };
  const value = { currentUser, currentUserId: currentUser?.id, isAuthenticated: !!currentUser, loading, error: null, login, logout, isHR: currentUser?.role === 'HR_ADMIN', isEmployee: currentUser?.role === 'EMPLOYEE', isSuperAdmin: currentUser?.role === 'SUPER_ADMIN', role: currentUser?.role || null };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within an AuthProvider');
  return value;
}
