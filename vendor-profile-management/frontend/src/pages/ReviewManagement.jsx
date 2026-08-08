import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Uses their Axios setup
import { MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get('/reviews'),
        api.get('/reviews/statistics')
      ]);
      setReviews(reviewsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/reply`, { responseText: replyText });
      setReplyingTo(null);
      setReplyText('');
      loadData();
    } catch (error) {
      alert("Failed to submit reply");
    }
  };

  const handleFlag = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/flag`, { reason: "Inappropriate content" });
      alert("Review flagged successfully!");
      loadData();
    } catch (error) {
      alert("Failed to flag review");
    }
  };

  if (loading) return <div className="p-8 text-white">Loading reviews...</div>;

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Review Management</h1>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Total Reviews</p>
            <p className="text-3xl font-bold">{stats.totalReviews}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Average Rating</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.averageRating} <span className="text-lg text-gray-500">/ 5</span></p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Unanswered</p>
            <p className="text-3xl font-bold text-red-400">{stats.unansweredReviews}</p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 && <p className="text-gray-400">No reviews yet.</p>}
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-yellow-500 font-bold text-lg">{review.rating} ★</span>
                <span className="text-gray-400 ml-2">by {review.user?.name || 'Customer'}</span>
              </div>
              <button 
                onClick={() => handleFlag(review.id)}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition-colors"
              >
                <AlertTriangle size={16} /> Flag
              </button>
            </div>
            <p className="text-gray-200 mb-4">{review.comment}</p>
            
            {review.response ? (
              <div className="bg-gray-700 p-3 rounded border-l-4 border-green-500">
                <p className="text-sm text-green-400 font-semibold mb-1">Your Reply:</p>
                <p className="text-gray-300">{review.response.responseText}</p>
              </div>
            ) : (
              <div className="mt-2">
                {replyingTo === review.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-yellow-500"
                      rows="2"
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReply(review.id)}
                        className="bg-yellow-500 text-gray-900 px-4 py-1.5 rounded font-semibold hover:bg-yellow-400 flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle size={16} /> Submit
                      </button>
                      <button 
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="bg-gray-600 text-white px-4 py-1.5 rounded hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingTo(review.id)}
                    className="text-yellow-500 hover:text-yellow-400 flex items-center gap-1 text-sm font-semibold transition-colors"
                  >
                    <MessageSquare size={16} /> Reply to this review
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}