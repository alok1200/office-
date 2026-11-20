export function notificationDestination(notification,role) {
  if(notification.category==='CORRECTION')return role==='EMPLOYEE'?{tab:'responses',label:'View my responses'}:{tab:'tickets',label:'View attendance tickets'};
  if(notification.category==='REQUEST'){
    if(role==='EMPLOYEE')return {tab:'responses',label:'View my responses'};
    if(role==='SUPER_ADMIN'&&!/^Request #\d+ (approved|rejected)$/i.test(notification.title||''))return {tab:'admin-approvals',label:'Review pending requests'};
    return {tab:'my-requests',label:'View my requests'};
  }
  if(notification.category==='HOLIDAY')return {tab:'holidays',label:'View company holidays'};
  if(notification.category==='ATTENDANCE')return {tab:'calendar',label:'View attendance calendar'};
  return null;
}
