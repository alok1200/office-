import {useDataRefresh} from '../../hooks/useDataRefresh';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, FileText, Info, Loader2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { CompanyLogo } from '../Common/CompanyLogo';
import { LeaveAllowances } from './LeaveAllowances';
import { GeofenceCard } from './GeofenceCard';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const label = value => String(value || 'Not checked in').replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase());
const time = value => value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—';
const date = value => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) : '—';
const duration = value => `${Math.floor((value || 0) / 60)}h ${(value || 0) % 60}m`;

function useResource(fetcher, userId) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const refresh = useCallback(async () => {
    setState(old => ({ ...old, loading: true, error: null }));
    try {
      const response = await fetcher(userId);
      if (!response.success) throw new Error(response.error || 'Could not load this section.');
      setState({ loading: false, data: response.data, error: null });
    } catch (error) {
      setState({ loading: false, data: null, error: error.message || 'Connection unavailable.' });
    }
  }, [fetcher, userId]);
  useEffect(() => { refresh(); }, [refresh]);
  useDataRefresh(refresh,['attendance','requests','holidays','employees','offices']);
  return { ...state, refresh };
}

function State({ resource, children, empty = false, emptyText = 'No records to show yet.' }) {
  if (resource.loading) return <div className="sa-empty" role="status"><Loader2 size={18} className="animate-spin" /> Loading records…</div>;
  if (resource.error) return <div className="sa-empty sa-error" role="alert"><span>{resource.error}</span><button className="sa-text-button" onClick={resource.refresh}><RefreshCw size={13} /> Retry</button></div>;
  if (empty) return <div className="sa-empty">{emptyText}</div>;
  return children;
}

function Title({ icon: Icon, children, aside }) {
  return <div className="sa-card-heading"><h2><Icon size={17} />{children}</h2>{aside}</div>;
}
function Pill({ value }) {
  const tone = ['PRESENT', 'CHECKED_IN', 'APPROVED', 'INSIDE'].includes(value) ? 'green' : ['PENDING', 'ON_BREAK', 'HALF_DAY'].includes(value) ? 'amber' : value === 'REJECTED' || value === 'OUTSIDE' ? 'red' : 'blue';
  return <span className={`sa-pill ${tone}`}>{label(value)}</span>;
}

const getRecent = async userId => {
  const now = new Date();
  const response = await api.getMyCalendar(userId, now.getFullYear(), now.getMonth() + 1);
  return { ...response, data: response.data?.days?.filter(day => day.attendance).map(day => ({ ...day.attendance, work_date: day.date })).reverse() || [] };
};

export function SuperAdminDashboard({ setTab }) {
  const { currentUserId, currentUser } = useAuth();
  const config = useResource(api.getSuperAdminDashboard, currentUserId);
  const team = useResource(api.getCompanyAttendance, currentUserId);
  const requests = useResource(api.getMyRequests, currentUserId);
// const recent = useResource(getRecent, currentUserId); // Super Admin does not track personal attendance
  const profile = useResource(api.getMyProfile, currentUserId);
  const profileData = profile.data;
  const complete = profileData && ['first_name', 'last_name', 'email', 'employee_id', 'department_name', 'designation'].every(key => !!profileData[key]);
  const teamRows = team.data || [];
  const requestRows = requests.data || [];
const recent = { data: [], loading: false, error: null, refresh: () => {} }; // placeholder (Super Admin has no personal attendance)
  const recentRows = [];
  return <div className="sa-dashboard sa-dashboard-reference">
    <h1 className="sr-only">Super Admin Dashboard</h1>
    {config.data?.demo && <div className="sa-dashboard-data-label"><ShieldCheck size={11} /> Local demo data</div>}
    <div className="sa-top-grid">
      <GeofenceCard resource={config} setTab={setTab} />
    <section className="sa-card sa-team"><Title icon={Users} aside={<button className="sa-text-button" onClick={() => setTab('hr-employees')}>View team <ArrowRight size={14} /></button>}>Team Status</Title><p className="sa-description">Today's attendance across your team. Precise locations are private.</p>
      <State resource={team} empty={!teamRows.length} emptyText="No team members found."><div className="sa-team-grid">{teamRows.slice(0, 4).map(person => <button className="sa-person" key={person.emp_code} onClick={() => setTab('hr-employees')}><div className="sa-person-top"><span className="sa-avatar">{person.first_name?.[0]}{person.last_name?.[0]}</span><span><strong>{person.first_name} {person.last_name}</strong><small>{person.emp_code} · {person.department_name || 'Team'}</small></span></div><Pill value={['CHECKED_IN','ON_BREAK'].includes(person.current_state) ? person.current_state : person.status || person.current_state || 'NOT_CHECKED_IN'} /></button>)}</div></State>
      <div className="sa-team-footer"><span>{teamRows.length ? `${teamRows.length} team members` : 'Team overview'}</span><span title="Team notes are not supported by the current backend.">Team notes are not available yet</span></div>
    </section>
    </div>
    <LeaveAllowances onSubmitted={requests.refresh} />
    <div className="sa-bottom-grid">
      <section className="sa-card"><Title icon={FileText} aside={<button className="sa-icon-button" aria-label="View all my requests" onClick={() => setTab('my-requests')}><ChevronRight size={17} /></button>}>My Requests</Title><p className="sa-description">Your latest leave, WFH, and regularization requests.</p>
        <State resource={requests} empty={!requestRows.length} emptyText="You're all caught up. No requests submitted yet."><div className="sa-table-wrap"><table><thead><tr><th>Type</th><th>Date</th><th>Status</th><th>Reason</th></tr></thead><tbody>{requestRows.slice(0, 3).map(row => <tr key={row.id}><td><span className="sa-pill blue">{label(row.request_type)}</span></td><td className="sa-nowrap">{date(row.start_date)}</td><td><Pill value={row.status} /></td><td className="sa-reason" title={row.reason}>{row.reason}</td></tr>)}</tbody></table></div></State>
        <button className="sa-text-button sa-bottom-link" onClick={() => setTab('my-requests')}>Manage my requests <ArrowRight size={14} /></button>
      </section>
      <section className="sa-card"><Title icon={CalendarDays}>Recent Attendance</Title><p className="sa-description">Personal attendance tracking is disabled for Super Admin.</p>
        <State resource={recent} empty={!recentRows.length} emptyText="SUPER_ADMIN accounts do not track personal check‑in, check‑out, or breaks."><div className="sa-table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Work</th></tr></thead><tbody>{recentRows.slice(0, 3).map(row => <tr key={row.work_date}><td className="sa-nowrap">{date(row.work_date)}</td><td><Pill value={row.status} /></td><td>{time(row.check_in)}</td><td>{time(row.check_out)}</td><td>{duration(row.total_work_minutes)}</td></tr>)}</tbody></table></div></State>
        <button className="sa-text-button sa-bottom-link" onClick={() => setTab('calendar')}>Open calendar <ArrowRight size={14} /></button>
      </section>
    </div>
    <section className="sa-profile-banner"><div className="sa-profile-symbol"><Info size={24} /></div><div className="sa-profile-content"><State resource={profile}><h2>{complete ? 'Your profile is up to date!' : 'Keep your profile up to date'}</h2><p>{complete ? 'Your essential profile information is complete.' : 'Review your personal details and account information.'}</p></State><button className="sa-primary-button" onClick={() => setTab('profile')}>View Profile Details <ArrowRight size={15} /></button></div><CheckCircle2 className="sa-banner-decoration" size={96} /></section>
    <div className="sa-page-footer"><CompanyLogo variant="compact" /><span className="company-product-name">Workforce Attendance</span><span>Signed in as {currentUser?.first_name} {currentUser?.last_name}</span></div>
  </div>;
}
