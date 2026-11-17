import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Loader2, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { todayInIndia } from './PersonalRequestForm';
const duration = value => value >= 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value || 0}m`;
const clock = value => value ? new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—';
const statusLabel = value => ({ PRESENT: 'Present', ABSENT: 'Absent', HALF_DAY: 'Half Day', HOLIDAY: 'Holiday', LEAVE: 'Planned Leave', WEEKLY_OFF: 'Weekly Off', FUTURE: '—', NOT_CHECKED_IN: 'Not checked in' }[value] || value.replaceAll('_', ' '));

export function SuperAdminReportsPage() {
  const { currentUserId } = useAuth();
  const [year, setYear] = useState(Number(todayInIndia().slice(0, 4)));
  const [month, setMonth] = useState(Number(todayInIndia().slice(5, 7)));
  const [employee, setEmployee] = useState('');
  const [version, setVersion] = useState(0);
  const [resource, setResource] = useState({ loading: true, data: null, error: '' });
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');
  const filters = { year, month, ...(employee ? { employee_id: employee } : {}) };
  useEffect(() => {
    let active = true;
    setResource(old => ({ ...old, loading: true, error: '' })); setExportError('');
    api.getMonthlyAttendanceReport(currentUserId, { year, month, ...(employee ? { employee_id: employee } : {}) }).then(res => {
      if (!res.success) throw new Error(res.error || 'Could not load monthly attendance.');
      if (active) setResource({ loading: false, data: res.data, error: '' });
    }).catch(error => { if (active) setResource({ loading: false, data: null, error: error.message }); });
    return () => { active = false; };
  }, [currentUserId, year, month, employee, version]);
  const navigate = delta => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(next.getUTCFullYear()); setMonth(next.getUTCMonth() + 1);
  };
  const download = async format => {
    if (exporting) return;
    setExporting(format); setExportError('');
    try {
      const blob = await api.exportMonthlyAttendanceReport(currentUserId, filters, format);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `attendance-${year}-${String(month).padStart(2, '0')}${employee ? `-employee-${employee}` : ''}.${format}`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setExportError(error.message); }
    finally { setExporting(''); }
  };
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const data = resource.data;
  return <section className="sa-operations-page sa-reports-page">
    <div className="sa-report-header"><div><h1><Users size={22} />Monthly attendance</h1><p className="sa-operations-subtitle">Day-level attendance for all employees — {monthLabel}</p></div><div className="sa-report-controls"><button onClick={() => navigate(-1)} aria-label="Previous month" disabled={!!exporting || (year === 2000 && month === 1)}><ChevronLeft size={19} /></button><span className="sa-report-month" aria-live="polite">{monthLabel}</span><button onClick={() => navigate(1)} aria-label="Next month" disabled={!!exporting || (year === 2100 && month === 12)}><ChevronRight size={19} /></button>{[['csv', FileText], ['xlsx', FileSpreadsheet]].map(([format, Icon]) => <button key={format} onClick={() => download(format)} disabled={resource.loading || !!resource.error || !data?.rows.length || !!exporting}>{exporting === format ? <Loader2 size={17} className="animate-spin" /> : <Icon size={18} />}{format.toUpperCase()}</button>)}</div></div>
    <div className="sa-report-filter"><label htmlFor="sa-report-employee" className="sr-only">Filter employee</label><select id="sa-report-employee" value={employee} onChange={e => setEmployee(e.target.value)} disabled={!!exporting}><option value="">All employees</option>{data?.employees.map(person => <option value={person.id} key={person.id}>{person.name} ({person.code})</option>)}</select><span role="status">{resource.loading ? 'Loading…' : `${data?.total || 0} records`}</span></div>
    {exportError && <p className="sa-request-error" role="alert">{exportError}</p>}
    {resource.loading ? <div className="sa-requests-empty" role="status"><Loader2 size={18} className="animate-spin" /> Loading attendance…</div> : resource.error ? <p className="sa-request-error" role="alert">{resource.error} <button onClick={() => setVersion(v => v + 1)}>Retry</button></p> : !data?.rows.length ? <p className="sa-requests-empty">No employees or attendance days found for this selection.</p> : <div className="sa-report-table" tabIndex={0} role="region" aria-label="Monthly attendance records"><table><thead><tr><th>Date</th><th>Employee</th><th>Status</th><th>In (IST)</th><th>Out (IST)</th><th>Work</th><th>Break</th><th>Mode</th><th>Notes</th></tr></thead><tbody>{data.rows.map(row => <tr key={`${row.employee_id}-${row.work_date}`}><td>{new Date(`${row.work_date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</td><td><strong>{row.employee_name}</strong><small>{row.employee_code}</small></td><td><span className={`sa-report-status ${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span></td><td>{clock(row.check_in)}</td><td>{clock(row.check_out)}</td><td>{duration(row.total_work_minutes)}</td><td>{duration(row.total_break_minutes)}</td><td className="sa-report-secondary">{row.mode}</td><td><p className="sa-report-note" title={row.notes}>{row.notes || '—'}</p></td></tr>)}</tbody></table></div>}
    <p className="sa-report-footnote">Times are shown in IST. Future days are unmarked. Weekly off is Sunday; configured holidays and recorded attendance take precedence. Super Admin accounts do not record attendance.</p>
  </section>;
}
