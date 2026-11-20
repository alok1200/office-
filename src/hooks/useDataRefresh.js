import {useEffect,useRef} from 'react';
import {subscribeDataRefresh} from '../services/dataRefresh';
export function useDataRefresh(refresh, resources, {enabled=true,intervalMs=15000}={}) {
  const latest=useRef(refresh);latest.current=refresh;
  const key=resources.join(',');
  useEffect(()=>{
    if(!enabled)return;
    return subscribeDataRefresh(()=>latest.current(),key.split(','),{intervalMs});
  },[key,enabled,intervalMs]);
}
