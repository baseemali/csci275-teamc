import { useState } from 'react';

export default function Verification() {
  const [docUrl, setDocUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Verification:", docUrl);
    alert("Verification submitted for review!");
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Business Verification</h2>
      <p className="text-gray-600 mb-6">Upload or link your business license to verify your restaurant.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Document URL (e.g., Google Drive Link)</label>
          <input 
            type="url" 
            value={docUrl} 
            onChange={(e) => setDocUrl(e.target.value)} 
            placeholder="https://..." 
            required 
            className="mt-1 block w-full p-2 border rounded-md" 
          />
        </div>
        <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition">
          Submit for Verification
        </button>
      </form>
    </div>
  );
}