import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Pencil, Save, MapPin, Store, Search } from 'lucide-react';
import { getTestVendor, getVendorRestaurants, createRestaurant, updateRestaurantProfile } from '../services/api';

// Cuisine options for the dropdown
const CUISINE_TYPES = [
  'Canadian', 'American', 'Italian', 'Chinese', 'Japanese', 'Sushi',
  'Indian', 'Mexican', 'Thai', 'Vietnamese', 'Korean', 'Greek',
  'French', 'Mediterranean', 'Middle Eastern', 'Burgers', 'Pizza',
  'Seafood', 'Vegetarian', 'Vegan', 'Desserts', 'Café', 'Other'
];

// Canadian postal code validation: A1A 1A1 (space optional)
const CANADA_POSTAL_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

// Normalizes "v6b5k8" → "V6B 5K8" for consistent DB storage
const formatPostalCode = (postal) => {
  const clean = postal.replace(/\s/g, '').toUpperCase();
  return clean.length === 6 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean;
};

export default function RestaurantProfile() {
  const [vendorId, setVendorId] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  // Search filter from URL (?search=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSearch = searchParams.get('search') || '';

  const [formData, setFormData] = useState({
    name: '', description: '', street: '', city: '', zipcode: '',
    phone: '', email: '', cuisine: '', priceLevel: 2
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const vendorRes = await getTestVendor();
        setVendorId(vendorRes.data.id);
        const restRes = await getVendorRestaurants(vendorRes.data.id);
        setRestaurants(restRes.data);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter restaurants based on the active search term
  const filteredRestaurants = activeSearch
    ? restaurants.filter((r) => {
        const q = activeSearch.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q) ||
          r.street?.toLowerCase().includes(q) ||
          r.cuisine?.toLowerCase().includes(q)
        );
      })
    : restaurants;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'zipcode' ? value.toUpperCase() : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!CANADA_POSTAL_REGEX.test(formData.zipcode.trim())) {
      newErrors.zipcode = 'Invalid postal code. Use Canadian format: A1A 1A1 (e.g., V6B 5K8)';
    }
    return newErrors;
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', street: '', city: '', zipcode: '', phone: '', email: '', cuisine: '', priceLevel: 2 });
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setErrors({});
  };

  const handleEdit = (restaurant) => {
    setSearchParams({}); // ✅ FIX: clear search filter so chip disappears while editing
    setFormData({
      name: restaurant.name || '',
      description: restaurant.description || '',
      street: restaurant.street || '',
      city: restaurant.city || '',
      zipcode: restaurant.zipcode || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      cuisine: restaurant.cuisine || '',
      priceLevel: restaurant.priceLevel || 2
    });
    setEditingId(restaurant.id);
    setIsEditing(true);
    setShowForm(true);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!vendorId && !isEditing) {
      alert("⚠️ Cannot save: Vendor ID is missing!");
      return;
    }

    try {
      const payload = {
        ...formData,
        priceLevel: parseInt(formData.priceLevel),
        zipcode: formatPostalCode(formData.zipcode),
      };

      let response;
      if (isEditing && editingId) {
        response = await updateRestaurantProfile(editingId, payload);
        setRestaurants(restaurants.map(r => r.id === editingId ? response.data : r));
        alert("✅ Restaurant updated successfully!");
      } else {
        payload.vendorId = vendorId;
        response = await createRestaurant(payload);
        setRestaurants([...restaurants, response.data]);
        alert("✅ Restaurant saved successfully!");
      }

      resetForm();
    } catch (error) {
      console.error("❌ Error saving:", error);
      if (error.response && error.response.status === 409) {
        alert("⚠️ Duplicate Restaurant: A restaurant with this name and address already exists!");
      } else if (error.response && error.response.status === 400) {
        alert(`⚠️ ${error.response.data?.error || 'Please check your input.'}`);
      } else {
        alert("❌ Error saving to database. Please check your connection.");
      }
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-400">Loading restaurants...</div>;

  const inputClass = "mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Restaurants</h2>
        <button
          type="button"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-yellow-400 transition"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Restaurant'}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="flex items-center gap-2 text-xl font-semibold mb-6 text-white">
            {isEditing ? <Pencil size={20} className="text-yellow-500" /> : <Plus size={20} className="text-yellow-500" />}
            {isEditing ? 'Edit Restaurant Details' : 'New Restaurant Details'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                name="description" value={formData.description} onChange={handleChange}
                placeholder="Tell customers about your restaurant..." rows="3" className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Restaurant Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., The Old Spaghetti Factory" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cuisine</label>
                <select name="cuisine" value={formData.cuisine} onChange={handleChange} className={inputClass}>
                  <option value="">Select a cuisine...</option>
                  {formData.cuisine && !CUISINE_TYPES.includes(formData.cuisine) && (
                    <option value={formData.cuisine}>{formData.cuisine}</option>
                  )}
                  {CUISINE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Street *</label>
                <input name="street" value={formData.street} onChange={handleChange} required placeholder="123 Robson St" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                <input name="city" value={formData.city} onChange={handleChange} required placeholder="Vancouver" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Zipcode *</label>
                <input
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleChange}
                  required
                  placeholder="V6B 5K8"
                  maxLength={7}
                  className={`mt-1 block w-full bg-gray-800 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition border ${
                    errors.zipcode
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:ring-yellow-500'
                  }`}
                />
                {errors.zipcode && <p className="text-red-400 text-xs mt-1">{errors.zipcode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="(604) 555-0123" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@restaurant.com" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price Level</label>
              <select name="priceLevel" value={formData.priceLevel} onChange={handleChange} className={inputClass}>
                <option value="1">$ (Budget)</option>
                <option value="2">$$ (Moderate)</option>
                <option value="3">$$$ (Expensive)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-emerald-500 text-gray-900 font-bold py-3 px-4 rounded-md hover:from-yellow-400 hover:to-emerald-400 transition"
            >
              {isEditing ? <Save size={18} /> : <Plus size={18} />}
              {isEditing ? 'Update Restaurant' : 'Save to Database'}
            </button>
          </form>
        </div>
      )}

      {/* ✅ FIX: Search filter chip — OUTSIDE the form, hidden while form is open */}
      {activeSearch && !showForm && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 px-4 py-2 rounded-lg text-sm">
          <Search size={14} />
          <span>
            Results for "<span className="font-semibold">{activeSearch}</span>" — {filteredRestaurants.length} found
          </span>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="ml-auto flex items-center gap-1 hover:text-white transition"
          >
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* Restaurant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <Store size={40} className="mx-auto text-gray-600" />
            <p className="text-gray-400 text-lg mt-4">No restaurants in the database yet.</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add Restaurant" to get started!</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <Search size={40} className="mx-auto text-gray-600" />
            <p className="text-gray-400 text-lg mt-4">No restaurants match "{activeSearch}".</p>
            <p className="text-gray-500 text-sm mt-2">Try a different name, city, or cuisine.</p>
          </div>
        ) : (
          filteredRestaurants.map((rest) => (
            <div key={rest.id} className="relative bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-yellow-500 transition shadow-lg">
              <button
                type="button"
                onClick={() => handleEdit(rest)}
                title="Edit restaurant"
                aria-label={`Edit ${rest.name}`}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-yellow-500 hover:text-gray-900 transition"
              >
                <Pencil size={16} />
              </button>

              <h3 className="text-xl font-bold text-white mb-2 pr-10">{rest.name}</h3>
              {rest.description && <p className="text-gray-300 text-sm mb-3 italic">{rest.description}</p>}

              <p className="flex items-center gap-1.5 text-gray-400 text-sm mb-4">
                <MapPin size={14} className="text-gray-500 shrink-0" />
                {rest.street}, {rest.city} {rest.zipcode}
              </p>

              <div className="flex justify-between items-center text-sm">
                <span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full">{rest.cuisine || 'General'}</span>
                <span className="text-yellow-500 font-bold text-lg">{'$'.repeat(rest.priceLevel)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}