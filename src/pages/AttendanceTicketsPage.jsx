import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ticket, Plus, RefreshCw, Check, X, History, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/Common/Modal';
import { StatusBadge } from '../components/Common/StatusBadge';
import {correctionModes, correctionFormPayload} from '../services/hrCorrectionForm';

const todayIST = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const dayOf = value => String(value || '').slice(0, 10);
const clock = value => value ? new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—';
const stamp = value => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—';
const typeLabel = { MISSED_CHECK_IN: 'Missed check-in', MISSED_CHECK_OUT: 'Missed check-out', BOTH: 'Both punches missing', STATUS_UPDATE: 'Attendance status update' };
const statusLabel = { PRESENT: 'Present', ABSENT: 'Absent', HALF_DAY: 'Half Day', LEAVE: 'Leave' };
const isoTime = (day, time) => new Date(`${day}T${time}:00+05:30`).toISOString();

export function RaiseTicket({ employees, onClose, onSaved, initialType = 'STATUS_UPDATE' }) {
  const [form, setForm] = useState({ employee_id: '', work_date: todayIST(), requested_status: 'PRESENT', reason: '', correction_type: initialType, check_in: '', check_out: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const submit = async event => {
    event.preventDefault(); if (locked.current) return; locked.current = true; setBusy(true); setError('');
    try {
      const response = await api.raiseAttendanceCorrection(correctionFormPayload(form));
      if (!response.success) throw new Error(response.error || 'Could not raise ticket.');
      onSaved(response.message);
    } catch (error) { setError(error.message); } finally { locked.current = false; setBusy(false); }
  };
  return <Modal isOpen onClose={() => { if (!locked.current) onClose(); }} title="Raise attendance ticket" maxWidth="max-w-2xl"><form onSubmit={submit} className="ticket-form">
    <p>Propose an attendance status or missing punch correction. Only Super Admin can approve and update attendance.</p>
    <label>Correction type<select value={form.correction_type} onChange={e => change('correction_type', e.target.value)} disabled={busy}>{Object.entries(correctionModes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Employee ID<select required value={form.employee_id} onChange={e => change('employee_id', e.target.value)} disabled={busy}><option value="">Choose employee</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.employee_id} · {employee.first_name} {employee.last_name}</option>)}</select></label>
    <div className="ticket-form-grid"><label>Date<input type="date" required max={todayIST()} value={form.work_date} onChange={e => change('work_date', e.target.value)} disabled={busy} /></label>{form.correction_type === 'STATUS_UPDATE' && <label>Status<select value={form.requested_status} onChange={e => change('requested_status', e.target.value)} disabled={busy}>{Object.entries(statusLabel).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>}</div>
    {form.correction_type !== 'STATUS_UPDATE' && <div className="ticket-form-grid"><label>Proposed check-in (IST)<input type="time" required value={form.check_in} onChange={e => change('check_in',e.target.value)} disabled={busy} /></label><label>Proposed check-out (IST)<input type="time" required value={form.check_out} onChange={e => change('check_out',e.target.value)} disabled={busy} /></label></div>}
    <label>Reason<textarea rows={3} minLength={form.correction_type === 'STATUS_UPDATE' ? 3 : 10} maxLength={1000} required value={form.reason} onChange={e => change('reason', e.target.value)} disabled={busy} placeholder="Explain why this attendance status should be updated." /></label>
    {error && <p role="alert" className="sa-request-error">{error}</p>}
    <div className="ticket-form-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="ui-button-primary" disabled={busy || !form.employee_id}>{busy ? 'Sending…' : 'Send to Super Admin'}</button></div>
  </form></Modal>;
}
function ReviewTicket({ ticket, status, onClose, onSaved }) {
  const isStatusTicket = Boolean(ticket.metadata?.requested_status);
  const [note, setNote] = useState(''), [checkIn, setCheckIn] = useState(clock(ticket.metadata.proposed_correction?.check_in)), [checkOut, setCheckOut] = useState(clock(ticket.metadata.proposed_correction?.check_out));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const locked = useRef(false);
  const approve = status === 'APPROVED';
  const submit = async event => {
    event.preventDefault(); if (locked.current) return; locked.current = true; setBusy(true); setError(''); try {
      const payload = isStatusTicket
        ? { status, note }
        : { status, note, ...(approve ? { correction: { check_in: isoTime(dayOf(ticket.start_date), checkIn), check_out: isoTime(dayOf(ticket.start_date), checkOut) } } : {}) };
      const response = await api.reviewSuperAdminRequest(null, ticket.id, payload);
      if (!response.success) throw new Error(response.error || 'Could not review ticket.'); onSaved(response.message);
    } catch (error) { setError(error.message); } finally { locked.current = false; setBusy(false); }
  };
  return <Modal isOpen onClose={() => { if (!locked.current) onClose(); }} title={`${approve ? 'Accept' : 'Reject'} ticket #${ticket.id}`}><form onSubmit={submit} className="ticket-form"><p><strong>{ticket.emp_code} · {ticket.first_name} {ticket.last_name}</strong> · {dayOf(ticket.start_date)}</p>{isStatusTicket && <p>Requested status: <strong>{statusLabel[ticket.metadata.requested_status] || ticket.metadata.requested_status}</strong></p>}<p>HR reason: {ticket.reason}</p>
    {approve && !isStatusTicket && <div className="ticket-form-grid"><label>Reviewed check-in (IST)<input type="time" required value={checkIn} onChange={e => setCheckIn(e.target.value)} disabled={busy} /></label><label>Reviewed check-out (IST)<input type="time" required value={checkOut} onChange={e => setCheckOut(e.target.value)} disabled={busy} /></label></div>}
    <label>{isStatusTicket ? 'Review note (optional)' : 'Review note (5–1000 characters)'}<textarea required={!isStatusTicket} rows={3} minLength={isStatusTicket ? 0 : 5} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} disabled={busy} placeholder={isStatusTicket ? 'Optional note…' : ''} /></label>
    {error && <p role="alert" className="sa-request-error">{error}</p>}
    <div className="ticket-form-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="ui-button-primary" disabled={busy}>{busy ? 'Saving…' : approve ? 'Accept and update attendance' : 'Reject ticket'}</button></div>
  </form></Modal>;
}
function AuditHistory({ ticket, onClose }) {
  const [resource, setResource] = useState({ loading: true, rows: [], error: '' });
  useEffect(() => { let active = true; api.getAttendanceCorrectionAudit(ticket.id).then(response => { if (!response.success) throw new Error(response.error); if (active) setResource({ loading: false, rows: response.data, error: '' }); }).catch(error => { if (active) setResource({ loading: false, rows: [], error: error.message }); }); return () => { active = false; }; }, [ticket.id]);
  return <Modal isOpen title={`Ticket #${ticket.id} audit history`} onClose={onClose}>{resource.loading ? <p role="status">Loading audit history…</p> : resource.error ? <p role="alert">{resource.error}</p> : <ol className="ticket-audit">{resource.rows.map(event => { let note = event.remark; try { note = JSON.parse(note).note || note; } catch { } return <li key={event.id}><strong>{event.action.replaceAll('_', ' ')} · {event.new_status}</strong><p>{event.first_name} {event.last_name} · {stamp(event.created_at)}</p><p>{note}</p></li>; })}</ol>}</Modal>;
}

export function AttendanceTicketsPage() {
  const { currentUserId, isHR, isSuperAdmin } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [resource, setResource] = useState({ owner: null, loading: true, rows: [], error: '' });
  const [employees, setEmployees] = useState([]), [directoryError, setDirectoryError] = useState('');
  const [directoryVersion,setDirectoryVersion]=useState(0), [cancelling,setCancelling]=useState(null);
  const cancelBusy=useRef(false);
  const [creating, setCreating] = useState(false), [review, setReview] = useState(null), [audit, setAudit] = useState(null), [notice, setNotice] = useState('');
  const request = useRef(null), version = useRef(0);
  const refresh = useCallback(async (silent = false) => {
    const ticket = ++version.current; request.current?.abort(); const controller = new AbortController(); request.current = controller; if (!silent) setResource(old => ({ ...old, loading: true, error: '' })); try {
      const response = await api.getAttendanceCorrections(controller.signal); if (!response.success) throw new Error(response.error || 'Could not load tickets.'); if (ticket === version.current) setResource({ owner: currentUserId, loading: false, rows: response.data, error: '' });
    } catch (error) { if (error.name !== 'AbortError' && ticket === version.current) setResource(old => ({ owner: currentUserId, loading: false, rows: old.owner === currentUserId ? old.rows : [], error: error.message })); }
  }, [currentUserId]);
  useEffect(() => { refresh(); const update = () => { if (document.visibilityState === 'visible') refresh(true); }; const timer = setInterval(update, 5000); document.addEventListener('visibilitychange', update); return () => { ++version.current; request.current?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', update); }; }, [refresh]);
  useEffect(() => { if (!isHR) return; let active = true; setEmployees([]); setDirectoryError(''); api.getCompanyEmployees(currentUserId).then(response => { if (!response.success) throw new Error(response.error); if (active) setEmployees(response.data.filter(employee => ['EMPLOYEE', 'HR_ADMIN'].includes(employee.role))); }).catch(error => { if (active) setDirectoryError(error.message); }); return () => { active = false; }; }, [isHR, currentUserId, directoryVersion]);
  const rows = resource.owner === currentUserId ? resource.rows : [];
  const loading = resource.owner !== currentUserId || resource.loading;
  const visible = rows.filter(row => filter === 'ALL' || row.status === filter);
  const cancelTicket=async id=>{
    if(cancelBusy.current)return;cancelBusy.current=true;setCancelling(id);
    try{const response=await api.cancelMyRequest(currentUserId,id);if(!response.success)throw new Error(response.error);setNotice('Ticket cancelled.');await refresh();}
    catch(error){setResource(old=>({...old,error:error.message}));}
    finally{cancelBusy.current=false;setCancelling(null);}
  };
  const saved = message => { setCreating(false); setReview(null); setNotice(message); refresh(); };
  return <div className="space-y-6">
    <div className="inbox-heading"><div><h1><Ticket size={23} />{isSuperAdmin ? 'HR-Requests' : 'Tickets'}</h1><p>{isHR ? 'Raise employee attendance corrections for Super Admin review.' : isSuperAdmin ? 'Review HR correction tickets and update attendance on approval.' : 'Track attendance corrections HR has raised for you.'}</p></div>{isHR && <button className="ui-button-primary" onClick={() => {setDirectoryVersion(v=>v+1);setCreating(true);}} disabled={!employees.length}><Plus size={17} />Raise correction ticket</button>}</div>
    <div className="inbox-toolbar" role="group" aria-label="Filter tickets">{['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status === 'ALL' ? 'All tickets' : status[0] + status.slice(1).toLowerCase()}</button>)}<button aria-label="Refresh tickets" disabled={loading} onClick={() => refresh()}><RefreshCw size={16} /></button></div>
      {notice && <p role="status" className="sa-request-notice">{notice}</p>}{(resource.error || directoryError) && <p role="alert" className="sa-info">{resource.error || directoryError}<button className="sa-text-button" onClick={() => {refresh();setDirectoryVersion(v=>v+1);}}>Retry</button></p>}
      {loading ? <p role="status" className="sa-empty">Loading attendance tickets…</p> : !visible.length ? <div className="inbox-empty"><ClipboardList size={30} /><h2>No tickets in this category</h2><p>{isHR ? 'Raise a correction ticket when an employee misses a punch.' : 'Attendance correction tickets will appear here.'}</p></div> : <div className="ticket-list">{visible.map(row => <article className="ticket-card" key={row.id}>
        <div className="ticket-card-heading"><div><h2>Ticket #{row.id} · {row.first_name} {row.last_name}</h2><p>{row.emp_code} · {row.department_name} · {dayOf(row.start_date)}</p></div><StatusBadge status={row.status} /></div>
        <p><strong>{typeLabel[row.metadata?.correction_type] || 'Attendance correction'}</strong> · Raised by {row.raised_by_first_name} {row.raised_by_last_name} on {stamp(row.submission_date)}</p><p className="ticket-reason">{row.reason}</p>
        {row.metadata?.requested_status
          ? <div className="ticket-times"><span>Current status: {statusLabel[row.metadata?.attendance_snapshot?.status] || row.metadata?.attendance_snapshot?.status || '—'}</span><span>Requested status: <strong>{statusLabel[row.metadata.requested_status] || row.metadata.requested_status}</strong></span></div>
          : <div className="ticket-times"><span>Recorded: {clock(row.metadata?.attendance_snapshot?.check_in)} → {clock(row.metadata?.attendance_snapshot?.check_out)}</span><span>Proposed: {clock(row.metadata?.proposed_correction?.check_in)} → {clock(row.metadata?.proposed_correction?.check_out)} IST</span></div>}
        {row.decision_remarks && <div className="sa-info"><div><strong>Super Admin response</strong><p>{row.decision_remarks}</p><small>Reviewed by {row.reviewer_first_name} {row.reviewer_last_name} · {stamp(row.decision_date)}</small>{row.metadata?.correction?.after && <p>{row.metadata?.requested_status ? `Updated status: ${statusLabel[row.metadata.correction.after.status] || row.metadata.correction.after.status}` : `Updated punches: ${clock(row.metadata.correction.after.check_in)} → ${clock(row.metadata.correction.after.check_out)} IST`}</p>}</div></div>}
        <div className="ticket-card-actions"><button className="sa-text-button" onClick={() => setAudit(row)}><History size={16} />Audit history</button>{isHR && row.status === 'PENDING' && Number(row.metadata?.raised_by) === currentUserId && <button type="button" className="sa-text-button" disabled={cancelling !== null} onClick={() => cancelTicket(row.id)}>{cancelling === row.id ? 'Cancelling…' : 'Cancel ticket'}</button>}{isSuperAdmin && row.status === 'PENDING' && <><button className="ui-button-primary" onClick={() => setReview({ ticket: row, status: 'APPROVED' })}><Check size={16} />Accept</button><button className="sa-reject-button" onClick={() => setReview({ ticket: row, status: 'REJECTED' })}><X size={16} />Reject</button></>}</div>
      </article>)}</div>}
    {creating && <RaiseTicket employees={employees} onClose={() => setCreating(false)} onSaved={saved} />}
    {review && <ReviewTicket {...review} onClose={() => setReview(null)} onSaved={saved} />}
    {audit && <AuditHistory ticket={audit} onClose={() => setAudit(null)} />}
  </div>;
}
