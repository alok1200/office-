// Calendar-only palette. Other statuses remain neutral and have no legend entry.
export const calendarStatuses = {
  PRESENT: { label: 'Present', color: 'Green', dot: 'bg-green-600', card: 'bg-green-50 hover:bg-green-100 border border-green-300 border-l-4 border-l-green-600 text-black', badge: 'bg-green-50 text-green-800 border-green-300' },
  ABSENT: { label: 'Absent', color: 'Red', dot: 'bg-red-600', card: 'bg-red-50 hover:bg-red-100 border border-red-300 border-l-4 border-l-red-600 text-black', badge: 'bg-red-50 text-red-800 border-red-300' },
  HALF_DAY: { label: 'Half Day', color: 'Orange', dot: 'bg-orange-500', card: 'bg-orange-50 hover:bg-orange-100 border border-orange-300 border-l-4 border-l-orange-500 text-black', badge: 'bg-orange-50 text-orange-800 border-orange-300' },
  HOLIDAY: { label: 'Holiday', color: 'Blue', solid: true, dot: 'bg-white', card: 'bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white', badge: 'bg-blue-600 text-white border-blue-700' },
  LEAVE: { label: 'Leave', color: 'Blue', solid: true, dot: 'bg-white', card: 'bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white', badge: 'bg-blue-600 text-white border-blue-700' },
};

export function getCalendarStatus(status) {
  const normalized = String(status || '').toUpperCase().replaceAll(' ', '_');
  return calendarStatuses[['PLANNED_LEAVE', 'PREPLANNED_LEAVE', 'PRE_PLANNED_LEAVE'].includes(normalized) ? 'LEAVE' : normalized];
}
