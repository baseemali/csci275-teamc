import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Save } from 'lucide-react';
import { getTestVendor, getVendorSettings, updateVendorSettings } from '../services/api';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  emailAlerts: true,
  reviewAlerts: true,
};

function ToggleRow({ icon: Icon, title, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-gray-700 text-yellow-500">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-white font-medium">{title}</p>
          <p className="text-gray-400 text-sm mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          enabled ? 'bg-yellow-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const [vendorId, setVendorId] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const vendorRes = await getTestVendor();
        setVendorId(vendorRes.data.id);

        const settingsRes = await getVendorSettings(vendorRes.data.id);
        // Merge with defaults so missing fields don't break the toggles
        setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data });
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fall back to defaults silently — toggles still work
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = (name) => {
    setSettings({ ...settings, [name]: !settings[name] });
  };

  const handleSave = async () => {
    if (!vendorId) {
      toast.error('Vendor not loaded yet. Please try again.');
      return;
    }
    try {
      setSaving(true);
      await updateVendorSettings(vendorId, settings);
      toast.success('Notification settings updated!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Manage how you receive alerts and updates</p>
      </div>

      {/* Notifications card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Bell size={20} className="text-yellow-500" />
            Notifications
          </h3>
        </div>

        <div className="divide-y divide-gray-700">
          <ToggleRow
            icon={Mail}
            title="Email Alerts"
            description="Receive important updates about your account and restaurants"
            enabled={settings.emailAlerts}
            onToggle={() => handleToggle('emailAlerts')}
          />
          <ToggleRow
            icon={MessageSquare}
            title="New Review Alerts"
            description="Get notified when a customer leaves a new review"
            enabled={settings.reviewAlerts}
            onToggle={() => handleToggle('reviewAlerts')}
          />
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-6 py-2.5 rounded-md hover:bg-yellow-400 transition disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}