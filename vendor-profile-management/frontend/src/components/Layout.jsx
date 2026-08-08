import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, FileText, Settings, Bell, Search, LogOut, User, MessageSquare } from 'lucide-react';
import { searchRestaurants } from '../services/api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const TEAM_A_LOGIN_URL = "http://localhost:3000/login";

  // ── Search functionality ──────────────────────────────
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const latestQueryRef = useRef('');

  const urlSearch = searchParams.get('search') || '';

  // ✅ Sync the topbar input with the URL ?search= param.
  // When "Clear" is pressed on My Restaurants, the param is removed
  // and this effect clears the input automatically.
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  // Debounced live search (waits 300ms after typing stops)
  useEffect(() => {
    const q = searchQuery.trim();
    latestQueryRef.current = q;

    if (!q) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
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
    { path: '/reviews', label: 'Manage Reviews', icon: MessageSquare }, // ADDED THIS LINE
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
            {/* Search bar */}
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                onKeyDown={(e) => e.key === 'Enter' && goToSearchResults()}
                placeholder="Search restaurants..."
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-yellow-500 w-64"
              />

              {/* Live results dropdown */}
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