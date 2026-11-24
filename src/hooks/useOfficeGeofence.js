import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { evaluateLocation } from '../services/geofenceStatus';
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
      result = { error: error.message };
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

  const checkLocation = async () => {
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
      const result = savedOffice?.office ? savedOffice : await loadOffice();
      if (!isCurrent()) throw new Error('The location check was cancelled. Please retry.');
      if (!result?.office) throw new Error(result?.error || 'Your office has not been configured. Contact your administrator.');
      let office = result.office;

      const reading = readCurrentLocation({
        maximumAccuracy: 75,
        signal: controller.signal,
        timeoutMs: 15000,
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
      const [location] = await Promise.all([reading, officeRefresh]);
      if (!isCurrent() || document.visibilityState !== 'visible') {
        throw new Error('The location check was cancelled. Please retry.');
      }

      const evaluation = evaluateLocation(office, location);
      if (!evaluation.eligible) throw new Error(evaluation.message);

      const { latitude, longitude, accuracy } = location;
      return { latitude, longitude, accuracy, message: evaluation.message };
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
    checkLocation
  };
}
