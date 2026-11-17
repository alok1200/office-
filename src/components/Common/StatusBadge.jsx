import React from 'react';
import { getCalendarStatus } from './calendarStatus';
import { CheckCircle2, XCircle, Clock, Calendar, Palmtree, Coffee } from 'lucide-react';

export function StatusBadge({ status, className = '', showIcon = true, variant = 'default' }) {
  const normStatus = (status || '').toUpperCase();
  if (variant === 'calendar') {
    const style = getCalendarStatus(status);
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style?.badge || 'bg-white text-slate-700 border-slate-200'} ${className}`}>
        {showIcon && style && <span className={`w-2 h-2 rounded-full ${style.dot}`} />}
        <span>{style?.label || String(status || 'Unknown').replaceAll('_', ' ')}</span>
      </span>
    );
  }

  switch (normStatus) {
    case 'PRESENT':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-emerald-400 shadow-2xs ${className}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
          <span>Present</span>
        </span>
      );

    case 'ABSENT':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-rose-400 shadow-2xs ${className}`}>
          {showIcon && <XCircle className="w-3.5 h-3.5 text-blue-600" />}
          <span>Absent</span>
        </span>
      );

    case 'HALF_DAY':
    case 'HALF DAY':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-blue-400 shadow-2xs ${className}`}>
          {showIcon && <Clock className="w-3.5 h-3.5 text-blue-600" />}
          <span>Half Day</span>
        </span>
      );

    case 'LEAVE':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-purple-400 shadow-2xs ${className}`}>
          {showIcon && <Palmtree className="w-3.5 h-3.5 text-blue-600" />}
          <span>Leave</span>
        </span>
      );

    case 'HOLIDAY':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border-2 border-amber-400 shadow-2xs ${className}`}>
          {showIcon && <Calendar className="w-3.5 h-3.5 text-blue-600" />}
          <span>Holiday</span>
        </span>
      );

    case 'WEEKLY_OFF':
    case 'WEEKLY OFF':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-slate-300 shadow-2xs ${className}`}>
          {showIcon && <Coffee className="w-3.5 h-3.5 text-blue-600" />}
          <span>Weekly Off</span>
        </span>
      );

    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-amber-300 shadow-2xs ${className}`}>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Pending</span>
        </span>
      );

    case 'APPROVED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-emerald-300 shadow-2xs ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Approved</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-rose-300 shadow-2xs ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Rejected</span>
        </span>
      );

    case 'CHECKED_IN':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-blue-600 shadow-2xs ${className}`}>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          <span>Checked In</span>
        </span>
      );

    case 'ON_BREAK':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-amber-500 shadow-2xs ${className}`}>
          <Coffee className="w-3.5 h-3.5 text-blue-600" />
          <span>On Break</span>
        </span>
      );

    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-300 shadow-2xs ${className}`}>
          <span>Cancelled</span>
        </span>
      );

    case 'CHECKED_OUT':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-slate-400 shadow-2xs ${className}`}>
          <span>Checked Out</span>
        </span>
      );

    case 'NOT_CHECKED_IN':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-black border border-slate-200 shadow-2xs ${className}`}>
          <span>Not Checked In</span>
        </span>
      );
  }
}
