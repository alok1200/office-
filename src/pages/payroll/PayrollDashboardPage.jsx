import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  Users,
  CalendarCheck,
  CalendarX,
  TrendingDown,
  IndianRupee,
  RefreshCw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MONTHS, currentIndiaYearMonth, formatDate, formatINR, payrollStatusTone, periodLabel } from './payrollFormat';

export function PayrollDashboardPage({ setTab }) {
  const { isEmployee } = useAuth();
  const initial = currentIndiaYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPayrollDashboard({ year, month });
      if (!res.success) throw new Error(res.error || 'Could not load payroll dashboard.');
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  if (isEmployee) {
    const latest = data?.latest_summary || data?.latest_payslips?.[0] || null;
    return (
      <div className="space-y-6 bg-white text-black">
        <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span>My Salary &amp; Payroll Overview</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Fixed 30-day monthly salary breakdown, deductions, and salary revision history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setTab('payroll-history')} className="ui-button-primary">
              <span>Salary History</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={load} className="ui-icon-button" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-xl border border-rose-300 bg-white text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <p className="text-[11px] font-black uppercase text-slate-500">Current Monthly Salary</p>
            <p className="text-2xl font-black text-blue-950 mt-1">
              {loading ? '—' : data?.current_salary ? formatINR(data.current_salary.monthly_salary_paise) : 'Not set'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {data?.current_salary ? `Effective ${formatDate(data.current_salary.effective_from)}` : 'Contact HR Admin'}
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <p className="text-[11px] font-black uppercase text-slate-500">Latest Present / Absent</p>
            <p className="text-2xl font-black text-black mt-1">
              {loading ? '—' : latest ? `${Number(latest.present_days)} / ${Number(latest.absent_days)}` : '—'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">{latest ? `${periodLabel(latest.year, latest.month)} (30 working days)` : 'No finalized payroll yet'}</p>
          </div>
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <p className="text-[11px] font-black uppercase text-slate-500">Latest Absent Deduction</p>
            <p className="text-2xl font-black text-rose-700 mt-1">
              {loading ? '—' : latest ? formatINR(latest.absent_deduction_paise) : '—'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Daily Salary × Absent Days</p>
          </div>
          <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-xs">
            <p className="text-[11px] font-black uppercase text-blue-700">Latest Payable Salary</p>
            <p className="text-2xl font-black text-blue-950 mt-1">
              {loading ? '—' : latest ? formatINR(latest.final_payable_paise) : '—'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">{latest ? periodLabel(latest.year, latest.month) : 'Monthly Salary − Absent Deduction'}</p>
          </div>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Employees', value: loading ? '—' : data?.total_employees ?? 0, icon: Users, tone: 'text-blue-700' },
    { label: 'Total Monthly Payroll', value: loading ? '—' : formatINR(data?.total_monthly_payroll_paise), icon: IndianRupee, tone: 'text-blue-950' },
    { label: 'Total Present Days', value: loading ? '—' : data?.total_present_days ?? 0, icon: CalendarCheck, tone: 'text-emerald-700' },
    { label: 'Total Absent Days', value: loading ? '—' : data?.total_absent_days ?? 0, icon: CalendarX, tone: 'text-rose-700' },
    { label: 'Total Salary Deductions', value: loading ? '—' : formatINR(data?.total_salary_deductions_paise), icon: TrendingDown, tone: 'text-rose-700' },
    { label: 'Total Payable Salary', value: loading ? '—' : formatINR(data?.total_payable_salary_paise), icon: Wallet, tone: 'text-blue-700' },
  ];

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span>Payroll Dashboard</span>
            {!loading && data?.is_live_preview && (
              <span className="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700">
                Live Preview
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Monthly payroll summary and fixed 30-day attendance-based salary deductions for {periodLabel(year, month)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white">
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="button" onClick={() => setTab('payroll-calculation')} className="ui-button-primary">
            <span>Monthly Calculation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={load} className="ui-icon-button" aria-label="Refresh payroll dashboard">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-xl border border-rose-300 bg-white text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
              <Icon className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
            <p className={`text-xl font-black tracking-tight ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-black">Recent Monthly Payroll Periods</h2>
            <p className="text-xs text-slate-500">Approval and disbursement status across recent months</p>
          </div>
        </div>
        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading payroll periods…</p>
        ) : !data?.recent_periods?.length ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No payroll periods generated yet. Go to <strong>Monthly Salary Calculation</strong> to generate your first payroll.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-white text-black font-black uppercase">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Employees</th>
                  <th className="px-4 py-3">Monthly Total</th>
                  <th className="px-4 py-3">Deductions</th>
                  <th className="px-4 py-3">Final Payable</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_periods.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/30">
                    <td className="px-4 py-3 font-black text-black">{periodLabel(p.year, p.month)}</td>
                    <td className="px-4 py-3 font-semibold">{p.total_employees}</td>
                    <td className="px-4 py-3 font-mono font-bold">{formatINR(p.total_monthly_salary_paise)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-700">{formatINR(p.total_deduction_paise)}</td>
                    <td className="px-4 py-3 font-mono font-black text-blue-950">{formatINR(p.total_payable_paise)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${payrollStatusTone(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
