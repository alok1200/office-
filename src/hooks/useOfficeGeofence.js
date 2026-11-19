import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { evaluateLocation } from '../services/geofenceStatus';
import { readCurrentLocation } from '../services/currentLocation';
import { useAuth } from '../context/AuthContext';

export function useOfficeGeofence(enabled) {
  const { currentUserId } = useAuth();
  const [officeState, setOfficeState] = useState({ loading: true, office: null, error: '' });
  const [sample, setSample] = useState(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [liveAccuracy, setLiveAccuracy] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [visible, setVisible] = useState(document.visibilityState === 'visible');
  const locationRequest = useRef(null);
  const sequence = useRef(0), mounted = useRef(true), activeUser = useRef(currentUserId);
  const sampleRef = useRef(null), trackingRef = useRef(false);
  sampleRef.current = sample; trackingRef.current = tracking;
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
    return () => { mounted.current = false; sequence.current++; locationRequest.current?.abort(); };
  }, [enabled, currentUserId, loadOffice]);
  useEffect(() => {
    const changed = () => { const next = document.visibilityState === 'visible'; setVisible(next); setSample(null); sequence.current++; if (!next) locationRequest.current?.abort(); if (next && enabled) loadOffice(); };
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
    locationRequest.current?.abort();
    const controller = new AbortController(); locationRequest.current = controller;
    setReading(true); setError('');
    try {
      const office = await loadOffice();
      if (!mounted.current || ticket !== sequence.current) return;
      if (!office) throw new Error('No saved office is available. Contact your administrator.');
      setLiveAccuracy(null);
    let location;
    try {
      // 12 s is enough for a phone to lock GPS; a device that cannot reach the limit by then needs a better signal, not more waiting.
      location = await readCurrentLocation({ maximumAccuracy: Number(office.max_accuracy_m ?? 50), signal: controller.signal, timeoutMs: 12000, onProgress: s => { if (mounted.current) setLiveAccuracy(Math.round(s.accuracy)); } });
    } finally { if (mounted.current) setLiveAccuracy(null); }
      if (mounted.current && ticket === sequence.current) { setSample(location); setTracking(true); }
    } catch (error) { if (mounted.current && ticket === sequence.current) { setSample(null); setError(error.message); } }
    finally { if (mounted.current) setReading(false); }
  };
  useEffect(() => {
    if (!enabled || !tracking || !visible) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [enabled, tracking, visible]);
  const stale = !!sample && Math.max(clock, Date.now()) - sample.readAt > 20000;
  const evaluation = evaluateLocation(officeState.office, sample);
  const eligible = enabled && tracking && visible && !!sample && !error && !officeState.error && !stale && evaluation.eligible;
  const getPunchLocation = async () => {
    // Always obtain a new reading and saved office before a consequential punch.
    const actor = currentUserId;
    if (!enabled || !mounted.current || document.visibilityState !== 'visible') throw new Error('Location check cancelled. Keep this page open and try again.');
    locationRequest.current?.abort();
    const controller = new AbortController(); locationRequest.current = controller;
    const office = await loadOffice();
    if (!mounted.current || actor !== activeUser.current || controller.signal.aborted) throw new Error('Attendance cancelled because the page or account changed.');
    if (!office) throw new Error('No saved office is available. Contact your administrator.');
    // Fast path: the page keeps a live GPS watch warm, so reuse a reading taken within the last 8 seconds.
    const warm = sampleRef.current;
    if (warm && trackingRef.current && Date.now() - warm.readAt <= 8000 && warm.accuracy <= Number(office.max_accuracy_m ?? 50)) {
      const quick = evaluateLocation(office, warm);
      if (quick.eligible) return { latitude: warm.latitude, longitude: warm.longitude, accuracy: warm.accuracy };
    }
    setLiveAccuracy(null);
    let location;
    try {
      // 12 s is enough for a phone to lock GPS; a device that cannot reach the limit by then needs a better signal, not more waiting.
      location = await readCurrentLocation({ maximumAccuracy: Number(office.max_accuracy_m ?? 50), signal: controller.signal, timeoutMs: 12000, onProgress: s => { if (mounted.current) setLiveAccuracy(Math.round(s.accuracy)); } });
    } finally { if (mounted.current) setLiveAccuracy(null); }
    if (!mounted.current || actor !== activeUser.current || document.visibilityState !== 'visible') throw new Error('Attendance cancelled because the signed-in account changed.');
    const evaluation = evaluateLocation(office, location);
    if (mounted.current) { setSample(location); }
    if (!evaluation.eligible) throw new Error(evaluation.message);
    return { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy };
  };
  return { ...officeState, sample, liveAccuracy, reading, tracking, eligible, distance: evaluation.distance, message: officeState.error || error || (stale ? 'Your GPS reading expired. Refresh your location to enable attendance.' : evaluation.message), refresh, getPunchLocation, stop: () => { sequence.current++; locationRequest.current?.abort(); setTracking(false); setSample(null); setError(''); } };
}
