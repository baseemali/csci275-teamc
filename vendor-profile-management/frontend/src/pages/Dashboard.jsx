import { useState, useEffect } from 'react';
import Skeleton from '../components/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  getTestVendor,
  getVendorRestaurants,
  getVendorReviews,
  getVendorReviewStats,
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Store, Star, MessageSquare, TrendingUp,
  ShieldCheck, ShieldAlert, AlertCircle, UtensilsCrossed,
  CheckCircle, ArrowRight  
} from 'lucide-react';

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

const StatCard = ({ icon: Icon, label, value, sub, accent, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg text-left w-full transition-all hover:border-yellow-500 hover:shadow-yellow-500/10 hover:-translate-y-0.5 cursor-pointer group"
  >
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-sm font-medium group-hover:text-gray-300 transition-colors">{label}</p>
      <div className={`p-2 rounded-lg ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-1 group-hover:text-gray-400 transition-colors">{sub}</p>}
  </button>
);

// Get initials from a name for the avatar
const getInitials = (name) => {
  if (!name) return 'C';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

// Sentiment color based on rating
const getSentiment = (rating) => {
  if (rating >= 4) return { border: 'border-l-emerald-500' };
  if (rating === 3) return { border: 'border-l-yellow-500' };
  return { border: 'border-l-red-500' };
};

// Relative time ("2 days ago")
const timeAgo = (dateString) => {
  if (!dateString) return '';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

// Gradient palette for avatars
const avatarGradients = [
  'from-yellow-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-pink-500',
  'from-red-400 to-rose-500',
];

export default function Dashboard() {
  const navigate = useNavigate();
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

  if (loading) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart + Recent reviews skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Restaurants strip skeleton */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-40 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

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
          onClick={() => navigate('/restaurant')}
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value={stats ? Number(stats.averageRating).toFixed(1) : '—'}
          sub={stats ? 'out of 5.0' : 'No review data yet'}
          accent="bg-emerald-500/20 text-emerald-500"
          onClick={() => navigate('/reviews')}
        />
        <StatCard
          icon={MessageSquare}
          label="Total Reviews"
          value={stats ? stats.totalReviews : '—'}
          sub={stats ? `${stats.responseRate ?? 0}% response rate` : 'No review data yet'}
          accent="bg-blue-500/20 text-blue-500"
          onClick={() => navigate('/reviews')}
        />
        <StatCard
          icon={TrendingUp}
          label="Profile Completion"
          value={`${profileCompletion}%`}
          sub={profileCompletion >= 100 ? 'Fully complete! 🎉' : 'Keep building your profile'}
          accent="bg-purple-500/20 text-purple-500"
          onClick={() => navigate('/vendor-profile')}
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

        {/* Recent Reviews — premium feed design */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          {/* Header with View All link */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Reviews</h3>
            <button
              onClick={() => navigate('/reviews')}
              className="text-yellow-500 hover:text-yellow-400 text-sm font-medium flex items-center gap-1 transition"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
              {reviews.slice(0, 5).map((review, idx) => {
                const sentiment = getSentiment(review.rating);
                const avatarGradient = avatarGradients[idx % avatarGradients.length];
                return (
                  <div
                    key={review.id}
                    className={`bg-gray-900/60 rounded-lg border border-gray-700 border-l-4 ${sentiment.border} p-4 hover:bg-gray-900 transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-gray-900 font-bold text-sm shrink-0`}>
                        {getInitials(review.user?.name)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Name + time */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-white text-sm font-semibold truncate">
                            {review.user?.name || 'Customer'}
                          </p>
                          <span className="text-gray-500 text-xs whitespace-nowrap">
                            {timeAgo(review.createdAt)}
                          </span>
                        </div>

                        {/* Stars + restaurant badge */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-yellow-500 text-xs">
                            {'★'.repeat(review.rating)}
                            <span className="text-gray-600">{'★'.repeat(5 - review.rating)}</span>
                          </span>
                          {review.restaurant?.name && (
                            <span className="inline-flex items-center gap-1 bg-gray-800 text-gray-400 text-[10px] px-1.5 py-0.5 rounded">
                              <UtensilsCrossed size={9} />
                              {review.restaurant.name}
                            </span>
                          )}
                        </div>

                        {/* Comment */}
                        <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                          {review.comment || review.text || review.content || 'No comment provided.'}
                        </p>

                        {/* Replied indicator */}
                        {review.response && (
                          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-medium">
                            <CheckCircle size={12} />
                            <span>You replied</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <button
                key={rest.id}
                onClick={() => navigate('/restaurant')}
                className="flex items-center gap-2 bg-gray-900/60 border border-gray-700 px-4 py-2 rounded-lg hover:border-yellow-500 hover:bg-gray-800 transition-all"
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
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No restaurants yet — add one from "My Restaurants".</p>
        )}
      </div>
    </div>
  );
}