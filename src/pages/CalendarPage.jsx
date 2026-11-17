import React from 'react';
import { AttendanceCalendar } from '../components/Employee/AttendanceCalendar';

export function CalendarPage() {
  return (
    <div className="calendar-palette space-y-6">
      <AttendanceCalendar />
    </div>
  );
}
