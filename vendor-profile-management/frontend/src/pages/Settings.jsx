import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, Mail, MessageSquare, Save, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { getTestVendor, getVendorSettings, updateVendorSettings } from '../services/api';

const DEFAULT_SETTINGS = { emailAlerts: true, reviewAlerts: true };

// Reusable toggle switch
function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        enabled ? 'bg-yellow-500' : 'bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

function SettingRow({ icon: Icon, title, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-gray-700 text-yellow-500">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-white font-medium text-sm">{title}</p>
          <p className="text-gray-400 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

export default function Settings() {
  const [vendor, setVendor] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const vendorRes = await getTestVendor();
        setVendor(vendorRes.data);
        setVendorId(vendorRes.data.id);

        const settingsRes = await getVendorSettings(vendorRes.data.id);
        setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data });
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = (name) => setSettings({ ...settings, [name]: !settings[name] });

  const handleSave = async () => {
    if (!vendorId) return toast.error('Vendor not loaded yet.');
    try {
      setSaving(true);
      await updateVendorSettings(vendorId, settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-8 w-40 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-48 bg-gray-800 rounded-xl animate-pulse"></div>
        <div className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your notifications and account preferences</p>
      </div>

      {/* Notifications Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-700 flex items-center gap-2">
          <Bell size={18} className="text-yellow-500" />
          <h2 className="text-base font-semibold text-white">Notifications</h2>
        </div>
        <div className="divide-y divide-gray-700">
          <SettingRow
            icon={Mail}
            title="Email Alerts"
            description="Receive important updates about your account and restaurants"
            enabled={settings.emailAlerts}
            onToggle={() => handleToggle('emailAlerts')}
          />
          <SettingRow
            icon={MessageSquare}
            title="New Review Alerts"
            description="Get notified when a customer leaves a new review"
            enabled={settings.reviewAlerts}
            onToggle={() => handleToggle('reviewAlerts')}
          />
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-700 flex items-center gap-2">
          <Building2 size={18} className="text-yellow-500" />
          <h2 className="text-base font-semibold text-white">Business Account</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-gray-900 font-bold text-lg">
                {(vendor?.businessName || 'V').charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{vendor?.businessName || 'Your Business'}</p>
                <p className="text-gray-400 text-xs mt-0.5">{vendor?.businessEmail || 'No email set'}</p>
              </div>
            </div>
            <Link
              to="/vendor-profile"
              className="flex items-center gap-1 text-yellow-500 hover:text-yellow-400 text-sm font-medium transition"
            >
              Manage Profile <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-6 py-2.5 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}