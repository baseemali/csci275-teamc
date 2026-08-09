import { useState, useEffect } from 'react';
import { getTestVendor, updateVendorProfile } from '../services/api';
import { Save, Building2, Phone, Mail, Globe, FileText, MapPin, Hash, ShieldCheck, ShieldAlert, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const DRAFT_KEY = 'vendor_profile_draft';

export default function VendorProfile() {
  const [vendorId, setVendorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('UNVERIFIED');
  const [hasDraft, setHasDraft] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    registrationNumber: '',
    registeredAddress: ''
  });

  // Weighted completion calculation
  const calculateCompletion = (data) => {
    const weights = {
      businessName: 25,        // Required, high priority
      description: 15,         // Important for profile
      businessPhone: 15,       // Contact info
      businessEmail: 15,       // Contact info
      website: 10,             // Nice to have
      registrationNumber: 10,  // Verification related
      registeredAddress: 10    // Legal requirement
    };

    let score = 0;
    Object.entries(data).forEach(([key, value]) => {
      if (value && value.trim() !== '' && weights[key]) {
        score += weights[key];
      }
    });

    return Math.min(100, Math.round(score));
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getTestVendor();
        setVendorId(response.data.id);
        setVerificationStatus(response.data.verificationStatus || 'UNVERIFIED');
        
        const dbData = {
          businessName: response.data.businessName || '',
          description: response.data.description || '',
          businessPhone: response.data.businessPhone || '',
          businessEmail: response.data.businessEmail || '',
          website: response.data.website || '',
          registrationNumber: response.data.registrationNumber || '',
          registeredAddress: response.data.registeredAddress || ''
        };

        // Check for draft in localStorage
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const draftData = JSON.parse(draft);
          setFormData(draftData);
          setProfileCompletion(calculateCompletion(draftData));
          setHasDraft(true);
        } else {
          setFormData(dbData);
          setProfileCompletion(calculateCompletion(dbData));
          setHasDraft(false);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    setProfileCompletion(calculateCompletion(newData));
    setError(null);
    
    // Save draft to localStorage
    localStorage.setItem(DRAFT_KEY, JSON.stringify(newData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorId) {
      setError("Vendor ID not found. Please refresh the page.");
      return;
    }
    
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const response = await updateVendorProfile(vendorId, formData);
      const updatedProfile = response.data;
      
      setProfileCompletion(updatedProfile.profileCompletion || calculateCompletion(formData));
      setSaveSuccess(true);
      setHasDraft(false);
      
      localStorage.removeItem(DRAFT_KEY);
      
      toast.success('Profile saved successfully!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMsg = error.response?.data?.error || "Failed to save profile. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDiscardDraft = () => {
    if (confirm("Discard unsaved changes and reload from database?")) {
      localStorage.removeItem(DRAFT_KEY);
      window.location.reload();
    }
  };

  if (loading) {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header with completion bar */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-12 w-16" />
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Form sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

  if (error && !vendorId) {
    return (
      <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 text-red-300 p-6 rounded-xl max-w-4xl">
        <ShieldAlert size={24} />
        <p>{error}</p>
      </div>
    );
  }

  const isVerified = verificationStatus === 'APPROVED';

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header with Completion Meter */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Vendor Profile</h2>
            {hasDraft && (
              <p className="text-sm text-yellow-400 mt-1 flex items-center gap-1">
                <CheckCircle size={14} />
                Unsaved changes detected
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
              isVerified
                ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700'
                : 'bg-yellow-900/40 text-yellow-400 border-yellow-700'
            }`}>
              {isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              {isVerified ? 'Verified' : verificationStatus}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Completion</p>
              <p className="text-2xl font-bold text-yellow-500">{profileCompletion}%</p>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">
          <ShieldAlert size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 text-emerald-300 p-4 rounded-lg">
          <CheckCircle size={20} />
          <p className="text-sm">Profile saved successfully!</p>
        </div>
      )}

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

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-700 flex gap-3">
          {hasDraft && (
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
            >
              Discard Draft
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-emerald-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:from-yellow-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}