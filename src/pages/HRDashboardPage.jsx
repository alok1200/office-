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
  CalendarDays,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/Common/StatusBadge';
import { CompanyLogo } from '../components/Common/CompanyLogo';

const todayLabel = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

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
  const { currentUser, currentUserId } = useAuth();
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
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'text-blue-600',
      onClick: () => setTab('hr-employees'),
    },
    {
      label: 'Present Today',
      value: loading ? '—' : present,
      sub: loading ? 'Loading…' : `${attendancePct}% attendance rate`,
      icon: UserCheck,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'text-emerald-600',
      onClick: () => setTab('hr-attendance'),
    },
    {
      label: 'On Leave / WFH',
      value: loading ? '—' : onLeave,
      sub: 'Approved time-off today',
      icon: Palmtree,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      accent: 'text-sky-600',
      onClick: () => setTab('hr-company-requests'),
    },
    {
      label: 'Absent Today',
      value: loading ? '—' : absent,
      sub: pendingTickets ? `${pendingTickets} pending ticket(s)` : 'No pending tickets',
      icon: UserX,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'text-rose-600',
      onClick: () => setTab('tickets'),
    },
  ];

  const quickActions = [
    {
      title: 'Team Directory',
      desc: 'View staff, company assets & passwords',
      icon: Users,
      tab: 'hr-employees',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Add Employee',
      desc: 'Onboard new hire & assign company assets',
      icon: UserPlus,
      tab: 'hr-add-employee',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Company Attendance',
      desc: 'Check daily punches & working hours',
      icon: Clock,
      tab: 'hr-attendance',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Employee Requests',
      desc: 'Inspect leave & WFH submissions',
      icon: FileText,
      tab: 'hr-company-requests',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner — White Background & Blue Text Theme */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-blue-200 p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-blue-50 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <CompanyLogo variant="compact" />
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700 tracking-wide">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                <span>{todayLabel()}</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-950">
              Welcome back, {currentUser?.first_name || 'HR Admin'}
            </h1>
            <p className="text-sm text-blue-700 max-w-xl font-medium">
              Monitor real-time company attendance, onboard new employees with assets, and raise attendance tickets for Super Admin review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setTab('hr-add-employee')}
              className="ui-button-primary"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('tickets')}
              className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-blue-600 px-4 py-2.5 text-xs font-black text-blue-700 hover:bg-blue-50 transition-all active:scale-[0.98]"
            >
              <Ticket className="w-4 h-4 text-blue-600" />
              <span>Raise Ticket</span>
              {pendingTickets > 0 && (
                <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {pendingTickets}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => loadAll(true)}
              disabled={refreshing}
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
              className="ui-icon-button"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {loadError && <p role="alert" className="sa-request-error">{loadError} <button type="button" onClick={()=>loadAll(true)}>Retry</button></p>}
      {/* KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="group text-left bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-3xl font-black text-black tracking-tight">{card.value}</p>
                <p className={`text-xs font-semibold ${card.accent}`}>{card.sub}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${card.iconBg}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </button>
          );
        })}
      </section>

      {/* Quick Actions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Quick Workspace Actions</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => setTab(item.tab)}
                className="group text-left bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-black truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Two-Column Live Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance Snapshot */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
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
            <div className="py-10 text-center text-xs text-slate-500 font-medium rounded-xl border border-dashed border-slate-200">
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
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
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
            <div className="py-10 text-center space-y-2 rounded-xl border border-dashed border-slate-200">
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
