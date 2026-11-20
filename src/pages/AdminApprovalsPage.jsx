import {useDataRefresh} from '../hooks/useDataRefresh';
import React, { useCallback, useEffect, useState } from 'react';
import { Check, Inbox, Loader2, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { displayRequestDate, requestDate } from '../components/SuperAdmin/PersonalRequestForm';

export function AdminApprovalsPage() {
  const { currentUserId } = useAuth();
  const [resource, setResource] = useState({ loading: true, rows: [], error: '' });
  const [review, setReview] = useState(null);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const refresh = useCallback(async () => {
    setResource(old => ({ ...old, loading: true, error: '' }));
    try {
      const res = await api.getPendingApprovals(currentUserId);
      if (!res.success) throw new Error(res.error || 'Could not load pending approvals.');
      setResource({ loading: false, rows: res.data, error: '' });
    } catch (error) { setResource({ loading: false, rows: [], error: error.message }); }
  }, [currentUserId]);
  useEffect(() => { refresh(); }, [refresh]);
  useDataRefresh(refresh,['requests'],{enabled:!saving&&!review});
  const beginReview = (row, status) => {
    setReview({ row, status }); setNote(''); setCategory(row.metadata?.category || ''); setCheckIn(row.metadata?.proposed_correction?.check_in ? new Date(row.metadata.proposed_correction.check_in).toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'}) : ''); setCheckOut(row.metadata?.proposed_correction?.check_out ? new Date(row.metadata.proposed_correction.check_out).toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'}) : ''); setMessage(''); setActionError('');
  };
  const isStatusTicket = Boolean(review?.row.metadata?.requested_status);
  const needsCategory = review?.status === 'APPROVED' && review.row.request_type === 'LEAVE' && !review.row.metadata?.category;
  const regularizing = review?.status === 'APPROVED' && review.row.request_type === 'REGULARIZATION' && !isStatusTicket;
  const submit = async event => {
    event.preventDefault();
    if (saving || (!isStatusTicket && note.trim().length < 5)) return;
    setSaving(true); setActionError('');
    try {
      const payload = { status: review.status, note: note.trim(), ...(needsCategory ? { category } : {}) };
      if (regularizing) {
        const day = requestDate(review.row.start_date);
        payload.correction = { check_in: new Date(`${day}T${checkIn}:00+05:30`).toISOString(), check_out: new Date(`${day}T${checkOut}:00+05:30`).toISOString() };
      }
      const res = await api.reviewSuperAdminRequest(currentUserId, review.row.id, payload);
      if (!res.success) throw new Error(res.error || 'Could not save the decision.');
      setMessage(res.message); setReview(null); await refresh();
    } catch (error) { setActionError(error.message); }
    finally { setSaving(false); }
  };
  return <section className="sa-operations-page sa-approvals-page">
    <div className="sa-operations-heading"><h1><Inbox size={22} />Pending approvals <span className="sa-approval-count">{resource.loading ? '…' : resource.rows.length}</span></h1><button className="sa-request-refresh" aria-label="Refresh pending approvals" onClick={() => { setReview(null); refresh(); }} disabled={saving}><RefreshCw size={16} /></button></div>
    <p className="sa-operations-subtitle">Leave balance is charged on approval; rejection does not deduct leave. Regularization approval updates the attendance record using reviewed times.</p>
    {message && <p role="status" className="sa-request-notice">{message}</p>}
    {resource.loading ? <p className="sa-requests-empty" role="status"><Loader2 size={18} className="animate-spin" /> Loading pending approvals…</p> : resource.error ? <p className="sa-request-error" role="alert">{resource.error} <button onClick={refresh}>Retry</button></p> : !resource.rows.length ? <p className="sa-requests-empty">You're all caught up. No pending requests.</p> : <div className="sa-approval-list">{resource.rows.map(row => <article className="sa-approval-card" key={row.id}>
      <div className="sa-approval-details"><h2>{row.first_name} {row.last_name} <span>({row.emp_code} · {row.department_name})</span></h2><p><span>{row.metadata?.label || ({ LEAVE: 'Leave', WFH: 'Remote Work', REGULARIZATION: 'Regularization', HOLIDAY: 'Holiday', OTHER: 'Other' }[row.request_type] || row.request_type)}</span> · {displayRequestDate(row.start_date)}{requestDate(row.start_date) !== requestDate(row.end_date) && ` – ${displayRequestDate(row.end_date)}`} · {row.review_days === null ? 'Review dates' : `${row.review_days} day(s)`}</p><p className="sa-approval-reason">Reason: {row.reason}</p>{row.metadata?.workflow === 'HR_ATTENDANCE_CORRECTION' && <p className="sa-approval-reason">{row.metadata.requested_status ? `Raised by HR · Requested status: ${row.metadata.requested_status.replace('_', ' ')}` : `Raised by HR · Proposed punches: ${new Date(row.metadata.proposed_correction.check_in).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})} – ${new Date(row.metadata.proposed_correction.check_out).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})} IST`}</p>}</div>
      <div className="sa-approval-actions"><button className="sa-request-primary" disabled={saving} onClick={() => beginReview(row, 'APPROVED')}><Check size={18} />Approve</button><button className="sa-reject-button" disabled={saving} onClick={() => beginReview(row, 'REJECTED')}><X size={18} />Reject</button></div>
      {review?.row.id === row.id && <form className="sa-review-form" onSubmit={submit} aria-label={`Confirm ${review.status.toLowerCase()} for ${row.first_name}`}>
        <h3>{review.status === 'APPROVED' ? 'Confirm approval' : 'Confirm rejection'}</h3>
        {needsCategory && <label>Leave category<select value={category} onChange={e => setCategory(e.target.value)} required disabled={saving}><option value="">Choose the correct category</option><option value="CL">Casual Leave</option><option value="SL">Sick Leave</option><option value="EL">Earned Leave</option></select></label>}
        {regularizing && <><p>Review the corrected times for {displayRequestDate(row.start_date)}. Times are in IST. Existing breaks must fit within these times.</p><div className="sa-review-time-grid"><label>Check in (IST)<input type="time" required value={checkIn} onChange={e => setCheckIn(e.target.value)} disabled={saving} /></label><label>Check out (IST)<input type="time" required value={checkOut} onChange={e => setCheckOut(e.target.value)} disabled={saving} /></label></div></>}
        <label>{isStatusTicket ? 'Review note (optional)' : 'Review note (5–1000 characters)'}<textarea value={note} onChange={e => setNote(e.target.value)} minLength={isStatusTicket ? 0 : 5} maxLength={1000} required={!isStatusTicket} rows={2} disabled={saving} placeholder="Explain your decision…" autoFocus /></label>
        {actionError && <p className="sa-request-error" role="alert">{actionError}</p>}
        <div className="sa-review-buttons"><button className={review.status === 'APPROVED' ? 'sa-request-primary' : 'sa-reject-button'} type="submit" disabled={saving || (!isStatusTicket && note.trim().length < 5) || (needsCategory && !category) || (regularizing && (!checkIn || !checkOut))}>{saving ? 'Saving…' : review.status === 'APPROVED' ? 'Confirm approval' : 'Confirm rejection'}</button><button type="button" onClick={() => setReview(null)} disabled={saving}>Go back</button></div>
      </form>}
    </article>)}</div>}
  </section>;
}
