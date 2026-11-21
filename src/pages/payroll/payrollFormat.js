export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatINR(paise) {
  const num = Number(paise || 0) / 100;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(val) {
  if (!val) return '—';
  return String(val).slice(0, 10);
}

export function periodLabel(year, month) {
  return `${MONTHS[(Number(month) || 1) - 1] || month} ${year}`;
}

export function currentIndiaYearMonth() {
  const iso = new Date(Date.now() + 19800000).toISOString().slice(0, 10);
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) };
}

export function payrollStatusTone(status) {
  const s = String(status || '').toUpperCase();
  if (['APPROVED', 'COMPLETED', 'SUCCESS'].includes(s)) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
  if (['SUBMITTED', 'PROCESSING', 'AUTHORIZED', 'PARTIALLY_PAID'].includes(s)) return 'bg-blue-50 text-blue-800 border-blue-300';
  if (['REJECTED', 'FAILED'].includes(s)) return 'bg-rose-50 text-rose-800 border-rose-300';
  return 'bg-amber-50 text-amber-800 border-amber-300';
}
