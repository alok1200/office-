import React, { useCallback, useEffect, useState } from 'react';
import { History, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, formatINR } from './payrollFormat';

export function SalaryHistoryPage() {
  const { isEmployee } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getSalaryHistory();
      if (!res.success) throw new Error(res.error || 'Could not load salary history.');
      setRows(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${r.first_name} ${r.last_name} ${r.employee_code} ${r.update_reason}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Salary History</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {isEmployee ? 'Complete history of your monthly salary revisions.' : 'Audit trail of all employee monthly salary revisions and effective dates.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEmployee && (
            <div className="relative">
              <input type="text" placeholder="Search employee or reason..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white" />
              <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
            </div>
          )}
          <button type="button" onClick={load} className="ui-icon-button" aria-label="Refresh history">
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
              {!isEmployee && <th className="px-4 py-3.5">Employee</th>}
              <th className="px-4 py-3.5">Previous Salary</th>
              <th className="px-4 py-3.5">Updated Salary</th>
              <th className="px-4 py-3.5">Effective From</th>
              <th className="px-4 py-3.5">Updated By</th>
              <th className="px-4 py-3.5">Reason</th>
              <th className="px-4 py-3.5">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={isEmployee ? 6 : 7} className="px-4 py-8 text-center text-slate-500">Loading salary history…</td></tr>
            ) : !visible.length ? (
              <tr><td colSpan={isEmployee ? 6 : 7} className="px-4 py-8 text-center text-slate-500">No salary revision records yet.</td></tr>
            ) : visible.map(r => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                {!isEmployee && (
                  <td className="px-4 py-3.5">
                    <div className="font-black text-black">{r.first_name} {r.last_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{r.employee_code}</div>
                  </td>
                )}
                <td className="px-4 py-3.5 font-mono text-slate-600">{r.previous_salary_paise ? formatINR(r.previous_salary_paise) : 'Initial'}</td>
                <td className="px-4 py-3.5 font-mono font-black text-blue-950">{formatINR(r.updated_salary_paise)}</td>
                <td className="px-4 py-3.5 font-bold">{formatDate(r.effective_from)}</td>
                <td className="px-4 py-3.5 font-medium">{r.updated_by_first_name ? `${r.updated_by_first_name} ${r.updated_by_last_name}` : '—'}</td>
                <td className="px-4 py-3.5 max-w-xs break-words">{r.update_reason}</td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
