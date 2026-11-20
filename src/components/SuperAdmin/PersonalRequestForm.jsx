import React, { useEffect, useRef, useState } from 'react';
import { CalendarClock, Info, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {useDataRefresh} from '../../hooks/useDataRefresh';

export const requestDate = value => value ? String(value).slice(0, 10) : '';
export const displayRequestDate = value => value ? new Date(`${requestDate(value)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';
export const todayInIndia = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function useRequestOptions(year) {
  const { currentUserId, isSuperAdmin } = useAuth();
  const [resource, setResource] = useState({ loading: true, data: null, error: '' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setResource({ loading: true, data: null, error: '' });
    (isSuperAdmin ? api.getSuperAdminRequestOptions : api.getMyRequestOptions)(currentUserId, year).then(res => {
      if (!res.success) throw new Error(res.error || 'Could not load allowances.');
      if (active) setResource({ loading: false, data: res.data, error: '' });
    }).catch(error => { if (active) setResource({ loading: false, data: null, error: error.message }); });
    return () => { active = false; };
  }, [currentUserId, isSuperAdmin, year, version]);
  useDataRefresh(()=>setVersion(v=>v+1),['requests']);
  return { ...resource, refresh: () => setVersion(v => v + 1) };
}

export function PersonalRequestForm({ initialCategory = 'CL', onClose, onSuccess }) {
  const { currentUserId, isSuperAdmin } = useAuth();
  const [category, setCategory] = useState(initialCategory);
  const [start, setStart] = useState(todayInIndia());
  const [end, setEnd] = useState(todayInIndia());
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState({ loading: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef(null);
  const submitting = useRef(false);
  const options = useRequestOptions(Number(start.slice(0, 4)) || Number(todayInIndia().slice(0, 4)));
  const payload = { category, start_date: start, end_date: end, half_day: halfDay };
  const payloadKey = JSON.stringify(payload);
  const selected = options.data?.categories?.find(c => c.id === category);
  const balance = options.data?.balances?.find(b => b.category === category);
  const close = () => { if (!submitting.current) onClose(); };

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('select')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape' && !submitting.current) onClose();
      if (event.key === 'Tab') {
        const elements = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
        if (!elements.length) { event.preventDefault(); panel.current?.focus(); return; }
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, []);

  useEffect(() => {
    let active = true;
    setPreview({ loading: true });
    const timer = setTimeout(() => {
      (isSuperAdmin ? api.previewSuperAdminRequest : api.previewMyRequest)(currentUserId, JSON.parse(payloadKey)).then(res => {
        if (active) setPreview({ loading: false, data: res.success ? res.data : null, error: res.success ? '' : res.error, key: payloadKey });
      }).catch(() => { if (active) setPreview({ loading: false, error: 'Could not calculate days. Change the dates to retry.', key: payloadKey }); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [payloadKey, currentUserId, isSuperAdmin]);
  const overBalance = balance && preview.data?.days > balance.remaining;
  const valid = !options.loading && !options.error && !preview.loading && preview.key === payloadKey && preview.data && !overBalance && reason.trim().length >= 10 && reason.trim().length <= 2000;

  const submit = async event => {
    event.preventDefault();
    if (!valid || submitting.current) return;
    submitting.current = true; setSaving(true); setError('');
    try {
      const res = await (isSuperAdmin ? api.submitSuperAdminRequest : api.submitMyRequest)(currentUserId, { ...payload, reason: reason.trim() });
      if (!res.success) { setError(res.error || 'Could not submit request.'); options.refresh(); return; }
      onSuccess(res.message);
    } catch { setError('Connection unavailable. Please retry.'); }
    finally { submitting.current = false; setSaving(false); }
  };
  const applyDuration = mode => {
    const base = new Date(`${start || todayInIndia()}T00:00:00Z`);
    if (Number.isNaN(base.getTime())) return;
    const yearEnd = `${base.getUTCFullYear()}-12-31`;
    const target = new Date(base);
    if (mode === 'week') target.setUTCDate(target.getUTCDate() + 6);
    else if (mode === 'month') { target.setUTCMonth(target.getUTCMonth() + 1); target.setUTCDate(target.getUTCDate() - 1); }
    const nextEnd = target.toISOString().slice(0, 10);
    setHalfDay(false);
    setEnd(nextEnd > yearEnd ? yearEnd : nextEnd);
  };
  return <div className="sa-request-overlay" onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <section className="sa-request-dialog" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sa-request-title" aria-describedby="sa-request-subtitle">
      <button className="sa-dialog-close" onClick={close} disabled={saving} aria-label="Close request form"><X size={21} /></button>
      <h2 id="sa-request-title">Apply for {selected?.label || 'Leave / WFH'}</h2><p id="sa-request-subtitle">{category === 'HOLIDAY' ? 'Request 1 day, 1 week, or 1 month of holiday for Super Admin approval. Approved days show in blue on the calendar.' : 'Working days only — Sundays and holidays are skipped automatically.'}</p>
      <form onSubmit={submit}>
        {error && <p className="sa-request-error" role="alert">{error}</p>}
        {options.error && <div className="sa-request-error" role="alert">{options.error} <button type="button" onClick={options.refresh}>Retry</button></div>}
        <label htmlFor="sa-request-type">Request type</label><select id="sa-request-type" value={category} onChange={e => { setCategory(e.target.value); if (['HOLIDAY', 'REGULARIZATION'].includes(e.target.value)) setHalfDay(false); }} disabled={saving || options.loading}>{options.data?.categories?.map(c => <option key={c.id} value={c.id}>{c.label}</option>) || <option>{options.loading ? 'Loading types…' : 'Unavailable'}</option>}</select>
        <div className="sa-request-dates"><div><label htmlFor="sa-request-from">From</label><input id="sa-request-from" type="date" min="2000-01-01" max={category === 'REGULARIZATION' ? todayInIndia() : '2100-12-31'} value={start} onChange={e => { setStart(e.target.value); if (end < e.target.value || halfDay) setEnd(e.target.value); }} required disabled={saving} /></div><div><label htmlFor="sa-request-to">To</label><input id="sa-request-to" type="date" min={start || '2000-01-01'} max={category === 'REGULARIZATION' ? todayInIndia() : '2100-12-31'} value={end} onChange={e => setEnd(e.target.value)} required disabled={saving || halfDay} /></div></div>
        {category !== 'REGULARIZATION' && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[11px] font-bold text-slate-500">Quick duration:</span>
            <button type="button" disabled={saving} onClick={() => applyDuration('day')} className="px-2.5 py-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-xs font-bold text-blue-700">1 Day</button>
            <button type="button" disabled={saving} onClick={() => applyDuration('week')} className="px-2.5 py-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-xs font-bold text-blue-700">1 Week</button>
            <button type="button" disabled={saving} onClick={() => applyDuration('month')} className="px-2.5 py-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-xs font-bold text-blue-700">1 Month</button>
          </div>
        )}
        <label className="sa-half-day"><input type="checkbox" checked={halfDay} disabled={saving || ['HOLIDAY', 'REGULARIZATION'].includes(category)} onChange={e => { setHalfDay(e.target.checked); if (e.target.checked) setEnd(start); }} /> Half day</label>
        <div className="sa-request-balance"><Info size={17} /><span>{options.loading ? 'Loading balance…' : balance ? <>{balance.label}: <strong>{balance.remaining.toFixed(1)}</strong> of {balance.allowance} day(s) available in {options.data?.year}.{balance.pending > 0 ? ` ${balance.pending} day(s) pending.` : ''}</> : 'No annual allowance applies to this request type.'}</span></div>
        <label htmlFor="sa-request-reason">Reason <span>(min 10 characters)</span></label><textarea id="sa-request-reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} minLength={10} maxLength={2000} placeholder="Explain briefly…" required disabled={saving} />
        <div className="sa-request-preview" role="status"><CalendarClock size={18} />{preview.loading ? 'Calculating working days…' : preview.error ? <span className="sa-request-error">{preview.error}</span> : <span>{displayRequestDate(start)}{start !== end ? ` – ${displayRequestDate(end)}` : ''} · <strong>{preview.data?.days} day(s)</strong></span>}</div>
        {overBalance && <p className="sa-request-error" role="alert">Not enough allowance for the selected dates.</p>}
        <div className="sa-request-submit"><button type="submit" className="sa-request-primary" disabled={!valid || saving}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Submitting…' : 'Submit request'}</button></div>
      </form>
    </section>
  </div>;
}
