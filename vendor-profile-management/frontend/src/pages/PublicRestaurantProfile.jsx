import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Globe, Clock, Star, MessageSquare,
  UtensilsCrossed, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
  ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { getPublicRestaurantProfile } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PublicRestaurantProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewSort, setReviewSort] = useState('newest');
  const [menuSort, setMenuSort] = useState('name');



  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getPublicRestaurantProfile(id);
        setData(res.data);
      } catch (error) {
        console.error('Error loading restaurant:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

	// Tab title shows the restaurant name
	useEffect(() => {
		if (data?.restaurant) {
			document.title = `${data.restaurant.name} · ForkRank`;
		}
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
          <p className="text-gray-400 text-lg">Restaurant not found</p>
          <Link to="/" className="text-yellow-500 hover:text-yellow-400 mt-4 inline-block">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const { restaurant, reviewStats } = data;
  const isVerified =
  restaurant.vendor?.verificationStatus === 'APPROVED' ||
  	restaurant.verifications?.some((v) => v.status === 'APPROVED');

	const isPending =
		!isVerified &&
		(restaurant.verifications?.[0]?.status === 'PENDING' ||
			restaurant.vendor?.verificationStatus === 'PENDING');
  // // Format hours for display
	const formatTime = (t) => {
		if (!t) return '';
		const d = new Date(t);
		if (isNaN(d.getTime())) return t; // already a plain "09:00" string
		return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	};
	const isOpenNow = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const h = restaurant.hours.find((x) => x.day === today);
    if (!h) return null;
    if (h.isClosed) return false;
    const now = new Date();
    const open = new Date(h.openTime);
    const close = new Date(h.closeTime);
    if (isNaN(open.getTime()) || isNaN(close.getTime())) return null;
    return now >= open && now <= close;
  };
  const openNow = isOpenNow();
	
	// Group menu by category
const groupedMenu = restaurant.menu.reduce((acc, item) => {
  const cat = item.category || 'Other';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(item);
  return acc;
}, {});

// 👇 SORT each category's items based on menuSort
Object.values(groupedMenu).forEach((items) => {
  items.sort((a, b) => {
    if (menuSort === 'price-asc') return a.price - b.price;
    if (menuSort === 'price-desc') return b.price - a.price;
    return a.name.localeCompare(b.name); // default: A–Z
  });
});

  // Sort menu items within each category
const sortItems = (items) => [...items].sort((a, b) => {
  if (menuSort === 'price-asc') return a.price - b.price;
  if (menuSort === 'price-desc') return b.price - a.price;
  return a.name.localeCompare(b.name); // default: name A–Z
});

// Sort reviews
const sortedReviews = [...restaurant.reviews].sort((a, b) => {
  if (reviewSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
  if (reviewSort === 'highest') return b.rating - a.rating;
  if (reviewSort === 'lowest') return a.rating - b.rating;
  return new Date(b.createdAt) - new Date(a.createdAt); // default: newest
});

const reviewsToShow = showAllReviews ? sortedReviews : sortedReviews.slice(0, 5);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'menu', label: `Menu (${restaurant.menu.length})`, icon: UtensilsCrossed },
    { id: 'reviews', label: `Reviews (${reviewStats.total})`, icon: MessageSquare },
    { id: 'hours', label: 'Hours', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
			<div className="relative">
				{/* Cover image */}
				<div className="relative h-64 md:h-80 overflow-hidden">
					{restaurant.coverUrl ? (
						<img
							src={restaurant.coverUrl}
							alt={restaurant.name}
							className="absolute inset-0 w-full h-full object-cover"
							onError={(e) => { e.currentTarget.style.display = 'none'; }}
						/>
					) : (
						<div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
							<UtensilsCrossed size={80} className="text-gray-700" />
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

					{/* Back button */}
					<button
						onClick={() => {
							if (window.history.length > 1) window.history.back();
							else window.location.href = '/';
						}}
						className="absolute top-6 left-6 p-2.5 bg-black/50 backdrop-blur-md text-white rounded-lg hover:bg-black/70 transition z-10"
					>
						<ArrowLeft size={20} />
					</button>
				</div>

				{/* Restaurant identity — overlaps the cover's bottom edge (no clipping) */}
				<div className="max-w-6xl mx-auto px-6">
					<div className="relative -mt-10 md:-mt-12 flex items-end gap-5">
						{/* Logo */}
						{restaurant.logoUrl ? (
							<img
								src={restaurant.logoUrl}
								alt={restaurant.name}
								className="h-24 w-24 rounded-2xl object-cover ring-4 ring-gray-900 shadow-2xl shrink-0"
								onError={(e) => { e.currentTarget.style.display = 'none'; }}
							/>
						) : (
							<div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-gray-900 font-bold text-3xl ring-4 ring-gray-900 shadow-2xl shrink-0">
								{restaurant.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
							</div>
						)}

						{/* Name + meta */}
						<div className="flex-1 min-w-0 pb-1">
							<div className="flex items-center gap-2">
								<h1 className="text-3xl md:text-4xl font-bold text-white truncate">
									{restaurant.name}
								</h1>

								{/* ✅ Simple verification icon */}
								{isVerified ? (
									<span title="Verified business" className="text-emerald-400 shrink-0">
										<ShieldCheck size={24} />
									</span>
								) : (
									<span title={isPending ? 'Verification pending' : 'Not verified'} className="text-gray-500 shrink-0">
										<ShieldAlert size={22} />
									</span>
								)}
							</div>

							{/* Meta row with Open/Closed dot indicator */}
							<div className="flex items-center gap-3 text-gray-300 text-sm mt-1.5 flex-wrap">
								<span className="flex items-center gap-1">
									<UtensilsCrossed size={14} />
									{restaurant.cuisine}
								</span>
								<span>{'$'.repeat(restaurant.priceLevel)}</span>
								<span className="flex items-center gap-1">
									<MapPin size={14} />
									{restaurant.city}
								</span>

								{openNow !== null && (
									<>
										<span className="h-1 w-1 bg-gray-600 rounded-full"></span>
										<span className={`flex items-center gap-1.5 font-medium ${openNow ? 'text-emerald-400' : 'text-red-400'}`}>
											<span className={`h-2 w-2 rounded-full ${openNow ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
											{openNow ? 'Open now' : 'Closed'}
										</span>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick stats bar */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
              <Star size={20} fill="currentColor" />
              <span className="text-2xl font-bold">{reviewStats.average}</span>
            </div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">{reviewStats.total}</p>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">{restaurant.menu.length}</p>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Menu Items</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">{restaurant.tags.length}</p>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Features</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {restaurant.description && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">About</h2>
                    <p className="text-gray-300 leading-relaxed">{restaurant.description}</p>
                  </div>
                )}

                {/* Tags */}
                {restaurant.tags.length > 0 && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Features</h2>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-full text-sm"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Location</h2>
                  <div className="flex items-start gap-3 text-gray-300">
                    <MapPin size={20} className="text-yellow-500 shrink-0 mt-1" />
                    <div>
                      <p>{restaurant.street}</p>
                      <p>{restaurant.city}, {restaurant.zipcode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
                  <div className="space-y-3">
                    {restaurant.phone && (
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition"
                      >
                        <Phone size={18} className="text-gray-500" />
                        <span className="text-sm">{restaurant.phone}</span>
                      </a>
                    )}
                    {restaurant.email && (
                      <a
                        href={`mailto:${restaurant.email}`}
                        className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition"
                      >
                        <Mail size={18} className="text-gray-500" />
                        <span className="text-sm">{restaurant.email}</span>
                      </a>
                    )}
                    {restaurant.website && (
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-300 hover:text-yellow-500 transition"
                      >
                        <Globe size={18} className="text-gray-500" />
                        <span className="text-sm">Website</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Vendor info */}
                {restaurant.vendor && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-white mb-3">Owned by</h3>
                    <p className="text-gray-300 text-sm">{restaurant.vendor.businessName}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Menu Tab — compact cards */}
					{activeTab === 'menu' && (
						<div className="space-y-8">
							{/* Header with sort */}
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-bold text-white">
									Menu <span className="text-gray-500 text-sm font-normal">({restaurant.menu.length} items)</span>
								</h2>
								<select
									value={menuSort}
									onChange={(e) => {
										console.log('menuSort changed to:', e.target.value);
										setMenuSort(e.target.value);
									}}
									className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
								>
									<option value="name">Name (A–Z)</option>
									<option value="price-asc">Price: Low → High</option>
									<option value="price-desc">Price: High → Low</option>
								</select>
							</div>

							{Object.keys(groupedMenu).length === 0 ? (
								<div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
									<UtensilsCrossed size={48} className="mx-auto text-gray-600 mb-4" />
									<p className="text-gray-400">Menu coming soon</p>
								</div>
							) : (
								Object.entries(groupedMenu).map(([category, items]) => (
									<div key={category}>
										<h3 className="text-lg font-semibold text-gray-300 uppercase tracking-wider mb-3 pb-2 border-b border-gray-700">
											{category} <span className="text-gray-500 text-xs font-normal">({items.length})</span>
										</h3>

										{/* Compact 2-column grid */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											{sortItems(items).map((item) => (
												<div
													key={item.id}
													className={`flex items-center gap-3 bg-gray-800 rounded-lg border border-gray-700 p-3 transition hover:border-yellow-500/40 ${
														!item.isAvailable ? 'opacity-50' : ''
													}`}
												>
													{/* Small thumbnail */}
													<div className="h-14 w-14 rounded-lg bg-gray-900 overflow-hidden shrink-0">
														{item.imageUrl ? (
															<img
																src={item.imageUrl}
																alt={item.name}
																className="h-full w-full object-cover"
																onError={(e) => { e.currentTarget.style.display = 'none'; }}
															/>
														) : (
															<div className="h-full w-full flex items-center justify-center">
																<ImageIcon size={18} className="text-gray-700" />
															</div>
														)}
													</div>

													{/* Details */}
													<div className="flex-1 min-w-0">
														<div className="flex items-baseline justify-between gap-2">
															<h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
															<span className="text-yellow-500 font-semibold text-sm whitespace-nowrap">
																${item.price.toFixed(2)}
															</span>
														</div>
														<div className="flex items-center justify-between gap-2 mt-0.5">
															<p className="text-gray-500 text-xs truncate">{item.description || 'No description'}</p>
															{!item.isAvailable && (
																<span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">
																	Sold out
																</span>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								))
							)}
						</div>
					)}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Rating breakdown */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-yellow-500 mb-2">{reviewStats.average}</div>
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={20} fill={i < Math.round(reviewStats.average) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm">Based on {reviewStats.total} reviews</p>
                  </div>
                  <div className="space-y-2">
                    {reviewStats.distribution.map(({ stars, count }) => (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16 text-sm text-gray-400">
                          <Star size={14} fill="currentColor" className="text-yellow-500" />
                          {stars}
                        </div>
                        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-yellow-500 h-full rounded-full transition-all"
                            style={{ width: `${(count / reviewStats.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-400 text-sm w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews list */}
              <div className="space-y-4">
								{/* Reviews header with sort */}
								<div className="flex items-center justify-between">
									<h2 className="text-xl font-bold text-white">
										Reviews <span className="text-gray-500 text-sm font-normal">({reviewStats.total})</span>
									</h2>
									<select
										value={reviewSort}
										onChange={(e) => setReviewSort(e.target.value)}
										className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
									>
										<option value="newest">Newest First</option>
										<option value="oldest">Oldest First</option>
										<option value="highest">Highest Rated</option>
										<option value="lowest">Lowest Rated</option>
									</select>
								</div>
                {reviewsToShow.map((review) => (
                  <div key={review.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-gray-900 font-bold">
                          {review.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{review.user?.name || 'Anonymous'}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < review.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{review.comment}</p>
                    {review.response && (
                      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck size={14} className="text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400 uppercase">Owner Response</span>
                        </div>
                        <p className="text-gray-300 text-sm">{review.response.responseText}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {restaurant.reviews.length > 5 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition flex items-center justify-center gap-2"
                >
                  {showAllReviews ? (
                    <>Show less <ChevronUp size={18} /></>
                  ) : (
                    <>Show all {restaurant.reviews.length} reviews <ChevronDown size={18} /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Hours Tab */}
          {activeTab === 'hours' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Opening Hours</h2>
              {restaurant.hours.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Hours not available</p>
              ) : (
                <div className="space-y-3">
                  {DAYS.map((day) => {
                    const hoursForDay = restaurant.hours.find(h => h.day === day);
                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                          isToday ? 'bg-yellow-500/10 border border-yellow-500/20' : ''
                        }`}
                      >
                        <span className={`font-medium ${isToday ? 'text-yellow-500' : 'text-gray-300'}`}>
                          {day}
                          {isToday && <span className="ml-2 text-xs">(Today)</span>}
                        </span>
                        <span className="text-gray-400 text-sm">
													{hoursForDay && !hoursForDay.isClosed
														? `${formatTime(hoursForDay.openTime)} – ${formatTime(hoursForDay.closeTime)}`
														: 'Closed'}
												</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}