import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Clock, Copy } from 'lucide-react';
import { getRestaurantHours, saveRestaurantHours } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const defaultDay = { openTime: '09:00', closeTime: '21:00', isClosed: false };

export default function HoursModal({ restaurantId, onClose }) {
  const [hours, setHours] = useState(() =>
    Object.fromEntries(DAYS.map((d) => [d, { ...defaultDay }]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRestaurantHours(restaurantId);
        const map = Object.fromEntries(DAYS.map((d) => [d, { ...defaultDay }]));
        (res.data || []).forEach((h) => {
          if (map[h.day]) {
            map[h.day] = {
              openTime: h.openTime || '09:00',
              closeTime: h.closeTime || '21:00',
              isClosed: h.isClosed ?? !h.openTime,
            };
          }
        });
        setHours(map);
      } catch (e) {
        toast.error('Failed to load hours');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restaurantId]);

  const updateDay = (day, field, value) =>
    setHours({ ...hours, [day]: { ...hours[day], [field]: value } });

  const copyMonday = () => {
    const next = {};
    DAYS.forEach((d) => { next[d] = { ...hours.Monday }; });
    setHours(next);
    toast.success('Monday copied to all days');
  };

  const handleSave = async () => {
    for (const d of DAYS) {
      const h = hours[d];
      if (!h.isClosed && h.openTime >= h.closeTime) {
        return toast.error(`${d}: close time must be after open time`);
      }
    }
    try {
      setSaving(true);
      await saveRestaurantHours(restaurantId, DAYS.map((d) => ({ day: d, ...hours[d] })));
      toast.success('Opening hours saved!');
      onClose();
    } catch (e) {
      toast.error('Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-yellow-500" /> Opening Hours
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X size={20} />
          </button>
        </div>

        {/* Day rows */}
        <div className="p-6 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading hours...</p>
          ) : (
            DAYS.map((day) => {
              const h = hours[day];
              return (
                <div key={day} className="flex items-center gap-3 bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                  <span className="w-24 text-sm font-medium text-gray-300">{day}</span>
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={h.isClosed}
                      onChange={(e) => updateDay(day, 'isClosed', e.target.checked)}
                      className="accent-yellow-500 h-4 w-4"
                    />
                    Closed
                  </label>
                  <div className="flex-1 flex items-center gap-2 justify-end">
                    <input
                      type="time"
                      value={h.openTime}
                      disabled={h.isClosed}
                      onChange={(e) => updateDay(day, 'openTime', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40"
                    />
                    <span className="text-gray-500 text-xs">to</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      disabled={h.isClosed}
                      onChange={(e) => updateDay(day, 'closeTime', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-40"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-700">
          <button onClick={copyMonday} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <Copy size={14} /> Copy Monday to all
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2.5 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Hours'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}