import React, { useEffect, useState } from 'react';
import { Calculator, RefreshCw, Play, AlertCircle, CheckCircle2, Download, Search } from 'lucide-react';
import { api } from '../../services/api';
import { MONTHS, currentIndiaYearMonth, formatINR, payrollStatusTone, periodLabel } from './payrollFormat';

export function MonthlySalaryCalculationPage() {
  const initial = currentIndiaYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const requestKey = `${year}-${month}-${revision}`;
  const currentResult = result?.key === requestKey ? result : null;
  const preview = currentResult?.data;
  const loading = !currentResult;
  const displayedError = error || currentResult?.error;

  useEffect(() => {
    const controller = new AbortController();
    api.previewMonthlyPayroll({ year, month }, controller.signal)
      .then(response => {
        if (!response.success) throw new Error(response.error || 'Could not calculate monthly payroll.');
        if (!controller.signal.aborted) setResult({ key: requestKey, data: response.data });
      })
      .catch(err => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: err.message });
      });
    return () => controller.abort();
  }, [year, month, requestKey]);

  const refresh = () => setRevision(value => value + 1);

  const changePeriod = (setValue, value) => {
    setValue(Number(value));
    setError('');
    setNotice('');
    refresh();
  };

  const handleGenerate = async () => {
    setBusy('generate');
    setError('');
    setNotice('');
    try {
      const res = await api.generateMonthlyPayroll({ year, month });
      if (!res.success) throw new Error(res.error || 'Could not generate payroll.');
      setNotice(res.message);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleExport = async (format) => {
    setBusy(format);
    setError('');
    try {
      const blob = await api.exportPayrollReport({ year, month }, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${year}-${String(month).padStart(2, '0')}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const existing = preview?.existing_period || null;
  const filteredRows = (preview?.records || []).filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${r.employee_name} ${r.employee_code} ${r.department_name}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <span>Monthly Salary Calculation</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Fixed 30 working days · Daily Salary = Monthly / 30 · Absent Deduction = Daily × Absent Days · Final = Monthly − Deduction
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Month" value={month} disabled={Boolean(busy)} onChange={e => changePeriod(setMonth, e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select aria-label="Year" value={year} disabled={Boolean(busy)} onChange={e => changePeriod(setYear, e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white">
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="relative">
            <input type="text" placeholder="Filter employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white" />
            <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
          </div>
          <button type="button" onClick={() => { setError(''); refresh(); }} disabled={loading || Boolean(busy)} className="ui-icon-button" aria-label="Recalculate">
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
      {displayedError && (
        <div role="alert" className="p-3.5 rounded-xl border border-rose-300 bg-white text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}

      {preview?.blockers?.length > 0 && !preview?.finalized && (
        <div role="alert" className="p-4 rounded-2xl border border-amber-300 bg-amber-50/50 space-y-1.5">
          <p className="text-xs font-black text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Payroll processing is blocked until the following issues are resolved:</span>
          </p>
          <ul className="list-disc pl-5 text-xs text-amber-900 space-y-0.5">
            {preview.blockers.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}

      {/* Period Status & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-bold block">Period</span>
            <strong className="text-sm font-black text-blue-950">{periodLabel(year, month)}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Status</span>
            <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${payrollStatusTone(existing?.status || 'PREVIEW')}`}>
              {loading ? 'LOADING' : existing?.status || (preview ? 'NOT GENERATED' : 'UNAVAILABLE')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Total Payable</span>
            <strong className="text-sm font-mono font-black text-blue-700">{formatINR(preview?.totals?.total_payable_paise)}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Total Deductions</span>
            <strong className="text-sm font-mono font-bold text-rose-700">{formatINR(preview?.totals?.total_deduction_paise)}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(!existing || ['DRAFT', 'REJECTED'].includes(existing.status)) && (
            <button type="button" disabled={Boolean(busy) || !preview?.can_process} onClick={handleGenerate} className="ui-button-primary">
              <Play className="w-4 h-4" />
              <span>{busy === 'generate' ? 'Generating…' : existing ? 'Regenerate Draft' : 'Generate Payroll'}</span>
            </button>
          )}
          {existing && (
            <>
              <button type="button" disabled={Boolean(busy)} onClick={() => handleExport('xlsx')} className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-blue-50 text-xs font-bold inline-flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Excel</span>
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => handleExport('csv')} className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-blue-50 text-xs font-bold inline-flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calculation Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-white text-black font-black uppercase">
            <tr>
              <th className="px-4 py-3.5">Employee Name</th>
              <th className="px-4 py-3.5">Employee ID</th>
              <th className="px-4 py-3.5">Monthly Salary</th>
              <th className="px-4 py-3.5">Working Days</th>
              <th className="px-4 py-3.5">Present Days</th>
              <th className="px-4 py-3.5">Absent Days</th>
              <th className="px-4 py-3.5">Daily Salary</th>
              <th className="px-4 py-3.5">Absent Deduction</th>
              <th className="px-4 py-3.5">Final Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">Calculating monthly salaries…</td></tr>
            ) : !filteredRows.length ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">{preview ? 'No matching employees for this period.' : 'Payroll preview unavailable.'}</td></tr>
            ) : filteredRows.map(r => (
              <tr key={r.employee_id} className="hover:bg-blue-50/30">
                <td className="px-4 py-3.5 font-black text-black">{r.employee_name}</td>
                <td className="px-4 py-3.5 font-mono font-bold text-slate-600">{r.employee_code}</td>
                <td className="px-4 py-3.5 font-mono font-bold">{formatINR(r.monthly_salary_paise)}</td>
                <td className="px-4 py-3.5 font-mono font-bold">30</td>
                <td className="px-4 py-3.5 font-mono font-bold text-emerald-700">{Number(r.present_days)}</td>
                <td className="px-4 py-3.5 font-mono font-bold text-rose-700">{Number(r.absent_days)}</td>
                <td className="px-4 py-3.5 font-mono">{formatINR(r.daily_salary_paise)}</td>
                <td className="px-4 py-3.5 font-mono font-bold text-rose-700">- {formatINR(r.absent_deduction_paise)}</td>
                <td className="px-4 py-3.5 font-mono font-black text-blue-950">{formatINR(r.final_payable_paise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
