export const correctionModes = {
  STATUS_UPDATE: 'Attendance status update',
  MISSED_CHECK_IN: 'Missed check-in',
  MISSED_CHECK_OUT: 'Missed check-out',
  BOTH: 'Both punches missing',
};
export function correctionFormPayload(form) {
  const common={employee_id:Number(form.employee_id),work_date:form.work_date,reason:form.reason.trim()};
  if(form.correction_type==='STATUS_UPDATE')return {...common,requested_status:form.requested_status};
  if(!['MISSED_CHECK_IN','MISSED_CHECK_OUT','BOTH'].includes(form.correction_type))throw new Error('Choose a correction type.');
  const valid=value=>typeof value==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if(!valid(form.check_in) || !valid(form.check_out))throw new Error('Provide the proposed check-in and check-out times.');
  if(form.check_out<=form.check_in)throw new Error('Check-out must be later than check-in on the selected date.');
  return {...common,correction_type:form.correction_type,check_in:new Date(`${form.work_date}T${form.check_in}:00+05:30`).toISOString(),check_out:new Date(`${form.work_date}T${form.check_out}:00+05:30`).toISOString()};
}
