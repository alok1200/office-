import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CalendarDays, Sparkles, Send } from 'lucide-react';
import { RequestFormModal } from '../components/Employee/RequestFormModal';

export function HolidaysPage() {
  const { currentUserId } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    async function loadHolidays() {
      try {
        const res = await api.getHolidays(currentUserId);
        if (res.success && res.data) {
          setHolidays(res.data);
        }
      } catch (err) {
        console.error('Failed to load holidays:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHolidays();
  }, [currentUserId]);

  const handleSuccess = (msg) => {
    setSuccessMsg(msg || 'Holiday request submitted successfully.');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 bg-white text-black">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>KNOOVIQ Company Holiday Calendar</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Official company-wide declared holidays for calendar year 2026
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-blue-600 hover:bg-blue-50 text-black text-xs font-black shadow-xs active:scale-[0.98] transition-all"
        >
          <Send className="w-4 h-4 text-blue-600" />
          <span>Submit Holiday Request</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-white border border-blue-200 text-black text-xs font-bold animate-in fade-in shadow-2xs">
          {successMsg}
        </div>
      )}

      {/* Holiday Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 text-center py-12 text-slate-500 font-medium text-xs">
            Loading holidays...
          </div>
        ) : (
          holidays.map((h) => {
            const dateObj = new Date(h.holiday_date);
            const dayNum = dateObj.getDate();
            const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

            return (
              <div
                key={h.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-black border border-slate-300 shadow-2xs">
                      {h.holiday_type || 'OFFICIAL'}
                    </span>
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">{dayNum}</span>
                    <span className="text-sm font-black text-blue-600 uppercase tracking-wider">{monthShort} 2026</span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold">{dayOfWeek}</p>

                  <h3 className="text-base font-black text-black mt-3">{h.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{h.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-blue-600 font-black">
                  🌴 Paid Non-Working Day
                </div>
              </div>
            );
          })
        )}
      </div>

      <RequestFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
