import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, FileText, Settings, Bell, Search,
  LogOut, User, MessageSquare, Menu, X, ChevronDown
} from 'lucide-react';
import { searchRestaurants, getTestVendor } from '../services/api';

// Profile picture: vendor logo, or avatar icon fallback
function VendorAvatar({ vendor }) {
  const [imgError, setImgError] = useState(false);
  if (vendor?.logoUrl && !imgError) {
    return (
      <img
        src={vendor.logoUrl}
        alt="Vendor logo"
        onError={() => setImgError(true)}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-800"
      />
    );
  }
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-gray-900">
      <User size={18} />
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);

  const TEAM_A_LOGIN_URL = "http://localhost:3000/login";

  // Today's date for the top bar
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Load vendor for name + logo
  useEffect(() => {
    getTestVendor()
      .then((res) => setVendor(res.data))
      .catch(() => {});
  }, []);

  // ── Search functionality ──────────────────────────────
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const latestQueryRef = useRef('');

  const urlSearch = searchParams.get('search') || '';

  useEffect(() => { setSearchQuery(urlSearch); }, [urlSearch]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Update browser tab title per page
  useEffect(() => {
    const titles = {
      '/': 'Dashboard',
      '/vendor-profile': 'My Profile',
      '/restaurant': 'My Restaurants',
      '/reviews': 'Review Management',
      '/verification': 'Verification',
      '/settings': 'Settings',
      '/api-tester': 'API Tester',
    };

    let page = titles[location.pathname];
    if (!page && location.pathname.includes('/menu')) page = 'Manage Menu';

    document.title = `${page || 'Dashboard'} · ForkRank`;
  }, [location.pathname]);

  useEffect(() => {
    const q = searchQuery.trim();
    latestQueryRef.current = q;
    if (!q) { setSearchResults([]); setShowResults(false); return; }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchRestaurants({ query: q });
        if (latestQueryRef.current === q) {
          setSearchResults(res.data || []);
          setShowResults(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToSearchResults = () => {
    navigate(`/restaurant?search=${encodeURIComponent(searchQuery.trim())}`);
    setShowResults(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = TEAM_A_LOGIN_URL;
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vendor-profile', label: 'My Profile', icon: User },
    { path: '/restaurant', label: 'My Restaurants', icon: UtensilsCrossed },
    { path: '/reviews', label: 'Manage Reviews', icon: MessageSquare },
    { path: '/verification', label: 'Verification', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const vendorName = vendor?.businessName || 'Vendor';

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Responsive Sidebar ─────────────────────────────
          mobile  (<md): hidden drawer, opens via hamburger
          medium  (md) : icon-only, always visible
          large   (lg+): full sidebar with labels        */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 border-r border-gray-800 w-64
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:transform-none md:transition-all md:w-20
        lg:w-64
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-5 md:justify-center md:p-3 lg:justify-between lg:p-5">
          <div className="flex items-center gap-2 text-yellow-500">
            <UtensilsCrossed size={24} className="shrink-0" />
            <span className="text-xl font-bold md:hidden lg:inline">Foodie Vendor</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 md:px-2 lg:px-4 space-y-2 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors justify-start md:justify-center md:px-0 lg:justify-start lg:px-4 ${
                  isActive ? 'bg-yellow-500 text-gray-900 font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="md:hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 md:p-2 lg:p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors w-full justify-start md:justify-center md:px-0 lg:justify-start lg:px-4"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="md:hidden lg:inline">Log out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content & Topbar ─────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          {/* Left: hamburger (mobile) + date */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white transition"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <p className="text-sm lg:text-base font-semibold text-white">{today}</p>
          </div>

          {/* Right: search + actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Search bar */}
            <div className="relative hidden sm:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                onKeyDown={(e) => e.key === 'Enter' && goToSearchResults()}
                placeholder="Search restaurants..."
                className="bg-gray-800 text-white text-sm pl-9 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-yellow-500 w-40 lg:w-64 transition-all"
              />

              {showResults && searchQuery.trim() && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  {searching ? (
                    <p className="p-4 text-gray-400 text-sm">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="p-4 text-gray-400 text-sm">No restaurants found for "{searchQuery.trim()}".</p>
                  ) : (
                    <>
                      <ul className="max-h-64 overflow-y-auto">
                        {searchResults.slice(0, 6).map((rest) => (
                          <li key={rest.id}>
                            <button
                              type="button"
                              onClick={goToSearchResults}
                              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition border-b border-gray-700/50"
                            >
                              <p className="text-white text-sm font-medium">{rest.name}</p>
                              <p className="text-gray-400 text-xs mt-0.5">
                                {rest.city} · {rest.cuisine || 'General'} · {'$'.repeat(rest.priceLevel)}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={goToSearchResults}
                        className="w-full px-4 py-2 text-xs text-yellow-500 hover:bg-gray-700 transition font-semibold"
                      >
                        View all results for "{searchQuery.trim()}" →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-800 hidden sm:block"></div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition" title="Notifications">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-gray-900"></span>
            </button>

            <div className="h-8 w-px bg-gray-800 hidden md:block"></div>

            {/* User profile chip */}
            <button className="flex items-center gap-3 pl-1 pr-2 py-1.5 rounded-lg hover:bg-gray-800 transition group">
              <div className="relative">
                <VendorAvatar vendor={vendor} />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full ring-2 ring-gray-900"></span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white leading-tight group-hover:text-yellow-400 transition">
                  {vendorName}
                </p>
                <p className="text-[11px] text-gray-500 leading-tight">Business Owner</p>
              </div>
              <ChevronDown size={14} className="text-gray-500 hidden md:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}