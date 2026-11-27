import {useDataRefresh} from '../../hooks/useDataRefresh';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, ClipboardCheck, FileText, Info, Loader2, MapPin, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { DashboardHeader, DashboardShortcut, dashboardDate } from '../Dashboard/DashboardElements';
import { GeofenceCard } from './GeofenceCard';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const label = value => String(value || 'Not checked in').replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase());
const date = value => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) : '—';

function useResource(fetcher, userId, keepData = false) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const ticket = ++requestId.current;
    setState(old => ({ ...old, loading: !keepData || old.data === null, error: null }));
    try {
      const response = await fetcher(userId);
      if (!response.success) throw new Error(response.error || 'Could not load this section.');
      if (ticket === requestId.current) setState({ loading: false, data: response.data, error: null });
    } catch (error) {
      if (ticket === requestId.current) setState(old => ({ loading: false, data: keepData ? old.data : null, error: error.message || 'Connection unavailable.' }));
    }
  }, [fetcher, userId, keepData]);
  const updateData = update => {
    requestId.current += 1;
    setState(old => ({ loading: false, error: null, data: update(old.data) }));
  };
  useEffect(() => { refresh(); }, [refresh]);
  useDataRefresh(refresh,['attendance','requests','holidays','employees','offices']);
  return { ...state, refresh, updateData };
}

function State({ resource, children, empty = false, emptyText = 'No records to show yet.' }) {
  if (resource.loading) return <div className="sa-empty" role="status"><Loader2 size={18} className="animate-spin" /> Loading records…</div>;
  const errorNotice = resource.error && <div className="sa-empty sa-error" role="alert"><span>{resource.error}</span><button className="sa-text-button" onClick={resource.refresh}><RefreshCw size={13} /> Retry</button></div>;
  if (errorNotice && resource.data == null) return errorNotice;
  return <>{errorNotice}{empty ? <div className="sa-empty">{emptyText}</div> : children}</>;
}

function Title({ icon: Icon, children, aside }) {
  return <div className="sa-card-heading"><h2><Icon size={17} />{children}</h2>{aside}</div>;
}
function Pill({ value }) {
  const tone = ['PRESENT', 'CHECKED_IN', 'APPROVED', 'INSIDE'].includes(value) ? 'green' : ['PENDING', 'ON_BREAK', 'HALF_DAY'].includes(value) ? 'amber' : ['ABSENT', 'REJECTED', 'OUTSIDE'].includes(value) ? 'red' : 'blue';
  return <span className={`sa-pill ${tone}`}>{label(value)}</span>;
}

export function SuperAdminDashboard({ setTab }) {
  const { currentUserId } = useAuth();
  const config = useResource(api.getSuperAdminDashboard, currentUserId, true);
  const team = useResource(api.getCompanyAttendance, currentUserId, true);
  const requests = useResource(api.getMyRequests, currentUserId);
  const profile = useResource(api.getMyProfile, currentUserId);
  const profileData = profile.data;
  const complete = profileData && ['first_name', 'last_name', 'email', 'employee_id', 'department_name', 'designation'].every(key => !!profileData[key]);
  const teamRows = team.data || [];
  const requestRows = requests.data || [];

  return (
    <div className="dashboard-page sa-dashboard">
      <DashboardHeader title="Super Admin Dashboard" context={dashboardDate()} description="Office verification, team attendance, and request approvals.">
        <button type="button" className="dashboard-hero-primary" onClick={() => setTab('office-location')}><MapPin size={16} aria-hidden="true" /> Office settings</button>
        <button type="button" onClick={() => setTab('admin-approvals')}><ClipboardCheck size={16} aria-hidden="true" /> Approvals</button>
      </DashboardHeader>
      {config.data?.demo && <div className="sa-dashboard-data-label"><ShieldCheck size={13} aria-hidden="true" /> Local demo data</div>}

      <div className="sa-top-grid">
        <GeofenceCard resource={config} setTab={setTab} />
        <div className="dashboard-admin-side">
          <section className="sa-card sa-team">
            <Title icon={Users} aside={<button type="button" className="sa-text-button" onClick={() => setTab('hr-employees')}>View team <ArrowRight size={14} /></button>}>Team status</Title>
            <p className="sa-description">Today’s attendance across your team.</p>
            <State resource={team} empty={!teamRows.length} emptyText="No team members found.">
              <div className="sa-team-grid">
                {teamRows.slice(0, 4).map(person => (
                  <button type="button" className="sa-person" key={person.emp_code} onClick={() => setTab('hr-employees')}>
                    <div className="sa-person-top">
                      <span className="sa-avatar">{person.first_name?.[0]}{person.last_name?.[0]}</span>
                      <span><strong>{person.first_name} {person.last_name}</strong><small>{person.emp_code} · {person.department_name || 'Team'}</small></span>
                    </div>
                    <Pill value={['CHECKED_IN', 'ON_BREAK'].includes(person.current_state) ? person.current_state : person.status || person.current_state || 'NOT_CHECKED_IN'} />
                  </button>
                ))}
              </div>
              <p className="sa-team-footer">{teamRows.length} team members</p>
            </State>
          </section>
          <section className="sa-card">
            <Title icon={FileText} aside={<button type="button" className="sa-text-button" onClick={() => setTab('my-requests')}>View all <ArrowRight size={14} /></button>}>My requests</Title>
            <State resource={requests} empty={!requestRows.length} emptyText="No requests submitted yet.">
              <div className="sa-table-wrap">
                <table>
                  <thead><tr><th>Type</th><th>Date</th><th>Status</th><th>Reason</th></tr></thead>
                  <tbody>
                    {requestRows.slice(0, 3).map(row => <tr key={row.id}><td><span className="sa-pill blue">{label(row.request_type)}</span></td><td className="sa-nowrap">{date(row.start_date)}</td><td><Pill value={row.status} /></td><td className="sa-reason" title={row.reason}>{row.reason}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </State>
          </section>
        </div>
      </div>

      <section className="sa-card">
        <Title icon={Info}>My workspace</Title>
        <div className="dashboard-shortcuts">
          <DashboardShortcut icon={CalendarDays} title="Calendar" description="View holidays and planned time off." onClick={() => setTab('calendar')} />
          <DashboardShortcut icon={Users} tone="indigo" title="Profile details" description={complete ? 'Your essential profile information is complete.' : 'Review your personal and account details.'} onClick={() => setTab('profile')} />
          {(profile.loading || profile.error) && <State resource={profile} />}
        </div>
      </section>
    </div>
  );
}
