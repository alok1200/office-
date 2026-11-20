import React,{useRef,useState} from 'react';
import {Modal} from '../Common/Modal';
import {api} from '../../services/api';
const clock=value=>value?new Date(value).toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'}):'';
export function AttendanceEditForm({row,onClose,onSaved}) {
  const [form,setForm]=useState({employee_id:row.employee_id,work_date:row.work_date,check_in:clock(row.check_in),check_out:clock(row.check_out),status:row.status==='FUTURE'||row.status==='NOT_CHECKED_IN'?'AUTO':row.status,notes:''});
  const [saving,setSaving]=useState(false),[error,setError]=useState('');const busy=useRef(false);
  const change=(key,value)=>setForm(old=>({...old,[key]:value}));
  const save=async event=>{
    event.preventDefault();if(busy.current)return;busy.current=true;setSaving(true);setError('');
    try{const response=await api.editAttendanceBySuperAdmin(null,form);if(!response.success)throw new Error(response.error||'Could not save attendance.');onSaved(response.message);}
    catch(error){setError(error.message);}finally{busy.current=false;setSaving(false);}
  };
  return <Modal isOpen title="Edit employee attendance" onClose={()=>{if(!busy.current)onClose();}}><form className="ticket-form" onSubmit={save}>
    <p><strong>{row.employee_name} ({row.employee_code})</strong> · {row.work_date}</p>
    <p>Times are in IST. Existing breaks are preserved and subtracted from work time. Leave both times empty for a status-only correction.</p>
    <div className="ticket-form-grid"><label>Check-in (IST)<input type="time" value={form.check_in} onChange={e=>change('check_in',e.target.value)} disabled={saving}/></label><label>Check-out (IST)<input type="time" value={form.check_out} onChange={e=>change('check_out',e.target.value)} disabled={saving}/></label></div>
    <label>Status<select value={form.status} onChange={e=>change('status',e.target.value)} disabled={saving}>{['AUTO','PRESENT','HALF_DAY','ABSENT','LEAVE','HOLIDAY','WEEKLY_OFF','WFH','OFFICIAL_WORK_OUTSIDE'].map(status=><option key={status} value={status}>{status.replaceAll('_',' ')}</option>)}</select></label>
    <label>Reason for change<textarea rows={3} value={form.notes} onChange={e=>change('notes',e.target.value)} required minLength={5} maxLength={2000} disabled={saving}/></label>
    {error&&<p role="alert" className="sa-request-error">{error}</p>}
    <div className="ticket-form-actions"><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button className="ui-button-primary" disabled={saving}>{saving?'Saving…':'Save attendance'}</button></div>
  </form></Modal>;
}
