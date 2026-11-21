import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Send, RefreshCw, RotateCcw, Settings, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Common/Modal';
import { formatDate, formatINR, payrollStatusTone, periodLabel } from './payrollFormat';

export function SalaryPaymentsPage() {
  const [periods, setPeriods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [authPeriod, setAuthPeriod] = useState(null);
  const [authProvider, setAuthProvider] = useState('RAZORPAYX');
  const [authConfirmed, setAuthConfirmed] = useState(false);

  const [txModal, setTxModal] = useState(null);
  const [txRows, setTxRows] = useState([]);

  const [showSettings, setShowSettings] = useState(false);
  const [providerForm, setProviderForm] = useState({ provider: 'RAZORPAYX', mode: 'TEST', account_identifier: '', webhook_url: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, payRes, provRes] = await Promise.all([
        api.listPayrollPeriods(),
        api.listSalaryPayments({ status: statusFilter }),
        api.getPaymentProviderSettings(),
      ]);
      if (pRes.success) setPeriods(pRes.data || []);
      if (payRes.success) setPayments(payRes.data || []);
      if (provRes.success && provRes.data) {
        setProviders(provRes.data);
        const active = provRes.data.find(x => x.is_active) || provRes.data[0];
        if (active) {
          setAuthProvider(active.provider);
          setProviderForm({
            provider: active.provider,
            mode: active.mode || 'TEST',
            account_identifier: active.account_identifier || '',
            webhook_url: active.webhook_url || '',
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const authorizeBulk = async (e) => {
    e.preventDefault();
    if (!authPeriod || !authConfirmed || busy) return;
    setBusy('authorize');
    setError('');
    setNotice('');
    try {
      const res = await api.authorizePayrollPayments(authPeriod.id, { confirm: true, provider: authProvider });
      if (!res.success) throw new Error(res.error || 'Could not authorize payments.');
      setAuthPeriod(null);
      setAuthConfirmed(false);
      setNotice(res.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleRetry = async (payment) => {
    if (busy) return;
    setBusy(`retry-${payment.id}`);
    setError('');
    setNotice('');
    try {
      const res = await api.retrySalaryPayment(payment.id);
      if (!res.success) throw new Error(res.error || 'Could not retry payment.');
      setNotice(res.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const openTransactions = async (payment) => {
    setTxModal(payment);
    setTxRows([]);
    try {
      const res = await api.getPaymentTransactions(payment.id);
      if (res.success) setTxRows(res.data || []);
    } catch { /* handled cleanly */ }
  };

  const saveProviderSettings = async (e) => {
    e.preventDefault();
    setBusy('provider');
    setError('');
    try {
      const res = await api.updatePaymentProviderSettings(providerForm);
      if (!res.success) throw new Error(res.error || 'Could not update provider settings.');
      setNotice(res.message);
      setShowSettings(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const approvedPeriods = periods.filter(p => p.status === 'APPROVED');

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Salary Payments</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Authorize bulk bank transfers via RazorpayX or Cashfree Payouts, monitor live status, and retry failed transfers safely.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowSettings(true)} className="px-3.5 py-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-800 text-xs font-bold inline-flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Provider Settings</span>
          </button>
          <button type="button" onClick={load} className="ui-icon-button" aria-label="Refresh payments">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="p-3.5 rounded-xl border border-blue-200 bg-white text-xs font-bold text-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div role="alert" className="p-3.5 rounded-xl border border-rose-300 bg-white text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ready for Payment Authorization */}
      {approvedPeriods.length > 0 && (
        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-200 space-y-3">
          <h2 className="text-sm font-black text-blue-950">Approved Payrolls Ready for Payment Authorization</h2>
          <div className="space-y-2">
            {approvedPeriods.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-4 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-black text-black text-sm">{periodLabel(p.year, p.month)}</p>
                  <p className="text-slate-600 mt-0.5">{p.total_employees} employees · Total Payable: <strong className="font-mono text-blue-950">{formatINR(p.total_payable_paise)}</strong></p>
                </div>
                <button type="button" onClick={() => { setAuthPeriod(p); setAuthConfirmed(false); }} className="ui-button-primary">
                  <Send className="w-4 h-4" />
                  <span>Authorize Bulk Payment</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-black text-black">Salary Payment History</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${statusFilter === st ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-black border-slate-200 hover:bg-blue-50'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-white font-black uppercase">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Bank Account</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">UTR / Error</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">Loading payment records…</td></tr>
              ) : !payments.length ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">No salary payments recorded yet.</td></tr>
              ) : payments.map(pay => (
                <tr key={pay.id} className="hover:bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div className="font-black text-black">{pay.employee_name}</div>
                    <div className="font-mono text-[11px] text-slate-500">{pay.employee_code}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{periodLabel(pay.year, pay.month)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{pay.bank_name || '—'}</div>
                    <div className="font-mono text-[11px] text-slate-500">{pay.account_number_masked || '—'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-black text-blue-950">{formatINR(pay.amount_paise)}</td>
                  <td className="px-4 py-3 font-bold">{pay.provider}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${payrollStatusTone(pay.status)}`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={pay.provider_utr || pay.failure_reason || ''}>
                    {pay.provider_utr ? <span className="font-mono text-emerald-700 font-bold">{pay.provider_utr}</span> : pay.failure_reason ? <span className="text-rose-700">{pay.failure_reason}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => openTransactions(pay)} className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-blue-50 font-bold inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Log</span>
                      </button>
                      {pay.status === 'FAILED' && (
                        <button type="button" disabled={busy === `retry-${pay.id}`} onClick={() => handleRetry(pay)} className="px-2.5 py-1 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 font-bold inline-flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{busy === `retry-${pay.id}` ? 'Checking…' : 'Retry'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorize Confirmation Modal */}
      {authPeriod && (
        <Modal isOpen onClose={() => { if (!busy) setAuthPeriod(null); }} title={`Authorize Bulk Salary Payment — ${periodLabel(authPeriod.year, authPeriod.month)}`}>
          <form onSubmit={authorizeBulk} className="space-y-4">
            <p className="text-xs text-slate-600">
              You are authorizing automatic bank transfers for <strong>{authPeriod.total_employees} employee(s)</strong> totaling <strong className="font-mono text-blue-950">{formatINR(authPeriod.total_payable_paise)}</strong>. Each transfer uses a unique idempotency key to prevent duplicate payouts.
            </p>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Payment Provider</label>
              <select value={authProvider} onChange={e => setAuthProvider(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold">
                <option value="RAZORPAYX">RazorpayX Payouts</option>
                <option value="CASHFREE">Cashfree Payouts</option>
              </select>
            </div>
            <label className="flex items-start gap-2 text-xs font-semibold text-black cursor-pointer">
              <input type="checkbox" checked={authConfirmed} onChange={e => setAuthConfirmed(e.target.checked)} className="mt-0.5" />
              <span>I have verified the approved payroll totals and explicitly authorize initiating bank transfers.</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={Boolean(busy)} onClick={() => setAuthPeriod(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={!authConfirmed || Boolean(busy)} className="ui-button-primary">
                <Send className="w-4 h-4" />
                <span>{busy === 'authorize' ? 'Authorizing…' : 'Authorize & Initiate Transfers'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transaction History Modal */}
      {txModal && (
        <Modal isOpen onClose={() => setTxModal(null)} title={`Transaction History — ${txModal.employee_name}`}>
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">Idempotency Key: <code className="font-mono text-black">{txModal.idempotency_key}</code></p>
            {!txRows.length ? (
              <p className="py-6 text-center text-slate-500">No provider transaction attempts recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {txRows.map(tx => (
                  <div key={tx.id} className="p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-black">{tx.request_type} · {tx.provider}</strong>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${payrollStatusTone(tx.status)}`}>{tx.status}</span>
                    </div>
                    <p className="text-slate-500">{formatDate(tx.created_at)} · HTTP {tx.http_status || '—'}{tx.provider_reference_id ? ` · Ref ${tx.provider_reference_id}` : ''}</p>
                    {tx.error_message && <p className="text-rose-700 font-semibold">{tx.error_message}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Provider Settings Modal */}
      {showSettings && (
        <Modal isOpen onClose={() => setShowSettings(false)} title="Payment Provider Settings">
          <form onSubmit={saveProviderSettings} className="space-y-4">
            <p className="text-xs text-slate-600">
              Secret API keys and webhook secrets are stored strictly in backend environment variables (<code>backend/.env</code>) and never exposed to the browser.
            </p>
            <div className="space-y-1.5 text-xs">
              {providers.map(p => (
                <div key={p.provider} className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <strong>{p.provider} {p.is_active ? '(Active)' : ''}</strong>
                  <span className={p.configured ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {p.configured ? 'Env Keys Configured' : 'Env Keys Missing'}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Active Provider</label>
              <select value={providerForm.provider} onChange={e => setProviderForm(f => ({ ...f, provider: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold">
                <option value="RAZORPAYX">RazorpayX</option>
                <option value="CASHFREE">Cashfree Payouts</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Mode</label>
              <select value={providerForm.mode} onChange={e => setProviderForm(f => ({ ...f, mode: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold">
                <option value="TEST">TEST / Sandbox</option>
                <option value="LIVE">LIVE / Production</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Source Account Label (optional)</label>
              <input value={providerForm.account_identifier} onChange={e => setProviderForm(f => ({ ...f, account_identifier: e.target.value }))} placeholder="e.g. KNOOVIQ Primary Payout Account" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={busy === 'provider'} className="ui-button-primary">{busy === 'provider' ? 'Saving…' : 'Save Provider'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
