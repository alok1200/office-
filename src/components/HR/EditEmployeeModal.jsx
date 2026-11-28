import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../Common/Modal';
import { DEPARTMENTS, EmployeeField as Field } from './AddEmployeeModal';

const OTHER_DEPARTMENT = '__OTHER__';
const today = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const dateStr = value => value ? String(value).slice(0, 10) : '';
const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs';

export function EditEmployeeModal({ employee, onClose, onSaved }) {
  const isPresetDept = DEPARTMENTS.includes(employee.department_name);
  const [form, setForm] = useState({
    first_name: employee.first_name || '',
    last_name: employee.last_name || '',
    email: employee.email || '',
    employee_id: employee.employee_id || '',
    department_name: isPresetDept ? employee.department_name : OTHER_DEPARTMENT,
    designation: employee.designation || '',
    phone: employee.phone || '',
    joining_date: dateStr(employee.joining_date) || today(),
    date_of_birth: dateStr(employee.date_of_birth),
    address: employee.address || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_phone: employee.emergency_contact_phone || ''
  });
  const [otherDepartment, setOtherDepartment] = useState(isPresetDept ? '' : (employee.department_name || ''));
  const [customFields, setCustomFields] = useState(Array.isArray(employee.custom_fields) ? employee.custom_fields : []);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);

  useEffect(() => {
    let active = true;
    api.getEmployeeDetails(employee.id).then(res => {
      if (!active) return;
      if (res.success && res.data) {
        const d = res.data;
        const preset = DEPARTMENTS.includes(d.department_name);
        setForm({
          first_name: d.first_name || '',
          last_name: d.last_name || '',
          email: d.email || '',
          employee_id: d.employee_id || '',
          department_name: preset ? d.department_name : OTHER_DEPARTMENT,
          designation: d.designation || '',
          phone: d.phone || '',
          joining_date: dateStr(d.joining_date) || today(),
          date_of_birth: dateStr(d.date_of_birth),
          address: d.address || '',
          emergency_contact_name: d.emergency_contact_name || '',
          emergency_contact_phone: d.emergency_contact_phone || ''
        });
        setOtherDepartment(preset ? '' : (d.department_name || ''));
        setCustomFields(Array.isArray(d.custom_fields) ? d.custom_fields : []);
      }
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employee.id]);

  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const textInput = (key, props = {}) => <input className={inputClass} value={form[key]} disabled={busy || loading} onChange={e => set(key, e.target.value)} {...props} />;

  const submit = async event => {
    event.preventDefault();
    if (locked.current || loading) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const department_name = form.department_name === OTHER_DEPARTMENT ? otherDepartment.trim() : form.department_name;
      if (!department_name) throw new Error('Enter the department name.');
      const res = await api.updateEmployee(employee.id, { ...form, department_name, custom_fields: customFields });
      if (!res.success) throw new Error(res.error || 'Could not update employee.');
      onSaved(res.message);
    } catch (err) { setError(err.message); }
    finally { locked.current = false; setBusy(false); }
  };

  return <Modal isOpen onClose={() => { if (!locked.current) onClose(); }} title={`Edit Employee: ${employee.first_name} ${employee.last_name}`} maxWidth="max-w-3xl">
    {loading ? (
      <div className="py-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading employee details…
      </div>
    ) : (
      <form onSubmit={submit} className="space-y-6 bg-white text-black">
        {error && <div role="alert" className="p-3 bg-white border border-rose-300 rounded-xl text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /><span className="font-semibold text-rose-700">{error}</span></div>}

        <fieldset className="space-y-3" disabled={busy}>
          <legend className="text-sm font-black text-black mb-2">Personal details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name">{textInput('first_name', { required: true, maxLength: 100 })}</Field>
            <Field label="Last name">{textInput('last_name', { required: true, maxLength: 100 })}</Field>
            <Field label="Work email">{textInput('email', { type: 'email', required: true, maxLength: 255 })}</Field>
            <Field label="Mobile number" hint="With or without a country code.">{textInput('phone', { type: 'tel', autoComplete: 'tel', required: true, maxLength: 50 })}</Field>
            <Field label="Date of birth">{textInput('date_of_birth', { type: 'date', required: true, max: today() })}</Field>
            <div className="sm:col-span-2"><Field label="Address"><textarea className={inputClass} rows={2} required maxLength={500} value={form.address} onChange={e => set('address', e.target.value)} /></Field></div>
            <Field label="Emergency contact name">{textInput('emergency_contact_name', { required: true, maxLength: 150 })}</Field>
            <Field label="Emergency contact number">{textInput('emergency_contact_phone', { type: 'tel', required: true, maxLength: 50 })}</Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3" disabled={busy}>
          <legend className="text-sm font-black text-black mb-2">Employment</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Employee ID">{textInput('employee_id', { required: true, maxLength: 50 })}</Field>
            <Field label="Joining date">{textInput('joining_date', { type: 'date', required: true })}</Field>
            <Field label="Department"><select className={inputClass} value={form.department_name} onChange={e => set('department_name', e.target.value)}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}<option value={OTHER_DEPARTMENT}>Other (type a new department)…</option></select></Field>
            {form.department_name === OTHER_DEPARTMENT && <Field label="Department name"><input className={inputClass} required maxLength={100} value={otherDepartment} disabled={busy} onChange={e => setOtherDepartment(e.target.value)} placeholder="e.g. Customer Support" /></Field>}
            <Field label="Designation">{textInput('designation', { required: true, maxLength: 100 })}</Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3" disabled={busy}>
          <legend className="text-sm font-black text-black mb-2">Others (extra fields)</legend>
          {!customFields.length && <p className="text-xs text-slate-600">No extra fields yet. Add blood group, PAN, bank details, or any custom info.</p>}
          {customFields.map((field, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
            <Field label="Field name"><input className={inputClass} required maxLength={60} value={field.label} onChange={e => setCustomFields(list => list.map((f, i) => i === index ? { ...f, label: e.target.value } : f))} placeholder="e.g. Blood group" /></Field>
            <Field label="Value"><input className={inputClass} required maxLength={500} value={field.value} onChange={e => setCustomFields(list => list.map((f, i) => i === index ? { ...f, value: e.target.value } : f))} /></Field>
            <button type="button" className="sa-text-button flex items-center gap-1 text-xs pb-2.5" aria-label={`Remove field ${index + 1}`} onClick={() => setCustomFields(list => list.filter((_, i) => i !== index))}><Trash2 size={14} />Remove</button>
          </div>)}
          {customFields.length < 20 && <button type="button" className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50" onClick={() => setCustomFields(list => [...list, { label: '', value: '' }])}><Plus size={14} />Add another field</button>}
        </fieldset>

        <div className="ticket-form-actions flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="ui-button-primary" disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}<span>{busy ? 'Saving…' : 'Save changes'}</span></button>
        </div>
      </form>
    )}
  </Modal>;
}
