import {useDataRefresh} from '../hooks/useDataRefresh';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Users,
  UserCheck,
  Palmtree,
  UserX,
  UserPlus,
  Ticket,
  Clock,
  FileText,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/Common/StatusBadge';
import { DashboardHeader, DashboardMetric, DashboardShortcut, dashboardDate } from '../components/Dashboard/DashboardElements';
import { PersonalAttendance } from '../components/Employee/PersonalAttendance';

const todayISO = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);

const formatTime = (val) =>
  val
    ? new Date(val).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      })
    : '—';

const statusText = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
  LEAVE: 'Leave',
};

export function HRDashboardPage({ setTab }) {
  const { currentUserId, isHR } = useAuth();
  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError,setLoadError]=useState('');
  const version=useRef(0);

  const loadAll = useCallback(
    async (isRefresh = false) => {
      const ticket=++version.current;setLoadError('');
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [sumRes, attRes, ticRes] = await Promise.all([
          api.getCompanySummary(currentUserId),
          api.getCompanyAttendance(currentUserId, { date: todayISO() }),
          api.getAttendanceCorrections(),
        ]);
        if(ticket!==version.current)return;
        for(const response of [sumRes,attRes,ticRes])if(!response.success)throw new Error(response.error || 'Could not load HR dashboard.');
        if (sumRes.success && sumRes.data) setSummary(sumRes.data);
        if (attRes.success && Array.isArray(attRes.data)) setAttendance(attRes.data);
        if (ticRes.success && Array.isArray(ticRes.data)) setTickets(ticRes.data);
      } catch (err) {
        if(ticket===version.current)setLoadError(err.message || 'Could not load HR dashboard.');
      } finally {
        if(ticket===version.current){setLoading(false);setRefreshing(false);}
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    setSummary(null);setAttendance([]);setTickets([]);loadAll();
    return ()=>{++version.current;};
  }, [loadAll]);

  useDataRefresh(()=>loadAll(true),['attendance','requests','employees','holidays']);
  const total = summary?.totalEmployees ?? 0;
  const present = summary?.presentToday ?? 0;
  const onLeave = summary?.onLeaveOrWfh ?? 0;
  const absent = summary?.absent ?? 0;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
  const pendingTickets = tickets.filter((t) => t.status === 'PENDING').length;

  const statCards = [
    {
      label: 'Total Headcount',
      value: loading || !summary ? '—' : total,
      sub: 'Active team members',
      icon: Users,
      tone: 'blue',
      onClick: () => setTab('hr-employees'),
    },
    {
      label: 'Present Today',
      value: loading ? '—' : present,
      sub: loading ? 'Loading…' : `${attendancePct}% attendance rate`,
      icon: UserCheck,
      tone: 'green',
      onClick: () => setTab('hr-attendance'),
    },
    {
      label: 'On Leave / WFH',
      value: loading ? '—' : onLeave,
      sub: 'Approved time-off today',
      icon: Palmtree,
      tone: 'indigo',
      onClick: () => setTab('hr-company-requests'),
    },
    {
      label: 'Absent Today',
      value: loading ? '—' : absent,
      sub: pendingTickets ? `${pendingTickets} pending ticket(s)` : 'No pending tickets',
      icon: UserX,
      tone: 'rose',
      onClick: () => setTab('tickets'),
    },
  ];

  const quickActions = [
    {
      title: 'Team Directory',
      desc: 'Review profiles and assigned assets',
      icon: Users,
      tab: 'hr-employees',
      tone: 'blue',
    },
    {
      title: 'Add Employee',
      desc: 'Onboard new hire & assign company assets',
      icon: UserPlus,
      tab: 'hr-add-employee',
      tone: 'indigo',
    },
    {
      title: 'Company Attendance',
      desc: 'Check daily punches & working hours',
      icon: Clock,
      tab: 'hr-attendance',
      tone: 'green',
    },
    {
      title: 'Employee Requests',
      desc: 'Inspect leave & WFH submissions',
      icon: FileText,
      tab: 'hr-company-requests',
      tone: 'amber',
    },
  ];

  return (
    <div className="dashboard-page">
      <DashboardHeader title="HR dashboard" context={dashboardDate()} description="Company attendance, employee records, and correction tickets.">
        <button type="button" className="dashboard-hero-primary" onClick={() => setTab('hr-add-employee')}>
          <UserPlus size={16} aria-hidden="true" /> Add Employee
        </button>
        <button type="button" onClick={() => setTab('tickets')}>
          <Ticket size={16} aria-hidden="true" /> Raise Ticket{pendingTickets > 0 && <span>({pendingTickets} pending)</span>}
        </button>
        <button type="button" onClick={() => loadAll(true)} disabled={refreshing} aria-label="Refresh dashboard">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
        </button>
      </DashboardHeader>

      {loadError && <p role="alert" className="sa-request-error">{loadError} <button type="button" onClick={()=>loadAll(true)}>Retry</button></p>}
      <section className="dashboard-section" aria-labelledby="hr-metrics-heading">
        <h2 id="hr-metrics-heading" className="dashboard-section-title">Company attendance today</h2>
        <div className="dashboard-metrics dashboard-metrics--wide">
          {statCards.map(card => <DashboardMetric key={card.label} label={card.label} value={card.value} detail={card.sub} icon={card.icon} tone={card.tone} onClick={card.onClick} />)}
        </div>
      </section>

      {isHR && (
        <section className="dashboard-section" aria-labelledby="hr-personal-attendance">
          <h2 id="hr-personal-attendance" className="dashboard-section-title">My attendance</h2>
          <PersonalAttendance />
        </section>
      )}

      <section className="dashboard-section" aria-labelledby="hr-shortcuts-heading">
        <h2 id="hr-shortcuts-heading" className="dashboard-section-title">Quick actions</h2>
        <div className="dashboard-shortcuts dashboard-shortcuts--wide">
          {quickActions.map(item => <DashboardShortcut key={item.tab} title={item.title} description={item.desc} icon={item.icon} tone={item.tone} onClick={() => setTab(item.tab)} />)}
        </div>
      </section>

      {/* Two-Column Live Feed */}
      <section className="dashboard-feed">
        {/* Today's Attendance Snapshot */}
        <div className="dashboard-surface space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-black flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Today's Attendance Snapshot</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Live check-in status across the team
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab('hr-attendance')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500 font-medium">
              Loading today's attendance…
            </div>
          ) : attendance.length === 0 ? (
            <div className="dashboard-empty">
              No attendance records yet for today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {attendance.slice(0, 6).map((row) => (
                <div
                  key={row.emp_code || row.employee_id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                      {row.first_name?.[0]}
                      {row.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-black truncate">
                        {row.first_name} {row.last_name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {row.emp_code} · {row.department_name || 'Team'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-[11px] font-mono font-bold text-slate-600">
                      In: {formatTime(row.check_in)} · {Array.isArray(row.breaks) ? row.breaks.length : 0} {(Array.isArray(row.breaks) ? row.breaks.length : 0) === 1 ? 'break' : 'breaks'}
                    </span>
                    <StatusBadge status={row.status || 'ABSENT'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attendance Tickets */}
        <div className="dashboard-surface space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-black flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>Recent Correction Tickets</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tickets raised by HR for Super Admin review
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab('tickets')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500 font-medium">
              Loading tickets…
            </div>
          ) : tickets.length === 0 ? (
            <div className="dashboard-empty space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-black">All clear — no tickets raised yet</p>
              <p className="text-[11px] text-slate-500">
                Raise a ticket whenever an employee's attendance needs updating.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.slice(0, 5).map((row) => (
                <div
                  key={row.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-black truncate">
                      #{row.id} · {row.first_name} {row.last_name}{' '}
                      <span className="font-mono text-slate-500 font-semibold">
                        ({row.emp_code})
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {String(row.start_date || '').slice(0, 10)}
                      {row.metadata?.requested_status
                        ? ` · Requested: ${statusText[row.metadata.requested_status] || row.metadata.requested_status}`
                        : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={row.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
