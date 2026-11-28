import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { assetTypeLabel } from '../components/HR/AddEmployeeModal';
import { User, Mail, Phone, Calendar, Building, Shield, CheckCircle, Laptop } from 'lucide-react';

export function ProfilePage() {
  const { currentUser } = useAuth();
  const [assets, setAssets] = useState({ loading: true, rows: [], error: '' });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'HR_ADMIN') { setAssets({ loading: false, rows: [], error: '' }); return; }
    let active = true;
    api.getMyAssets().then(res => {
      if (!res.success) throw new Error(res.error || 'Could not load your assets.');
      if (active) setAssets({ loading: false, rows: res.data, error: '' });
    }).catch(error => { if (active) setAssets({ loading: false, rows: [], error: error.message }); });
    return () => { active = false; };
  }, [currentUser?.id]);

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-black flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>My Profile & Employment Details</span>
        </h2>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Your personal employment record and account permissions
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-200">
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
            alt={currentUser.first_name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-100 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-black text-black">
                {currentUser.first_name} {currentUser.last_name}
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-black border border-slate-300 shadow-2xs">
                {currentUser.role === 'HR_ADMIN' ? 'HR Admin' : currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Employee'}
              </span>
            </div>
            <p className="text-sm text-slate-600 font-semibold mt-0.5">{currentUser.designation}</p>
            <p className="text-xs font-mono text-blue-600 font-bold mt-1">
              Employee ID: {currentUser.employee_id}
            </p>
          </div>
        </div>

        {/* Detailed Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
            <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-bold text-black mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
            <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</p>
              <p className="text-sm font-bold text-black mt-0.5">{currentUser.phone || 'No mobile number on file'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
            <Building className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</p>
              <p className="text-sm font-bold text-black mt-0.5">{currentUser.department_name}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Joining Date</p>
              <p className="text-sm font-bold text-black mt-0.5">
                {new Date(currentUser.joining_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Permissions & Rules Card */}
        <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-2">
          <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Assigned Access & Rules</span>
          </h4>
          <ul className="text-xs text-black font-medium space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Record own attendance: {currentUser.can_record_attendance ? 'Enabled' : 'Disabled'}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Submit own requests (Leave, Regularization, WFH, Holiday): Allowed</span>
            </li>
            {currentUser.role === 'HR_ADMIN' && (
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>HR access: view company employees, attendance and requests; onboard new employees and issue company assets</span>
              </li>
            )}
          </ul>
        </div>

        {currentUser.role === 'HR_ADMIN' && (
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>My Company Assets</span>
            </h4>
            {assets.loading ? <p className="text-xs text-slate-500">Loading assets…</p>
              : assets.error ? <p role="alert" className="text-xs text-rose-700">{assets.error}</p>
              : !assets.rows.length ? <p className="text-xs text-slate-500">No company assets are assigned to you.</p>
              : <ul className="space-y-2">{assets.rows.map(asset => (
                <li key={asset.id} className="text-xs border border-slate-200 rounded-lg p-3">
                  <p className="font-black text-black">{asset.asset_name} <span className="font-medium text-slate-500">· {assetTypeLabel(asset.asset_type)}</span></p>
                  <p className="text-slate-600">{asset.asset_tag ? `Tag ${asset.asset_tag}` : 'No tag'}{asset.serial_number ? ` · S/N ${asset.serial_number}` : ''}</p>
                  <p className="text-slate-600">Issued {String(asset.issued_date).slice(0, 10)}{asset.returned_date ? ` · Returned ${String(asset.returned_date).slice(0, 10)}` : ' · In your possession'}</p>
                </li>
              ))}</ul>}
          </div>
        )}
      </div>
    </div>
  );
}
