import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RestaurantProfile from './pages/RestaurantProfile';
import VendorProfile from './pages/VendorProfile';
import Verification from './pages/Verification';
import Settings from './pages/Settings';
import ReviewManagement from './pages/ReviewManagement';
import ApiTester from './pages/ApiTester';
import RestaurantMenu from './pages/RestaurantMenu';
import PublicRestaurantProfile from './pages/PublicRestaurantProfile';

const TEAM_A_LOGIN_URL = "http://localhost:3000/login";

const ProtectedRoute = ({ children }) => {
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
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
      <Routes>
        <Route path="/unauthorized" element={
          <div className="p-8 text-center text-white bg-gray-900 min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-gray-400">You must be a Vendor to access this dashboard.</p>
          </div>
        } />

        <Route path="/restaurant/:id/view" element={<PublicRestaurantProfile />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="vendor-profile" element={<VendorProfile />} />
          <Route path="restaurant" element={<RestaurantProfile />} />
          <Route path="restaurant/:id/menu" element={<RestaurantMenu />} />
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