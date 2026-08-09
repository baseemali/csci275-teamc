import { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldAlert, FileText, Upload, Clock,
  CheckCircle, XCircle, Link2, Loader2, AlertCircle
} from 'lucide-react';
import {
  getTestVendor,
  getVendorRestaurants,
  getRestaurantVerifications,
  submitVerification,
} from '../services/api';

const STATUS_CONFIG = {
  PENDING: { label: 'Under Review', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  APPROVED: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

// Visual 3-step progress indicator
function VerificationStepper({ status }) {
  const steps = [
    { label: 'Submitted', icon: FileText },
    { label: 'In Review', icon: Clock },
    { label: 'Verified', icon: ShieldCheck },
  ];

  let activeStep = 0;
  if (status === 'PENDING' || status === 'REJECTED') activeStep = 1;
  if (status === 'APPROVED') activeStep = 3;

  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isComplete = i < activeStep;
        const isCurrent = i === activeStep && status !== 'APPROVED';
        const isRejected = status === 'REJECTED' && i === 1;

        return (
          <Fragment key={i}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                isComplete ? 'bg-emerald-500 border-emerald-500 text-gray-900'
                : isRejected ? 'bg-red-500 border-red-500 text-white'
                : isCurrent ? 'bg-yellow-500 border-yellow-500 text-gray-900'
                : 'bg-gray-800 border-gray-600 text-gray-500'
              }`}>
                {isComplete ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className={`text-xs mt-2 font-medium ${
                isComplete ? 'text-emerald-400' : isRejected ? 'text-red-400' : isCurrent ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-6 ${i < activeStep - 1 || status === 'APPROVED' ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export default function Verification() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [verifications, setVerifications] = useState([]);
  const [docUrl, setDocUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const vendorRes = await getTestVendor();
        const restRes = await getVendorRestaurants(vendorRes.data.id);
        const claimed = (restRes.data || []).filter((r) => r.isClaimed);
        setRestaurants(claimed);
        if (claimed.length > 0) setSelectedRestaurantId(claimed[0].id);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await getRestaurantVerifications(selectedRestaurantId);
        const sorted = (res.data || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        setVerifications(sorted);
      } catch (error) {
        console.error('Error loading verifications:', error);
        setVerifications([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [selectedRestaurantId]);

  const latestStatus = verifications.length > 0 ? verifications[0].status : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestaurantId) return toast.error('Please select a restaurant first.');
    if (!docUrl.trim()) return toast.error('Please enter a document URL.');

    try {
      setSubmitting(true);
      const res = await submitVerification(selectedRestaurantId, { documentUrl: docUrl });
      setVerifications([res.data, ...verifications]);
      setDocUrl('');
      toast.success('Verification submitted for review!');
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Failed to submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-56 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
        <div className="h-64 bg-gray-800 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Hero card styling based on status
  const heroConfig = {
    null: { icon: FileText, title: 'Start Your Verification', desc: 'Submit your business license to get verified and build trust with customers.', color: 'text-gray-400' },
    PENDING: { icon: Clock, title: 'Verification In Progress', desc: 'Your documents are being reviewed. This usually takes 1-2 business days.', color: 'text-yellow-400' },
    APPROVED: { icon: ShieldCheck, title: 'You\'re Verified!', desc: 'Your business has been successfully verified. Customers can trust your listings.', color: 'text-emerald-400' },
    REJECTED: { icon: AlertCircle, title: 'Verification Rejected', desc: 'Your submission was rejected. Please review the requirements and resubmit.', color: 'text-red-400' },
  }[latestStatus];
  const HeroIcon = heroConfig.icon;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Business Verification</h1>
        <p className="text-gray-400 text-sm mt-1">Verify your restaurant to build trust and unlock premium features</p>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
          <FileText size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No restaurants available</p>
          <p className="text-gray-500 text-sm mt-2">Claim a restaurant first to submit verification documents.</p>
        </div>
      ) : (
        <>
          {/* Status Hero Card */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-xl bg-gray-700 ${heroConfig.color}`}>
                <HeroIcon size={24} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${heroConfig.color}`}>{heroConfig.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{heroConfig.desc}</p>
              </div>
            </div>
            <VerificationStepper status={latestStatus} />
          </div>

          {/* Submission Form */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Upload size={20} className="text-yellow-500" />
              Submit Verification Document
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Select Restaurant</label>
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                >
                  {restaurants.map((rest) => (
                    <option key={rest.id} value={rest.id}>{rest.name} — {rest.city}</option>
                  ))}
                </select>
              </div>

              {/* Upload-zone style input */}
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-colors">
                <Link2 size={32} className="mx-auto text-gray-500 mb-3" />
                <p className="text-gray-300 text-sm font-medium mb-1">Paste a link to your document</p>
                <p className="text-gray-500 text-xs mb-4">Google Drive, Dropbox, or any public URL</p>
                <input
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </div>

          {/* Verification History Timeline */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-yellow-500" />
              Verification History
            </h3>

            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-700 rounded-lg animate-pulse"></div>)}
              </div>
            ) : verifications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No verification documents submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => {
                  const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = config.icon;
                  return (
                    <div key={v.id} className={`flex items-center gap-4 p-4 rounded-lg border ${config.bg} ${config.border}`}>
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <StatusIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(v.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <a
                          href={v.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 text-xs hover:text-yellow-500 transition truncate block mt-0.5"
                        >
                          {v.documentUrl}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}