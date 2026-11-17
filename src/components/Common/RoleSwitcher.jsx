import React from 'react';
import { useAuth } from '../../context/AuthContext';

// Signed-in identity only. Changing accounts requires signing out and signing in.
export function RoleSwitcher({ onViewProfile }) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  const name = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
  return <button type="button" onClick={onViewProfile} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-left" aria-label={`View your profile: ${name}`} title="View your profile">
    {currentUser.avatar_url ? <img src={currentUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20" /> : <span className="w-8 h-8 rounded-full border border-blue-200 inline-flex items-center justify-center text-sm font-bold">{currentUser.first_name?.[0]}{currentUser.last_name?.[0]}</span>}
    <span className="hidden sm:block"><span className="flex items-center gap-2"><strong className="text-xs">{name}</strong><span className="text-[10px] border border-slate-200 rounded px-1.5">{currentUser.role === 'HR_ADMIN' ? 'HR Admin' : currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Employee'}</span></span><span className="block text-[11px] mt-0.5">{currentUser.department_name}</span></span>
  </button>;
}
