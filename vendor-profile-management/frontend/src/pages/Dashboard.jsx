import { useState, useEffect } from 'react';
import {
  Store, Star, MessageSquare, TrendingUp,
  ShieldCheck, ShieldAlert, AlertCircle, UtensilsCrossed
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  getTestVendor,
  getVendorRestaurants,
  getVendorReviews,
  getVendorReviewStats,
} from '../services/api';

// Fallback: compute stats from raw reviews if the stats endpoint is unavailable
const computeStatsFromReviews = (reviewList) => {
  if (!reviewList || reviewList.length === 0) {
    return { averageRating: 0, totalReviews: 0, responseRate: 0 };
  }
  const total = reviewList.length;
  const avg = reviewList.reduce((sum, r) => sum + (r.rating || 0), 0) / total;
  const responded = reviewList.filter(
    (r) => r.response || r.reviewResponse || (r.responses && r.responses.length > 0)
  ).length;
  return {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: total,
    responseRate: Math.round((responded / total) * 100),
  };
};

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <div className={`p-2 rounded-lg ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [vendor, setVendor] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Vendor profile (real data)
        const vendorRes = await getTestVendor();
        setVendor(vendorRes.data);

        // 2. Vendor's restaurants (real data)
        const restRes = await getVendorRestaurants(vendorRes.data.id);
        setRestaurants(restRes.data || []);

        // 3. Review data — fetch statistics AND raw list in parallel
        const [statsRes, revRes] = await Promise.allSettled([
          getVendorReviewStats(),
          getVendorReviews(),
        ]);

        // Raw list → powers the rating chart + recent reviews
        if (revRes.status === 'fulfilled') {
          setReviews(revRes.value.data || []);
        }

        // Stats → powers the stat cards
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        } else if (revRes.status === 'fulfilled') {
          // Stats endpoint failed — compute from raw reviews instead
          setStats(computeStatsFromReviews(revRes.value.data || []));
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="text-center p-8 text-gray-400">Loading dashboard...</div>;

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 text-red-300 p-6 rounded-xl">
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }

  // ── Real derived metrics ──────────────────────────────
  const claimedCount = restaurants.filter((r) => r.isClaimed).length;
  const profileCompletion = vendor?.profileCompletion ?? 0;
  const isVerified = vendor?.isVerified || vendor?.verificationStatus === 'APPROVED';

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: `${star}★`,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, {vendor?.businessName || vendor?.name || 'Vendor'}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
          isVerified
            ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700'
            : 'bg-yellow-900/40 text-yellow-400 border-yellow-700'
        }`}>
          {isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
          {isVerified ? 'Verified Business' : 'Verification Pending'}
        </div>
      </div>

      {/* Stat Cards — all real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Store}
          label="Total Restaurants"
          value={restaurants.length}
          sub={`${claimedCount} claimed`}
          accent="bg-yellow-500/20 text-yellow-500"
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value={stats ? Number(stats.averageRating).toFixed(1) : '—'}
          sub={stats ? 'out of 5.0' : 'No review data yet'}
          accent="bg-emerald-500/20 text-emerald-500"
        />
        <StatCard
          icon={MessageSquare}
          label="Total Reviews"
          value={stats ? stats.totalReviews : '—'}
          sub={stats ? `${stats.responseRate ?? 0}% response rate` : 'No review data yet'}
          accent="bg-blue-500/20 text-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Profile Completion"
          value={`${profileCompletion}%`}
          sub={profileCompletion >= 100 ? 'Fully complete! 🎉' : 'Keep building your profile'}
          accent="bg-purple-500/20 text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution — computed from real reviews */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
          {reviews.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="stars" stroke="#9CA3AF" />
                <YAxis allowDecimals={false} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Bar dataKey="count" fill="#EAB308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm text-center">
              No reviews yet — the chart will appear once customers leave feedback.
            </div>
          )}
        </div>

        {/* Recent Reviews — real data */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Reviews</h3>
          {reviews.length > 0 ? (
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-yellow-500 font-semibold">
                      {'★'.repeat(review.rating)}
                      <span className="text-gray-600">{'★'.repeat(5 - review.rating)}</span>
                    </span>
                    <span className="text-gray-500 text-xs">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {review.comment || review.text || review.content || 'No comment provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
              No reviews to display yet.
            </div>
          )}
        </div>
      </div>

      {/* Your Restaurants strip — real data */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Your Restaurants</h3>
        {restaurants.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {restaurants.map((rest) => (
              <div
                key={rest.id}
                className="flex items-center gap-2 bg-gray-900/60 border border-gray-700 px-4 py-2 rounded-lg"
              >
                <UtensilsCrossed size={16} className="text-yellow-500" />
                <span className="text-gray-200 text-sm font-medium">{rest.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  rest.isClaimed
                    ? 'bg-emerald-900/50 text-emerald-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {rest.isClaimed ? 'Claimed' : 'Unclaimed'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No restaurants yet — add one from "My Restaurants".</p>
        )}
      </div>
    </div>
  );
}