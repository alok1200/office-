import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useOfficeGeofence } from '../../hooks/useOfficeGeofence';
import { StatusBadge } from '../Common/StatusBadge';
import { LogIn, LogOut, Utensils, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function PunchControls({ todayData, onRefresh, loading = false }) {
  const { currentUserId, currentUser, isSuperAdmin } = useAuth();
  if (isSuperAdmin) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <p className="text-sm text-slate-600">
          SUPER_ADMIN accounts do not track personal check‑in, check‑out, or breaks.
        </p>
      </div>
    );
  }
  const [loadingAction, setLoadingAction] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const currentState = todayData?.current_state || 'NOT_CHECKED_IN';
  const canRecord = !loading && todayData?.can_record_attendance === true;
  const geofence = useOfficeGeofence(currentUser?.can_record_attendance === true);

  // Warm up GPS as soon as the controls are ready so Check In / Check Out respond instantly.
  const warmedUp = useRef(false);
  useEffect(() => {
    if (canRecord && !warmedUp.current && !geofence.loading) { warmedUp.current = true; geofence.refresh(); }
  }, [canRecord, geofence.loading]);

  const handlePunch = async (action) => {
    setLoadingAction(action);
    setMessage(null);
    setError(null);

    try {
      const location = await geofence.getPunchLocation();
      const res = await api.recordPunch(currentUserId, action, location);
      if (res.success) {
        setMessage(res.message || `Successfully recorded ${action.replace('_', ' ')}`);
        onRefresh();
      } else {
        setError(res.message || res.error || 'Failed to record punch');
      }
    } catch (err) {
      setError(err.message || 'Network error occurred while punching');
    } finally {
      setLoadingAction(null);
    }
  };

  const isCheckInAllowed = currentState === 'NOT_CHECKED_IN';
  const isStartBreakAllowed = currentState === 'CHECKED_IN';
  const isEndBreakAllowed = currentState === 'ON_BREAK';
  const isCheckOutAllowed = currentState === 'CHECKED_IN';
  const isDayFinished = currentState === 'CHECKED_OUT';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-black">Attendance Punch Controls</h2>
          <p id="attendance-location-policy" className="text-xs text-slate-600 mt-0.5">
            Your location is verified when you press an attendance button. You must be within 50 m of the saved office.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-black font-bold">Current Status:</span>
          <StatusBadge status={currentState} />
        </div>
      </div>

      {/* GPS is checked on attendance actions; the full GPS panel is Super Admin only. */}
      {/* Live GPS status so employees know before tapping whether their signal is good enough. */}
      {canRecord && (() => {
        const limit = Number(geofence.office?.max_accuracy_m ?? 75);
        const accuracy = geofence.liveAccuracy ?? (geofence.sample ? Math.round(geofence.sample.accuracy) : null);
        const good = accuracy !== null && accuracy <= limit;
        return <p role="status" className={`mt-4 text-xs font-semibold ${good ? 'text-emerald-700' : 'text-slate-600'}`}>
          {accuracy === null
            ? (geofence.reading || loadingAction ? 'Getting your GPS signal…' : 'GPS signal not ready yet — it will start when you tap an attendance button.')
            : good ? `GPS ready (±${accuracy} m) — attendance will be recorded instantly.`
            : `GPS signal is weak (±${accuracy} m, need ±${limit} m). Still improving… If this stays high, you are likely on a laptop/desktop without GPS — use your phone, turn on Precise Location, or step near a window or outdoors.`}
        </p>;
      })()}
      {loadingAction && <p role="status" className="mt-2 text-sm text-slate-600">Verifying your location and recording attendance…</p>}

      {/* Messages */}
      {message && (
        <div className="mt-4 p-3.5 rounded-xl bg-white border border-blue-200 text-black text-xs flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 p-3.5 rounded-xl bg-white border border-rose-200 text-black text-xs flex items-center gap-2 animate-in fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-rose-700">{error}</span>
        </div>
      )}

      {!canRecord && (
        <div className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200 text-black text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{loading ? 'Loading your attendance…' : !todayData ? 'Attendance is unavailable. Refresh the page to retry.' : 'Attendance recording is currently disabled for your account.'}</span>
        </div>
      )}

      {/* Available actions use blue; unavailable actions remain disabled. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        {/* 1. Check In */}
        <button
          onClick={() => handlePunch('CHECK_IN')}
          aria-describedby="attendance-location-policy"
          title="Verify your location and check in"
          disabled={!isCheckInAllowed || loadingAction !== null || !canRecord}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
            isCheckInAllowed && canRecord
              ? 'ui-button-primary'
              : 'bg-white text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
          }`}
        >
          {loadingAction === 'CHECK_IN' ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <LogIn className="w-4 h-4 text-blue-600" />
          )}
          <span>Check In</span>
        </button>

        {/* 2. Start Break (with Cutlery icon in Blue) */}
        <button
          onClick={() => handlePunch('START_BREAK')}
          disabled={!isStartBreakAllowed || loadingAction !== null || !canRecord}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
            isStartBreakAllowed && canRecord
              ? 'ui-button-primary'
              : 'bg-white text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
          }`}
        >
          {loadingAction === 'START_BREAK' ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Utensils className="w-4 h-4 text-blue-600" />
          )}
          <span>Start Break</span>
        </button>

        {/* 3. End Break (with Cutlery icon in Blue) */}
        <button
          onClick={() => handlePunch('END_BREAK')}
          disabled={!isEndBreakAllowed || loadingAction !== null || !canRecord}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
            isEndBreakAllowed && canRecord
              ? 'ui-button-primary'
              : 'bg-white text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
          }`}
        >
          {loadingAction === 'END_BREAK' ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Utensils className="w-4 h-4 text-blue-600" />
          )}
          <span>End Break</span>
        </button>

        {/* 4. Check Out */}
        <button
          onClick={() => handlePunch('CHECK_OUT')}
          aria-describedby="attendance-location-policy"
          title="Verify your location and check out"
          disabled={!isCheckOutAllowed || loadingAction !== null || !canRecord}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
            isCheckOutAllowed && canRecord
              ? 'ui-button-primary'
              : 'bg-white text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
          }`}
        >
          {loadingAction === 'CHECK_OUT' ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <LogOut className="w-4 h-4 text-blue-600" />
          )}
          <span>Check Out</span>
        </button>
      </div>

      {isDayFinished && (
        <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl text-center text-xs text-black font-bold shadow-2xs">
          ✅ Workday completed and checked out. No further punches allowed today.
        </div>
      )}
    </div>
  );
}
