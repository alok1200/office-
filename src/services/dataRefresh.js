import {DATA_CHANGED_EVENT} from './dataChanges.js';
export function subscribeDataRefresh(refresh,resources,{windowTarget=globalThis.window,documentTarget=globalThis.document,intervalMs=15000,setIntervalFn=setInterval,clearIntervalFn=clearInterval}={}) {
  if(!windowTarget||!documentTarget)return ()=>{};
  const visible=()=>{if(documentTarget.visibilityState==='visible')refresh();};
  const changed=event=>{if(resources.includes(event.detail?.resource))visible();};
  windowTarget.addEventListener(DATA_CHANGED_EVENT,changed);windowTarget.addEventListener('focus',visible);documentTarget.addEventListener('visibilitychange',visible);
  const timer=intervalMs>0?setIntervalFn(visible,intervalMs):null;
  return()=>{windowTarget.removeEventListener(DATA_CHANGED_EVENT,changed);windowTarget.removeEventListener('focus',visible);documentTarget.removeEventListener('visibilitychange',visible);if(timer!==null)clearIntervalFn(timer);};
}
