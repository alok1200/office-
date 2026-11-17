import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { captureOfficeLocation } from './captureOfficeLocation';
import { Info, Loader2, MapPin, Navigation, RefreshCw, Settings2, ShieldCheck } from 'lucide-react';

export function GeofenceCard({ resource, setTab }) {
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [locating, setLocating] = useState(false);
  const [officeCandidate, setOfficeCandidate] = useState(null);
  const [officeBusy, setOfficeBusy] = useState(false);
  const [officeNotice, setOfficeNotice] = useState('');
  const officeOperation = useRef(false);
  const office = resource.data?.office;
  const officeKey = office ? `${office.id}:${office.latitude}:${office.longitude}:${office.radius_m}` : '';
  const activeRequest = useRef(0);

  useEffect(() => {
    activeRequest.current += 1;
    setGps(null); setGpsError(''); setLocating(false); setOfficeCandidate(null); setOfficeBusy(false);
    return () => { activeRequest.current += 1; };
  }, [officeKey]);

  const locate = () => {
    if (!office || locating || officeOperation.current) return;
    if (!navigator.geolocation) { setGpsError('This browser does not support GPS.'); return; }
    const requestId = ++activeRequest.current;
    setLocating(true); setGpsError('');
    navigator.geolocation.getCurrentPosition(position => {
      if (requestId !== activeRequest.current) return;
      const { latitude, longitude, accuracy } = position.coords;
      if (![latitude, longitude, accuracy].every(Number.isFinite) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy < 0) { setGps(null); setGpsError('GPS returned an invalid position. Refresh your location.'); setLocating(false); return; }
      const radians = n => n * Math.PI / 180;
      const officeLat = radians(Number(office.latitude));
      const currentLat = radians(latitude);
      const deltaLat = currentLat - officeLat;
      const deltaLon = radians(longitude - Number(office.longitude));
      const a = Math.min(1, Math.max(0, Math.sin(deltaLat / 2) ** 2 + Math.cos(officeLat) * Math.cos(currentLat) * Math.sin(deltaLon / 2) ** 2));
      const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const bearing = Math.atan2(Math.sin(deltaLon) * Math.cos(currentLat), Math.cos(officeLat) * Math.sin(currentLat) - Math.sin(officeLat) * Math.cos(currentLat) * Math.cos(deltaLon));
      setGps({ distance, accuracy, bearing });
      setLocating(false);
    }, error => {
      if (requestId !== activeRequest.current) return;
      setGpsError(error.code === 1 ? 'Location permission denied. Allow access in your browser and retry.' : 'GPS unavailable. Move near a window and retry.');
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const captureCompany = async () => {
    if (officeOperation.current || locating) return;
    officeOperation.current = true; setOfficeBusy(true); setOfficeCandidate(null); setOfficeNotice(''); setGpsError('');
    const ticket = activeRequest.current;
    try {
      const result = await captureOfficeLocation({ geolocation: navigator.geolocation, includeNetwork: false });
      if (ticket !== activeRequest.current) return;
      if (!result.coordinates) throw new Error(result.errors.join(' ') || 'Could not read your location.');
      if (result.coordinates.accuracy > 15) throw new Error(`GPS accuracy is ±${Math.round(result.coordinates.accuracy)} m. Move near a window or outdoors and retry; ±15 m or better is required.`);
      setOfficeCandidate({ ...result.coordinates, capturedAt: Date.now() });
    } catch (error) { if (ticket === activeRequest.current) setGpsError(error.message); }
    finally { officeOperation.current = false; if (ticket === activeRequest.current) setOfficeBusy(false); }
  };
  const saveCompany = async () => {
    if (!officeCandidate || officeOperation.current) return;
    if (Date.now() - officeCandidate.capturedAt > 60000) { setOfficeCandidate(null); setGpsError('Location preview expired. Capture your current location again.'); return; }
    officeOperation.current = true; setOfficeBusy(true); setGpsError('');
    const ticket = activeRequest.current;
    try {
      const response = await api.updateOfficeLocation({ latitude: Number(officeCandidate.latitude), longitude: Number(officeCandidate.longitude), radius_m: 15, max_accuracy_m: 15 });
      if (ticket !== activeRequest.current) return;
      if (!response.success) throw new Error(response.error || 'Could not save the company location.');
      setOfficeCandidate(null); setOfficeNotice('Company location saved with a 15 m radius. It will remain fixed until you change it. Check your location to compare your position.');
      await resource.refresh();
    } catch (error) { if (ticket === activeRequest.current) setGpsError(error.message); }
    finally { officeOperation.current = false; setOfficeBusy(false); }
  };

  const lowAccuracy = gps && gps.accuracy > Number(office?.max_accuracy_m || 15);
  const inside = gps && gps.distance <= Number(office?.radius_m);
  const status = !office ? 'Not configured' : locating ? 'Locating…' : gpsError ? 'GPS unavailable' : !gps ? 'GPS not checked' : lowAccuracy ? 'Low accuracy' : inside ? 'Inside zone' : 'Outside zone';
  const statusTone = gps && !lowAccuracy ? (inside ? 'green' : 'red') : 'blue';
  // The marker shows actual bearing with distance clamped to the diagram's edge.
  const markerRadius = gps ? Math.min(43, gps.distance / Math.max(1, Number(office?.radius_m)) * 32) : 0;
  const markerStyle = gps ? { left: `${50 + Math.sin(gps.bearing) * markerRadius}%`, top: `${50 - Math.cos(gps.bearing) * markerRadius}%` } : undefined;

  return <section className="sa-card sa-geofence" aria-labelledby="sa-geofence-title">
    <div className="sa-card-heading"><h2 id="sa-geofence-title"><MapPin size={16} /> GPS Geofence</h2><button className="sa-icon-button" aria-label="Configure office location" title="Configure office location" onClick={() => setTab('admin')}><Settings2 size={14} /></button></div>
    {resource.loading ? <div className="sa-empty" role="status"><Loader2 size={18} className="animate-spin" />Loading office…</div> : resource.error ? <div className="sa-empty sa-error" role="alert"><span>{resource.error}</span><button className="sa-text-button" onClick={resource.refresh}><RefreshCw size={13} /> Retry</button></div> : <>
      <p className="sa-description sa-office-name">{office?.name || 'No office location configured'}</p>
      <div className="sa-geofence-badges"><div className="sa-pills"><span className={`sa-pill ${statusTone}`} role="status">{status}</span>{office && <span className="sa-pill blue">Radius: {office.radius_m} m</span>}</div><span className={`sa-pill ${resource.data?.network?.matched ? 'sa-network-pill' : 'blue'}`}><ShieldCheck size={11} /> {resource.data?.network?.matched ? 'Office network (IP) ✓' : 'Office network: no match'}</span><span className="sa-pill blue"><ShieldCheck size={11} /> Privacy: checked on request</span></div>
      <div className="sa-radar" role="img" aria-label={gps ? `${status}. Office distance ${Math.round(gps.distance)} metres. Schematic capped at the outer ring.` : 'Office geofence illustration. Your location has not been checked.'}>
        <div className="sa-radar-ring"><div><span className="sa-office-dot" title="Office location" /><span className="sa-office-label">Office</span></div></div>
        {gps && <span className="sa-location-dot" title="Your location" style={markerStyle} />}
      </div>
      <div className="sa-geofence-legend"><span><i className="sa-legend-office" aria-hidden="true" />Office</span><span><i className="sa-legend-employee" aria-hidden="true" />Your location</span></div>
      <div className="sa-mini-stats"><div><span>Distance</span><strong>{gps ? `${Math.round(gps.distance)} m` : '—'}</strong></div><div><span>Accuracy</span><strong className={lowAccuracy ? 'sa-accuracy-low' : ''}>{gps ? `±${Math.round(gps.accuracy)} m` : '—'}</strong></div><div><span>GPS</span><strong>{gps ? (lowAccuracy ? 'Low' : 'Ready') : '—'}</strong></div></div>
      <div className="sa-info"><Info size={13} /><span>{office ? <>The office location stays fixed. GPS updates only your orange marker. All attendance actions require employees to be within <strong>15 m</strong> with GPS accuracy ±15 m or better. </> : <>Set your office location to enable distance checks. </>}Location is never shared with teammates.</span></div>
      <button className="sa-location-button" onClick={locate} disabled={!office || locating || officeBusy}>{locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}{locating ? 'Checking location…' : gps ? 'Refresh my location' : 'Check my location'}</button>
      <button type="button" className="sa-location-button" onClick={captureCompany} disabled={officeBusy || locating}>{officeBusy ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}{officeBusy ? 'Updating company location…' : 'Use my GPS as company location'}</button>
      {officeCandidate && <div className="sa-info"><div><strong>Company location preview</strong><p>{officeCandidate.latitude}, {officeCandidate.longitude} · Accuracy ±{Math.round(officeCandidate.accuracy)} m · Radius 15 m</p><p>Saving sets the company location for employees using the primary office.</p><div className="flex flex-wrap gap-3 mt-3"><button type="button" className="sa-request-primary" onClick={saveCompany} disabled={officeBusy}>Save company location</button><button type="button" className="sa-text-button" onClick={() => setOfficeCandidate(null)} disabled={officeBusy}>Cancel</button></div></div></div>}
      {officeNotice && <p role="status" className="sa-info">{officeNotice}</p>}
      {gpsError && <p role="alert" className="sa-error sa-gps-error">{gpsError}</p>}
    </>}
  </section>;
}
