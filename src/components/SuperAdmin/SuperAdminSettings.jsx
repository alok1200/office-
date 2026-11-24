import {useDataRefresh} from '../../hooks/useDataRefresh';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, Clock3, CalendarDays, Loader2, MapPin, Pencil, Plus, RefreshCw, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ATTENDANCE_RADIUS_M, MAX_ATTENDANCE_ACCURACY_M, attendanceAccuracyLimit } from '../../services/geofenceStatus';
import { api } from '../../services/api';
import { GeofenceMapPanel } from './GeofenceMapPanel';
import { captureOfficeLocation, DIRECT_SAVE_ACCURACY_M } from './captureOfficeLocation';
import { HRAdminForm } from './HRAdminForm';

const tabs = [['users', 'Users', Users], ['offices', 'Offices', Building2], ['shifts', 'Shifts', Clock3], ['holidays', 'Holidays', CalendarDays]];

function OfficeForm({ office, data, onClose, onSaved }) {
  const { currentUserId } = useAuth();
  const [form, setForm] = useState({ name: office?.name || '', latitude: office?.latitude ?? '', longitude: office?.longitude ?? '', radius_m: ATTENDANCE_RADIUS_M, max_accuracy_m: attendanceAccuracyLimit(office?.max_accuracy_m), timezone: office?.timezone || 'Asia/Kolkata', address: office?.address || '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [captureNotice, setCaptureNotice] = useState('');
  const [showPinMap, setShowPinMap] = useState(false);
  const capturing = useRef(false), captureRequest = useRef(null);
  const panel = useRef(null), busy = useRef(false), mounted = useRef(true);
  const close = () => { if (!busy.current) onClose(); };
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; panel.current.querySelector('input')?.focus();
    const keydown = e => {
      if (e.key === 'Escape' && !busy.current) onClose();
      if (e.key !== 'Tab') return;
      const items = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')];
      if (!items.length) { e.preventDefault(); panel.current.focus(); return; }
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { mounted.current = false; captureRequest.current?.abort(); document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  const capture = async () => {
    if (capturing.current || busy.current) return;
    capturing.current = true; setLocating(true); setError(''); setCaptureNotice('');
    const controller = new AbortController(); captureRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const result = await captureOfficeLocation({
        geolocation: navigator.geolocation,
        includeNetwork: false,
        signal: controller.signal,
      });
      if (!mounted.current) return;
      if (result.coordinates) {
        const { latitude, longitude, accuracy } = result.coordinates;
        setForm(old => ({ ...old, latitude, longitude }));
        const needsMapReview = accuracy > DIRECT_SAVE_ACCURACY_M;
        if (needsMapReview) setShowPinMap(true);
        setCaptureNotice(`GPS accuracy is ±${Math.round(accuracy)} m. ${needsMapReview ? 'Check the blue pin on the map and move it to your office building if needed.' : 'Review the coordinates.'} Press Save office to apply the location.`);
      } else {
        setShowPinMap(true);
        setError(`${result.errors.join(' ')} Select your office building on the map or enter verified coordinates.`.trim());
      }
    } catch { if (mounted.current) setError('Could not capture your current details. Please retry.'); }
    finally { clearTimeout(timeout); capturing.current = false; captureRequest.current = null; if (mounted.current) setLocating(false); }
  };
  const locate = () => capture();
  const pickOfficePoint = ({ latitude, longitude }) => {
    if (busy.current || capturing.current) return;
    setForm(old => ({ ...old, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
    setError('');
    setCaptureNotice('Office pin adjusted on the map. This is a draft; press Save office to apply it.');
  };
  const save = async event => {
    event.preventDefault(); if (busy.current || capturing.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const res = await api.saveAdminOffice(currentUserId, office?.id, {
        ...form,
        office_ips: office?.office_ips || [],
        user_ids: office?.user_ids || [],
        is_primary: office?.is_primary || !data.offices.length,
      });
      if (!res.success) throw new Error(res.error || 'Could not save office.');
      onSaved(res.message);
    } catch (error) { setError(error.message); }
    finally { busy.current = false; if (mounted.current) setSaving(false); }
  };
  return <div className="sa-request-overlay" onClick={e => { if (e.target === e.currentTarget) close(); }}><section ref={panel} tabIndex={-1} className="sa-request-dialog sa-office-dialog" role="dialog" aria-modal="true" aria-labelledby="sa-office-form-title"><button className="sa-dialog-close" onClick={close} disabled={saving} aria-label="Close office form"><X size={21} /></button><h2 id="sa-office-form-title">{office ? 'Edit office' : 'Add office'}</h2><p>Configure the office details and GPS geofence.</p>
    <form onSubmit={save}>{error && <p role="alert" className="sa-request-error">{error}</p>}
      <label htmlFor="sa-office-name">Office name</label><input id="sa-office-name" value={form.name} onChange={e => change('name', e.target.value)} required maxLength={150} disabled={saving} />
      <div className="sa-request-dates"><div><label htmlFor="sa-office-lat">Latitude</label><input id="sa-office-lat" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={e => change('latitude', e.target.value)} required disabled={saving || locating} /></div><div><label htmlFor="sa-office-lng">Longitude</label><input id="sa-office-lng" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={e => change('longitude', e.target.value)} required disabled={saving || locating} /></div></div>
      <button type="button" className="sa-office-location-action" onClick={locate} disabled={saving || locating}>{locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}{locating ? 'Reading current location…' : 'Use my current location'}</button>
      <button type="button" className="sa-location-button" onClick={() => setShowPinMap(value => !value)} aria-expanded={showPinMap} aria-controls="office-pin-map" disabled={saving || locating}><MapPin size={15} />{showPinMap ? 'Hide office pin map' : 'Adjust office pin on map'}</button>
      {showPinMap && <div id="office-pin-map"><GeofenceMapPanel office={form} onOfficePick={pickOfficePoint} disabled={saving || locating} /></div>}
      {captureNotice && <p className="sa-office-capture-notice" role="status">{captureNotice}</p>}
      <div className="sa-request-dates"><div><label htmlFor="sa-office-radius">Radius (metres)</label><input id="sa-office-radius" type="number" value={ATTENDANCE_RADIUS_M} readOnly aria-describedby="office-radius-help" /></div><div><label htmlFor="sa-office-accuracy">Maximum GPS accuracy (metres)</label><input id="sa-office-accuracy" type="number" min={1} max={MAX_ATTENDANCE_ACCURACY_M} step={1} value={form.max_accuracy_m} onChange={e => change('max_accuracy_m', e.target.value)} required disabled={saving} /></div></div>
      <p id="office-radius-help" className="sa-office-form-help">Attendance requires a reported position within {ATTENDANCE_RADIUS_M} m of the saved pin. Set this office’s GPS accuracy limit separately, up to ±{MAX_ATTENDANCE_ACCURACY_M} m. To place the pin, use accurate GPS, select the building on the map, or enter verified coordinates. Then press Save office.</p>
      <label htmlFor="sa-office-zone">Timezone</label><input id="sa-office-zone" list="sa-office-timezones" value={form.timezone} onChange={e => change('timezone', e.target.value)} required disabled={saving} /><datalist id="sa-office-timezones">{['Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Europe/London', 'America/New_York'].map(zone => <option key={zone} value={zone} />)}</datalist>
      <label htmlFor="sa-office-address">Address</label><input id="sa-office-address" value={form.address} onChange={e => change('address', e.target.value)} maxLength={500} disabled={saving} />
      <div className="sa-request-submit"><button type="button" className="sa-office-cancel-form" onClick={close} disabled={saving}>Cancel</button><button type="submit" className="sa-request-primary" disabled={saving || locating}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Saving…' : 'Save office'}</button></div>
    </form></section></div>;
}

export function SuperAdminSettings({ initialTab = 'offices' } = {}) {
  const { currentUserId } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [creatingHR, setCreatingHR] = useState(false);
  const [resource, setResource] = useState({ loading: true, data: null, error: '' });
  const [secondary, setSecondary] = useState({ loading: false, data: null, error: '' });
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setResource(old => ({ ...old, loading: true, error: '' }));
    try { const res = await api.getAdminOffices(currentUserId); if (!res.success) throw new Error(res.error); setResource({ loading: false, data: res.data, error: '' }); }
    catch (error) { setResource({ loading: false, data: null, error: error.message || 'Could not load offices.' }); }
  }, [currentUserId]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (tab !== 'holidays') return;
    let active = true; setSecondary({ loading: true, data: null, error: '' });
    const promise = api.getHolidays(currentUserId);
    promise.then(res => { if (!res.success) throw new Error(res.error || 'Could not load this section.'); if (active) setSecondary({ loading: false, data: res.data, error: '' }); }).catch(error => { if (active) setSecondary({ loading: false, data: null, error: error.message }); });
    return () => { active = false; };
  }, [tab, currentUserId, version]);
  const remove = async () => {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { const res = await api.deleteAdminOffice(currentUserId, removing.id); if (!res.success) throw new Error(res.error); setRemoving(null); setNotice(res.message); await refresh(); setVersion(v => v + 1); }
    catch (error) { setError(error.message || 'Could not remove office.'); }
    finally { setBusy(false); }
  };
  useDataRefresh(()=>{refresh();setVersion(v=>v+1);},['offices','employees','holidays']);
  const data = resource.data;
  return <div className="sa-admin-console"><h1>Admin console</h1><p className="sa-admin-subtitle">Manage HR Admin accounts, office details and saved settings.</p>
    <div className="sa-admin-tabs" role="tablist" aria-label="Admin sections">{tabs.map(([id, name, Icon]) => <button type="button" key={id} id={`sa-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls="sa-admin-panel" onClick={() => { setTab(id); setError(''); }}><Icon size={19} />{name}</button>)}</div>
    <section id="sa-admin-panel" role="tabpanel" aria-labelledby={`sa-tab-${tab}`}>
      {notice && <p role="status" className="sa-request-notice">{notice}</p>}{error && <p role="alert" className="sa-request-error">{error}</p>}
      {resource.loading ? <p role="status" className="sa-requests-empty"><Loader2 size={18} className="animate-spin" />Loading office settings…</p> : resource.error ? <p className="sa-request-error" role="alert">{resource.error} <button onClick={refresh}>Retry</button></p> : <>
      {tab === 'offices' && <><div className="sa-admin-section-header"><div><h2>Offices</h2><p>Physical office locations and GPS geofences.</p></div><button className="sa-request-primary" onClick={() => { setError(''); setEditor({ office: null }); }}><Plus size={20} />Add office</button></div>
        {removing && <div className="sa-cancel-confirm" role="group" aria-label="Confirm office removal"><p>Remove {removing.name}? Its configuration will be archived.</p><div><button onClick={remove} disabled={busy}>{busy ? 'Removing…' : 'Remove office'}</button><button onClick={() => setRemoving(null)} disabled={busy}>Keep office</button></div></div>}
        {!data.offices.length ? <div className="sa-requests-empty">No offices configured. Add your first office to get started.</div> : <div className="sa-admin-table"><table><thead><tr><th>Name</th><th>Coordinates</th><th>Radius</th><th>Timezone</th><th>Office IPs</th><th>Users</th><th>Actions</th></tr></thead><tbody>{data.offices.map(office => <tr key={office.id}><td><strong>{office.name}</strong>{office.is_primary && <span className="sa-office-primary">Primary</span>}{office.address && <small>{office.address}</small>}</td><td className="sa-office-coordinates">{Number(office.latitude).toFixed(5)}, {Number(office.longitude).toFixed(5)}</td><td>{office.radius_m} m</td><td className="sa-admin-muted">{office.timezone}</td><td><div className="sa-office-ip-list">{office.office_ips.length ? office.office_ips.map(ip => <code key={ip}>{ip}</code>) : <span className="sa-admin-muted">Not registered</span>}</div>{office.network_matches && <span className="sa-office-primary">Current network ✓</span>}</td><td>{office.users_count}{office.inherited_users_count > 0 && <small>{office.inherited_users_count} default</small>}</td><td><div className="sa-office-actions"><button aria-label={`Edit ${office.name}`} onClick={() => { setError(''); setEditor({ office }); }}><Pencil size={18} /></button><button className="sa-office-delete" aria-label={`Remove ${office.name}`} onClick={() => { setError(''); setRemoving(office); }} disabled={busy}><Trash2 size={18} /></button></div></td></tr>)}</tbody></table></div>}
</>}
      {tab === 'users' && <><div className="sa-admin-section-header"><div><h2>Users</h2><p>Create HR Admin accounts and view saved office assignments.</p></div><button type="button" className="sa-request-primary" onClick={() => { setNotice(''); setCreatingHR(true); }}><Plus size={20} />Create HR Admin</button></div><div className="sa-admin-table"><table><thead><tr><th>Name</th><th>Employee ID</th><th>Login email</th><th>Role</th><th>Office</th></tr></thead><tbody>{data.users.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.code}</td><td>{user.email || '—'}</td><td>{user.role.replaceAll('_', ' ')}</td><td>{data.offices.find(o => o.id === user.office_id)?.name || data.offices.find(o => o.is_primary)?.name || 'Unassigned'}{!user.office_id && <small>Default office</small>}</td></tr>)}</tbody></table></div></>}
      {tab === 'shifts' && <section className="sa-card"><h2>Shifts</h2><p className="sa-admin-subtitle">Shift configuration is not available in the current attendance service.</p></section>}
      {tab === 'holidays' && <><div className="sa-admin-section-header"><h2>Holidays</h2><button className="sa-request-refresh" aria-label="Refresh holidays" onClick={() => setVersion(v => v + 1)}><RefreshCw size={16} /></button></div>{secondary.loading ? <p className="sa-requests-empty" role="status">Loading…</p> : secondary.error ? <p className="sa-request-error" role="alert">{secondary.error} <button onClick={() => setVersion(v => v + 1)}>Retry</button></p> : <div className="sa-admin-table"><table><thead><tr><th>Date</th><th>Holiday</th><th>Description</th></tr></thead><tbody>{secondary.data?.map(holiday => <tr key={holiday.id}><td>{String(holiday.holiday_date).slice(0, 10)}</td><td>{holiday.name}</td><td>{holiday.description || '—'}</td></tr>)}</tbody></table>{!secondary.data?.length && <p className="sa-requests-empty">No holidays configured.</p>}</div>}</>}

      </>}
    </section>
    {creatingHR && <HRAdminForm onClose={() => setCreatingHR(false)} onSaved={message => { setCreatingHR(false); setNotice(message); refresh(); }} />}
    {editor && data && <OfficeForm office={editor.office} data={data} onClose={() => setEditor(null)} onSaved={message => { setEditor(null); setNotice(message); refresh(); setVersion(v => v + 1); }} />}
  </div>;
}
