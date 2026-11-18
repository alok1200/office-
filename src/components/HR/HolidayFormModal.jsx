import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../Common/Modal';
import { Send, AlertCircle, Loader2 } from 'lucide-react';

export function HolidayFormModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('OFFICIAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(initialData && initialData.id);

  useEffect(() => {
    if (initialData) {
      // Format date string to YYYY-MM-DD for input
      let formattedDate = '';
      if (initialData.holiday_date) {
        const d = new Date(initialData.holiday_date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        } else {
          formattedDate = String(initialData.holiday_date).split('T')[0];
        }
      }
      setDate(formattedDate);
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setType(initialData.holiday_type || 'OFFICIAL');
    } else {
      setDate('');
      setName('');
      setDescription('');
      setType('OFFICIAL');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!date || !name.trim()) {
      setError('Date and name are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        holiday_date: date,
        name: name.trim(),
        description: description.trim(),
        holiday_type: type
      };

      const res = isEdit
        ? await api.updateHoliday(null, initialData.id, payload)
        : await api.createHoliday(null, payload);

      if (res.success) {
        onSuccess && onSuccess(isEdit ? 'Holiday updated successfully.' : 'Holiday added successfully.');
        onClose();
        setDate('');
        setName('');
        setDescription('');
        setType('OFFICIAL');
      } else {
        setError(res.error || `Failed to ${isEdit ? 'update' : 'add'} holiday`);
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Holiday' : 'Add Holiday'}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white text-black">
        {error && (
          <div className="p-3 bg-white border border-rose-300 rounded-xl text-black text-xs flex items-center gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-rose-700">{error}</span>
          </div>
        )}
        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
            Holiday Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Independence Day"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional details about this holiday..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
            Holiday Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-black shadow-2xs"
          >
            <option value="OFFICIAL">Official</option>
            <option value="OPTIONAL">Optional</option>
          </select>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-black hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="ui-button-primary"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Send className="w-3.5 h-3.5 text-blue-600" />}
            <span>{loading ? 'Saving…' : isEdit ? 'Update Holiday' : 'Add Holiday'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
