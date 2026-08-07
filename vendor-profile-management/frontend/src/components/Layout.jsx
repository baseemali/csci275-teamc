import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, FileText, Settings, Bell, Search, LogOut, User } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize navigation

  // URL where Team A's login page is hosted
  const TEAM_A_LOGIN_URL = "http://localhost:3000/login"; 

  // Logout Handler
  const handleLogout = () => {
    // 1. Clear local session data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Redirect to Team A's login page
    window.location.href = TEAM_A_LOGIN_URL;
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vendor-profile', label: 'My Profile', icon: User },
    { path: '/restaurant', label: 'My Restaurants', icon: UtensilsCrossed },
    { path: '/verification', label: 'Verification', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 text-2xl font-bold text-yellow-500 flex items-center gap-2">
          <UtensilsCrossed /> Foodie Vendor
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-yellow-500 text-gray-900 font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} /> Log out
          </button>
        </div>
      </aside>

      {/* Main Content & Topbar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold">Welcome, Vendor </h2>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-yellow-500 w-64"
              />
            </div>
            <button className="relative text-gray-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold">V</div>
              <div>
                <p className="text-sm font-medium">Vendor Admin</p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}