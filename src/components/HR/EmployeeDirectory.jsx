import {useDataRefresh} from '../../hooks/useDataRefresh';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { Search, Mail, Calendar, Eye, AlertCircle, Building, UserPlus, Plus, Laptop, KeyRound, Trash2, Edit2 } from 'lucide-react';
import { AddEmployeeModal, AssetFields, blankAsset, assetTypeLabel } from './AddEmployeeModal';
import { EditEmployeeModal } from './EditEmployeeModal';

const day = value => value ? String(value).slice(0, 10) : '—';

export function EmployeeDirectory({ openAdd = false }) {
  const { currentUserId, isHR, isSuperAdmin } = useAuth();
  const canManageAccount = (emp) => (isHR && emp.role === 'EMPLOYEE') || (isSuperAdmin && emp.role === 'HR_ADMIN');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [directoryError,setDirectoryError]=useState('');
  const directoryVersion=useRef(0);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedEmp, setInspectedEmp] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [adding, setAdding] = useState(openAdd);
  const [notice, setNotice] = useState('');
  const [assets, setAssets] = useState({ loading: false, rows: [], error: '', extra: [] });
  const [newAsset, setNewAsset] = useState(null);
  const [assetBusy, setAssetBusy] = useState(false);
  const [assetError, setAssetError] = useState('');
  const [resetEmp, setResetEmp] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [deleteEmp, setDeleteEmp] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [editEmp, setEditEmp] = useState(null);

  const handleDeleteEmployee = async () => {
    if (deleteBusy || !deleteEmp) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      const res = await api.deleteEmployee(deleteEmp.id);
      if (!res.success) throw new Error(res.error || 'Could not delete employee.');
      if (inspectedEmp?.id === deleteEmp.id) setInspectedEmp(null);
      setDeleteEmp(null);
      setNotice(res.message || `${deleteEmp.first_name} ${deleteEmp.last_name} has been removed.`);
      fetchEmployees();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const openResetPassword = (emp) => {
    setResetEmp(emp);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setResetError('');
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (resetBusy || !resetEmp) return;
    if (newPassword.length < 8 || newPassword.length > 128) {
      setResetError('New password must be 8–128 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    setResetBusy(true);
    setResetError('');
    try {
      const res = await api.resetEmployeePassword(resetEmp.id, newPassword);
      if (!res.success) throw new Error(res.error || 'Could not reset password.');
      setResetEmp(null);
      setNewPassword('');
      setConfirmPassword('');
      setNotice(res.message || `Password updated for ${resetEmp.first_name} ${resetEmp.last_name}.`);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetBusy(false);
    }
  };

  const fetchEmployees = async (silent=false) => {
    const ticket=++directoryVersion.current;
    if(silent!==true)setLoading(true);setDirectoryError('');
    try {
      const res = await api.getCompanyEmployees(currentUserId, {
        department: selectedDept,
        search: searchQuery
      });
      if(ticket!==directoryVersion.current)return;
      if(!res.success)throw new Error(res.error || 'Could not load employees.');
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err) {
      if(ticket===directoryVersion.current)setDirectoryError(err.message || 'Could not load employees.');
    } finally {
      if(ticket===directoryVersion.current)setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    return()=>{++directoryVersion.current;};
  }, [currentUserId, selectedDept]);
  useDataRefresh(()=>fetchEmployees(true),['employees','offices']);

  const loadAssets = async id => {
    setAssets(old => ({ ...old, loading: true, error: '' }));
    try {
      const res = await api.getEmployeeDetails(id);
      if (!res.success) throw new Error(res.error || 'Could not load assets.');
      setAssets({ loading: false, rows: res.data.assets || [], error: '', extra: res.data.custom_fields || [] });
    } catch (err) { setAssets({ loading: false, rows: [], error: err.message, extra: [] }); }
  };

  const handleInspect = async (emp) => {
    setInspectedEmp(emp);
    setAttendanceHistory([]);
    setNewAsset(null); setAssetError('');
    if (isHR) loadAssets(emp.id);
    setLoadingHistory(true);
    try {
      const res = await api.getEmployeeAttendanceHistory(currentUserId, emp.id, 2026, 11);
      if (res.success && res.data) {
        setAttendanceHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const issueAsset = async event => {
    event.preventDefault();
    if (assetBusy) return;
    setAssetBusy(true); setAssetError('');
    try {
      const res = await api.addEmployeeAsset(inspectedEmp.id, newAsset);
      if (!res.success) throw new Error(res.error || 'Could not issue the asset.');
      setNewAsset(null); await loadAssets(inspectedEmp.id);
    } catch (err) { setAssetError(err.message); }
    finally { setAssetBusy(false); }
  };

  const returnAsset = async asset => {
    if (assetBusy || !window.confirm(`Mark "${asset.asset_name}" as returned?`)) return;
    setAssetBusy(true); setAssetError('');
    try {
      const res = await api.returnEmployeeAsset(asset.id);
      if (!res.success) throw new Error(res.error || 'Could not update the asset.');
      await loadAssets(inspectedEmp.id);
    } catch (err) { setAssetError(err.message); }
    finally { setAssetBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      {directoryError && <p role="alert" className="sa-request-error">{directoryError}<button onClick={()=>fetchEmployees()}>Retry employees</button></p>}
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-black">Company Employee Directory</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Company personnel list, contact info, attendance records and issued company assets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isHR && <button type="button" className="ui-button-primary" onClick={() => { setNotice(''); setAdding(true); }}>
            <UserPlus className="w-4 h-4" /><span>Add Employee</span>
          </button>}
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-black font-bold focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Departments</option>
            <option value="Software development">Software development</option>
            <option value="Hr department">Hr department</option>
            <option value="Digital marketing">Digital marketing</option>
            <option value="Sales and distribution">Sales and distribution</option>
            <option value="Marketing">Marketing</option>
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchEmployees()}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {notice && <p role="status" className="p-3 rounded-xl border border-blue-200 text-xs font-bold text-black">{notice}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 font-medium text-xs">
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 font-medium text-xs">
            No employees found.
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                      alt={emp.first_name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-100"
                    />
                    <div>
                      <h4 className="text-sm font-black text-black leading-tight">
                        {emp.first_name} {emp.last_name}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">{emp.designation}</p>
                      <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-black border border-slate-200 mt-1">
                        {emp.employee_id}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-black border border-slate-300">
                    {emp.role === 'HR_ADMIN' ? 'HR' : emp.role === 'SUPER_ADMIN' ? 'Admin' : 'Staff'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-black">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{emp.department_name}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Joined: {new Date(emp.joining_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-black font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Active Employee
                  </span>
                  <button
                    onClick={() => handleInspect(emp)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-black text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Inspect History</span>
                  </button>
                </div>
                {canManageAccount(emp) && (
                  <div className={`grid ${isHR && emp.role === 'EMPLOYEE' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 pt-1`}>
                    {isHR && emp.role === 'EMPLOYEE' && (
                      <button
                        type="button"
                        onClick={() => setEditEmp(emp)}
                        title="Edit employee details"
                        className="px-2 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-black text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openResetPassword(emp)}
                      title="Reset forgotten password"
                      className="px-2 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-black text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteError(''); setDeleteEmp(emp); }}
                      title={emp.role === 'HR_ADMIN' ? 'Delete HR Admin account' : 'Delete employee account'}
                      className="px-2 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Employee Profile & Attendance History Modal */}
      {inspectedEmp && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedEmp(null)}
          title={`Employee Record: ${inspectedEmp.first_name} ${inspectedEmp.last_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 bg-white text-black">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-black flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Employee records are read-only after creation. You can onboard new employees and manage their company assets.</span>
            </div>

            {/* Profile Summary */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <img
                src={inspectedEmp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                alt={inspectedEmp.first_name}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-200 shadow-xs"
              />
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-black">
                  {inspectedEmp.first_name} {inspectedEmp.last_name}
                </h3>
                <p className="text-xs text-slate-600 font-medium">{inspectedEmp.designation} • {inspectedEmp.department_name}</p>
                <div className="flex items-center gap-2 text-xs text-black pt-1 font-medium">
                  <span>ID: <strong className="font-mono text-black">{inspectedEmp.employee_id}</strong></span>
                  <span>•</span>
                  <span>{inspectedEmp.email}</span>
                </div>
              </div>
            </div>

            {/* Attendance History Section */}
            <div>
              <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">
                Recent Attendance History (November 2026)
              </h4>

              {loadingHistory ? (
                <div className="text-center py-6 text-xs text-slate-500 font-medium">Loading attendance history...</div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  No attendance history recorded for this month.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-black font-black border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Date</th>
                        <th className="px-3.5 py-2.5">Status</th>
                        <th className="px-3.5 py-2.5">Check-In</th>
                        <th className="px-3.5 py-2.5">Check-Out</th>
                        <th className="px-3.5 py-2.5">Work Time</th>
                        <th className="px-3.5 py-2.5">Break</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {attendanceHistory.map((att) => (
                        <tr key={att.id}>
                          <td className="px-3.5 py-2.5 font-bold text-black">{att.work_date}</td>
                          <td className="px-3.5 py-2.5">
                            <StatusBadge status={att.status} />
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-black font-medium">
                            {att.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-black font-medium">
                            {att.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-black font-black">
                            {Math.floor(att.total_work_minutes / 60)}h {att.total_work_minutes % 60}m
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-700 font-bold">
                            {Array.isArray(att.breaks) ? att.breaks.length : 0} ({att.total_break_minutes || 0}m)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {isHR && !!assets.extra?.length && <div>
              <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">Other Details</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">{assets.extra.map((field, i) => <div key={i} className="p-3 rounded-xl border border-slate-200 text-xs"><dt className="text-slate-500 font-bold">{field.label}</dt><dd className="font-black text-black mt-0.5 break-words">{field.value}</dd></div>)}</dl>
            </div>}

            {isHR && <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5"><Laptop className="w-4 h-4 text-blue-600" />Company Assets</h4>
                {!newAsset && <button type="button" className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 hover:bg-blue-50" onClick={() => { setAssetError(''); setNewAsset(blankAsset()); }}><Plus className="w-3.5 h-3.5 text-blue-600" />Issue asset</button>}
              </div>
              {assetError && <p role="alert" className="mb-2 text-xs font-semibold text-rose-700">{assetError}</p>}
              {newAsset && <form onSubmit={issueAsset} className="mb-3 p-4 rounded-xl border border-slate-200 space-y-3">
                <AssetFields asset={newAsset} onChange={setNewAsset} disabled={assetBusy} />
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold" disabled={assetBusy} onClick={() => setNewAsset(null)}>Cancel</button>
                  <button className="ui-button-primary" disabled={assetBusy}>{assetBusy ? 'Saving…' : 'Issue asset'}</button>
                </div>
              </form>}
              {assets.loading ? <div className="text-center py-4 text-xs text-slate-500">Loading assets...</div>
                : assets.error ? <p role="alert" className="text-xs text-rose-700">{assets.error}</p>
                : !assets.rows.length ? <div className="text-center py-4 text-xs text-slate-500 bg-white rounded-xl border border-slate-200">No company assets issued.</div>
                : <div className="space-y-2">{assets.rows.map(asset => <div key={asset.id} className="p-3 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-black text-black">{asset.asset_name} <span className="font-medium text-slate-500">· {assetTypeLabel(asset.asset_type)}</span></p>
                    <p className="text-slate-600 mt-0.5">{asset.asset_tag ? `Tag ${asset.asset_tag}` : 'No tag'}{asset.serial_number ? ` · S/N ${asset.serial_number}` : ''} · {asset.condition.toLowerCase()}</p>
                    <p className="text-slate-600">Issued {day(asset.issued_date)}{asset.returned_date ? ` · Returned ${day(asset.returned_date)}` : ''}</p>
                    {asset.notes && <p className="text-slate-500 mt-0.5">{asset.notes}</p>}
                  </div>
                  {asset.returned_date ? <span className="px-2 py-0.5 rounded-full border border-slate-300 font-bold shrink-0">Returned</span>
                    : <button type="button" className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-blue-50 shrink-0" disabled={assetBusy} onClick={() => returnAsset(asset)}>Mark returned</button>}
                </div>)}</div>}
            </div>}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedEmp(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-black text-xs font-bold shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
      {isHR && adding && <AddEmployeeModal onClose={() => setAdding(false)} onSaved={message => { setAdding(false); setNotice(message); fetchEmployees(); }} />}
      {isHR && editEmp && <EditEmployeeModal employee={editEmp} onClose={() => setEditEmp(null)} onSaved={message => { setEditEmp(null); setNotice(message); fetchEmployees(); }} />}

      {(isHR || isSuperAdmin) && resetEmp && (
        <Modal
          isOpen={true}
          onClose={() => { if (!resetBusy) setResetEmp(null); }}
          title={`Reset Password: ${resetEmp.first_name} ${resetEmp.last_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleResetPassword} className="space-y-4 bg-white text-black">
            <p className="text-xs text-slate-600">
              Set a new password for <strong className="text-black">{resetEmp.first_name} {resetEmp.last_name}</strong> ({resetEmp.employee_id} · {resetEmp.email}). Any existing sessions for this employee will be signed out.
            </p>
            {resetError && (
              <div role="alert" className="p-3 bg-white border border-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold text-rose-700">{resetError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                disabled={resetBusy}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={confirmPassword}
                disabled={resetBusy}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                disabled={resetBusy}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={resetBusy}
                onClick={() => setResetEmp(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-black text-xs font-bold shadow-2xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={resetBusy} className="ui-button-primary">
                <KeyRound className="w-3.5 h-3.5" />
                <span>{resetBusy ? 'Updating…' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {(isHR || isSuperAdmin) && deleteEmp && (
        <Modal
          isOpen={true}
          onClose={() => { if (!deleteBusy) setDeleteEmp(null); }}
          title={`Delete ${deleteEmp.role === 'HR_ADMIN' ? 'HR Admin' : 'Employee'}: ${deleteEmp.first_name} ${deleteEmp.last_name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 bg-white text-black">
            <p className="text-xs text-slate-600">
              Remove <strong className="text-black">{deleteEmp.first_name} {deleteEmp.last_name}</strong> ({deleteEmp.employee_id} · {deleteEmp.email})? Their login email and password will be cleared immediately, active sessions will be signed out, and they will no longer be able to access the system.
            </p>
            {deleteError && (
              <div role="alert" className="p-3 bg-white border border-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold text-rose-700">{deleteError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteEmp(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-black text-xs font-bold shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={handleDeleteEmployee}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteBusy ? 'Deleting…' : deleteEmp.role === 'HR_ADMIN' ? 'Delete HR Admin' : 'Delete Employee'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
