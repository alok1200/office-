import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Download, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatINR, payrollStatusTone, periodLabel } from './payrollFormat';

export function PayslipsPage() {
  const { isEmployee } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listPayslips();
      if (!res.success) throw new Error(res.error || 'Could not load payslips.');
      setRows(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadPdf = async (rec) => {
    setDownloadingId(rec.id);
    setError('');
    try {
      const blob = await api.downloadPayslipPdf(rec.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${rec.employee_code}-${rec.year}-${String(rec.month).padStart(2, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || 'Could not download payslip PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const visible = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${r.employee_name} ${r.employee_code} ${periodLabel(r.year, r.month)}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>{isEmployee ? 'My Monthly Payslips' : 'Monthly Payslips'}</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {isEmployee ? 'View and download your approved monthly salary payslips as PDF.' : 'Download approved employee payslips.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEmployee && (
            <div className="relative">
              <input type="text" placeholder="Search employee or month..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white" />
              <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
            </div>
          )}
          <button type="button" onClick={load} className="ui-icon-button" aria-label="Refresh payslips">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
              <th className="px-4 py-3.5">Month</th>
              {!isEmployee && <th className="px-4 py-3.5">Employee</th>}
              <th className="px-4 py-3.5">Monthly Salary</th>
              <th className="px-4 py-3.5">Present / Absent</th>
              <th className="px-4 py-3.5">Absent Deduction</th>
              <th className="px-4 py-3.5">Final Payable</th>
              <th className="px-4 py-3.5">Payment Status</th>
              <th className="px-4 py-3.5 text-right">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={isEmployee ? 7 : 8} className="px-4 py-8 text-center text-slate-500">Loading payslips…</td></tr>
            ) : !visible.length ? (
              <tr><td colSpan={isEmployee ? 7 : 8} className="px-4 py-8 text-center text-slate-500">No approved payslips available yet.</td></tr>
            ) : visible.map(rec => (
              <tr key={rec.id} className="hover:bg-blue-50/30">
                <td className="px-4 py-3.5 font-black text-black">{periodLabel(rec.year, rec.month)}</td>
                {!isEmployee && (
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-black">{rec.employee_name}</div>
                    <div className="font-mono text-[11px] text-slate-500">{rec.employee_code}</div>
                  </td>
                )}
                <td className="px-4 py-3.5 font-mono font-bold">{formatINR(rec.monthly_salary_paise)}</td>
                <td className="px-4 py-3.5 font-mono font-semibold">{Number(rec.present_days)} / {Number(rec.absent_days)} <span className="text-slate-400">(30)</span></td>
                <td className="px-4 py-3.5 font-mono font-bold text-rose-700">- {formatINR(rec.absent_deduction_paise)}</td>
                <td className="px-4 py-3.5 font-mono font-black text-blue-950">{formatINR(rec.final_payable_paise)}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${payrollStatusTone(rec.payment_status || rec.period_status)}`}>
                    {rec.payment_status || rec.period_status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    disabled={downloadingId === rec.id}
                    onClick={() => downloadPdf(rec)}
                    className="px-3 py-1.5 rounded-xl border border-blue-600 bg-white hover:bg-blue-50 text-blue-700 font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>{downloadingId === rec.id ? 'Downloading…' : 'Download PDF'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
