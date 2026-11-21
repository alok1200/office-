import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Check, X, Eye, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Common/Modal';
import { formatDate, formatINR, payrollStatusTone, periodLabel } from './payrollFormat';

export function PayrollApprovalPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [decision, setDecision] = useState(null); // { period, action: 'APPROVE' | 'REJECT' }
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listPayrollPeriods();
      if (!res.success) throw new Error(res.error || 'Could not load payroll periods.');
      setPeriods(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const inspectPeriod = async (p) => {
    setLoadingDetails(true);
    setDetails({ period: p, records: [], approvals: [] });
    try {
      const res = await api.getPayrollPeriodDetails(p.id);
      if (!res.success) throw new Error(res.error || 'Could not load payroll details.');
      setDetails(res.data);
    } catch (err) {
      setError(err.message);
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const confirmDecision = async (e) => {
    e.preventDefault();
    if (submitting || !decision) return;
    setSubmitting(true);
    setDecisionError('');
    try {
      const res = decision.action === 'APPROVE'
        ? await api.approvePayrollPeriod(decision.period.id, remarks)
        : await api.rejectPayrollPeriod(decision.period.id, remarks);
      if (!res.success) throw new Error(res.error || 'Could not process payroll decision.');
      setDecision(null);
      setRemarks('');
      setNotice(res.message);
      await load();
      if (details?.period?.id === decision.period.id) setDetails(null);
    } catch (err) {
      setDecisionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Payroll Approval</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Review HR-submitted monthly payrolls, verify every employee's 30-day deduction, and Approve or Reject.
          </p>
        </div>
        <button type="button" onClick={load} className="ui-icon-button" aria-label="Refresh payrolls">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-white text-black font-black uppercase">
            <tr>
              <th className="px-4 py-3.5">Period</th>
              <th className="px-4 py-3.5">Prepared / Submitted By</th>
              <th className="px-4 py-3.5">Employees</th>
              <th className="px-4 py-3.5">Deductions</th>
              <th className="px-4 py-3.5">Final Payable</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Loading payroll submissions…</td></tr>
            ) : !periods.length ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">No payroll periods submitted yet.</td></tr>
            ) : periods.map(p => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <td className="px-4 py-3.5 font-black text-black">{periodLabel(p.year, p.month)}</td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold">{p.submitted_by_name || p.prepared_by_name || '—'}</div>
                  <div className="text-[11px] text-slate-500">{p.submitted_at ? `Submitted ${formatDate(p.submitted_at)}` : 'Draft'}</div>
                </td>
                <td className="px-4 py-3.5 font-bold">{p.total_employees}</td>
                <td className="px-4 py-3.5 font-mono font-bold text-rose-700">{formatINR(p.total_deduction_paise)}</td>
                <td className="px-4 py-3.5 font-mono font-black text-blue-950">{formatINR(p.total_payable_paise)}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${payrollStatusTone(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button type="button" onClick={() => inspectPeriod(p)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-xs font-bold inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Review</span>
                    </button>
                    {p.status === 'SUBMITTED' && (
                      <>
                        <button type="button" onClick={() => { setDecision({ period: p, action: 'APPROVE' }); setRemarks(''); setDecisionError(''); }} className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" style={{ color: 'white' }} />
                          <span>Approve</span>
                        </button>
                        <button type="button" onClick={() => { setDecision({ period: p, action: 'REJECT' }); setRemarks(''); setDecisionError(''); }} className="px-2.5 py-1.5 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {details && (
        <Modal isOpen onClose={() => setDetails(null)} title={`Payroll Breakdown — ${periodLabel(details.period.year, details.period.month)}`} maxWidth="max-w-4xl">
          {loadingDetails ? (
            <p className="py-8 text-center text-xs text-slate-500">Loading employee records…</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-white font-black uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Employee</th>
                      <th className="px-3 py-2.5">Monthly</th>
                      <th className="px-3 py-2.5">Present / Absent</th>
                      <th className="px-3 py-2.5">Deduction</th>
                      <th className="px-3 py-2.5">Payable</th>
                      <th className="px-3 py-2.5">Bank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {details.records.map(r => (
                      <tr key={r.id}>
                        <td className="px-3 py-2.5 font-bold">{r.employee_name} <span className="font-mono text-slate-500">({r.employee_code})</span></td>
                        <td className="px-3 py-2.5 font-mono">{formatINR(r.monthly_salary_paise)}</td>
                        <td className="px-3 py-2.5 font-mono">{Number(r.present_days)} / {Number(r.absent_days)}</td>
                        <td className="px-3 py-2.5 font-mono text-rose-700">- {formatINR(r.absent_deduction_paise)}</td>
                        <td className="px-3 py-2.5 font-mono font-black text-blue-950">{formatINR(r.final_payable_paise)}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{r.account_number_masked || 'Missing'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setDetails(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold">Close</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {decision && (
        <Modal isOpen onClose={() => { if (!submitting) setDecision(null); }} title={`${decision.action === 'APPROVE' ? 'Confirm Payroll Approval' : 'Reject Payroll'} — ${periodLabel(decision.period.year, decision.period.month)}`}>
          <form onSubmit={confirmDecision} className="space-y-4">
            <p className="text-xs text-slate-600">
              {decision.action === 'APPROVE'
                ? `Approve payroll for ${periodLabel(decision.period.year, decision.period.month)} (${decision.period.total_employees} employees, total payable ${formatINR(decision.period.total_payable_paise)})? Finalized payroll records will be locked and payslips will become available to employees.`
                : `Reject payroll for ${periodLabel(decision.period.year, decision.period.month)} and return it to HR Admin for corrections?`}
            </p>
            {decisionError && <p role="alert" className="text-xs font-semibold text-rose-700">{decisionError}</p>}
            <div>
              <label className="block text-xs font-black uppercase mb-1">
                {decision.action === 'REJECT' ? 'Rejection Reason (required, min 5 characters)' : 'Approval Remarks (optional)'}
              </label>
              <textarea
                rows={3}
                required={decision.action === 'REJECT'}
                minLength={decision.action === 'REJECT' ? 5 : 0}
                maxLength={1000}
                value={remarks}
                disabled={submitting}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                placeholder={decision.action === 'REJECT' ? 'Explain what HR must fix…' : 'Optional approval note…'}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={submitting} onClick={() => setDecision(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold">Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className={decision.action === 'APPROVE' ? 'ui-button-primary' : 'px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold'}
              >
                {submitting ? 'Saving…' : decision.action === 'APPROVE' ? 'Confirm Approval' : 'Reject Payroll'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
