import React, { useEffect, useRef, useState } from 'react';
import { readCurrentLocation } from '../../services/currentLocation';
import { gpsQuality, formatGpsDistance } from '../../services/gpsPresentation';
import { ATTENDANCE_RADIUS_M, evaluateLocation } from '../../services/geofenceStatus';
import { api } from '../../services/api';
import { GeofenceMapPanel } from './GeofenceMapPanel';
import { captureOfficeLocation } from './captureOfficeLocation';
import { Info, Loader2, MapPin, Navigation, RefreshCw, Settings2, ShieldCheck, Map as MapIcon } from 'lucide-react';

export function GeofenceCard({ resource, setTab }) {
  const [gps, setGps] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsProgress, setGpsProgress] = useState('');
  const locationRequest = useRef(null);
  const [locating, setLocating] = useState(false);
  const [officeCandidate, setOfficeCandidate] = useState(null);
  const [officeAction, setOfficeAction] = useState(null);
  const officeBusy = officeAction !== null;
  const [officeNotice, setOfficeNotice] = useState('');
  const officeOperation = useRef(false);
  const office = resource.data?.office;
  const officeKey = office ? `${office.id}:${office.latitude}:${office.longitude}:${office.radius_m}` : '';
  const activeRequest = useRef(0);

  useEffect(() => {
    activeRequest.current += 1;
    locationRequest.current?.abort();
    setGps(null); setGpsError(''); setLocating(false); setOfficeCandidate(null);
    return () => { activeRequest.current += 1; locationRequest.current?.abort(); };
  }, [officeKey]);

  const locate = async () => {
    if (!office || locating || officeOperation.current) return;
    const requestId = ++activeRequest.current;
    locationRequest.current?.abort();
    const controller = new AbortController(); locationRequest.current = controller;
    setLocating(true); setGps(null); setGpsError(''); setGpsProgress('Finding a fresh GPS position…');
    const update = sample => {
      if (requestId !== activeRequest.current) return;
      const { latitude, longitude, accuracy } = sample;
      const evaluation = evaluateLocation(office, sample);
      const radians = value => value * Math.PI / 180;
      const officeLat = radians(Number(office.latitude)), currentLat = radians(latitude);
      const deltaLon = radians(longitude - Number(office.longitude));
      const bearing = Math.atan2(Math.sin(deltaLon) * Math.cos(currentLat), Math.cos(officeLat) * Math.sin(currentLat) - Math.sin(officeLat) * Math.cos(currentLat) * Math.cos(deltaLon));
      setGps({ ...sample, distance: evaluation.distance, bearing });
      setGpsProgress(accuracy > Number(office.max_accuracy_m || 50) ? `Improving GPS accuracy: ±${Math.round(accuracy)} m. Waiting for ±${office.max_accuracy_m || 50} m or better…` : '');
    };
    try {
      await readCurrentLocation({ signal: controller.signal, maximumAccuracy: Number(office.max_accuracy_m || 50), onProgress: update });
    } catch (error) { if (requestId === activeRequest.current) setGpsError(error.message); }
    finally { if (requestId === activeRequest.current) { setLocating(false); setGpsProgress(''); } }
  };

  const captureCompany = async () => {
    if (officeOperation.current || locating) return;
    officeOperation.current = true; setOfficeAction('capturing'); setOfficeCandidate(null); setOfficeNotice(''); setGpsError('');
    const ticket = activeRequest.current;
    const controller = new AbortController(); locationRequest.current?.abort(); locationRequest.current = controller;
    try {
      const result = await captureOfficeLocation({ geolocation: navigator.geolocation, includeNetwork: false, signal: controller.signal });
      if (ticket !== activeRequest.current) return;
      if (!result.coordinates) throw new Error(result.errors.join(' ') || 'Could not read your location.');
      setOfficeCandidate({ ...result.coordinates, capturedAt: Date.now() });
    } catch (error) { if (ticket === activeRequest.current) setGpsError(error.message); }
    finally { officeOperation.current = false; setOfficeAction(null); }
  };
  const saveCompany = async () => {
    if (!officeCandidate || officeOperation.current) return;
    if (Date.now() - officeCandidate.capturedAt > 60000) { setOfficeCandidate(null); setGpsError('Location preview expired. Capture your current location again.'); return; }
    officeOperation.current = true; setOfficeAction('saving'); setGpsError('');
    try {
      const response = await api.updateOfficeLocation({ latitude: Number(officeCandidate.latitude), longitude: Number(officeCandidate.longitude) });
      if (!response.success || !response.data) throw new Error(response.error || 'Could not confirm the saved company location.');
      resource.updateData(data => ({ ...data, office: response.data }));
      setOfficeCandidate(null); setOfficeNotice('Primary office location saved.');
      void resource.refresh();
    } catch (error) { setGpsError(error.message); }
    finally { officeOperation.current = false; setOfficeAction(null); }
  };

  const quality = gpsQuality(gps, Number(office?.max_accuracy_m || 50));
  const lowAccuracy = !!gps && !quality.precise;
  const verified = quality.precise && !gpsError && Number.isFinite(gps.distance);
  const inside = verified && gps.distance <= ATTENDANCE_RADIUS_M;
  const status = !office ? 'Not configured' : lowAccuracy || gpsError ? 'Location not verified' : locating ? 'Finding precise GPS…' : !gps ? 'GPS not checked' : inside ? 'Inside zone' : 'Outside zone';
  const statusTone = verified ? (inside ? 'green' : 'red') : 'blue';
  // The marker shows actual bearing with distance clamped to the diagram's edge.
  const markerRadius = gps ? Math.min(43, gps.distance / ATTENDANCE_RADIUS_M * 32) : 0;
  const markerStyle = gps ? { left: `${50 + Math.sin(gps.bearing) * markerRadius}%`, top: `${50 - Math.cos(gps.bearing) * markerRadius}%` } : undefined;

  return <section className="sa-card sa-geofence" aria-labelledby="sa-geofence-title">
    <div className="sa-card-heading"><h2 id="sa-geofence-title"><MapPin size={16} /> GPS Geofence</h2><button className="sa-icon-button" aria-label="Configure office location" title="Configure office location" onClick={() => setTab('admin')}><Settings2 size={14} /></button></div>
    {resource.error && <div className="sa-empty sa-error" role="alert"><span>{resource.error}</span><button className="sa-text-button" onClick={resource.refresh}><RefreshCw size={13} /> Retry</button></div>}
    {resource.loading ? <div className="sa-empty" role="status"><Loader2 size={18} className="animate-spin" />Loading office…</div> : (!resource.error || resource.data) && <>
      <p className="sa-description sa-office-name">{office?.name || 'No office location configured'}</p>
      <div className="sa-geofence-badges"><div className="sa-pills"><span className={`sa-pill ${statusTone}`} role="status">{status}</span>{office && <span className="sa-pill blue">Radius: {ATTENDANCE_RADIUS_M} m</span>}</div><span className={`sa-pill ${resource.data?.network?.matched ? 'sa-network-pill' : 'blue'}`}><ShieldCheck size={11} /> {resource.data?.network?.matched ? 'Office network matched · GPS separate' : 'Office network: no match'}</span><span className="sa-pill blue"><ShieldCheck size={11} /> Privacy: checked on request</span></div>
      <div className="sa-radar" role="img" aria-label={verified ? `${status}. Office distance ${gps.distance.toFixed(2)} metres. Schematic capped at the outer ring.` : 'Fixed office location. Your current position is not verified; no employee marker is plotted.'}>
        <div className="sa-radar-ring"><div><span className="sa-office-dot" title="Office location" /><span className="sa-office-label">Office</span></div></div>
        {verified && <span className="sa-location-dot" title="Your location" style={markerStyle} />}
      </div>
      <div className="sa-geofence-legend"><span><i className="sa-legend-office" aria-hidden="true" />Office</span><span><i className="sa-legend-employee" aria-hidden="true" />Your location</span></div>
      <div className="sa-mini-stats"><div><span>{verified ? 'Distance' : 'Estimated distance'}</span><strong>{formatGpsDistance(gps?.distance)}</strong></div><div><span>Accuracy</span><strong className={lowAccuracy ? 'sa-accuracy-low' : ''}>{gps ? `±${Math.round(gps.accuracy)} m` : '—'}</strong></div><div><span>Fix quality</span><strong className="sa-gps-quality" aria-label={`Reported GPS accuracy quality: ${verified ? quality.label : 'Unverified'}`}><span className="sa-gps-bars" aria-hidden="true">{[1, 2, 3].map(level => <i key={level} className={level <= (gpsError ? 0 : quality.bars) ? 'filled' : ''} style={{ height: 4 + level * 4 }} />)}</span><small>{verified ? quality.label : gps ? 'Unverified' : 'No fix'}</small></strong></div></div>
      {office && <><button type="button" className="sa-location-button" aria-expanded={showMap} aria-controls="company-geographic-map" onClick={() => setShowMap(value => !value)}><MapIcon size={15} />{showMap ? 'Hide geographic map' : 'View geographic map'}</button>{showMap && <div id="company-geographic-map"><GeofenceMapPanel office={office} sample={verified ? gps : null} /></div>}</>}
      {lowAccuracy && <div className="sa-info" role="status"><Info size={16} /><div><strong>Location not verified</strong><p>Your device reports accuracy ±{Math.round(gps.accuracy)} m; this office requires ±{office?.max_accuracy_m || 50} m or better. We cannot confirm inside or outside the {ATTENDANCE_RADIUS_M} m radius from this reading. Your orange marker appears when GPS meets the configured accuracy limit.</p><p>Enable precise location in your device settings and retry near a window or outdoors. A matching office network does not confirm your GPS position.</p></div></div>}
      <div className="sa-gps-details">
        <p><strong>Primary office location</strong><span>{office ? `${Number(office.latitude).toFixed(6)}, ${Number(office.longitude).toFixed(6)}` : 'Not configured'}</span></p>
        {office?.updated_at && <p><strong>Office last saved</strong><span>{new Date(office.updated_at).toLocaleString('en-IN', { timeZone: office.timezone || 'Asia/Kolkata', timeZoneName: 'short' })}</span></p>}
        <p><strong>{verified ? 'Your current GPS' : 'Approximate GPS (not verified)'}</strong><span>{gps ? `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}` : 'Press Check my location'}</span></p>
        {gps && <p><strong>Last GPS check</strong><span>{new Date(gps.readAt).toLocaleTimeString('en-IN')}</span></p>}
      </div>
      {verified && !inside && !locating && <p className="sa-info" role="status">GPS places you {formatGpsDistance(gps.distance)} from the saved company pin; the limit is {ATTENDANCE_RADIUS_M} m. If this pin is not the office you are standing in, capture and save the correct company location below. Saving changes the office anchor for employees using it.</p>}
      {gpsProgress && <p role="status" className="sa-info">{gpsProgress}</p>}
      <div className="sa-info"><Info size={13} /><span>{office ? <>The office location stays fixed. GPS updates only your orange marker. All attendance actions require employees to be within <strong>{ATTENDANCE_RADIUS_M} m</strong> with reported GPS accuracy within the configured ±{office.max_accuracy_m || 50} m limit. Accuracy does not increase the {ATTENDANCE_RADIUS_M} m boundary. </> : <>Set your office location to enable distance checks. </>}Location is never shared with teammates.</span></div>
      <button className="sa-location-button" onClick={locate} disabled={!office || locating || officeBusy}>{locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}{locating ? 'Checking location…' : gps ? 'Refresh my location' : 'Check my location'}</button>
      <button type="button" className="sa-location-button" onClick={captureCompany} disabled={officeBusy || locating}>{officeAction === 'capturing' ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}{officeAction === 'capturing' ? 'Capturing office GPS…' : 'Change fixed office location using GPS'}</button>
      {officeCandidate && <div className="sa-info"><div><strong>New fixed office location — preview</strong><p>{officeCandidate.latitude}, {officeCandidate.longitude} · Accuracy ±{Math.round(officeCandidate.accuracy)} m · Radius {ATTENDANCE_RADIUS_M} m</p><p>Saving sets the company location for employees using the primary office.</p><div className="flex flex-wrap gap-3 mt-3"><button type="button" className="sa-request-primary" onClick={saveCompany} disabled={officeBusy}>{officeAction === 'saving' ? 'Saving company location…' : 'Save company location'}</button><button type="button" className="sa-text-button" onClick={() => setOfficeCandidate(null)} disabled={officeBusy}>Cancel</button></div></div></div>}
      {officeNotice && <p role="status" className="sa-info">{officeNotice}</p>}
      {(gpsError || lowAccuracy || verified && !inside) && <div className="sa-info"><div>{gpsError && <p role="alert" className="sa-error sa-gps-error">{gpsError}</p>}<strong>Improve location accuracy</strong><ol className="sa-gps-help"><li>Allow location for this site and enable precise location in your device settings.</li><li>Try a GPS-capable phone. Computer location can be less precise.</li><li>Move near a window or outdoors, then press Refresh my location.</li><li>Open the geographic map and check whether the saved office pin is on your building. Change it only if the saved office location is wrong.</li></ol></div></div>}
    </>}
  </section>;
}
