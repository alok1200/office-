import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, RefreshCw, CheckCircle2, Clock3, XCircle, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/Common/StatusBadge';

const date = value => {
  if (!value) return '—';
  const parsed = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const label = value => String(value || 'Request').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());

export function ResponsesPage() {
  const { currentUserId } = useAuth();
  const [state, setState] = useState({ owner: null, rows: [], loading: true, error: '' });
  const [filter, setFilter] = useState('ALL');
  const request = useRef(null), version = useRef(0);
  const refresh = useCallback(async (silent = false) => {
    const sequence = ++version.current;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    if (!silent) setState(old => ({ ...old, loading: true, error: '' }));
    try {
      const response = await api.getMyRequests(currentUserId, controller.signal);
      if (!response.success) throw new Error(response.error || 'Could not load your responses.');
      if (sequence !== version.current) return;
      const rows = [...(response.data || [])].sort((a, b) => new Date(b.decision_date || b.submission_date || 0) - new Date(a.decision_date || a.submission_date || 0));
      setState({ owner: currentUserId, rows, loading: false, error: '' });
    } catch (error) {
      if (error.name !== 'AbortError' && sequence === version.current) setState(old => ({ owner: currentUserId, rows: old.owner === currentUserId ? old.rows : [], loading: false, error: error.message }));
    }
  }, [currentUserId]);
  useEffect(() => {
    setFilter('ALL'); refresh();
    const update = () => { if (document.visibilityState === 'visible') refresh(true); };
    const timer = setInterval(update, 5000);
    document.addEventListener('visibilitychange', update);
    return () => { ++version.current; request.current?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [refresh]);
  const rows = state.owner === currentUserId ? state.rows : [];
  const loading = state.owner !== currentUserId || state.loading;
  const filtered = rows.filter(row => filter === 'ALL' || row.status === filter);
  const summaries = [{ status: 'APPROVED', title: 'Approved', icon: CheckCircle2 }, { status: 'REJECTED', title: 'Rejected', icon: XCircle }, { status: 'PENDING', title: 'Awaiting response', icon: Clock3 }];
  return <div className="space-y-6">
    <header className="inbox-heading"><div><h1><MessageSquare size={23} />Responses</h1><p>All updates and review comments on your own requests.</p></div><button type="button" className="ui-icon-button" onClick={() => refresh()} aria-label="Refresh responses" disabled={loading}><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button></header>
    <div className="response-summary">{summaries.map(({ status, title, icon: Icon }) => <div key={status}><span className="inbox-category-icon"><Icon size={21} /></span><div><p>{title}</p><strong>{state.owner === currentUserId ? rows.filter(row => row.status === status).length : '—'}</strong></div></div>)}</div>
    <div className="inbox-toolbar" role="group" aria-label="Filter responses">{[['ALL', 'All updates'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['PENDING', 'Awaiting response'], ['CANCELLED', 'Cancelled']].map(([value, text]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{text}</button>)}</div>
    {state.owner === currentUserId && state.error && <p role="alert" className="sa-info">{state.error}<button type="button" className="sa-text-button" onClick={() => refresh()}>Retry</button></p>}
    <section className="response-table" aria-label="Your request responses" aria-busy={loading}>
      {loading ? <p role="status" className="sa-empty">Loading your responses…</p> : !filtered.length ? <div className="inbox-empty"><Inbox size={32} /><h2>{rows.length ? 'No updates in this category' : 'No requests yet'}</h2><p>{rows.length ? 'Choose another filter to see your request updates.' : 'Responses will appear here after you submit a request.'}</p></div> : <table><thead><tr><th scope="col">Request</th><th scope="col">Requested dates</th><th scope="col">Status</th><th scope="col">Response</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}>
        <td><strong>{label(row.metadata?.category || row.request_type)}</strong><small>Request #{row.id} · Sent {date(row.submission_date)}</small><p>{row.reason}</p></td>
        <td className="sa-nowrap">{date(row.start_date)}{row.end_date !== row.start_date && <><br />to {date(row.end_date)}</>}</td>
        <td><StatusBadge status={row.status} /></td>
        <td><p>{row.decision_remarks || (row.status === 'PENDING' ? 'Awaiting review. Your response will appear here.' : row.status === 'CANCELLED' ? 'This request was cancelled.' : 'No review comment was provided.')}</p>{row.decision_date && <small>Reviewed {date(row.decision_date)}</small>}</td>
      </tr>)}</tbody></table>}
    </section>
  </div>;
}
