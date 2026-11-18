import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ticket, Plus, RefreshCw, Check, X, History, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/Common/Modal';
import { StatusBadge } from '../components/Common/StatusBadge';
import { MyRequestsPage } from './MyRequestsPage';

const todayIST = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const dayOf = value => String(value || '').slice(0, 10);
const clock = value => value ? new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—';
const stamp = value => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—';
const typeLabel = { MISSED_CHECK_IN: 'Missed check-in', MISSED_CHECK_OUT: 'Missed check-out', BOTH: 'Both punches missing' };
const isoTime = (day, time) => new Date(`${day}T${time}:00+05:30`).toISOString();

function RaiseTicket({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_id: '', work_date: new Date(Date.now() - 86400000 + 19800000).toISOString().slice(0, 10), correction_type: 'MISSED_CHECK_OUT', check_in: '09:00', check_out: '18:00', reason: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const submit = async event => {
    event.preventDefault(); if (locked.current) return; locked.current = true; setBusy(true); setError('');
    try {
      const response = await api.raiseAttendanceCorrection({ ...form, employee_id: Number(form.employee_id), check_in: isoTime(form.work_date, form.check_in), check_out: isoTime(form.work_date, form.check_out) });
      if (!response.success) throw new Error(response.error || 'Could not raise ticket.');
      onSaved(response.message);
    } catch (error) { setError(error.message); } finally { locked.current = false; setBusy(false); }
  };
  return <Modal isOpen onClose={() => { if (!locked.current) onClose(); }} title="Raise attendance correction" maxWidth="max-w-2xl"><form onSubmit={submit} className="ticket-form">
    <p>HR proposes the correct punches. Only Super Admin can approve and update attendance.</p>
    <label>Employee<select required value={form.employee_id} onChange={e => change('employee_id', e.target.value)} disabled={busy}><option value="">Choose employee</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name} · {employee.employee_id}</option>)}</select></label>
    <div className="ticket-form-grid"><label>Attendance date<input type="date" required max={todayIST()} value={form.work_date} onChange={e => change('work_date', e.target.value)} disabled={busy} /></label><label>Missing punch<select value={form.correction_type} onChange={e => change('correction_type', e.target.value)} disabled={busy}>{Object.entries(typeLabel).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label></div>
    <div className="ticket-form-grid"><label>Proposed check-in (IST)<input type="time" required value={form.check_in} onChange={e => change('check_in', e.target.value)} disabled={busy} /></label><label>Proposed check-out (IST)<input type="time" required value={form.check_out} onChange={e => change('check_out', e.target.value)} disabled={busy} /></label></div>
    <label>Reason (10–1000 characters)<textarea rows={3} minLength={10} maxLength={1000} required value={form.reason} onChange={e => change('reason', e.target.value)} disabled={busy} placeholder="Explain which punch was missed and how the correct time was verified." /></label>
    {error && <p role="alert" className="sa-request-error">{error}</p>}
    <div className="ticket-form-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="ui-button-primary" disabled={busy || !form.employee_id}>{busy ? 'Sending…' : 'Send to Super Admin'}</button></div>
  </form></Modal>;
}
function ReviewTicket({ ticket, status, onClose, onSaved }) {
  const [note, setNote] = useState(''), [checkIn, setCheckIn] = useState(clock(ticket.metadata.proposed_correction?.check_in)), [checkOut, setCheckOut] = useState(clock(ticket.metadata.proposed_correction?.check_out));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const locked = useRef(false);
  const approve = status === 'APPROVED';
  const submit = async event => {
    event.preventDefault(); if (locked.current) return; locked.current = true; setBusy(true); setError(''); try {
      const response = await api.reviewSuperAdminRequest(null, ticket.id, { status, note, ...(approve ? { correction: { check_in: isoTime(dayOf(ticket.start_date), checkIn), check_out: isoTime(dayOf(ticket.start_date), checkOut) } } : {}) });
      if (!response.success) throw new Error(response.error || 'Could not review ticket.'); onSaved(response.message);
    } catch (error) { setError(error.message); } finally { locked.current = false; setBusy(false); }
  };
  return <Modal isOpen onClose={() => { if (!locked.current) onClose(); }} title={`${approve ? 'Approve' : 'Reject'} ticket #${ticket.id}`}><form onSubmit={submit} className="ticket-form"><p><strong>{ticket.first_name} {ticket.last_name}</strong> · {dayOf(ticket.start_date)}</p><p>HR reason: {ticket.reason}</p>
    {approve && <div className="ticket-form-grid"><label>Reviewed check-in (IST)<input type="time" required value={checkIn} onChange={e => setCheckIn(e.target.value)} disabled={busy} /></label><label>Reviewed check-out (IST)<input type="time" required value={checkOut} onChange={e => setCheckOut(e.target.value)} disabled={busy} /></label></div>}
    <label>Review note (5–1000 characters)<textarea required rows={3} minLength={5} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} disabled={busy} /></label>
    {error && <p role="alert" className="sa-request-error">{error}</p>}
    <div className="ticket-form-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="ui-button-primary" disabled={busy}>{busy ? 'Saving…' : approve ? 'Approve and update attendance' : 'Reject ticket'}</button></div>
  </form></Modal>;
}
function AuditHistory({ ticket, onClose }) {
  const [resource, setResource] = useState({ loading: true, rows: [], error: '' });
  useEffect(() => { let active = true; api.getAttendanceCorrectionAudit(ticket.id).then(response => { if (!response.success) throw new Error(response.error); if (active) setResource({ loading: false, rows: response.data, error: '' }); }).catch(error => { if (active) setResource({ loading: false, rows: [], error: error.message }); }); return () => { active = false; }; }, [ticket.id]);
  return <Modal isOpen title={`Ticket #${ticket.id} audit history`} onClose={onClose}>{resource.loading ? <p role="status">Loading audit history…</p> : resource.error ? <p role="alert">{resource.error}</p> : <ol className="ticket-audit">{resource.rows.map(event => { let note = event.remark; try { note = JSON.parse(note).note || note; } catch { } return <li key={event.id}><strong>{event.action.replaceAll('_', ' ')} · {event.new_status}</strong><p>{event.first_name} {event.last_name} · {stamp(event.created_at)}</p><p>{note}</p></li>; })}</ol>}</Modal>;
}

export function AttendanceTicketsPage() {
  const { currentUserId, isHR, isSuperAdmin } = useAuth();
  const [mode, setMode] = useState('corrections'), [filter, setFilter] = useState('ALL');
  const [resource, setResource] = useState({ owner: null, loading: true, rows: [], error: '' });
  const [employees, setEmployees] = useState([]), [directoryError, setDirectoryError] = useState('');
  const [creating, setCreating] = useState(false), [review, setReview] = useState(null), [audit, setAudit] = useState(null), [notice, setNotice] = useState('');
  const request = useRef(null), version = useRef(0);
  const refresh = useCallback(async (silent = false) => {
    const ticket = ++version.current; request.current?.abort(); const controller = new AbortController(); request.current = controller; if (!silent) setResource(old => ({ ...old, loading: true, error: '' })); try {
      const response = await api.getAttendanceCorrections(controller.signal); if (!response.success) throw new Error(response.error || 'Could not load tickets.'); if (ticket === version.current) setResource({ owner: currentUserId, loading: false, rows: response.data, error: '' });
    } catch (error) { if (error.name !== 'AbortError' && ticket === version.current) setResource(old => ({ owner: currentUserId, loading: false, rows: old.owner === currentUserId ? old.rows : [], error: error.message })); }
  }, [currentUserId]);
  useEffect(() => { refresh(); const update = () => { if (document.visibilityState === 'visible') refresh(true); }; const timer = setInterval(update, 5000); document.addEventListener('visibilitychange', update); return () => { ++version.current; request.current?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', update); }; }, [refresh]);
  useEffect(() => { if (!isHR) return; let active = true; setEmployees([]); setDirectoryError(''); api.getCompanyEmployees(currentUserId).then(response => { if (!response.success) throw new Error(response.error); if (active) setEmployees(response.data.filter(employee => ['EMPLOYEE', 'HR_ADMIN'].includes(employee.role))); }).catch(error => { if (active) setDirectoryError(error.message); }); return () => { active = false; }; }, [isHR, currentUserId]);
  const rows = resource.owner === currentUserId ? resource.rows : [];
  const loading = resource.owner !== currentUserId || resource.loading;
  const visible = rows.filter(row => filter === 'ALL' || row.status === filter);
  const saved = message => { setCreating(false); setReview(null); setNotice(message); refresh(); };
  return <div className="space-y-6">
    <div className="inbox-heading"><div><h1><Ticket size={23} />{isSuperAdmin ? 'HR-Requests' : 'Tickets'}</h1><p>{isHR ? 'Raise employee attendance corrections for Super Admin review.' : isSuperAdmin ? 'Review HR correction tickets and update attendance on approval.' : 'Track attendance corrections HR has raised for you.'}</p></div>{isHR && <button className="ui-button-primary" onClick={() => setCreating(true)} disabled={!employees.length}><Plus size={17} />Raise correction ticket</button>}</div>
    {!isSuperAdmin && <div className="inbox-toolbar"><button aria-pressed={mode === 'corrections'} onClick={() => setMode('corrections')}>Attendance corrections</button> </div>}
    {/* <button aria-pressed={mode==='personal'} onClick={()=>setMode('personal')}>My leave / WFH requests</button>    // this we dont use */}
    {mode === 'personal' && !isSuperAdmin ? <MyRequestsPage /> : <>
      <div className="inbox-toolbar" role="group" aria-label="Filter tickets">{['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status === 'ALL' ? 'All tickets' : status[0] + status.slice(1).toLowerCase()}</button>)}<button aria-label="Refresh tickets" disabled={loading} onClick={() => refresh()}><RefreshCw size={16} /></button></div>
      {notice && <p role="status" className="sa-request-notice">{notice}</p>}{(resource.error || directoryError) && <p role="alert" className="sa-info">{resource.error || directoryError}<button className="sa-text-button" onClick={() => refresh()}>Retry</button></p>}
      {loading ? <p role="status" className="sa-empty">Loading attendance tickets…</p> : !visible.length ? <div className="inbox-empty"><ClipboardList size={30} /><h2>No tickets in this category</h2><p>{isHR ? 'Raise a correction ticket when an employee misses a punch.' : 'Attendance correction tickets will appear here.'}</p></div> : <div className="ticket-list">{visible.map(row => <article className="ticket-card" key={row.id}>
        <div className="ticket-card-heading"><div><h2>Ticket #{row.id} · {row.first_name} {row.last_name}</h2><p>{row.emp_code} · {row.department_name} · {dayOf(row.start_date)}</p></div><StatusBadge status={row.status} /></div>
        <p><strong>{typeLabel[row.metadata?.correction_type] || 'Attendance correction'}</strong> · Raised by {row.raised_by_first_name} {row.raised_by_last_name} on {stamp(row.submission_date)}</p><p className="ticket-reason">{row.reason}</p>
        <div className="ticket-times"><span>Recorded: {clock(row.metadata?.attendance_snapshot?.check_in)} → {clock(row.metadata?.attendance_snapshot?.check_out)}</span><span>Proposed: {clock(row.metadata?.proposed_correction?.check_in)} → {clock(row.metadata?.proposed_correction?.check_out)} IST</span></div>
        {row.decision_remarks && <div className="sa-info"><div><strong>Super Admin response</strong><p>{row.decision_remarks}</p><small>Reviewed by {row.reviewer_first_name} {row.reviewer_last_name} · {stamp(row.decision_date)}</small>{row.metadata?.correction?.after && <p>Updated punches: {clock(row.metadata.correction.after.check_in)} → {clock(row.metadata.correction.after.check_out)} IST</p>}</div></div>}
        <div className="ticket-card-actions"><button className="sa-text-button" onClick={() => setAudit(row)}><History size={16} />Audit history</button>{isSuperAdmin && row.status === 'PENDING' && <><button className="ui-button-primary" onClick={() => setReview({ ticket: row, status: 'APPROVED' })}><Check size={16} />Approve</button><button className="sa-reject-button" onClick={() => setReview({ ticket: row, status: 'REJECTED' })}><X size={16} />Reject</button></>}</div>
      </article>)}</div>}
    </>}
    {creating && <RaiseTicket employees={employees} onClose={() => setCreating(false)} onSaved={saved} />}
    {review && <ReviewTicket {...review} onClose={() => setReview(null)} onSaved={saved} />}
    {audit && <AuditHistory ticket={audit} onClose={() => setAudit(null)} />}
  </div>;
}
