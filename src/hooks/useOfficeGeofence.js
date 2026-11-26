import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { attendanceAccuracyLimit, attendanceLocationFailure, evaluateLocation, officeWifiMessage } from '../services/geofenceStatus';
import { readCurrentLocation } from '../services/currentLocation';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from './useDataRefresh';

export function useOfficeGeofence(enabled) {
  const { currentUserId } = useAuth();
  const [officeState, setOfficeState] = useState(null);
  const [progress, setProgress] = useState(null);
  const session = useRef(null);
  const locationRequest = useRef(null);

  const loadOffice = useCallback(async () => {
    const active = session.current;
    if (!active || active.userId !== currentUserId) return null;
    const request = ++active.officeRequest;

    let result;
    try {
      const response = await api.getOfficeLocation();
      if (!response.success) throw new Error(response.error || 'Could not load your saved office.');
      result = { office: response.data };
    } catch (error) {
      result = { error: error instanceof TypeError ? 'Could not reach the attendance server. Check your connection and retry.' : error.message };
    }

    if (session.current !== active) return null;
    if (request === active.officeRequest) setOfficeState({ ...result, userId: currentUserId });
    return result;
  }, [currentUserId]);

  useEffect(() => {
    if (!enabled) return;
    session.current = { userId: currentUserId, officeRequest: 0 };
    setOfficeState(null);
    setProgress(null);
    void loadOffice();
    return () => {
      session.current = null;
      locationRequest.current?.abort();
      locationRequest.current = null;
    };
  }, [enabled, currentUserId, loadOffice]);

  useDataRefresh(loadOffice, ['offices', 'employees'], { enabled });

  const savedOffice = officeState?.userId === currentUserId ? officeState : null;

  const checkOfficeWifi = async () => {
    const result = await loadOffice();
    if (!result) throw new Error('The office Wi-Fi check was cancelled. Please retry.');
    if (!result.office) throw new Error(result.error || 'Your office has not been configured. Contact your administrator.');

    const { office } = result;
    const status = officeWifiMessage(office);
    const connection = office.office_connection_type === 'PUBLIC'
      ? office.office_connection_ip
        ? `The hosted server sees your public IP as ${office.office_connection_ip}.`
        : 'The hosted server could not verify your public IP. Contact your administrator.'
      : office.office_connection_ip
        ? `The server sees your connection as ${office.office_connection_ip}.`
        : 'The server could not read your connection IP.';
    const message = `${status} ${connection}`;
    if (!office.office_wifi_matched) throw new Error(message);
    return message;
  };

  const checkLocation = async ({ preferWifi = false } = {}) => {
    const active = session.current;
    if (!enabled || active?.userId !== currentUserId || document.visibilityState !== 'visible') {
      throw new Error('Keep the attendance page open and retry the location check.');
    }

    locationRequest.current?.abort();
    const controller = new AbortController();
    locationRequest.current = controller;
    const isCurrent = () => session.current === active && locationRequest.current === controller;

    setProgress(null);
    try {
      // Use the preloaded office so GPS can start directly from the employee's click.
      const canUseSavedOffice = savedOffice?.office && !(preferWifi && savedOffice.office.wifi_attendance_enabled);
      const result = canUseSavedOffice ? savedOffice : await loadOffice();
      if (!isCurrent()) throw new Error('The location check was cancelled. Please retry.');
      if (!result?.office) throw new Error(result?.error || 'Your office has not been configured. Contact your administrator.');
      let office = result.office;
      if (preferWifi && office.wifi_attendance_enabled && office.office_wifi_matched) return { location: {} };

      const reading = readCurrentLocation({
        maximumAccuracy: attendanceAccuracyLimit(office.max_accuracy_m),
        signal: controller.signal,
        timeoutMs: 25000,
        canFinishEarly: sample => evaluateLocation(office, sample).eligible,
        onProgress: sample => { if (isCurrent()) setProgress(sample.accuracy); }
      });
      // Refresh the assignment while GPS is running in case an admin changed the office.
      const officeRefresh = result === savedOffice
        ? loadOffice().then(latest => {
          if (!latest?.office) throw new Error(latest?.error || 'Your office has not been configured. Contact your administrator.');
          office = latest.office;
        })
        : Promise.resolve();
      const [outcome] = await Promise.all([reading.then(location => ({ location }), error => ({ error })), officeRefresh]);
      if (!isCurrent() || document.visibilityState !== 'visible') {
        throw new Error('The location check was cancelled. Please retry.');
      }
      const { location } = outcome;
      const evaluation = outcome.error || evaluateLocation(office, location);
      if (!evaluation.eligible) {
        const { fallback, gpsSummary, message } = attendanceLocationFailure(office, evaluation);
        if (fallback) return { location: {}, message, gpsSummary };
        throw Object.assign(new Error(message), { code: evaluation.code });
      }

      const { latitude, longitude, accuracy } = location;
      return { location: { latitude, longitude, accuracy }, message: `GPS verified. ${evaluation.message} ${officeWifiMessage(office)}` };
    } finally {
      if (isCurrent()) {
        locationRequest.current = null;
        controller.abort();
        setProgress(null);
      }
    }
  };

  return {
    office: savedOffice?.office,
    loading: enabled && !savedOffice,
    progress,
    checkOfficeWifi,
    checkLocation
  };
}
