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
  const [locationCheck, setLocationCheck] = useState(null);
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
    setLocationCheck(null);

    let punchSubmitted = false;
    try {
      if (action === 'CHECK_WIFI') {
        setMessage(await geofence.checkOfficeWifi());
        return;
      }
      if (action === 'CHECK_LOCATION') {
        setLocationCheck(await geofence.checkLocation());
        return;
      }

      const { location, gpsSummary } = await geofence.checkLocation({ preferWifi: true });
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
          ? attendanceLocationFailure(res, { code: res.error, message: responseMessage }).message
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
  const actions = [
    { action: 'CHECK_IN', label: 'Check In', icon: LogIn, available: isCheckInAllowed, primary: true },
    { action: 'START_BREAK', label: 'Start Break', icon: Utensils, available: isStartBreakAllowed },
    { action: 'END_BREAK', label: 'End Break', icon: Utensils, available: isEndBreakAllowed, primary: true },
    { action: 'CHECK_OUT', label: 'Check Out', icon: LogOut, available: isCheckOutAllowed, primary: true }
  ];

  return (
    <div className="dashboard-surface">
      <div className="attendance-heading">
        <div>
          <h2>Attendance Punch Controls</h2>
          <p id="attendance-location-policy">
            GPS verification uses the {ATTENDANCE_RADIUS_M} m office boundary. {geofence.office?.wifi_attendance_enabled && 'Registered office Wi-Fi verifies check-in, breaks, and check-out without waiting for GPS.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="sr-only">Current status</span>
          <StatusBadge status={currentState} />
        </div>
      </div>

      {canRecord && (
        <div className="attendance-tools">
          {geofence.office?.name && <p>{geofence.office.name} · GPS accuracy ±{geofence.office.max_accuracy_m} m or better</p>}
          {geofence.office?.office_wifi_matched && <p className="attendance-wifi-match">Office Wi-Fi matched</p>}
          {geofence.office?.office_lan_url && <a href={geofence.office.office_lan_url}>Open the office Wi-Fi attendance link</a>}
          <button
            type="button"
            onClick={() => handlePunch('CHECK_LOCATION')}
            disabled={locationBusy}
            aria-describedby="attendance-location-policy"
          >
            Verify my location and Wi-Fi
          </button>
          <button type="button" disabled={locationBusy} onClick={() => handlePunch('CHECK_WIFI')}>
            Check office Wi-Fi
          </button>
        </div>
      )}
      {canRecord && geofence.loading && <p role="status" className="mt-2 text-sm text-slate-600">Loading your office…</p>}
      {loadingAction && (
        <p role="status" className="mt-2 text-sm text-slate-600">
          {geofence.progress !== null
            ? `Checking your location (GPS accuracy ±${Math.round(geofence.progress)} m)…`
            : loadingAction === 'CHECK_WIFI' ? 'Checking your office network…' : loadingAction === 'CHECK_LOCATION' ? 'Checking GPS and office Wi-Fi…' : 'Verifying your location and recording attendance…'}
        </p>
      )}

      {locationCheck && (
        <section role="status" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-bold text-slate-900">{locationCheck.ready ? 'Location verified for attendance' : 'Location verification needed'}</p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {[['GPS', locationCheck.gps], ['Office Wi-Fi', locationCheck.wifi]].map(([label, result]) => (
              <div key={label}>
                <dt className={result.verified ? 'font-semibold text-blue-700' : 'font-semibold text-slate-700'}>{label}</dt>
                <dd className="text-xs text-slate-600">{result.message}</dd>
              </div>
            ))}
          </dl>
          {locationCheck.ready && !isDayFinished && (
            <p className="mt-2 text-xs font-semibold text-slate-700">
              {isCheckInAllowed ? 'Select Check In below.' : isEndBreakAllowed ? 'Select End Break to resume work.' : 'Select Start Break or Check Out below.'}
            </p>
          )}
        </section>
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

      <div className="attendance-actions">
        {actions.map(({ action, label, icon: Icon, available, primary }) => (
          <button
            key={action}
            type="button"
            className={`attendance-action${primary ? ' attendance-action-primary' : ''}`}
            onClick={() => handlePunch(action)}
            disabled={!available || locationBusy || !canRecord}
            aria-describedby="attendance-location-policy"
          >
            {loadingAction === action ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {isDayFinished && (
        <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl text-center text-xs text-black font-bold shadow-2xs">
          ✅ Workday completed and checked out. No further punches allowed today.
        </div>
      )}
    </div>
  );
}
