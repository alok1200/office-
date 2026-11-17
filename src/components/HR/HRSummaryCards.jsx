import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Users, UserCheck, Palmtree, UserX, Shield } from 'lucide-react';

export function HRSummaryCards() {
  const { currentUserId } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.getCompanySummary(currentUserId);
        if (res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to load HR summary cards:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [currentUserId]);

  return (
    <div className="space-y-4">
      {/* Read-Only Notice Banner */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-black text-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-bold">HR Admin Portal — Read-Only Mode:</span>
          <span className="text-slate-600">Company-wide visibility into headcount, punches, and requests. Decision authority reserved for Super Admin.</span>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-white text-black border border-slate-300 font-black text-[10px]">
          VIEW ONLY
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Total Employees */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Headcount</p>
            <p className="text-2xl font-black text-black mt-0.5">{loading ? '--' : summary?.totalEmployees}</p>
            <span className="text-[11px] text-slate-500">Active personnel</span>
          </div>
        </div>

        {/* 2. Present Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present Today</p>
            <p className="text-2xl font-black text-black mt-0.5">{loading ? '--' : summary?.presentToday}</p>
            <span className="text-[11px] text-blue-600 font-bold">Checked in / Active</span>
          </div>
        </div>

        {/* 3. On Leave / WFH */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Palmtree className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">On Leave / WFH</p>
            <p className="text-2xl font-black text-black mt-0.5">{loading ? '--' : summary?.onLeaveOrWfh}</p>
            <span className="text-[11px] text-slate-500 font-medium">Approved time-off</span>
          </div>
        </div>

        {/* 4. Absent */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <UserX className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absent</p>
            <p className="text-2xl font-black text-black mt-0.5">{loading ? '--' : summary?.absent}</p>
            <span className="text-[11px] text-slate-500 font-medium">No punch recorded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
