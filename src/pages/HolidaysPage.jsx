import {useDataRefresh} from '../hooks/useDataRefresh';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CalendarDays, Sparkles, Plus, Edit2, Trash2 } from 'lucide-react';
import { HolidayFormModal } from '../components/HR/HolidayFormModal';

export function HolidaysPage() {
  const { currentUserId, isSuperAdmin } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadError,setLoadError]=useState('');

  const loadHolidays = useCallback(async () => {
    setLoadError('');
    try {
      const res = await api.getHolidays(currentUserId);
      if(!res.success)throw new Error(res.error || 'Could not load holidays.');
      if (res.success && res.data) {
        setHolidays(res.data);
      }
    } catch (err) {
      setLoadError(err.message || 'Could not load holidays.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  useDataRefresh(loadHolidays,['holidays']);
  const handleOpenAdd = () => {
    setSelectedHoliday(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove the holiday "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await api.deleteHoliday(currentUserId, id);
      if (res.success) {
        setSuccessMsg(`Holiday "${name}" removed successfully.`);
        setTimeout(() => setSuccessMsg(null), 5000);
        await loadHolidays();
      } else {
        alert(res.error || 'Failed to remove holiday');
      }
    } catch (err) {
      alert(err.message || 'Error deleting holiday');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = (msg) => {
    setSuccessMsg(msg || 'Holiday updated successfully.');
    setTimeout(() => setSuccessMsg(null), 5000);
    loadHolidays();
  };

  return (
    <div className="space-y-6 bg-white text-black">
      {loadError && <p role="alert" className="sa-request-error">{loadError}<button onClick={loadHolidays}>Retry holidays</button></p>}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>KNOOVIQ Company Holiday Calendar</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Official company-wide declared holidays
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-blue-600 hover:bg-blue-50 text-black text-xs font-black shadow-xs active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add Holiday</span>
          </button>
        )}
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
        ) : holidays.length === 0 ? (
          <div className="col-span-4 text-center py-12 text-slate-500 font-medium text-xs">
            No holidays declared yet.
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
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-black border border-slate-300 shadow-2xs">
                      {h.holiday_type || 'OFFICIAL'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isSuperAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(h)}
                            title="Edit Holiday"
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(h.id, h.name)}
                            disabled={deletingId === h.id}
                            title="Remove Holiday"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
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

      {isSuperAdmin && (
        <HolidayFormModal
          isOpen={isModalOpen}
          initialData={selectedHoliday}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedHoliday(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
