import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, AlertTriangle, CheckCircle, Edit2, Trash2, ArrowUpDown, Search } from 'lucide-react';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyTemplate, setReplyTemplate] = useState(''); // NEW: For quick replies
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(''); // NEW: For search

  // Initial load
  useEffect(() => { 
    loadRestaurants();
    loadData(); 
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadData();
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
      if (restaurantFilter !== 'all') {
        params.restaurantId = restaurantFilter;
      }
      
      const [reviewsRes, statsRes] = await Promise.all([
        api.get('/reviews', { params }), 
        api.get('/reviews/statistics', { params })
      ]);
      
      setReviews(reviewsRes.data);
      setStats(statsRes.data);
    } catch (error) { console.error("Failed to load data", error); }
  };

  const handleReply = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/reply`, { responseText: replyText });
      setReplyingTo(null); setReplyText(''); setReplyTemplate(''); loadData();
    } catch (error) { toast.error("Failed to submit reply"); }
  };

  const handleEditReply = async (replyId) => {
    try {
      await api.put(`/reviews/replies/${replyId}`, { responseText: editText });
      setEditingReply(null); setEditText(''); loadData();
    } catch (error) { toast.error("Failed to edit reply"); }
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      await api.delete(`/reviews/replies/${replyId}`);
      loadData();
    } catch (error) { toast.error("Failed to delete reply"); }
  };

  const handleFlag = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/flag`, { reason: "Inappropriate content" });
      toast.success("Review flagged successfully!"); loadData();
    } catch (error) { toast.error("Failed to flag review"); }
  };

  // Helper function for sentiment badges
  const getSentimentBadge = (rating) => {
    if (rating >= 4) return <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-semibold ml-2">Positive</span>;
    if (rating === 3) return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-semibold ml-2">Neutral</span>;
    return <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-semibold ml-2">Negative</span>;
  };

  // Sort and filter reviews
  const getFilteredReviews = () => {
    let filtered = [...reviews];

    // 1. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.comment.toLowerCase().includes(query) || 
        r.user?.name?.toLowerCase().includes(query)
      );
    }

    // 2. Status Filter
    if (filterBy === 'answered') filtered = filtered.filter(r => r.response);
    if (filterBy === 'unanswered') filtered = filtered.filter(r => !r.response);

    // 3. Sort
    if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'highest') filtered.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'lowest') filtered.sort((a, b) => a.rating - b.rating);

    return filtered;
  };

  const filteredReviews = getFilteredReviews();

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Review Management</h1>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Total Reviews</p>
            <p className="text-3xl font-bold">{stats.totalReviews}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Total Responses</p>
            <p className="text-3xl font-bold text-green-400">{stats.totalResponses}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Average Rating</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.averageRating} <span className="text-lg text-gray-500">/ 5</span></p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Response Rate</p>
            <p className="text-3xl font-bold text-blue-400">{stats.responseRate}%</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Unanswered</p>
            <p className="text-3xl font-bold text-red-400">{stats.unansweredReviews}</p>
          </div>
        </div>
      )}

      {/* Controls: Search, Sort, Filter, Restaurant */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by customer or keyword..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={18} className="text-gray-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">All Reviews</option>
            <option value="answered">Answered Only</option>
            <option value="unanswered">Unanswered Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select value={restaurantFilter} onChange={(e) => setRestaurantFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="all">All Restaurants</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReviews.length === 0 && <p className="text-gray-400 text-center py-8">No reviews found matching your criteria.</p>}
        {filteredReviews.map((review) => (
          <div key={review.id} className={`bg-gray-800 p-6 rounded-lg border ${review.flags && review.flags.length > 0 ? 'border-orange-500' : 'border-gray-700'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-yellow-500 font-bold text-lg">{review.rating} ★</span>
                {getSentimentBadge(review.rating)} {/* ✅ SENTIMENT BADGE ADDED HERE */}
                <span className="text-gray-400 ml-2">by {review.user?.name || 'Customer'}</span>
                <span className="text-gray-500 text-sm ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <button onClick={() => handleFlag(review.id)} className={`flex items-center gap-1 text-sm transition-colors ${review.flags && review.flags.length > 0 ? 'text-orange-500' : 'text-red-400 hover:text-red-300'}`}>
                <AlertTriangle size={16} /> {review.flags && review.flags.length > 0 ? 'Flagged' : 'Flag'}
              </button>
            </div>
            <p className="text-gray-200 mb-4">{review.comment}</p>
            
            {review.response ? (
              <div className="bg-gray-700 p-3 rounded border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-green-400 font-semibold">Your Reply:</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingReply(review.response.id); setEditText(review.response.responseText); }} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteReply(review.response.id)} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
                {editingReply === review.response.id ? (
                  <div className="space-y-2 mt-2">
                    <textarea className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" rows="2" value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => handleEditReply(review.response.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Save</button>
                      <button onClick={() => { setEditingReply(null); setEditText(''); }} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300">{review.response.responseText}</p>
                )}
              </div>
            ) : (
              <div className="mt-2">
                {replyingTo === review.id ? (
                  <div className="space-y-2">
                    {/* ✅ QUICK REPLY TEMPLATES ADDED HERE */}
                    <select 
                      value={replyTemplate} 
                      onChange={(e) => { setReplyText(e.target.value); setReplyTemplate(e.target.value); }}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                    >
                      <option value="">Select a quick reply template...</option>
                      <option value="Thank you so much for your kind words! We hope to see you again soon.">Thank you (Positive)</option>
                      <option value="We appreciate your feedback and will work on improving this aspect of our service.">We appreciate your feedback (Neutral/Negative)</option>
                      <option value="We are sorry to hear about your experience. Please contact us directly so we can make this right.">Apology (Negative)</option>
                    </select>

                    <textarea 
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                      rows="2" 
                      placeholder="Write your reply..." 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)} 
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReply(review.id)} className="bg-yellow-500 text-gray-900 px-4 py-1.5 rounded font-semibold flex items-center gap-1"><CheckCircle size={16} /> Submit</button>
                      <button onClick={() => { setReplyingTo(null); setReplyText(''); setReplyTemplate(''); }} className="bg-gray-600 text-white px-4 py-1.5 rounded">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyingTo(review.id)} className="text-yellow-500 hover:text-yellow-400 flex items-center gap-1 text-sm font-semibold"><MessageSquare size={16} /> Reply to this review</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}