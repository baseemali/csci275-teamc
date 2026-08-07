import { useState, useEffect } from 'react';
import { getTestVendor, getVendorRestaurants, createRestaurant } from '../services/api';

export default function RestaurantProfile() {
  const [vendorId, setVendorId] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', description: '', street: '', city: '', zipcode: '', phone: '', email: '', cuisine: '', priceLevel: 2
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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

      const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log("🖱️ Save button clicked!");
        console.log("Current vendorId:", vendorId);

        if (!vendorId) {
          alert("⚠️ Cannot save: Vendor ID is missing! Check your backend terminal for errors.");
          return; 
        }

        try {
          const payload = { ...formData, vendorId, priceLevel: parseInt(formData.priceLevel) };
          const response = await createRestaurant(payload);
          
          setRestaurants([...restaurants, response.data]);
          setFormData({ name: '', description: '', street: '', city: '', zipcode: '', phone: '', email: '', cuisine: '', priceLevel: 2 });
          setShowForm(false);
          alert("✅ Restaurant saved successfully!");
        } catch (error) {
          console.error("❌ Error saving:", error);
          
          // --- NEW: Handle Duplicate Error Gracefully ---
          if (error.response && error.response.status === 409) {
            alert("⚠️ Duplicate Restaurant: A restaurant with this name and address already exists in the database!");
          } else if (error.response && error.response.status === 400) {
            alert("⚠️ Missing Information: Please fill out all required fields.");
          } else {
            alert("❌ Error saving to database. Please check your connection.");
          }
        }
      };

  if (loading) return <div className="text-center p-8 text-gray-400">Loading restaurants...</div>;

  // Reusable input class for dark mode visibility
  const inputClass = "mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Restaurants</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-yellow-400 transition"
        >
          {showForm ? "Cancel" : "+ Add New Restaurant"}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-white">New Restaurant Details</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Restaurant Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., Joe's Diner" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cuisine</label>
                <input name="cuisine" value={formData.cuisine} onChange={handleChange} placeholder="e.g., Italian, Burgers" className={inputClass} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Street *</label>
                <input name="street" value={formData.street} onChange={handleChange} required placeholder="123 Main St" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                <input name="city" value={formData.city} onChange={handleChange} required placeholder="New York" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Zipcode *</label>
                <input name="zipcode" value={formData.zipcode} onChange={handleChange} required placeholder="10001" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" className={inputClass} />
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

            <button type="submit" className="w-full bg-gradient-to-r from-yellow-500 to-emerald-500 text-gray-900 font-bold py-3 px-4 rounded-md hover:from-yellow-400 hover:to-emerald-400 transition">
              Save to Database
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-lg">No restaurants in the database yet.</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add New Restaurant" to get started!</p>
          </div>
        ) : (
          restaurants.map((rest) => (
            <div key={rest.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-yellow-500 transition shadow-lg">
              <h3 className="text-xl font-bold text-white mb-2">{rest.name}</h3>
              <p className="text-gray-400 text-sm mb-4">📍 {rest.street}, {rest.city} {rest.zipcode}</p>
              <div className="flex justify-between items-center text-sm mb-4">
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