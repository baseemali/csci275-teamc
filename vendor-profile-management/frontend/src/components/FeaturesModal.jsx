import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Sparkles, Plus, Check } from 'lucide-react';
import { getRestaurantTags, createRestaurantTag, deleteRestaurantTag } from '../services/api';

// Curated list of common restaurant features (click to quick-add)
const PRESET_FEATURES = [
  'Outdoor seating', 'Free Wi-Fi', 'Takeout', 'Delivery',
  'Reservations', 'Wheelchair accessible', 'Parking available', 'Live music',
  'Private dining', 'Bar/Lounge', 'BYOB', 'Vegetarian options',
  'Vegan options', 'Halal', 'Gluten-free options', 'Family friendly',
  'Dog friendly', 'Catering', 'Drive-through', 'Table service',
];

export default function FeaturesModal({ restaurantId, onClose }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState('');
  const [adding, setAdding] = useState(false);

  const loadTags = async () => {
    try {
      const res = await getRestaurantTags(restaurantId);
      setTags(res.data || []);
    } catch (e) {
      toast.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTags(); }, [restaurantId]);

  const isAdded = (name) =>
    tags.some((t) => t.name.toLowerCase() === name.toLowerCase());

  const handleAdd = async (name) => {
    if (!name.trim()) return;
    try {
      setAdding(true);
      const res = await createRestaurantTag(restaurantId, name.trim());
      if (!tags.some((t) => t.id === res.data.id)) {
        setTags((prev) => [...prev, res.data]);
      }
      toast.success(`Added "${res.data.name}"`);
      setCustomName('');
    } catch (e) {
      toast.error('Failed to add feature');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (tag) => {
    try {
      await deleteRestaurantTag(restaurantId, tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      toast.success(`Removed "${tag.name}"`);
    } catch (e) {
      toast.error('Failed to remove feature');
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    handleAdd(customName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-yellow-500" /> Features
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current features */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Added features ({tags.length})
            </h3>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : tags.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No features added yet. Pick from below or type your own.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="group flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-sm"
                  >
                    <Check size={13} />
                    {tag.name}
                    <button
                      onClick={() => handleRemove(tag)}
                      className="ml-1 p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-400 transition"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Custom input */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Add a custom feature (e.g., Rooftop terrace)"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !customName.trim()}
              className="flex items-center gap-1.5 bg-yellow-500 text-gray-900 font-semibold px-4 py-2.5 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 text-sm"
            >
              <Plus size={16} /> Add
            </button>
          </form>

          {/* Quick-add presets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Quick add
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRESET_FEATURES.map((preset) => {
                const added = isAdded(preset);
                return (
                  <button
                    key={preset}
                    onClick={() => (added ? null : handleAdd(preset))}
                    disabled={added || adding}
                    className={`px-3 py-1.5 rounded-full text-sm transition border ${
                      added
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default'
                        : 'bg-gray-900/60 text-gray-300 border-gray-700 hover:border-yellow-500/50 hover:text-yellow-400'
                    }`}
                  >
                    {added ? <><Check size={12} className="inline mr-1" />{preset}</> : <>+ {preset}</>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}