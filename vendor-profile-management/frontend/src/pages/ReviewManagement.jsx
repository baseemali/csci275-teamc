import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, AlertTriangle, CheckCircle, Edit2, Trash2, ArrowUpDown } from 'lucide-react';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest
  const [filterBy, setFilterBy] = useState('all'); // all, answered, unanswered
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => { 
  loadRestaurants();
  loadData(); 
}, []);

// New function to load restaurants
const loadRestaurants = async () => {
  try {
    const res = await api.get('/restaurants'); // Fetch all restaurants
    setRestaurants(res.data);
  } catch (error) {
    console.error("Failed to load restaurants", error);
  }
};

const loadData = async () => {
  try {
    const params = restaurantFilter !== 'all' ? { params: { restaurantId: restaurantFilter } } : {};
    
    const [reviewsRes, statsRes] = await Promise.all([
      api.get('/reviews', params), 
      api.get('/reviews/statistics')
    ]);
    setReviews(reviewsRes.data);
    setStats(statsRes.data);
  } catch (error) { console.error("Failed to load data", error); }
};

  const handleReply = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/reply`, { responseText: replyText });
      setReplyingTo(null); setReplyText(''); loadData();
    } catch (error) { alert("Failed to submit reply"); }
  };

  const handleEditReply = async (replyId) => {
    try {
      await api.put(`/reviews/replies/${replyId}`, { responseText: editText });
      setEditingReply(null); setEditText(''); loadData();
    } catch (error) { alert("Failed to edit reply"); }
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      await api.delete(`/reviews/replies/${replyId}`);
      loadData();
    } catch (error) { alert("Failed to delete reply"); }
  };

  const handleFlag = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/flag`, { reason: "Inappropriate content" });
      alert("Review flagged successfully!"); loadData();
    } catch (error) { alert("Failed to flag review"); }
  };

  // Sort and filter reviews
  const getFilteredReviews = () => {
    let filtered = [...reviews];

    // Filter
    if (filterBy === 'answered') filtered = filtered.filter(r => r.response);
    if (filterBy === 'unanswered') filtered = filtered.filter(r => !r.response);

    // Sort
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

      {/* Sort and Filter Controls */}
<div className="flex gap-4 mb-6 flex-wrap">
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

  {/* NEW: Restaurant Filter Dropdown */}
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
        {filteredReviews.length === 0 && <p className="text-gray-400">No reviews found.</p>}
        {filteredReviews.map((review) => (
          <div key={review.id} className={`bg-gray-800 p-6 rounded-lg border ${review.flags && review.flags.length > 0 ? 'border-orange-500' : 'border-gray-700'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-yellow-500 font-bold text-lg">{review.rating} ★</span>
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
                    <textarea className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" rows="2" placeholder="Write your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => handleReply(review.id)} className="bg-yellow-500 text-gray-900 px-4 py-1.5 rounded font-semibold flex items-center gap-1"><CheckCircle size={16} /> Submit</button>
                      <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-gray-600 text-white px-4 py-1.5 rounded">Cancel</button>
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