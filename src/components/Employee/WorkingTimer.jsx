import React, { useState, useEffect } from 'react';
import { Activity, Coffee, LogIn, LogOut } from 'lucide-react';
import { DashboardMetric } from '../Dashboard/DashboardElements';

function formatDuration(totalMinutes) {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}

function formatTimeString(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function WorkingTimer({ todayData, loading = false }) {
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
    <div className="dashboard-metrics" aria-label="Workday timing">
      <DashboardMetric label="Check-in" value={formatTimeString(todayData?.check_in)} icon={LogIn} tone="green" />
      <DashboardMetric label="Check-out" value={formatTimeString(todayData?.check_out)} icon={LogOut} tone="indigo" />
      <DashboardMetric label="Working time" value={loading ? '—' : formatDuration(liveWorkingMinutes)} icon={Activity} tone="feature" active={todayData?.current_state === 'CHECKED_IN'} />
      <DashboardMetric label="Break time" value={loading ? '—' : formatDuration(liveBreakMinutes)} icon={Coffee} tone="amber" active={todayData?.current_state === 'ON_BREAK'} />
    </div>
  );
}
