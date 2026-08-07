import { useState, useEffect } from 'react';
import { getTestVendor } from '../services/api';
import { Save, Building2, Phone, Mail, Globe, FileText, MapPin, Hash } from 'lucide-react';

export default function VendorProfile() {
  const [vendorId, setVendorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    registrationNumber: '',
    registeredAddress: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getTestVendor();
        setVendorId(response.data.id);
        setFormData({
          businessName: response.data.businessName || '',
          description: response.data.description || '',
          businessPhone: response.data.businessPhone || '',
          businessEmail: response.data.businessEmail || '',
          website: response.data.website || '',
          registrationNumber: response.data.registrationNumber || '',
          registeredAddress: response.data.registeredAddress || ''
        });
        setProfileCompletion(response.data.profileCompletion || 0);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    
    // Recalculate completion
    const fields = Object.values(newData);
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    setProfileCompletion(Math.round((filledFields / fields.length) * 100));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorId) return;
    
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:5000/api/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const updated = await response.json();
        setProfileCompletion(updated.profileCompletion);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-400">Loading profile...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header with Completion Meter */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Vendor Profile</h2>
          <div className="text-right">
            <p className="text-sm text-gray-400">Profile Completion</p>
            <p className="text-2xl font-bold text-yellow-500">{profileCompletion}%</p>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">
        
        {/* Business Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-yellow-500" />
            Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition"
                placeholder="e.g., ABC Restaurant Group"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Registration Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition"
                  placeholder="Business license or Tax ID"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone size={20} className="text-blue-500" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Business Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="tel"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Business Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition"
                  placeholder="contact@business.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Online Presence Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe size={20} className="text-emerald-500" />
            Online Presence
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition"
                  placeholder="https://www.yourbusiness.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description & Address Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-purple-500" />
            Additional Details
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Business Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition resize-none"
                placeholder="Tell us about your business..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Registered Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-500" size={18} />
                <textarea
                  name="registeredAddress"
                  value={formData.registeredAddress}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition resize-none"
                  placeholder="Legal headquarters address..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-yellow-500 to-emerald-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:from-yellow-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}