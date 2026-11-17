import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { displayRequestDate, PersonalRequestForm } from './PersonalRequestForm';

export function SuperAdminRequestsPage() {
  const { currentUserId } = useAuth();
  const [resource, setResource] = useState({ loading: true, rows: [], error: '' });
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setResource(old => ({ ...old, loading: true, error: '' }));
    try {
      const res = await api.getMyRequests(currentUserId);
      if (!res.success) throw new Error(res.error || 'Could not load requests.');
      setResource({ loading: false, rows: res.data || [], error: '' });
    } catch (error) { setResource({ loading: false, rows: [], error: error.message }); }
  }, [currentUserId]);
  useEffect(() => { refresh(); }, [refresh]);
  const cancel = async () => {
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      const res = await api.cancelSuperAdminRequest(currentUserId, cancelling.id);
      if (!res.success) throw new Error(res.error || 'Could not cancel request.');
      setNotice(res.message); setCancelling(null); await refresh();
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const typeLabel = row => row.metadata?.label || ({ LEAVE: 'Leave', WFH: 'Remote Work', REGULARIZATION: 'Regularization', HOLIDAY: 'Holiday', OTHER: 'Other' }[row.request_type] || row.request_type);
  return <section className="sa-requests-page">
    <h1>My Requests</h1><p className="sa-requests-subtitle">Leave, WFH, official work outside and regularization</p>
    <div className="sa-requests-actions"><button className="sa-request-primary" onClick={() => setOpen(true)}><Plus size={20} /> New request</button><button className="sa-request-refresh" onClick={refresh} aria-label="Refresh requests"><RefreshCw size={16} /></button></div>
    {notice && <p className="sa-request-notice" role="status">{notice}</p>}
    {cancelling && <div className="sa-cancel-confirm" role="group" aria-label="Confirm cancellation"><p>Cancel your {typeLabel(cancelling)} request for {displayRequestDate(cancelling.start_date)}? This cannot be undone.</p><div><button onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : 'Yes, cancel request'}</button><button onClick={() => setCancelling(null)} disabled={busy}>Keep request</button></div></div>}
    {resource.loading ? <p className="sa-requests-empty" role="status"><Loader2 size={18} className="animate-spin" /> Loading your requests…</p> : resource.error ? <p className="sa-request-error" role="alert">{resource.error} <button onClick={refresh}>Retry</button></p> : !resource.rows.length ? <p className="sa-requests-empty">No requests yet. Create a new request to get started.</p> : <div className="sa-requests-table"><table><thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead><tbody>{resource.rows.map(row => <tr key={row.id}><td><span className="sa-request-type">{typeLabel(row)}</span></td><td>{displayRequestDate(row.start_date)}{String(row.start_date).slice(0, 10) !== String(row.end_date).slice(0, 10) && <> – {displayRequestDate(row.end_date)}</>}</td><td>{row.metadata?.days ?? '—'}</td><td><span className={`sa-request-status ${row.status.toLowerCase()}`}>{row.status.charAt(0) + row.status.slice(1).toLowerCase()}</span></td><td><p className="sa-request-reason" title={row.reason}>{row.reason}</p>{row.decision_remarks && <small>{row.decision_remarks}</small>}</td><td>{row.status === 'PENDING' ? <button className="sa-request-cancel" onClick={() => { setNotice(''); setCancelling(row); }} disabled={busy}>Cancel</button> : '—'}</td></tr>)}</tbody></table></div>}
    {open && <PersonalRequestForm onClose={() => setOpen(false)} onSuccess={message => { setOpen(false); setNotice(message); refresh(); }} />}
  </section>;
}
