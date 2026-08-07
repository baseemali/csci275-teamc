import { useState } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    reviewAlerts: true
  });

  const handleToggle = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.checked });
  };

  const handleSave = () => {
    console.log("Saving Settings:", settings);
    alert("Notification settings updated!");
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Email Alerts</span>
          <input 
            type="checkbox" 
            name="emailAlerts" 
            checked={settings.emailAlerts} 
            onChange={handleToggle} 
            className="h-5 w-5 text-blue-600" 
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">New Review Alerts</span>
          <input 
            type="checkbox" 
            name="reviewAlerts" 
            checked={settings.reviewAlerts} 
            onChange={handleToggle} 
            className="h-5 w-5 text-blue-600" 
          />
        </div>
      </div>

      <button onClick={handleSave} className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
        Save Preferences
      </button>
    </div>
  );
}