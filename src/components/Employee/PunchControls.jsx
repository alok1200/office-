import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ATTENDANCE_RADIUS_M, attendanceLocationFailure } from '../../services/geofenceStatus';
import { useOfficeGeofence } from '../../hooks/useOfficeGeofence';
import { StatusBadge } from '../Common/StatusBadge';
import { LogIn, LogOut, Utensils, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const punchLabels = { CHECK_IN: 'Check-in', CHECK_OUT: 'Check-out', START_BREAK: 'Break start', END_BREAK: 'Break end' };

export function PunchControls({ todayData, onRefresh, loading = false }) {
  const { currentUserId, isSuperAdmin } = useAuth();
  const [loadingAction, setLoadingAction] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const canRecord = !isSuperAdmin && !loading && todayData?.can_record_attendance === true;
  const geofence = useOfficeGeofence(canRecord);

  if (isSuperAdmin) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <p className="text-sm text-slate-600">
          SUPER_ADMIN accounts do not track personal check‑in, check‑out, or breaks.
        </p>
      </div>
    );
  }
  const currentState = todayData?.current_state || 'NOT_CHECKED_IN';
  const locationBusy = loadingAction !== null || geofence.loading;

  const handlePunch = async (action) => {
    setLoadingAction(action);
    setMessage(null);
    setError(null);

    let punchSubmitted = false;
    try {
      const allowWifi = ['CHECK_LOCATION', 'CHECK_IN', 'CHECK_OUT'].includes(action);
      const { message: locationMessage, location, gpsSummary } = await geofence.checkLocation({ allowWifi });
      if (action === 'CHECK_LOCATION') {
        setMessage(locationMessage);
        return;
      }

      punchSubmitted = true;
      const res = await api.recordPunch(currentUserId, action, location);
      const latest = await onRefresh();
      if (res.success) {
        setMessage(res.verification_method === 'OFFICE_WIFI'
          ? [res.message, gpsSummary].filter(Boolean).join(' ')
          : `${punchLabels[action]} recorded using GPS.`);
      } else {
        const responseMessage = res.message || res.error || 'Could not record attendance. Please retry.';
        const failure = typeof res.office_wifi_matched === 'boolean'
          ? attendanceLocationFailure(res, { code: res.error, message: responseMessage }, allowWifi).message
          : responseMessage;
        setError(latest && latest.current_state !== currentState
          ? `${failure} Your attendance status and available actions have refreshed.`
          : failure);
      }
    } catch (err) {
      if (punchSubmitted) await onRefresh();
      const failure = err instanceof TypeError && punchSubmitted
        ? 'The connection was interrupted. Check your attendance status before retrying.'
        : err.message || 'Could not verify your location. Please retry.';
      setError(!punchSubmitted && ['CHECK_IN', 'CHECK_OUT'].includes(action) && (err.code?.startsWith('GPS_') || err.code === 'LOW_ACCURACY')
        ? `${failure} If you miss a punch, submit an Attendance Regularization request from My Requests.`
        : failure);
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
            GPS verification uses the {ATTENDANCE_RADIUS_M} m office boundary. {geofence.office?.wifi_attendance_enabled && 'When GPS is unavailable or too coarse, registered office Wi-Fi can verify check-in and check-out.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-black font-bold">Current Status:</span>
          <StatusBadge status={currentState} />
        </div>
      </div>

      {canRecord && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {geofence.office?.name && <p className="text-xs text-slate-600">{geofence.office.name} · GPS accuracy must be ±{geofence.office.max_accuracy_m} m or better</p>}
          {geofence.office?.office_wifi_matched && <p className="text-xs font-semibold text-blue-700">Office Wi-Fi matched</p>}
          <button
            type="button"
            className="text-xs font-bold text-blue-700 underline disabled:opacity-50"
            onClick={() => handlePunch('CHECK_LOCATION')}
            disabled={locationBusy}
            aria-describedby="attendance-location-policy"
          >
            Check my location
          </button>
        </div>
      )}
      {canRecord && geofence.loading && <p role="status" className="mt-2 text-sm text-slate-600">Loading your office…</p>}
      {loadingAction && (
        <p role="status" className="mt-2 text-sm text-slate-600">
          {geofence.progress !== null
            ? `Checking your location (GPS accuracy ±${Math.round(geofence.progress)} m)…`
            : loadingAction === 'CHECK_LOCATION' ? 'Checking your location…' : 'Verifying your location and recording attendance…'}
        </p>
      )}

      {/* Messages */}
      {message && (
        <div role="status" className="mt-4 p-3.5 rounded-xl bg-white border border-blue-200 text-black text-xs flex items-center gap-2 animate-in fade-in shadow-2xs">
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
          disabled={!isCheckInAllowed || locationBusy || !canRecord}
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
          disabled={!isStartBreakAllowed || locationBusy || !canRecord}
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
          disabled={!isEndBreakAllowed || locationBusy || !canRecord}
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
          disabled={!isCheckOutAllowed || locationBusy || !canRecord}
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
