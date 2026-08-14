import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, Clock, Star, MessageSquare,
  UtensilsCrossed, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
  Image as ImageIcon, Check, Camera, Sparkles, Info
} from 'lucide-react';
import { getPublicRestaurantProfile } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const RATING_LABELS = { 5: 'Excellent', 4: 'Good', 3: 'Average', 2: 'Poor', 1: 'Terrible' };

/* ── Tiny building blocks ─────────────────────────────── */
function Stars({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

function SmartImage({ src, alt, className, iconSize = 24 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-800`}>
        <ImageIcon size={iconSize} className="text-gray-600" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

function SectionHeading({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
        <Icon size={20} />
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {sub && <span className="text-gray-500 text-sm mt-1">{sub}</span>}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function PublicRestaurantProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewSort, setReviewSort] = useState('newest');
  const [menuSort, setMenuSort] = useState('name');
  const [expandedReviews, setExpandedReviews] = useState({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    getPublicRestaurantProfile(id)
      .then((res) => setData(res.data))
      .catch((e) => console.error('Error loading restaurant:', e))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (data?.restaurant) document.title = `${data.restaurant.name} · ForkRank`;
    return () => { document.title = 'ForkRank · Vendor Dashboard'; };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading restaurant...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <UtensilsCrossed size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg mb-4">Restaurant not found</p>
          <button onClick={() => (window.location.href = '/')} className="text-yellow-500 hover:text-yellow-400">
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  const { restaurant, reviewStats, cityRank } = data;

  /* Helpers */
  const parseTime = (t) => {
    if (!t) return null;
    const d = new Date(t);
    if (!isNaN(d.getTime())) return d;
    const [hh, mm] = String(t).split(':').map(Number);
    if (isNaN(hh)) return null;
    const date = new Date();
    date.setHours(hh, mm || 0, 0, 0);
    return date;
  };

  const formatTime = (t) => {
    if (!t) return '';
    const d = parseTime(t);
    if (!d) return t;
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const getStatusInfo = () => {
    const todayIdx = DAYS.indexOf(todayName);
    const now = new Date();
    const h = restaurant.hours.find((x) => x.day === todayName);
    const open = parseTime(h?.openTime);
    const close = parseTime(h?.closeTime);

    if (h && !h.isClosed && open && close && now >= open && now <= close) return { isOpen: true };

    const startOffset = h && !h.isClosed && open && now < open ? 0 : 1;
    for (let i = startOffset; i <= 7; i++) {
      const dayName = DAYS[(todayIdx + i) % 7];
      const dh = restaurant.hours.find((x) => x.day === dayName);
      if (dh && !dh.isClosed && dh.openTime) {
        return {
          isOpen: false,
          nextLabel: i === 0 ? 'today' : i === 1 ? 'tomorrow' : `on ${dayName}`,
          nextTime: formatTime(dh.openTime),
        };
      }
    }
    return { isOpen: false };
  };
  const statusInfo = getStatusInfo();

  const isVerified =
    restaurant.vendor?.verificationStatus === 'APPROVED' ||
    restaurant.verifications?.some((v) => v.status === 'APPROVED');

  /* Photos: cover + menu images */
  const photos = [restaurant.coverUrl, ...restaurant.menu.filter((m) => m.imageUrl).map((m) => m.imageUrl)].filter(Boolean).slice(0, 5);

  /* Menu grouping + sorting */
  const groupedMenu = restaurant.menu.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  Object.values(groupedMenu).forEach((items) => {
    items.sort((a, b) => {
      if (menuSort === 'price-asc') return a.price - b.price;
      if (menuSort === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  });
  const popularDishes = restaurant.menu.filter((m) => m.imageUrl && m.isAvailable).slice(0, 6);

  /* Reviews sorting */
  const sortedReviews = [...restaurant.reviews].sort((a, b) => {
    if (reviewSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  const reviewsToShow = showAllReviews ? sortedReviews : sortedReviews.slice(0, 5);
  const toggleExpand = (rid) => setExpandedReviews((p) => ({ ...p, [rid]: !p[rid] }));

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'menu', label: 'Menu' },
    { id: 'reviews', label: `Reviews (${reviewStats.total})` },
    { id: 'hours', label: 'Hours' },
    { id: 'features', label: 'Features' },
  ];
  const scrollTo = (sid) => {
    setActiveSection(sid);
    document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-16">
      {/* ── Top mini bar ── */}
      <div className="max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
        <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
          <ArrowLeft size={18} /> Back
        </button>
        <span className="flex items-center gap-2 text-yellow-500 font-bold">
          <UtensilsCrossed size={18} /> ForkRank
        </span>
      </div>

      {/* ── Photo mosaic hero ── */}
      <div className="max-w-6xl mx-auto px-6 mt-5">
        {photos.length === 0 ? (
          <div className="h-72 md:h-96 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <ImageIcon size={64} className="text-gray-700" />
          </div>
        ) : (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
            <div className="relative col-span-4 md:col-span-2 row-span-2">
              <SmartImage src={photos[0]} alt={restaurant.name} className="h-full w-full object-cover" iconSize={48} />
              <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium">
                <Camera size={13} /> {photos.length} photos
              </span>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="hidden md:block">
                <SmartImage src={photos[i]} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Title block ── */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl md:text-4xl font-bold truncate">{restaurant.name}</h1>
              {isVerified ? (
                <span title="Verified business"><ShieldCheck size={24} className="text-emerald-400 shrink-0" /></span>
              ) : (
                <span title="Not verified"><ShieldAlert size={22} className="text-gray-500 shrink-0" /></span>
              )}
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap text-sm">
              <span className="text-yellow-500 font-bold text-xl">{reviewStats.average}</span>
              <Stars rating={reviewStats.average} size={18} />
              <span className="text-gray-400">({reviewStats.total} reviews)</span>
              {cityRank && cityRank.total > 0 && (
                <span className="text-gray-400">· #{cityRank.rank} of {cityRank.total} Restaurants in {restaurant.city}</span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2.5 mt-1.5 text-sm text-gray-400 flex-wrap">
              <span>{restaurant.cuisine}</span>
              <span className="text-gray-600">•</span>
              <span>{'$'.repeat(restaurant.priceLevel)}</span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1"><MapPin size={13} /> {restaurant.city}</span>
              <span className="text-gray-600">•</span>
              {statusInfo.isOpen ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Open now
                </span>
              ) : statusInfo.nextLabel ? (
                <span className="flex items-center gap-1.5 font-medium text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-400"></span> Closed · Opens {statusInfo.nextLabel} at {statusInfo.nextTime}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-400"></span> Closed
                </span>
              )}
            </div>
          </div>

          {/* Logo */}
          <SmartImage
            src={restaurant.logoUrl}
            alt={restaurant.name}
            className="h-20 w-20 md:h-24 md:w-24 rounded-2xl object-cover ring-2 ring-gray-700 shrink-0"
            iconSize={28}
          />
        </div>
      </div>

      {/* ── Sticky ghost nav ── */}
      <div className="max-w-6xl mx-auto px-6 mt-6 sticky top-0 z-20 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
        <div className="flex gap-7 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeSection === s.id
                  ? 'text-yellow-500 border-yellow-500'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* ═══ MAIN COLUMN ═══ */}
        <div className="lg:col-span-2 space-y-14">
          {/* Overview */}
          <section id="overview" className="scroll-mt-20">
            <SectionHeading icon={Info} title="About" />
            <p className="text-gray-300 leading-relaxed">
              {restaurant.description || 'No description provided yet.'}
            </p>

            {popularDishes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4">Popular dishes</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {popularDishes.map((dish) => (
                    <div key={dish.id} className="shrink-0 w-44 bg-gray-800/60 rounded-xl overflow-hidden border border-gray-700/60 hover:border-yellow-500/40 transition">
                      <SmartImage src={dish.imageUrl} alt={dish.name} className="h-28 w-full object-cover" />
                      <div className="p-3">
                        <p className="text-white text-sm font-semibold truncate">{dish.name}</p>
                        <p className="text-yellow-500 text-sm font-bold mt-0.5">${dish.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Menu */}
          <section id="menu" className="scroll-mt-20">
            <div className="flex items-center justify-between mb-6">
              <SectionHeading icon={UtensilsCrossed} title="Menu" sub={`${restaurant.menu.length} items`} />
              <select
                value={menuSort}
                onChange={(e) => setMenuSort(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                <option value="name">Name (A–Z)</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>

            {Object.keys(groupedMenu).length === 0 ? (
              <p className="text-gray-500 text-sm">Menu coming soon.</p>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-800">
                      {category}
                    </h3>
                    <div className="divide-y divide-gray-800/70">
                      {items.map((item) => (
                        <div key={item.id} className={`flex items-center gap-4 py-3.5 ${!item.isAvailable ? 'opacity-50' : ''}`}>
                          <SmartImage src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-lg object-cover shrink-0" iconSize={16} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="text-white font-medium text-sm truncate">
                                {item.name}
                                {!item.isAvailable && <span className="ml-2 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-full">Sold out</span>}
                              </p>
                              <span className="text-gray-500 text-xs leading-none">············</span>
                              <span className="text-yellow-500 font-semibold text-sm whitespace-nowrap">${item.price.toFixed(2)}</span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section id="reviews" className="scroll-mt-20">
            <div className="flex items-center justify-between mb-6">
              <SectionHeading icon={MessageSquare} title="Reviews" sub={`${reviewStats.total} total`} />
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>

            {/* Rating summary */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <p className="text-5xl font-bold text-yellow-500">{reviewStats.average}</p>
                <div className="flex justify-center mt-2"><Stars rating={reviewStats.average} size={20} /></div>
                <p className="text-gray-500 text-sm mt-2">Based on {reviewStats.total} reviews</p>
              </div>
              <div className="space-y-2.5">
                {reviewStats.distribution.map(({ stars, count }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-gray-400">{RATING_LABELS[stars]}</span>
                    <div className="flex-1 bg-gray-700/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full rounded-full"
                        style={{ width: `${reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="w-6 text-right text-xs text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review cards */}
            {sortedReviews.length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews yet.</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {reviewsToShow.map((review) => (
                  <div key={review.id} className="py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center font-bold text-white shrink-0">
                        {review.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{review.user?.name || 'Anonymous'}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <Stars rating={review.rating} size={14} />
                    </div>

                    {review.comment && (
                      <div className="mt-3">
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {expandedReviews[review.id] || review.comment.length <= 220
                            ? review.comment
                            : review.comment.slice(0, 220) + '…'}
                        </p>
                        {review.comment.length > 220 && (
                          <button onClick={() => toggleExpand(review.id)} className="text-yellow-500 hover:text-yellow-400 text-xs font-semibold mt-1.5">
                            {expandedReviews[review.id] ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}

                    {review.response && (
                      <div className="mt-4 ml-4 pl-4 border-l-2 border-yellow-500/40">
                        <p className="text-xs font-semibold text-yellow-500 mb-1 flex items-center gap-1">
                          <ShieldCheck size={12} /> Response from owner
                        </p>
                        <p className="text-gray-400 text-sm leading-relaxed">{review.response.responseText}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {sortedReviews.length > 5 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="mt-4 w-full py-3 text-sm font-semibold text-gray-300 hover:text-white border border-gray-700 rounded-lg hover:border-gray-500 transition flex items-center justify-center gap-2"
              >
                {showAllReviews ? <>Show less <ChevronUp size={16} /></> : <>Show all {sortedReviews.length} reviews <ChevronDown size={16} /></>}
              </button>
            )}
          </section>

          {/* Hours */}
          <section id="hours" className="scroll-mt-20">
            <SectionHeading icon={Clock} title="Hours" />
            {restaurant.hours.length === 0 ? (
              <p className="text-gray-500 text-sm">Hours not available yet.</p>
            ) : (
              <div className="bg-gray-800/50 rounded-xl divide-y divide-gray-800 overflow-hidden">
                {DAYS.map((day) => {
                  const h = restaurant.hours.find((x) => x.day === day);
                  const isToday = todayName === day;
                  return (
                    <div key={day} className={`flex items-center justify-between px-5 py-3 text-sm ${isToday ? 'bg-yellow-500/10' : ''}`}>
                      <span className={isToday ? 'text-yellow-500 font-semibold' : 'text-gray-300'}>
                        {day}{isToday && ' · Today'}
                      </span>
                      <span className={h && !h.isClosed && h.openTime ? 'text-gray-300' : 'text-red-400'}>
                        {h && !h.isClosed && h.openTime ? `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}` : 'Closed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Features */}
          <section id="features" className="scroll-mt-20">
            <SectionHeading icon={Sparkles} title="Features" />
            {restaurant.tags.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {restaurant.tags.map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 bg-gray-800/50 border border-gray-700/60 rounded-lg px-4 py-3 text-sm text-gray-300">
                    <Check size={15} className="text-emerald-400 shrink-0" /> {t.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No features listed yet. The owner can add features like "Outdoor seating", "Free Wi-Fi" or "Wheelchair accessible" soon.
              </p>
            )}
          </section>
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <aside className="space-y-6 lg:sticky lg:top-16 self-start">
          {/* At a glance */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700/60 p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-yellow-500" /> At a glance
            </h3>
            <div className="space-y-3.5 text-sm text-gray-300">
              <div className="flex gap-3">
                <MapPin size={16} className="text-gray-500 shrink-0 mt-0.5" />
                <span>{restaurant.street}, {restaurant.city} {restaurant.zipcode}</span>
              </div>
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="flex gap-3 hover:text-yellow-500 transition">
                  <Phone size={16} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>{restaurant.phone}</span>
                </a>
              )}
              {restaurant.email && (
                <a href={`mailto:${restaurant.email}`} className="flex gap-3 hover:text-yellow-500 transition">
                  <Mail size={16} className="text-gray-500 shrink-0 mt-0.5" />
                  <span className="truncate">{restaurant.email}</span>
                </a>
              )}
              {restaurant.website && (
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-yellow-500 transition">
                  <Globe size={16} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>Visit website</span>
                </a>
              )}
            </div>
          </div>

          {/* Hours mini */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700/60 p-5">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" /> Today
            </h3>
            {statusInfo.isOpen ? (
              <p className="text-emerald-400 text-sm font-medium">Open now</p>
            ) : statusInfo.nextLabel ? (
              <p className="text-red-400 text-sm font-medium">Closed · Opens {statusInfo.nextLabel} at {statusInfo.nextTime}</p>
            ) : (
              <p className="text-red-400 text-sm font-medium">Closed</p>
            )}
            <button onClick={() => scrollTo('hours')} className="text-yellow-500 hover:text-yellow-400 text-xs font-semibold mt-2">
              See all hours →
            </button>
          </div>

          {/* Vendor */}
          {restaurant.vendor && (
            <div className="bg-gray-800/60 rounded-xl border border-gray-700/60 p-5">
              <h3 className="font-bold text-lg mb-2">Managed by</h3>
              <p className="text-gray-300 text-sm flex items-center gap-2">
                {restaurant.vendor.businessName}
                {isVerified && <ShieldCheck size={14} className="text-emerald-400" />}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}