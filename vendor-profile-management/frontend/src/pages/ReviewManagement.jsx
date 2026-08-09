import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  MessageSquare, CheckCircle, Pencil, Trash2, Flag, 
  ArrowUpDown, Search, UtensilsCrossed, ChevronLeft, ChevronRight 
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return 'C';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getSentiment = (rating) => {
  if (rating >= 4) return { border: 'border-l-emerald-500' };
  if (rating === 3) return { border: 'border-l-yellow-500' };
  return { border: 'border-l-red-500' };
};

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

const avatarGradients = [
  'from-yellow-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-pink-500',
  'from-red-400 to-rose-500',
];

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyTemplate, setReplyTemplate] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const REVIEWS_PER_PAGE = 5;

  useEffect(() => { 
    loadRestaurants();
    loadData(); 
  }, []);

  useEffect(() => {
    loadData();
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [restaurantFilter, sortBy, filterBy, searchQuery]);

  const loadRestaurants = async () => {
    try {
      const res = await api.get('/restaurants');
      setRestaurants(res.data);
    } catch (error) {
      console.error("Failed to load restaurants", error);
    }
  };

  const loadData = async () => {
    try {
      const params = {};
      if (restaurantFilter !== 'all') params.restaurantId = restaurantFilter;
      
      const [reviewsRes, statsRes] = await Promise.all([
        api.get('/reviews', { params }), 
        api.get('/reviews/statistics', { params })
      ]);
      
      setReviews(reviewsRes.data);
      setStats(statsRes.data);
    } catch (error) { 
      console.error("Failed to load data", error); 
      toast.error("Failed to load reviews");
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return toast.error("Reply cannot be empty");
    try {
      await api.post(`/reviews/${reviewId}/reply`, { responseText: replyText });
      setReplyingTo(null); setReplyText(''); setReplyTemplate(''); 
      loadData();
      toast.success('Reply submitted!');
    } catch (error) { toast.error("Failed to submit reply"); }
  };

  const handleEditReply = async (replyId) => {
    if (!editText.trim()) return toast.error("Reply cannot be empty");
    try {
      await api.put(`/reviews/replies/${replyId}`, { responseText: editText });
      setEditingReply(null); setEditText(''); 
      loadData();
      toast.success('Reply updated!');
    } catch (error) { toast.error("Failed to edit reply"); }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      await api.delete(`/reviews/replies/${replyId}`);
      loadData();
      toast.success('Reply deleted');
    } catch (error) { toast.error("Failed to delete reply"); }
  };

  const handleFlag = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/flag`, { reason: "Inappropriate content" });
      loadData();
      toast.success("Review flagged!");
    } catch (error) { toast.error("Failed to flag review"); }
  };

  // Filter & Sort Logic
  const getFilteredReviews = () => {
    let filtered = [...reviews];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.comment.toLowerCase().includes(query) || 
        r.user?.name?.toLowerCase().includes(query)
      );
    }
    if (filterBy === 'answered') filtered = filtered.filter(r => r.response);
    if (filterBy === 'unanswered') filtered = filtered.filter(r => !r.response);

    if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'highest') filtered.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'lowest') filtered.sort((a, b) => a.rating - b.rating);

    return filtered;
  };

  const filteredReviews = getFilteredReviews();
  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  const selectClass = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Review Management</h1>
      
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalReviews}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Responses</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalResponses}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Average</p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.averageRating} <span className="text-sm text-gray-500">/ 5</span></p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Response Rate</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.responseRate}%</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Unanswered</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.unansweredReviews}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <div className="flex items-center gap-2 flex-1">
          <Search size={16} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search customer or keyword..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className={selectClass}>
            <option value="all">All Reviews</option>
            <option value="answered">Answered</option>
            <option value="unanswered">Unanswered</option>
          </select>
          <select value={restaurantFilter} onChange={(e) => setRestaurantFilter(e.target.value)} className={selectClass}>
            <option value="all">All Restaurants</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Review Feed */}
      <div className="space-y-4">
        {paginatedReviews.length === 0 && (
          <div className="text-center py-12 text-gray-500">No reviews found matching your criteria.</div>
        )}
        
        {paginatedReviews.map((review, idx) => {
          const sentiment = getSentiment(review.rating);
          const avatarGradient = avatarGradients[idx % avatarGradients.length];
          const isFlagged = review.flags && review.flags.length > 0;
          const flagStatus = isFlagged ? review.flags[0].status : null;

          return (
            <div key={review.id} className={`bg-gray-800 rounded-xl border border-gray-700 border-l-4 ${sentiment.border} overflow-hidden transition-all hover:shadow-lg hover:shadow-black/20`}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-gray-900 font-bold text-base shrink-0`}>
                    {getInitials(review.user?.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header: Name, Restaurant, Time */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-semibold text-sm">{review.user?.name || 'Customer'}</h4>
                        {review.restaurant?.name && (
                          <span className="inline-flex items-center gap-1 bg-gray-700/50 text-gray-400 text-xs px-2 py-0.5 rounded border border-gray-600">
                            <UtensilsCrossed size={10} />
                            {review.restaurant.name}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs whitespace-nowrap">{timeAgo(review.createdAt)}</span>
                    </div>

                    {/* Stars */}
                    <div className="text-yellow-500 text-sm mb-3">
                      {'★'.repeat(review.rating)}
                      <span className="text-gray-600">{'★'.repeat(5 - review.rating)}</span>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {review.comment}
                    </p>

                    {/* Existing Reply Display / Edit Mode */}
                    {review.response && (
                      <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-700 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={14} className="text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Your Reply</span>
                        </div>
                        {editingReply === review.response.id ? (
                          <div className="mt-2">
                            <textarea className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" rows="2" value={editText} onChange={(e) => setEditText(e.target.value)} />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleEditReply(review.response.id)} className="px-3 py-1.5 bg-yellow-500 text-gray-900 rounded-md text-xs font-semibold hover:bg-yellow-400 transition">Save</button>
                              <button onClick={() => { setEditingReply(null); setEditText(''); }} className="px-3 py-1.5 bg-gray-700 text-white rounded-md text-xs font-semibold hover:bg-gray-600 transition">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-300 text-sm mt-1">{review.response.responseText}</p>
                        )}
                      </div>
                    )}

                    {/* Reply Composer */}
                    {!review.response && replyingTo === review.id && (
                      <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-700 mb-4">
                        <select 
                          value={replyTemplate} 
                          onChange={(e) => { setReplyText(e.target.value); setReplyTemplate(e.target.value); }}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-white mb-2 focus:outline-none focus:border-yellow-500"
                        >
                          <option value="">Select a quick reply template...</option>
                          <option value="Thank you so much for your kind words! We hope to see you again soon.">Thank you (Positive)</option>
                          <option value="We appreciate your feedback and will work on improving this aspect of our service.">We appreciate your feedback</option>
                          <option value="We are sorry to hear about your experience. Please contact us directly so we can make this right.">Apology (Negative)</option>
                        </select>
                        <textarea 
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" 
                          rows="3" 
                          placeholder="Write your reply..." 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)} 
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleReply(review.id)} className="px-3 py-1.5 bg-yellow-500 text-gray-900 rounded-md text-xs font-semibold hover:bg-yellow-400 transition flex items-center gap-1"><CheckCircle size={14} /> Submit</button>
                          <button onClick={() => { setReplyingTo(null); setReplyText(''); setReplyTemplate(''); }} className="px-3 py-1.5 bg-gray-700 text-white rounded-md text-xs font-semibold hover:bg-gray-600 transition">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Flags & Action Icons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    {isFlagged && (
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
                        flagStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        flagStatus === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      }`}>
                        <Flag size={12} />
                        Flagged {flagStatus !== 'PENDING' ? `· ${flagStatus}` : '· Pending'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!review.response && replyingTo !== review.id && (
                      <button onClick={() => setReplyingTo(review.id)} title="Reply" className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-gray-700 rounded-lg transition">
                        <MessageSquare size={16} />
                      </button>
                    )}
                    {review.response && editingReply !== review.response.id && (
                      <button onClick={() => { setEditingReply(review.response.id); setEditText(review.response.responseText); }} title="Edit Reply" className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition">
                        <Pencil size={16} />
                      </button>
                    )}
                    {review.response && editingReply !== review.response.id && (
                      <button onClick={() => handleDeleteReply(review.response.id)} title="Delete Reply" className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleFlag(review.id)} 
                      disabled={isFlagged}
                      title={isFlagged ? 'Already flagged' : 'Flag as inappropriate'}
                      className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      <Flag size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">
            Showing <span className="text-white font-medium">{((currentPage - 1) * REVIEWS_PER_PAGE) + 1}</span>–
            <span className="text-white font-medium">{Math.min(currentPage * REVIEWS_PER_PAGE, filteredReviews.length)}</span> of <span className="text-white font-medium">{filteredReviews.length}</span> reviews
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm"
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Page numbers (show max 5) */}
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
              }
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg border transition text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}