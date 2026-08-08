import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RestaurantProfile from './pages/RestaurantProfile';
import VendorProfile from './pages/VendorProfile';
import Verification from './pages/Verification';
import Settings from './pages/Settings';
import ReviewManagement from './pages/ReviewManagement'; // ADDED

// TEMP: Bypass login redirect for testing
const ProtectedRoute = ({ children }) => {
  if (!localStorage.getItem('user')) {
    localStorage.setItem('user', JSON.stringify({ id: 'test-user-001', name: 'Test Vendor', role: 'VENDOR' }));
    localStorage.setItem('token', 'dev-test-token');
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/unauthorized" element={<div className="p-8 text-center text-white bg-gray-900 min-h-screen"><h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1></div>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="vendor-profile" element={<VendorProfile />} />
          <Route path="restaurant" element={<RestaurantProfile />} />
          <Route path="verification" element={<Verification />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reviews" element={<ReviewManagement />} /> {/* ADDED */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;