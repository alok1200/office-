import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useOfficeGeofence } from '../../hooks/useOfficeGeofence';
import { StatusBadge } from '../Common/StatusBadge';
import { LogIn, LogOut, Utensils, AlertCircle, CheckCircle, Loader2, MapPin, RefreshCw } from 'lucide-react';

export function PunchControls({ todayData, onRefresh, loading = false }) {
  const { currentUserId, currentUser } = useAuth();
  const [loadingAction, setLoadingAction] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const currentState = todayData?.current_state || 'NOT_CHECKED_IN';
  const canRecord = !loading && todayData?.can_record_attendance === true;
  const geofence = useOfficeGeofence(currentUser?.can_record_attendance === true);

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

  const isCheckInAllowed = currentState === 'NOT_CHECKED_IN' && geofence.eligible;
  const isStartBreakAllowed = currentState === 'CHECKED_IN' && geofence.eligible;
  const isEndBreakAllowed = currentState === 'ON_BREAK' && geofence.eligible;
  const isCheckOutAllowed = currentState === 'CHECKED_IN' && geofence.eligible;
  const isDayFinished = currentState === 'CHECKED_OUT';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-black">Attendance Punch Controls</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Attendance actions are available only while your GPS is within 15 m of the saved office.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-black font-bold">Current Status:</span>
          <StatusBadge status={currentState} />
        </div>
      </div>

      <section className="employee-geofence" aria-labelledby="employee-office-title">
        <div className="employee-office-heading"><MapPin size={18} /><h3 id="employee-office-title">{geofence.loading ? 'Loading saved office…' : geofence.office?.name || 'Office not configured'}</h3></div>
        {geofence.office && <p><span className="office-fixed-marker" aria-hidden="true" />Saved office · Radius {geofence.office.radius_m} m · Maximum accuracy ±{geofence.office.max_accuracy_m ?? 15} m</p>}
        <p id="employee-geofence-status" role="status">{geofence.loading ? 'Loading saved office settings…' : geofence.message}</p>
        {geofence.sample && <p><span className="employee-gps-marker" aria-hidden="true" />Your location · Distance {Math.round(geofence.distance || 0)} m · Accuracy ±{Math.round(geofence.sample.accuracy)} m</p>}
        <div className="employee-geofence-actions"><button type="button" onClick={geofence.refresh} disabled={!canRecord || geofence.reading || geofence.loading}>{geofence.reading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}{geofence.reading ? 'Checking GPS…' : geofence.tracking ? 'Refresh my location' : 'Check my location'}</button>{geofence.tracking && <button type="button" onClick={geofence.stop} disabled={loadingAction !== null}>Stop location updates</button>}</div>
        <small>The saved office stays fixed. Location updates run only after you choose to check, while this page is visible. Check-in, check-out, start break and end break all require fresh GPS within 15 m of the saved office.</small>
      </section>

      {/* Messages */}
      {message && (
        <div className="mt-4 p-3.5 rounded-xl bg-white border border-blue-200 text-black text-xs flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-white border border-rose-200 text-black text-xs flex items-center gap-2 animate-in fade-in shadow-2xs">
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
          aria-describedby="employee-geofence-status"
          title={geofence.eligible ? 'Check in at the saved office' : geofence.message}
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
          aria-describedby="employee-geofence-status"
          title={geofence.eligible ? 'Check out at the saved office' : geofence.message}
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
