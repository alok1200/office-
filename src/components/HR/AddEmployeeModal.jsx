import React, { useRef, useState } from 'react';
import { AlertCircle, Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../Common/Modal';

export const ASSET_TYPES = [
  ['LAPTOP', 'Laptop'], ['DESKTOP', 'Desktop'], ['MONITOR', 'Monitor'], ['MOBILE', 'Mobile phone'], ['ACCESS_CARD', 'Access card'],
  ['ID_CARD', 'ID card'], ['HEADSET', 'Headset'], ['KEYBOARD_MOUSE', 'Keyboard / mouse'], ['FURNITURE', 'Furniture'], ['OTHER', 'Other']
];
export const ASSET_CONDITIONS = [['NEW', 'New'], ['GOOD', 'Good'], ['FAIR', 'Fair'], ['POOR', 'Poor']];
export const DEPARTMENTS = ['Engineering', 'Human Resources', 'Product & Design', 'Marketing', 'Finance & Operations'];
const OTHER_DEPARTMENT = '__OTHER__';
export const assetTypeLabel = value => (ASSET_TYPES.find(([id]) => id === value) || [, value])[1];

const today = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
export const blankAsset = () => ({ asset_type: 'LAPTOP', asset_name: '', asset_tag: '', serial_number: '', condition: 'NEW', issued_date: '', notes: '' });
const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs';
const labelClass = 'block text-xs font-black text-black uppercase tracking-wider mb-1.5';

function Field({ label, children }) {
  return <div><label className={labelClass}>{label}</label>{children}</div>;
}

/** Reusable fields for one asset; used here and when issuing an asset to an existing employee. */
export function AssetFields({ asset, onChange, disabled }) {
  const set = (key, value) => onChange({ ...asset, [key]: value });
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <Field label="Asset type"><select className={inputClass} value={asset.asset_type} disabled={disabled} onChange={e => set('asset_type', e.target.value)}>{ASSET_TYPES.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></Field>
    <Field label="Name / model"><input className={inputClass} required maxLength={150} value={asset.asset_name} disabled={disabled} onChange={e => set('asset_name', e.target.value)} placeholder="e.g. MacBook Pro 14”" /></Field>
    <Field label="Asset tag"><input className={inputClass} maxLength={100} value={asset.asset_tag} disabled={disabled} onChange={e => set('asset_tag', e.target.value)} placeholder="e.g. KNV-LT-0042" /></Field>
    <Field label="Serial number"><input className={inputClass} maxLength={150} value={asset.serial_number} disabled={disabled} onChange={e => set('serial_number', e.target.value)} /></Field>
    <Field label="Condition"><select className={inputClass} value={asset.condition} disabled={disabled} onChange={e => set('condition', e.target.value)}>{ASSET_CONDITIONS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></Field>
    <Field label="Issue date"><input type="date" className={inputClass} max={today()} value={asset.issued_date} disabled={disabled} onChange={e => set('issued_date', e.target.value)} /></Field>
    <div className="sm:col-span-2"><Field label="Notes"><input className={inputClass} maxLength={500} value={asset.notes} disabled={disabled} onChange={e => set('notes', e.target.value)} placeholder="Accessories, charger, bag…" /></Field></div>
  </div>;
}

export function AddEmployeeModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', employee_id: '', department_name: DEPARTMENTS[0], designation: '', phone: '',
    joining_date: today(), date_of_birth: '', address: '', emergency_contact_name: '', emergency_contact_phone: ''
  });
  const [assets, setAssets] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [otherDepartment, setOtherDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const text = (key, props = {}) => <input className={inputClass} value={form[key]} disabled={busy} onChange={e => set(key, e.target.value)} {...props} />;

  const submit = async event => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const department_name = form.department_name === OTHER_DEPARTMENT ? otherDepartment.trim() : form.department_name;
      if (!department_name) throw new Error('Enter the new department name.');
      const res = await api.createEmployee({ ...form, department_name, custom_fields: customFields, assets });
      if (!res.success) throw new Error(res.error || 'Could not add the employee.');
      onSaved(res.message);
    } catch (err) { setError(err.message); }
    finally { locked.current = false; setBusy(false); }
  };

  return <Modal isOpen onClose={() => { if (!locked.current) onClose(); }} title="Add new employee" maxWidth="max-w-3xl">
    <form onSubmit={submit} className="space-y-6 bg-white text-black">
      {error && <div role="alert" className="p-3 bg-white border border-rose-300 rounded-xl text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /><span className="font-semibold text-rose-700">{error}</span></div>}

      <fieldset className="space-y-3" disabled={busy}>
        <legend className="text-sm font-black text-black mb-2">Personal &amp; login details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First name">{text('first_name', { required: true, maxLength: 100 })}</Field>
          <Field label="Last name">{text('last_name', { required: true, maxLength: 100 })}</Field>
          <Field label="Work email">{text('email', { type: 'email', required: true, maxLength: 255, autoComplete: 'off' })}</Field>
          <Field label="Password">{text('password', { type: 'password', required: true, minLength: 8, maxLength: 128, autoComplete: 'new-password', placeholder: 'At least 8 characters' })}</Field>
          <Field label="Phone">{text('phone', { type: 'tel', required: true, maxLength: 50 })}</Field>
          <Field label="Date of birth">{text('date_of_birth', { type: 'date', required: true, max: today() })}</Field>
          <div className="sm:col-span-2"><Field label="Address"><textarea className={inputClass} rows={2} required maxLength={500} value={form.address} onChange={e => set('address', e.target.value)} /></Field></div>
          <Field label="Emergency contact name">{text('emergency_contact_name', { required: true, maxLength: 150 })}</Field>
          <Field label="Emergency contact phone">{text('emergency_contact_phone', { type: 'tel', required: true, maxLength: 50 })}</Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3" disabled={busy}>
        <legend className="text-sm font-black text-black mb-2">Employment</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Employee ID">{text('employee_id', { required: true, maxLength: 50, placeholder: 'e.g. KNV-1010' })}</Field>
          <Field label="Joining date">{text('joining_date', { type: 'date', required: true })}</Field>
          <Field label="Department"><select className={inputClass} value={form.department_name} onChange={e => set('department_name', e.target.value)}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}<option value={OTHER_DEPARTMENT}>Other (type a new department)…</option></select></Field>
          {form.department_name === OTHER_DEPARTMENT && <Field label="New department name"><input className={inputClass} required maxLength={100} value={otherDepartment} disabled={busy} onChange={e => setOtherDepartment(e.target.value)} placeholder="e.g. Customer Support" autoFocus /></Field>}
          <Field label="Designation">{text('designation', { required: true, maxLength: 100 })}</Field>
        </div>
        <p className="text-xs text-slate-600">New accounts are created with the Employee role. Ask the employee to change the temporary password after first sign-in.</p>
      </fieldset>

      <fieldset className="space-y-3" disabled={busy}>
        <legend className="text-sm font-black text-black mb-2">Others (extra fields)</legend>
        {!customFields.length && <p className="text-xs text-slate-600">Need to record something not listed above (blood group, PAN, bank account, previous employer…)? Add your own field.</p>}
        {customFields.map((field, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <Field label="Field name"><input className={inputClass} required maxLength={60} value={field.label} onChange={e => setCustomFields(list => list.map((f, i) => i === index ? { ...f, label: e.target.value } : f))} placeholder="e.g. Blood group" /></Field>
          <Field label="Value"><input className={inputClass} required maxLength={500} value={field.value} onChange={e => setCustomFields(list => list.map((f, i) => i === index ? { ...f, value: e.target.value } : f))} /></Field>
          <button type="button" className="sa-text-button flex items-center gap-1 text-xs pb-2.5" aria-label={`Remove field ${index + 1}`} onClick={() => setCustomFields(list => list.filter((_, i) => i !== index))}><Trash2 size={14} />Remove</button>
        </div>)}
        {customFields.length < 20 && <button type="button" className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50" onClick={() => setCustomFields(list => [...list, { label: '', value: '' }])}><Plus size={14} />Add another field</button>}
      </fieldset>

      <fieldset className="space-y-3" disabled={busy}>
        <legend className="text-sm font-black text-black mb-2">Company assets issued</legend>
        {!assets.length && <p className="text-xs text-slate-600">No assets added. Add laptops, access cards, phones and other equipment handed to this employee.</p>}
        {assets.map((asset, index) => <div key={index} className="p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between"><strong className="text-xs">Asset {index + 1}</strong>
            <button type="button" className="sa-text-button flex items-center gap-1 text-xs" onClick={() => setAssets(list => list.filter((_, i) => i !== index))}><Trash2 size={14} />Remove</button></div>
          <AssetFields asset={asset} disabled={busy} onChange={next => setAssets(list => list.map((a, i) => i === index ? next : a))} />
        </div>)}
        {assets.length < 25 && <button type="button" className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50" onClick={() => setAssets(list => [...list, blankAsset()])}><Plus size={14} />Add asset</button>}
      </fieldset>

      <div className="ticket-form-actions flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="ui-button-primary" disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}<span>{busy ? 'Saving…' : 'Add employee'}</span></button>
      </div>
    </form>
  </Modal>;
}
