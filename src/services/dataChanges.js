export const DATA_CHANGED_EVENT='knooviq:data-changed';
export function changedResource(path, method='GET') {
  if(['GET','HEAD','OPTIONS'].includes(method.toUpperCase())||path.startsWith('/api/auth/')||path.endsWith('/requests/preview'))return null;
  if(path.includes('/holidays'))return 'holidays';
  if(path.includes('/office-location')||path.includes('/offices'))return 'offices';
  if(path.includes('/attendance/edit')||path.includes('/attendance/punch'))return 'attendance';
  if(path.includes('/requests'))return 'requests';
  if(path.includes('/hr-admins')||path.includes('/employees'))return 'employees';
  if(path.includes('/notifications'))return 'notifications';
  return null;
}
export function announceDataChange(path,method,target=globalThis.window) {
  const resource=changedResource(path,method);
  if(resource&&target?.dispatchEvent)target.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT,{detail:{resource}}));
}
