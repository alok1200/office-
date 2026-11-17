// Calendar-only palette. Other statuses remain neutral and have no legend entry.
export const calendarStatuses = {
  PRESENT: { label: 'Present', color: 'Green', dot: 'bg-green-600', card: 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-600', badge: 'bg-green-50 text-green-800 border-green-300' },
  ABSENT: { label: 'Absent', color: 'Red', dot: 'bg-red-600', card: 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-600', badge: 'bg-red-50 text-red-800 border-red-300' },
  HALF_DAY: { label: 'Half Day', color: 'Orange', dot: 'bg-orange-500', card: 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-500', badge: 'bg-orange-50 text-orange-800 border-orange-300' },
  HOLIDAY: { label: 'Holiday', color: 'Blue', dot: 'bg-blue-600', card: 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-600', badge: 'bg-blue-50 text-blue-800 border-blue-300' },
  LEAVE: { label: 'Planned Leave', color: 'Yellow', dot: 'bg-yellow-400', card: 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-400', badge: 'bg-yellow-50 text-yellow-900 border-yellow-300' },
};

export function getCalendarStatus(status) {
  const normalized = String(status || '').toUpperCase().replaceAll(' ', '_');
  return calendarStatuses[['PLANNED_LEAVE', 'PREPLANNED_LEAVE', 'PRE_PLANNED_LEAVE'].includes(normalized) ? 'LEAVE' : normalized];
}
