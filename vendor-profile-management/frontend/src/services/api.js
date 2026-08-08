import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// 1. Request Interceptor: Attach JWT token to every outgoing request
API.interceptors.request.use((config) => {
  // Note: If Team A uses httpOnly cookies instead of localStorage, change this to read from document.cookie
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor: Handle expired tokens automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired. Clear local data and redirect to Team A's login.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'http://localhost:3000/login'; // Change to Team A's actual login URL
    }
    return Promise.reject(error);
  }
);

// ==========================================
// VENDOR APIs
// ==========================================
export const getVendorProfile = (id) => API.get(`/vendors/${id}`);
export const updateVendorProfile = (id, data) => API.put(`/vendors/${id}`, data);
export const getNotificationSettings = (id) => API.get(`/vendors/${id}/settings`);
export const updateNotificationSettings = (id, data) => API.put(`/vendors/${id}/settings`, data);
export const getVendorRestaurants = (vendorId) => API.get(`/vendors/${vendorId}/restaurants`);

export const getVendorSettings = (id) => API.get(`/vendors/${id}/settings`);
export const updateVendorSettings = (id, data) => API.put(`/vendors/${id}/settings`, data);

// Dev Only: Remove this in production when Team A's auth is fully integrated
export const getTestVendor = () => API.get('/vendors/test-vendor'); 

// ==========================================
// RESTAURANT APIs
// ==========================================
export const createRestaurant = (data) => API.post('/restaurants', data);
export const getRestaurantProfile = (id) => API.get(`/restaurants/${id}`);
export const updateRestaurantProfile = (id, data) => API.put(`/restaurants/${id}`, data);
export const getRestaurantVerifications = (id) => API.get(`/restaurants/${id}/verifications`);
export const submitVerification = (id, data) => API.post(`/restaurants/${id}/verification`, data);

// ==========================================
// REVIEW APIs (matches backend/routes/reviewRoutes.js)
// ==========================================
export const getVendorReviews = () => API.get('/reviews');
export const getVendorReviewStats = () => API.get('/reviews/statistics');

// For the Review Management page
export const replyToReview = (reviewId, responseText) =>
  API.post(`/reviews/${reviewId}/reply`, { responseText });
export const flagReview = (reviewId, reason) =>
  API.post(`/reviews/${reviewId}/flag`, { reason });

// Discovery / Claim APIs
export const searchRestaurants = (params) => API.get('/restaurants/search', { params });
export const getUnclaimedRestaurants = () => API.get('/restaurants/unclaimed');
export const getClaimedRestaurants = (vendorId) => API.get('/restaurants/claimed', { params: { vendorId } });

// NEW: General User Suggestion API
export const suggestRestaurant = (data) => API.post('/restaurants/suggest', data);

export default API;