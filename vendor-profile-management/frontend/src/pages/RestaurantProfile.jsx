import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, X, MapPin, Phone, Mail,
  Star, MessageSquare, ShieldCheck, ShieldAlert, Clock,
  UtensilsCrossed, Search, Filter, ChevronDown, BookOpen, Eye, Sparkles
} from 'lucide-react';
import {
  getTestVendor,
  getVendorRestaurants,
  createRestaurant,
  updateRestaurantProfile,
} from '../services/api';
import HoursModal from '../components/HoursModal';
import FeaturesModal from '../components/FeaturesModal';
// add Sparkles to lucide-react import

const CUISINES = [
  'Italian', 'Japanese', 'Chinese', 'Indian', 'Mexican',
  'Thai', 'French', 'Canadian', 'Seafood', 'Vegan',
  'American', 'Korean', 'Vietnamese', 'Mediterranean', 'Other'
];

// Real food photos per cuisine (Unsplash CDN)
const CUISINE_IMAGES = {
  Italian: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=60&auto=format&fit=crop',
  Japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=60&auto=format&fit=crop',
  Chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=60&auto=format&fit=crop',
  Indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=60&auto=format&fit=crop',
  Mexican: 'https://images.unsplash.com/photo-1565299624246-b28f40a0ae38?w=600&q=60&auto=format&fit=crop',
  Thai: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=60&auto=format&fit=crop',
  French: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=600&q=60&auto=format&fit=crop',
  Canadian: 'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=600&q=60&auto=format&fit=crop',
  Seafood: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=60&auto=format&fit=crop',
  Vegan: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=60&auto=format&fit=crop',
  American: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=60&auto=format&fit=crop',
  Korean: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&q=60&auto=format&fit=crop',
  Vietnamese: 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=600&q=60&auto=format&fit=crop',
  Mediterranean: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=60&auto=format&fit=crop',
  Other: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=60&auto=format&fit=crop',
};

// Emoji fallback (shows if the photo fails to load)
const CUISINE_EMOJI = {
  Italian: '🍕', Japanese: '🍣', Chinese: '🥡', Indian: '🍛', Mexican: '🌮',
  Thai: '🍜', French: '🥐', Canadian: '🍁', Seafood: '🦞', Vegan: '🥗',
  American: '🍔', Korean: '🍲', Vietnamese: '🍜', Mediterranean: '🫒', Other: '🍽️',
};

// Cover image with cascading fallback: coverUrl → cuisine image → emoji
function RestaurantCover({ rest }) {
  const [src, setSrc] = useState(rest.coverUrl || CUISINE_IMAGES[rest.cuisine] || CUISINE_IMAGES.Other);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (rest.coverUrl && src === rest.coverUrl) {
      setSrc(CUISINE_IMAGES[rest.cuisine] || CUISINE_IMAGES.Other); // try cuisine image
    } else {
      setFailed(true); // fall back to emoji layer
    }
  };

  return (
    <>
      {/* Emoji fallback layer (always underneath) */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <span className="text-6xl opacity-40">{CUISINE_EMOJI[rest.cuisine] || '🍽️'}</span>
      </div>
      {/* Actual image */}
      {!failed && (
        <img
          src={src}
          alt={rest.name}
          loading="lazy"
          onError={handleError}
          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      )}
    </>
  );
}

// Logo with graceful fallback to initials
function RestaurantLogo({ rest, size = 'md' }) {
  const [imgError, setImgError] = useState(false);
  const initials = (rest.name || 'R').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sizeClasses = size === 'sm' ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-lg';

  if (rest.logoUrl && !imgError) {
    return (
      <img
        src={rest.logoUrl}
        alt={rest.name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover bg-gray-700 ring-2 ring-gray-700 shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-gray-900 font-bold ring-2 ring-gray-700 shrink-0`}>
      {initials}
    </div>
  );
}

const initialFormData = {
  name: '', description: '', street: '', city: '', zipcode: '',
  phone: '', email: '', cuisine: 'Canadian', priceLevel: 2,
  logoUrl: '', coverUrl: ''
};


export default function RestaurantProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoursRestaurantId, setHoursRestaurantId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [featuresRestaurantId, setFeaturesRestaurantId] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
  }, [searchParams]);

  const loadData = async () => {
    try {
      const vendorRes = await getTestVendor();
      setVendorId(vendorRes.data.id);
      const restRes = await getVendorRestaurants(vendorRes.data.id);
      setRestaurants(restRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ─────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Restaurant name is required';
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(formData.zipcode.trim())) {
      newErrors.zipcode = 'Invalid Canadian postal code (e.g., V6B 5K8)';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    return newErrors;
  };

  // ── Modal Handlers ─────────────────────────────────────
  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (rest) => {
    setEditingId(rest.id);
    setFormData({
      name: rest.name || '',
      description: rest.description || '',
      street: rest.street || '',
      city: rest.city || '',
      zipcode: rest.zipcode || '',
      phone: rest.phone || '',
      email: rest.email || '',
      cuisine: rest.cuisine || 'Canadian',
      priceLevel: rest.priceLevel || 2,
      logoUrl: rest.logoUrl || '',
      coverUrl: rest.coverUrl || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData, priceLevel: parseInt(formData.priceLevel) };

      if (editingId) {
        await updateRestaurantProfile(editingId, payload);
        toast.success('Restaurant updated successfully!');
      } else {
        payload.vendorId = vendorId;
        await createRestaurant(payload);
        toast.success('Restaurant added successfully!');
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      if (error.response?.status === 409) {
        toast.error('Duplicate: A restaurant with this name and address already exists!');
      } else {
        toast.error('Error saving. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // ── Filtering & Sorting ────────────────────────────────
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = cuisineFilter === 'all' || r.cuisine === cuisineFilter;
    return matchesSearch && matchesCuisine;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  // ── Skeleton Loading ───────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-36 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="h-32 bg-gray-700 animate-pulse"></div>
              <div className="p-5 space-y-3">
                <div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-40 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Shows the logo image, or falls back to initials if missing/broken
function RestaurantAvatar({ rest }) {
  const [imgError, setImgError] = useState(false);
  const initials = rest.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (rest.logoUrl && !imgError) {
    return (
      <img
        src={rest.logoUrl}
        alt={rest.name}
        onError={() => setImgError(true)}
        className="h-16 w-16 rounded-full object-cover border-2 border-gray-800 shadow-lg"
      />
    );
  }
  return (
    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-gray-900 font-bold text-xl shadow-lg">
      {initials}
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Restaurants</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition-all hover:shadow-lg hover:shadow-yellow-500/20"
        >
          <Plus size={18} />
          Add Restaurant
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-yellow-500 transition">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, or cuisine..."
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="text-gray-400 hover:text-white transition">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Cuisine Filter */}
          <select
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
          >
            <option value="all">All Cuisines</option>
            {CUISINES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
          >
            <option value="name">Sort by Name</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Active search chip */}
        {searchQuery && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-400">Filtering by:</span>
            <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-xs px-2.5 py-1 rounded-full">
              "{searchQuery}"
              <button onClick={clearSearch} className="hover:text-white transition">
                <X size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Restaurant Cards Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No restaurants found</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchQuery ? 'Try a different search term' : 'Add your first restaurant to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((rest) => (
            <div
              key={rest.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-yellow-500/50 hover:shadow-xl hover:shadow-black/30 transition-all group flex flex-col"
            >
              {/* Cover Image — clean, no overlap */}
              <div className="relative h-36 w-full overflow-hidden bg-gray-900">
                <RestaurantCover rest={rest} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent pointer-events-none"></div>

                {/* Status Badge */}
                <span className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium backdrop-blur-md ${
                  rest.isClaimed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gray-900/60 text-gray-300 border border-gray-600'
                }`}>
                  {rest.isClaimed ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                  {rest.isClaimed ? 'Claimed' : 'Unclaimed'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1">
                {/* Header row: Logo + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <RestaurantLogo rest={rest} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold text-base group-hover:text-yellow-400 transition-colors truncate">
                      {rest.name}
                    </h3>
                    <p className="text-gray-500 text-xs">{rest.cuisine} · {'$'.repeat(rest.priceLevel)}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {rest.description || 'No description provided'}
                </p>

                {/* Details */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <MapPin size={13} className="text-gray-500 shrink-0" />
                    <span className="truncate">{rest.street}, {rest.city} {rest.zipcode}</span>
                  </div>
                  {rest.phone && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Phone size={13} className="text-gray-500 shrink-0" />
                      <span>{rest.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions — unified icon-only buttons */}
                <div className="mt-auto pt-4 border-t border-gray-700 flex items-center justify-center">
                  <div className="flex items-center gap-1.5">
                    {/* View public profile */}
                    <button
                      onClick={() => navigate(`/restaurant/${rest.id}/view`)}
                      title="View public profile"
                      className="p-2.5 rounded-lg bg-gray-700/50 text-gray-400 border border-transparent hover:text-blue-400 hover:bg-blue-500/15 hover:border-blue-500/30 transition-all"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Manage menu */}
                    <button
                      onClick={() => navigate(`/restaurant/${rest.id}/menu`)}
                      title="Manage menu"
                      className="p-2.5 rounded-lg bg-gray-700/50 text-gray-400 border border-transparent hover:text-yellow-400 hover:bg-yellow-500/15 hover:border-yellow-500/30 transition-all"
                    >
                      <BookOpen size={16} />
                    </button>

                    {/* Manage hours */}
                    <button
                      onClick={() => setHoursRestaurantId(rest.id)}
                      title="Manage hours"
                      className="p-2.5 rounded-lg bg-gray-700/50 text-gray-400 border border-transparent hover:text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all"
                    >
                      <Clock size={16} />
                    </button>

                    {/* Edit restaurant */}
                    <button
                      onClick={() => openEditModal(rest)}
                      title="Edit restaurant"
                      className="p-2.5 rounded-lg bg-gray-700/50 text-gray-400 border border-transparent hover:text-white hover:bg-gray-700 hover:border-gray-600 transition-all"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Features restaurant */}
                    <button
                      onClick={() => setFeaturesRestaurantId(rest.id)}
                      title="Manage features"
                      className="p-2.5 rounded-lg bg-gray-700/50 text-gray-400 border border-transparent hover:text-purple-400 hover:bg-purple-500/15 hover:border-purple-500/30 transition-all"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Restaurant Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-gray-900 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition ${errors.name ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="e.g., The Golden Fork"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cuisine</label>
                  <select
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
                  >
                    {CUISINES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price Level</label>
                  <select
                    name="priceLevel"
                    value={formData.priceLevel}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value={1}>$ - Budget</option>
                    <option value={2}>$$ - Moderate</option>
                    <option value={3}>$$$ - Upscale</option>
                    <option value={4}>$$$$ - Fine Dining</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 resize-none"
                  placeholder="Tell customers about your restaurant..."
                ></textarea>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Restaurant Images</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Cover Image URL</label>
                    <input
                      type="url"
                      name="coverUrl"
                      value={formData.coverUrl}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                      placeholder="https://.../cover.jpg"
                    />
                    {formData.coverUrl && (
                      <img
                        src={formData.coverUrl}
                        alt="Cover preview"
                        className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-700"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
                      />
                    )}
                  </div>
                  {/* Logo */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Logo URL</label>
                    <input
                      type="url"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                      placeholder="https://.../logo.png"
                    />
                    {formData.logoUrl && (
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="mt-2 h-24 w-24 object-cover rounded-lg border border-gray-700"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Street Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className={`w-full bg-gray-900 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition ${errors.street ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="123 Main St"
                  />
                  {errors.street && <p className="text-red-400 text-xs mt-1">{errors.street}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Postal Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                    className={`w-full bg-gray-900 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition ${errors.zipcode ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="V6B 5K8"
                  />
                  {errors.zipcode && <p className="text-red-400 text-xs mt-1">{errors.zipcode}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full bg-gray-900 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition ${errors.city ? 'border-red-500' : 'border-gray-700'}`}
                  placeholder="Vancouver"
                />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full bg-gray-900 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition ${errors.phone ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="(604) 555-0123"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-gray-900 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="contact@restaurant.com"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? 'Update Restaurant' : 'Add Restaurant'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {hoursRestaurantId && (
        <HoursModal
          restaurantId={hoursRestaurantId}
          onClose={() => setHoursRestaurantId(null)}
        />
      )}

      {featuresRestaurantId && (
        <FeaturesModal
          restaurantId={featuresRestaurantId}
          onClose={() => setFeaturesRestaurantId(null)}
        />
      )}
    </div>
  );
}