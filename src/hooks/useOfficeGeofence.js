import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { evaluateLocation } from '../services/geofenceStatus';
import { useAuth } from '../context/AuthContext';

const readPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) { reject(new Error('GPS is not supported. Use a device with location access.')); return; }
  navigator.geolocation.getCurrentPosition(position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, readAt: Date.now() }), error => reject(new Error(error.code === 1 ? 'Location access denied. Allow GPS to check in or out.' : 'Could not read GPS. Refresh your location and try again.')), { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
});

export function useOfficeGeofence(enabled) {
  const { currentUserId } = useAuth();
  const [officeState, setOfficeState] = useState({ loading: true, office: null, error: '' });
  const [sample, setSample] = useState(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [visible, setVisible] = useState(document.visibilityState === 'visible');
  const sequence = useRef(0), mounted = useRef(true), activeUser = useRef(currentUserId);
  activeUser.current = currentUserId;
  const loadOffice = useCallback(async () => {
    const user = currentUserId;
    try {
      const res = await api.getOfficeLocation();
      if (!res.success) throw new Error(res.error || 'Could not load your saved office.');
      if (mounted.current && user === activeUser.current) { setOfficeState({ loading: false, office: res.data, error: '' }); return res.data; }
    } catch (error) { if (mounted.current && user === activeUser.current) setOfficeState({ loading: false, office: null, error: error.message }); }
    return null;
  }, [currentUserId]);
  useEffect(() => {
    mounted.current = true; setSample(null); setTracking(false); setError('');
    setOfficeState({ loading: true, office: null, error: '' });
    if (enabled) loadOffice();
    return () => { mounted.current = false; sequence.current++; };
  }, [enabled, currentUserId, loadOffice]);
  useEffect(() => {
    const changed = () => { const next = document.visibilityState === 'visible'; setVisible(next); setSample(null); sequence.current++; if (next && enabled) loadOffice(); };
    document.addEventListener('visibilitychange', changed);
    return () => { document.removeEventListener('visibilitychange', changed); };
  }, [enabled, loadOffice]);
  useEffect(() => {
    if (!enabled || !tracking || !visible || !navigator.geolocation) return;
    const user = currentUserId;
    let active = true;
    const id = navigator.geolocation.watchPosition(position => {
      if (active && mounted.current && activeUser.current === user) { setSample({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, readAt: Date.now() }); setError(''); }
    }, event => { if (active && mounted.current && activeUser.current === user) { setSample(null); setError(event.code === 1 ? 'Allow GPS access to enable attendance.' : 'GPS unavailable. Refresh your location.'); } }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    return () => { active = false; navigator.geolocation.clearWatch(id); };
  }, [enabled, tracking, visible, currentUserId]);
  const refresh = async () => {
    if (!enabled || reading) return;
    const ticket = ++sequence.current;
    setReading(true); setError('');
    try {
      const office = await loadOffice();
      if (!mounted.current || ticket !== sequence.current) return;
      if (!office) throw new Error('No saved office is available. Contact your administrator.');
      const location = await readPosition();
      if (mounted.current && ticket === sequence.current) { setSample(location); setTracking(true); }
    } catch (error) { if (mounted.current && ticket === sequence.current) { setSample(null); setError(error.message); } }
    finally { if (mounted.current) setReading(false); }
  };
  const evaluation = evaluateLocation(officeState.office, sample);
  const eligible = enabled && tracking && visible && !!sample && !error && !officeState.error && evaluation.eligible;
  const getPunchLocation = async () => {
    // Always obtain a new reading and saved office before a consequential punch.
    const actor = currentUserId;
    const office = await loadOffice();
    if (!office) throw new Error('No saved office is available. Contact your administrator.');
    const location = await readPosition();
    if (!mounted.current || actor !== activeUser.current || document.visibilityState !== 'visible') throw new Error('Attendance cancelled because the signed-in account changed.');
    const evaluation = evaluateLocation(office, location);
    if (mounted.current) { setSample(location); }
    if (!evaluation.eligible) throw new Error(evaluation.message);
    return { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy };
  };
  return { ...officeState, sample, reading, tracking, eligible, distance: evaluation.distance, message: officeState.error || error || evaluation.message, refresh, getPunchLocation, stop: () => { sequence.current++; setTracking(false); setSample(null); setError(''); } };
}
