import { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Upload, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  getTestVendor,
  getVendorRestaurants,
  getRestaurantVerifications,
  submitVerification,
} from '../services/api';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    classes: 'bg-red-500/10 text-red-400 border-red-500/40',
  },
};

export default function Verification() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [verifications, setVerifications] = useState([]);
  const [docUrl, setDocUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load vendor's claimed restaurants on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const vendorRes = await getTestVendor();
        const restRes = await getVendorRestaurants(vendorRes.data.id);
        // Only verified businesses can verify restaurants — show all claimed ones
        const claimed = (restRes.data || []).filter((r) => r.isClaimed);
        setRestaurants(claimed);
        if (claimed.length > 0) {
          setSelectedRestaurantId(claimed[0].id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load verification history whenever the selected restaurant changes
  useEffect(() => {
    if (!selectedRestaurantId) return;

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await getRestaurantVerifications(selectedRestaurantId);
        setVerifications(res.data || []);
      } catch (error) {
        console.error('Error loading verifications:', error);
        setVerifications([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [selectedRestaurantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestaurantId) {
      alert('⚠️ Please select a restaurant first.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitVerification(selectedRestaurantId, { documentUrl: docUrl });
      // Prepend the new submission to the history
      setVerifications([res.data, ...verifications]);
      setDocUrl('');
      alert('✅ Verification submitted for review!');
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('❌ Failed to submit verification. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition';

  if (loading) return <div className="text-center p-8 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Business Verification</h2>
        <p className="text-gray-400 text-sm mt-1">
          Upload or link your business license to verify your restaurant
        </p>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <FileText size={40} className="mx-auto text-gray-600" />
          <p className="text-gray-400 text-lg mt-4">No restaurants available.</p>
          <p className="text-gray-500 text-sm mt-2">Claim a restaurant first to submit verification documents.</p>
        </div>
      ) : (
        <>
          {/* Restaurant selector + submission form */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
            <div className="p-6 border-b border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <ShieldCheck size={20} className="text-yellow-500" />
                Submit Verification Document
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Select Restaurant
                </label>
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  className={inputClass}
                >
                  {restaurants.map((rest) => (
                    <option key={rest.id} value={rest.id}>
                      {rest.name} — {rest.street}, {rest.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Document URL
                </label>
                <input
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                  className={inputClass}
                />
                <p className="text-gray-500 text-xs mt-1">
                  Link to your business license, permit, or other documentation (Google Drive, Dropbox, etc.)
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-6 py-2.5 rounded-md hover:bg-yellow-400 transition disabled:opacity-50"
                >
                  <Upload size={18} />
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>

          {/* Verification history */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
            <div className="p-6 border-b border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <FileText size={20} className="text-yellow-500" />
                Verification History
              </h3>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-gray-400">Loading history...</div>
            ) : verifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No verification documents submitted yet for this restaurant.
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {verifications.map((v) => {
                  const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = config.icon;
                  return (
                    <li key={v.id} className="p-6 flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg border ${config.classes} shrink-0`}>
                        <StatusIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${config.classes}`}
                          >
                            {config.label}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {v.submittedAt
                              ? new Date(v.submittedAt).toLocaleString()
                              : 'Date unknown'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mt-1.5 truncate">
                          <span className="text-gray-500">Document: </span>
                          <a
                            href={v.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-yellow-500 underline transition"
                          >
                            {v.documentUrl}
                          </a>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}