import React, { useState, useEffect } from 'react';
import { Clock, Coffee, LogIn, LogOut, Activity } from 'lucide-react';

function formatDuration(totalMinutes) {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}

function formatTimeString(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function WorkingTimer({ todayData }) {
  const [liveWorkingMinutes, setLiveWorkingMinutes] = useState(todayData?.total_work_minutes || 0);
  const [liveBreakMinutes, setLiveBreakMinutes] = useState(todayData?.total_break_minutes || 0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!todayData || !todayData.check_in || todayData.current_state === 'CHECKED_OUT') {
        setLiveWorkingMinutes(todayData?.total_work_minutes || 0);
        setLiveBreakMinutes(todayData?.total_break_minutes || 0);
        return;
      }

      const now = new Date();
      const checkIn = new Date(todayData.check_in);
      const totalElapsedMins = Math.max(0, Math.floor((now - checkIn) / (1000 * 60)));

      let breaksTotal = 0;
      if (todayData.breaks && Array.isArray(todayData.breaks)) {
        for (const b of todayData.breaks) {
          if (b.break_end) {
            breaksTotal += b.duration_minutes || 0;
          } else if (todayData.current_state === 'ON_BREAK') {
            const bStart = new Date(b.break_start);
            breaksTotal += Math.max(0, Math.floor((now - bStart) / (1000 * 60)));
          }
        }
      }

      const workingMins = Math.max(0, totalElapsedMins - breaksTotal);
      setLiveWorkingMinutes(workingMins);
      setLiveBreakMinutes(breaksTotal);
    }, 5000);

    setLiveWorkingMinutes(todayData?.total_work_minutes || 0);
    setLiveBreakMinutes(todayData?.total_break_minutes || 0);

    return () => clearInterval(interval);
  }, [todayData]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Check-In Time */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
          <LogIn className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Check-In</p>
          <p className="text-xl font-black text-black mt-0.5">{formatTimeString(todayData?.check_in)}</p>
          <span className="text-[11px] text-slate-500 font-medium">Recorded entry</span>
        </div>
      </div>

      {/* 2. Check-Out Time */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
          <LogOut className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Check-Out</p>
          <p className="text-xl font-black text-black mt-0.5">{formatTimeString(todayData?.check_out)}</p>
          <span className="text-[11px] text-slate-500 font-medium">Workday end</span>
        </div>
      </div>

      {/* 3. Total Working Time */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working Time</p>
            {todayData?.current_state === 'CHECKED_IN' && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>
          <p className="text-xl font-black text-black mt-0.5">{formatDuration(liveWorkingMinutes)}</p>
          <span className="text-[11px] text-blue-600 font-bold">Net working hours</span>
        </div>
      </div>

      {/* 4. Total Break Time */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
          <Coffee className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Break Time</p>
            {todayData?.current_state === 'ON_BREAK' && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>
          <p className="text-xl font-black text-black mt-0.5">{formatDuration(liveBreakMinutes)}</p>
          <span className="text-[11px] text-slate-500 font-medium">Excluded from work</span>
        </div>
      </div>
    </div>
  );
}
