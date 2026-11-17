import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function restore() {
      const token = localStorage.getItem('knooviq_auth_token');
      try {
        if (token) {
          const res = await api.getCurrentUser();
          if (res.success && res.user) { if (active) setCurrentUser(res.user); return; }
        }
        localStorage.removeItem('knooviq_auth_token');
        localStorage.removeItem('knooviq_user_id');
      } catch {
        localStorage.removeItem('knooviq_auth_token');
        localStorage.removeItem('knooviq_user_id');
      } finally { if (active) setLoading(false); }
    }
    restore();
    return () => { active = false; };
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
