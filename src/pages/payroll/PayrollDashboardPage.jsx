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
import { DashboardHeader, DashboardMetric } from '../../components/Dashboard/DashboardElements';
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

  const refreshButton = (
    <button type="button" onClick={load} disabled={loading} aria-label="Refresh payroll dashboard">
      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
    </button>
  );
  const errorNotice = error && (
    <div role="alert" className="dashboard-surface flex items-center gap-2 text-sm text-rose-700">
      <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {error}
    </div>
  );

  if (isEmployee) {
    const latest = data?.latest_summary || data?.latest_payslips?.[0] || null;
    return (
      <div className="dashboard-page">
        <DashboardHeader icon={Wallet} context={periodLabel(year, month)} title="My salary" description="Monthly salary, attendance deductions, and revision history.">
          <button type="button" className="dashboard-hero-primary" onClick={() => setTab('payroll-history')}>Salary History <ArrowRight size={16} aria-hidden="true" /></button>
          {refreshButton}
        </DashboardHeader>
        {errorNotice}
        <div className="dashboard-metrics dashboard-metrics--wide dashboard-metrics--currency">
          <DashboardMetric label="Current monthly salary" value={loading ? '—' : data?.current_salary ? formatINR(data.current_salary.monthly_salary_paise) : 'Not set'} detail={loading ? undefined : data?.current_salary ? `Effective ${formatDate(data.current_salary.effective_from)}` : 'Contact HR Admin'} icon={IndianRupee} />
          <DashboardMetric label="Latest present / absent" value={loading || !latest ? '—' : `${Number(latest.present_days)} / ${Number(latest.absent_days)}`} detail={latest ? `${periodLabel(latest.year, latest.month)} · 30 working days` : undefined} icon={CalendarCheck} tone="green" />
          <DashboardMetric label="Latest absent deduction" value={loading || !latest ? '—' : formatINR(latest.absent_deduction_paise)} detail="Daily salary × absent days" icon={TrendingDown} tone="rose" />
          <DashboardMetric label="Latest payable salary" value={loading || !latest ? '—' : formatINR(latest.final_payable_paise)} detail={latest ? periodLabel(latest.year, latest.month) : undefined} icon={Wallet} tone="feature" />
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Employees', value: loading ? '—' : data?.total_employees ?? 0, icon: Users, tone: 'blue' },
    { label: 'Total Monthly Payroll', value: loading ? '—' : formatINR(data?.total_monthly_payroll_paise), icon: IndianRupee, tone: 'indigo' },
    { label: 'Total Present Days', value: loading ? '—' : data?.total_present_days ?? 0, icon: CalendarCheck, tone: 'green' },
    { label: 'Total Absent Days', value: loading ? '—' : data?.total_absent_days ?? 0, icon: CalendarX, tone: 'rose' },
    { label: 'Total Salary Deductions', value: loading ? '—' : formatINR(data?.total_salary_deductions_paise), icon: TrendingDown, tone: 'rose' },
    { label: 'Total Payable Salary', value: loading ? '—' : formatINR(data?.total_payable_salary_paise), icon: Wallet, tone: 'feature' },
  ];

  return (
    <div className="dashboard-page">
      <DashboardHeader icon={Wallet} context={periodLabel(year, month)} title="Payroll Dashboard" description="Monthly salary totals, attendance deductions, and disbursement status.">
        <select aria-label="Payroll month" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
        </select>
        <select aria-label="Payroll year" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <button type="button" className="dashboard-hero-primary" onClick={() => setTab('payroll-calculation')}>
          Monthly Calculation <ArrowRight size={16} aria-hidden="true" />
        </button>
        {refreshButton}
      </DashboardHeader>

      {errorNotice}
      <section className="dashboard-section" aria-labelledby="payroll-monthly-totals">
        <div className="dashboard-section-heading">
          <h2 id="payroll-monthly-totals" className="dashboard-section-title">Monthly totals</h2>
          {!loading && data?.is_live_preview && <span className="dashboard-status-note">Live estimate</span>}
        </div>
        <div className="dashboard-metrics dashboard-metrics--payroll">
          {kpis.map(metric => <DashboardMetric key={metric.label} {...metric} />)}
        </div>
      </section>

      <section className="dashboard-surface space-y-4" aria-labelledby="payroll-recent-periods">
        <h2 id="payroll-recent-periods" className="dashboard-section-title">Recent payroll periods</h2>
        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading payroll periods…</p>
        ) : !data?.recent_periods?.length ? (
          <div className="dashboard-empty">
            No payroll periods generated yet. Go to <strong>Monthly Salary Calculation</strong> to generate your first payroll.
          </div>
        ) : (
          <div className="dashboard-table-scroll" tabIndex={0} role="region" aria-label="Recent payroll periods table">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-xs">
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
      </section>
    </div>
  );
}
