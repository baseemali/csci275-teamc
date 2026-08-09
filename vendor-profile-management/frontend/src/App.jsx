import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RestaurantProfile from './pages/RestaurantProfile';
import VendorProfile from './pages/VendorProfile';
import Verification from './pages/Verification';
import Settings from './pages/Settings';
import ReviewManagement from './pages/ReviewManagement';
import ApiTester from './pages/ApiTester';

// URL where Team A's login page is hosted
const TEAM_A_LOGIN_URL = "http://localhost:3000/login"; // Change this if their port is different

// Protect routes from non-vendors
const ProtectedRoute = ({ children }) => {
  // TEMP: Disable authentication for testing
  if (!localStorage.getItem('user')) {
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user-001',
      name: 'Test Vendor',
      role: 'VENDOR'
    }));
    localStorage.setItem('token', 'dev-test-token');
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthorized Page */}
        <Route path="/unauthorized" element={
          <div className="p-8 text-center text-white bg-gray-900 min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-gray-400">You must be a Vendor to access this dashboard.</p>
          </div>
        } />

        {/* Protected Vendor Routes (Your Subsystem) */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="vendor-profile" element={<VendorProfile />} />
          <Route path="restaurant" element={<RestaurantProfile />} />
          <Route path="reviews" element={<ReviewManagement />} />
          <Route path="verification" element={<Verification />} />
          <Route path="settings" element={<Settings />} />
          <Route path="api-tester" element={<ApiTester />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;