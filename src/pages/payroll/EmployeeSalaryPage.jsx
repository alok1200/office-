import React, { useCallback, useEffect, useState } from 'react';
import { IndianRupee, Search, Building2, Edit2, Landmark, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Common/Modal';
import { formatDate, formatINR } from './payrollFormat';

const todayISO = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);

export function EmployeeSalaryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [salaryEmp, setSalaryEmp] = useState(null);
  const [salaryVal, setSalaryVal] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState('');

  const [bankEmp, setBankEmp] = useState(null);
  const [bankForm, setBankForm] = useState({ account_holder_name: '', bank_name: '', account_number: '', ifsc_code: '', account_type: 'SAVINGS' });
  const [savingBank, setSavingBank] = useState(false);
  const [bankError, setBankError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listEmployeeSalaries({ department, search });
      if (!res.success) throw new Error(res.error || 'Could not load employee salaries.');
      setRows(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [department, search]);

  useEffect(() => { load(); }, [load]);

  const openSalaryModal = (emp) => {
    setSalaryEmp(emp);
    setSalaryVal(emp.monthly_salary_paise ? String(Number(emp.monthly_salary_paise) / 100) : '');
    setEffectiveFrom(todayISO());
    setReason('');
    setSalaryError('');
  };

  const openBankModal = (emp) => {
    setBankEmp(emp);
    setBankForm({
      account_holder_name: emp.account_holder_name || `${emp.first_name} ${emp.last_name}`.trim(),
      bank_name: emp.bank_name || '',
      account_number: '',
      ifsc_code: emp.ifsc_code || '',
      account_type: emp.account_type || 'SAVINGS',
    });
    setBankError('');
  };

  const saveSalary = async (e) => {
    e.preventDefault();
    if (savingSalary || !salaryEmp) return;
    setSavingSalary(true);
    setSalaryError('');
    try {
      const res = await api.upsertEmployeeSalary(salaryEmp.id, {
        monthly_salary: salaryVal,
        effective_from: effectiveFrom,
        update_reason: reason,
      });
      if (!res.success) throw new Error(res.error || 'Could not update salary.');
      setSalaryEmp(null);
      setNotice(res.message);
      load();
    } catch (err) {
      setSalaryError(err.message);
    } finally {
      setSavingSalary(false);
    }
  };

  const saveBank = async (e) => {
    e.preventDefault();
    if (savingBank || !bankEmp) return;
    setSavingBank(true);
    setBankError('');
    try {
      const res = await api.upsertEmployeeBankAccount(bankEmp.id, bankForm);
      if (!res.success) throw new Error(res.error || 'Could not save bank details.');
      setBankEmp(null);
      setNotice(res.message);
      load();
    } catch (err) {
      setBankError(err.message);
    } finally {
      setSavingBank(false);
    }
  };

  const departments = ['ALL', ...new Set(rows.map(r => r.department_name).filter(Boolean))];

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-blue-950 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            <span>Employee Salary &amp; Bank Details</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure monthly base salary (fixed 30-day divisor) and verified bank accounts. Salary revisions preserve finalized payrolls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employee or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            />
            <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
          </div>
          <select value={department} onChange={e => setDepartment(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white">
            {departments.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
          </select>
          <button type="button" onClick={load} className="ui-icon-button" aria-label="Refresh salaries">
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-white text-black font-black uppercase">
            <tr>
              <th className="px-4 py-3.5">Employee</th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Monthly Salary</th>
              <th className="px-4 py-3.5">Daily Rate (/30)</th>
              <th className="px-4 py-3.5">Effective From</th>
              <th className="px-4 py-3.5">Bank Account</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Loading employee salaries…</td></tr>
            ) : !rows.length ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">No active employees found.</td></tr>
            ) : rows.map(emp => (
              <tr key={emp.id} className="hover:bg-blue-50/30">
                <td className="px-4 py-3.5">
                  <div className="font-black text-black">{emp.first_name} {emp.last_name}</div>
                  <div className="text-[11px] font-mono text-slate-500 font-bold">{emp.employee_code}</div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 font-medium"><Building2 className="w-3.5 h-3.5 text-blue-600" />{emp.department_name}</div>
                </td>
                <td className="px-4 py-3.5 font-mono font-black text-blue-950">
                  {emp.monthly_salary_paise ? formatINR(emp.monthly_salary_paise) : <span className="text-amber-700 font-sans font-bold">Not configured</span>}
                </td>
                <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                  {emp.monthly_salary_paise ? formatINR(Math.round(Number(emp.monthly_salary_paise) / 30)) : '—'}
                </td>
                <td className="px-4 py-3.5 font-semibold">{formatDate(emp.effective_from)}</td>
                <td className="px-4 py-3.5">
                  {emp.account_number_masked ? (
                    <div>
                      <div className="font-bold text-black">{emp.bank_name}</div>
                      <div className="font-mono text-[11px] text-slate-600">{emp.account_number_masked} · {emp.ifsc_code}</div>
                    </div>
                  ) : (
                    <span className="text-amber-700 font-bold">Not registered</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button type="button" onClick={() => openSalaryModal(emp)} className="px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold inline-flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{emp.monthly_salary_paise ? 'Update Salary' : 'Set Salary'}</span>
                    </button>
                    <button type="button" onClick={() => openBankModal(emp)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-black font-bold inline-flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-blue-600" />
                      <span>Bank</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {salaryEmp && (
        <Modal isOpen onClose={() => { if (!savingSalary) setSalaryEmp(null); }} title={`Update Monthly Salary — ${salaryEmp.first_name} ${salaryEmp.last_name}`}>
          <form onSubmit={saveSalary} className="space-y-4">
            <div className="p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <span className="text-slate-600 font-semibold">Previous Monthly Salary:</span>
              <strong className="font-mono text-black">{salaryEmp.monthly_salary_paise ? formatINR(salaryEmp.monthly_salary_paise) : 'Not set'}</strong>
            </div>
            {salaryError && <p role="alert" className="text-xs font-semibold text-rose-700">{salaryError}</p>}
            <div>
              <label className="block text-xs font-black uppercase mb-1">Updated Monthly Salary (₹)</label>
              <input type="number" step="0.01" min="1" required value={salaryVal} disabled={savingSalary} onChange={e => setSalaryVal(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold" placeholder="e.g. 30000" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Effective From Date</label>
              <input type="date" required value={effectiveFrom} disabled={savingSalary} onChange={e => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Update Reason</label>
              <textarea rows={3} required minLength={3} maxLength={500} value={reason} disabled={savingSalary} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" placeholder="e.g. Annual appraisal revision / Initial salary setup" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={savingSalary} onClick={() => setSalaryEmp(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={savingSalary} className="ui-button-primary">{savingSalary ? 'Saving…' : 'Save Salary'}</button>
            </div>
          </form>
        </Modal>
      )}

      {bankEmp && (
        <Modal isOpen onClose={() => { if (!savingBank) setBankEmp(null); }} title={`Bank Account — ${bankEmp.first_name} ${bankEmp.last_name}`}>
          <form onSubmit={saveBank} className="space-y-4">
            {bankEmp.account_number_masked && (
              <p className="text-xs text-slate-600">Current registered account: <strong className="font-mono text-black">{bankEmp.account_number_masked}</strong> ({bankEmp.ifsc_code})</p>
            )}
            {bankError && <p role="alert" className="text-xs font-semibold text-rose-700">{bankError}</p>}
            <div>
              <label className="block text-xs font-black uppercase mb-1">Account Holder Name</label>
              <input required maxLength={150} value={bankForm.account_holder_name} disabled={savingBank} onChange={e => setBankForm(f => ({ ...f, account_holder_name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Bank Name</label>
              <input required maxLength={150} value={bankForm.bank_name} disabled={savingBank} onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="e.g. HDFC Bank" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Account Number</label>
                <input required pattern="\d{9,18}" value={bankForm.account_number} disabled={savingBank} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))} placeholder="9–18 digits" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">IFSC Code</label>
                <input required maxLength={11} value={bankForm.ifsc_code} disabled={savingBank} onChange={e => setBankForm(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() }))} placeholder="e.g. HDFC0001234" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-semibold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Account Type</label>
              <select value={bankForm.account_type} disabled={savingBank} onChange={e => setBankForm(f => ({ ...f, account_type: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold">
                <option value="SAVINGS">Savings</option>
                <option value="SALARY">Salary</option>
                <option value="CURRENT">Current</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={savingBank} onClick={() => setBankEmp(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={savingBank} className="ui-button-primary">{savingBank ? 'Saving…' : 'Save Bank Details'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
