import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { api } from '../../services/api';
import { employeeIdHint, employeeIdInput } from '../HR/AddEmployeeModal';

export function HRAdminForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ employee_id: '', first_name: '', last_name: '', email: '', password: '', department_name: 'Hr department', designation: 'HR Admin' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef(null), busy = useRef(false), mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; panel.current.querySelector('input')?.focus();
    const keydown = event => {
      if (event.key === 'Escape' && !busy.current) onClose();
      if (event.key !== 'Tab') return;
      const items = [...panel.current.querySelectorAll('input:not(:disabled), button:not(:disabled)')];
      if (!items.length) { event.preventDefault(); panel.current.focus(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { mounted.current = false; document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const save = async event => {
    event.preventDefault(); if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const response = await api.createHRAdmin(form);
      if (!response.success) throw new Error(response.error || 'Could not create HR Admin.');
      if (mounted.current) onSaved(`HR Admin ${response.data.first_name} ${response.data.last_name} (${response.data.employee_id}) created.`);
    } catch (error) { if (mounted.current) setError(error.message); }
    finally { busy.current = false; if (mounted.current) setSaving(false); }
  };
  return <div className="sa-request-overlay" onClick={event => { if (event.target === event.currentTarget && !busy.current) onClose(); }}>
    <section ref={panel} tabIndex={-1} className="sa-request-dialog" role="dialog" aria-modal="true" aria-labelledby="create-hr-title">
      <button type="button" className="sa-dialog-close" onClick={onClose} disabled={saving} aria-label="Close HR Admin form"><X size={21} /></button>
      <h2 id="create-hr-title">Create HR Admin</h2>
      <p>Assign a work email and password. This account will open the HR Admin portal when it signs in.</p>
      <form onSubmit={save}>
        <div>
          <label htmlFor="hr-admin-employee-id">Employee ID</label>
          <input id="hr-admin-employee-id" {...employeeIdInput} aria-describedby="hr-admin-employee-id-hint" value={form.employee_id} onChange={event => setForm(old => ({ ...old, employee_id: event.target.value }))} disabled={saving} />
          <small id="hr-admin-employee-id-hint">{employeeIdHint}</small>
        </div>
        {[
          ['first_name', 'First name', 'text', 100, 'given-name'],
          ['last_name', 'Last name', 'text', 100, 'family-name'],
          ['email', 'Login email', 'email', 255, 'off'],
          ['password', 'Password (8–128 characters)', 'password', 128, 'new-password'],
          ['department_name', 'Department', 'text', 100, 'off'],
          ['designation', 'Designation', 'text', 100, 'organization-title'],
        ].map(([key, label, type, maxLength, autoComplete]) => <div key={key}>
          <label htmlFor={`hr-admin-${key}`}>{label}</label>
          <input id={`hr-admin-${key}`} type={type} value={form[key]} onChange={event => setForm(old => ({ ...old, [key]: event.target.value }))} required minLength={key === 'password' ? 8 : 1} maxLength={maxLength} autoComplete={autoComplete} disabled={saving} />
        </div>)}
        {error && <p role="alert" className="sa-request-error">{error}</p>}
        <div className="sa-request-submit"><button type="button" className="sa-office-cancel-form" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="sa-request-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Creating…' : 'Create HR Admin'}</button></div>
      </form>
    </section>
  </div>;
}
