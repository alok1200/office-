import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { api } from '../../services/api';
import { PunchControls } from './PunchControls';
import { WorkingTimer } from './WorkingTimer';

export function PersonalAttendance() {
  const { currentUserId } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const attendanceRequest = useRef(0);

  const fetchTodayData = useCallback(async () => {
    const request = ++attendanceRequest.current;
    try {
      const res = await api.getTodayAttendance(currentUserId);
      if (request === attendanceRequest.current && res.success && res.data) {
        setTodayData(res.data);
        return res.data;
      }
    } catch (error) {
      console.error('Failed to load today attendance:', error);
    } finally {
      if (request === attendanceRequest.current) setLoading(false);
    }
    return null;
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    setTodayData(null);
    setLoading(true);
    void fetchTodayData();
    return () => { attendanceRequest.current++; };
  }, [fetchTodayData, currentUserId]);

  useDataRefresh(fetchTodayData, ['attendance', 'requests', 'employees'], { enabled: Boolean(currentUserId) });

  return (
    <div className="dashboard-workday">
      <PunchControls todayData={todayData} onRefresh={fetchTodayData} loading={loading} />
      <WorkingTimer todayData={todayData} loading={loading} />
    </div>
  );
}
