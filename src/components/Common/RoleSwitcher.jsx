import React from 'react';
import { useAuth } from '../../context/AuthContext';

// Only the signed-in identity is displayed; account changes require sign-out.
export function RoleSwitcher({ onViewProfile }) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  const name = [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ');
  const role = currentUser.role === 'HR_ADMIN' ? 'HR Admin' : currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Employee';
  return <button type="button" onClick={onViewProfile} className="header-profile" aria-label={`View your profile: ${name}`} title="View your profile">
    {currentUser.avatar_url ? <img src={currentUser.avatar_url} alt="" className="profile-avatar" /> : <span className="profile-avatar">{currentUser.first_name?.[0]}{currentUser.last_name?.[0]}</span>}
    <span className="profile-identity"><strong>{name}</strong><small>{role}</small></span>
  </button>;
}
