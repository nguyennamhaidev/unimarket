import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  Gift, 
  Clock, 
  MapPin, 
  GraduationCap, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Store, 
  Package, 
  Heart, 
  Search, 
  Award,
  MessageSquare
} from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import VipSlotContactModal from '../components/common/VipSlotContactModal';
import api from '../api';

// Helper: Build exactly 20 slots for Products (filled with actual items or styled VIP placeholders)
function build20ProductSlots(products) {
  const slots = Array.from({ length: 20 }, (_, index) => {
    const slotNum = index + 1;
    return {
      id: `placeholder-prod-${slotNum}`,
      slotNumber: slotNum,
      isPlaceholder: true,
      title: `Slot VIP #${String(slotNum).padStart(2, '0')} - Ghim Top 1`,
    };
  });

  const unassigned = [];
  (products || []).forEach((prod) => {
    if (prod.slotNumber && prod.slotNumber >= 1 && prod.slotNumber <= 20) {
      slots[prod.slotNumber - 1] = { ...prod, isPlaceholder: false };
    } else {
      unassigned.push(prod);
    }
  });

  let unassignedIdx = 0;
  for (let i = 0; i < 20 && unassignedIdx < unassigned.length; i++) {
    if (slots[i].isPlaceholder) {
      slots[i] = { ...unassigned[unassignedIdx], slotNumber: i + 1, isPlaceholder: false };
      unassignedIdx++;
    }
  }

  return slots;
}

// Helper: Build exactly 20 slots for Shops (filled with actual items or styled VIP placeholders)
function build20ShopSlots(shops) {
  const slots = Array.from({ length: 20 }, (_, index) => {
    const slotNum = index + 1;
    return {
      id: `placeholder-shop-${slotNum}`,
      slotNumber: slotNum,
      isPlaceholder: true,
      fullName: `Gian Hàng VIP #${String(slotNum).padStart(2, '0')}`,
    };
  });

  const unassigned = [];
  (shops || []).forEach((shop) => {
    if (shop.slotNumber && shop.slotNumber >= 1 && shop.slotNumber <= 20) {
      slots[shop.slotNumber - 1] = { ...shop, isPlaceholder: false };
    } else {
      unassigned.push(shop);
    }
  });

  let unassignedIdx = 0;
  for (let i = 0; i < 20 && unassignedIdx < unassigned.length; i++) {
    if (slots[i].isPlaceholder) {
      slots[i] = { ...unassigned[unassignedIdx], slotNumber: i + 1, isPlaceholder: false };
      unassignedIdx++;
    }
  }

  return slots;
}

// -------------------------------------------------------------
// Component: Featured Products Carousel (20 Slots, Smooth Continuous Gliding, Pause on Hover)
// -------------------------------------------------------------
function FeaturedProductsCarousel({ products = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const scrollContainerRef = useRef(null);

  const allSlots = build20ProductSlots(products);
  const activeCount = (products || []).length;

  // Duplicate slots to create seamless infinite loop
  const displaySlots = [...allSlots, ...allSlots];

  // Smooth continuous auto-glide
  useEffect(() => {
    if (isHovered) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let animationId;
    const speed = 0.85; // Balanced steady glide speed

    const glide = () => {
      if (!isHovered && container) {
        container.scrollLeft += speed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(glide);
    };

    animationId = requestAnimationFrame(glide);
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isHovered]);

  const handleManualScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenVipSlot = (slotNum) => {
    setSelectedSlot(slotNum);
    setVipModalOpen(true);
  };

  return (
    <section 
      className="relative bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-6 rounded-3xl border border-amber-500/20 shadow-sm overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>TOP 20 NỔI BẬT</span>
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Sản Phẩm Nổi Bật</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Tự động luân chuyển liên tục toàn bộ 20 Slot ({activeCount}/20 Đã đăng ký • Rê chuột để dừng xem)
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleManualScroll('left')}
            className="w-8 h-8 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleManualScroll('right')}
            className="w-8 h-8 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Smooth Auto-Gliding Carousel Ribbon */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 touch-pan-x select-none"
      >
        {displaySlots.map((prod, idx) => {
          const slotNum = String(prod.slotNumber || (idx % 20) + 1).padStart(2, '0');

          if (prod.isPlaceholder) {
            return (
              <div
                key={`p-ph-${prod.slotNumber}-${idx}`}
                className="group relative min-w-[210px] sm:min-w-[230px] max-w-[230px] bg-gradient-to-b from-white via-amber-50/40 to-amber-100/40 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/15 transition-all duration-300 flex flex-col justify-between p-4 text-center min-h-[290px] shrink-0"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 border border-amber-300">
                    <Star className="w-3 h-3 text-amber-600 fill-current" />
                    <span>Slot {slotNum}</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded animate-pulse">
                    Đang mở
                  </span>
                </div>

                {/* Middle Icon & Text */}
                <div className="my-auto py-2 space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 line-clamp-2">
                      Vị Trí SP Nổi Bật #{slotNum}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Ghim đầu trang tiếp cận 10.000+ sinh viên
                    </p>
                  </div>
                </div>

                {/* Action Button: Opens Support / Admin / CTV Selector Modal */}
                <button
                  type="button"
                  onClick={() => handleOpenVipSlot(prod.slotNumber)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Đăng ký Slot này</span>
                </button>
              </div>
            );
          }

          const imgUrl = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

          return (
            <div
              key={`p-real-${prod.id}-${idx}`}
              className="group relative min-w-[210px] sm:min-w-[230px] max-w-[230px] bg-white rounded-2xl border border-slate-200/80 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden shrink-0"
            >
              {/* Image & Slot Badge */}
              <Link to={`/product/${prod.id}`} className="relative block aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={imgUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Slot {slotNum}</span>
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <span className="bg-slate-900/80 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {prod.category?.name || 'Đồ sinh viên'}
                  </span>
                </div>
              </Link>

              {/* Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-extrabold text-base text-rose-600 tracking-tight">
                      {prod.isFree || prod.price === 0
                        ? '0đ Miễn phí'
                        : new Intl.NumberFormat('vi-VN').format(prod.price) + ' đ'}
                    </span>
                    {prod.seller?.totalSold > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Đã bán {prod.seller.totalSold}
                      </span>
                    )}
                  </div>

                  <Link to={`/product/${prod.id}`}>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug">
                      {prod.title}
                    </h3>
                  </Link>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[110px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    🏫 {prod.university?.shortName || prod.district || 'Hà Nội'}
                  </span>
                  {prod.seller && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                      @{prod.seller.username}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIP Slot Contact Modal */}
      <VipSlotContactModal
        isOpen={vipModalOpen}
        onClose={() => setVipModalOpen(false)}
        slotNumber={selectedSlot}
        slotType="product"
      />
    </section>
  );
}

// -------------------------------------------------------------
// Component: Featured Shops Carousel (20 Slots, Smooth Continuous Gliding, Pause on Hover)
// -------------------------------------------------------------
function FeaturedShopsCarousel({ shops = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const scrollContainerRef = useRef(null);

  const allSlots = build20ShopSlots(shops);
  const activeCount = (shops || []).length;

  // Duplicate slots to create seamless infinite loop
  const displaySlots = [...allSlots, ...allSlots];

  // Smooth continuous auto-glide
  useEffect(() => {
    if (isHovered) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let animationId;
    const speed = 0.85; // Balanced steady glide speed

    const glide = () => {
      if (!isHovered && container) {
        container.scrollLeft += speed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(glide);
    };

    animationId = requestAnimationFrame(glide);
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isHovered]);

  const handleManualScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenVipSlot = (slotNum) => {
    setSelectedSlot(slotNum);
    setVipModalOpen(true);
  };

  return (
    <section 
      className="relative bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent p-4 sm:p-6 rounded-3xl border border-indigo-500/20 shadow-sm overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
              <Store className="w-3.5 h-3.5" />
              <span>TOP 20 GIAN HÀNG</span>
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Gian Hàng Nổi Bật</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Tự động luân chuyển liên tục toàn bộ 20 Gian hàng ({activeCount}/20 Đã chứng thực • Rê chuột để dừng xem)
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleManualScroll('left')}
            className="w-8 h-8 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleManualScroll('right')}
            className="w-8 h-8 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Smooth Auto-Gliding Shops Ribbon */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 touch-pan-x select-none"
      >
        {displaySlots.map((shop, idx) => {
          const slotNum = String(shop.slotNumber || (idx % 20) + 1).padStart(2, '0');

          if (shop.isPlaceholder) {
            return (
              <div
                key={`s-ph-${shop.slotNumber}-${idx}`}
                className="group relative min-w-[200px] sm:min-w-[220px] max-w-[220px] bg-gradient-to-b from-white via-indigo-50/40 to-indigo-100/40 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/15 transition-all duration-300 flex flex-col justify-between items-center text-center p-4 min-h-[260px] shrink-0"
              >
                {/* Slot Badge */}
                <div className="w-full flex items-center justify-between">
                  <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black px-2 py-0.5 rounded-lg border border-indigo-300">
                    Shop {slotNum}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-200/70 px-1.5 py-0.5 rounded animate-pulse">
                    Đang mở
                  </span>
                </div>

                {/* Avatar Icon */}
                <div className="my-auto py-2 space-y-2 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    🏬
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                      Gian Hàng VIP #{slotNum}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Chứng thực Top Shop sinh viên uy tín
                    </p>
                  </div>
                </div>

                {/* CTA Button: Opens Support / Admin / CTV Selector Modal */}
                <button
                  type="button"
                  onClick={() => handleOpenVipSlot(shop.slotNumber)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Đăng ký Top Shop</span>
                </button>
              </div>
            );
          }

          const avatarUrl = shop.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${shop.username}`;

          return (
            <div
              key={`s-real-${shop.id}-${idx}`}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 p-4 flex flex-col justify-between items-center text-center transition-all duration-300 relative group min-w-[200px] sm:min-w-[220px] max-w-[220px] shrink-0"
            >
              {/* Slot Badge */}
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-200">
                  Shop {slotNum}
                </span>
              </div>

              {/* Avatar */}
              <div className="relative mt-3 mb-2">
                <img
                  src={avatarUrl}
                  alt={shop.fullName}
                  className="w-16 h-16 rounded-2xl object-cover bg-indigo-50 border-2 border-indigo-100 group-hover:scale-105 transition-transform duration-200 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                  ✓
                </span>
              </div>

              {/* Info */}
              <div className="space-y-1 w-full">
                <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                  {shop.fullName}
                </h3>
                <div className="text-[11px] text-slate-400 truncate">@{shop.username}</div>

                {/* Rating & Sold */}
                <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{shop.rating || 5.0}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {shop.activeProductsCount || 0} sản phẩm
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                to={`/profile/${shop.id}`}
                className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs rounded-xl transition-all border border-indigo-200/60 flex items-center justify-center gap-1 shadow-2xs"
              >
                <span>Xem gian hàng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* VIP Slot Contact Modal */}
      <VipSlotContactModal
        isOpen={vipModalOpen}
        onClose={() => setVipModalOpen(false)}
        slotNumber={selectedSlot}
        slotType="shop"
      />
    </section>
  );
}

// -------------------------------------------------------------
// Main HomePage Component
// -------------------------------------------------------------
export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [freeProducts, setFreeProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [nearProducts, setNearProducts] = useState([]);
  const [activeUni, setActiveUni] = useState('');
  const [quickSearch, setQuickSearch] = useState('');

  const fetchRecommendations = async () => {
    setLoadingRecommended(true);
    try {
      const res = await api.get('/products/recommended?limit=12');
      setRecommendedProducts(res.data.products || []);
    } catch (err) {
      console.error('Fetch recommendations error:', err);
    } finally {
      setLoadingRecommended(false);
    }
  };

  useEffect(() => {
    // 1. Fetch categories
    api.get('/categories').then(res => setCategories(res.data.categories || [])).catch(console.error);

    // 2. Fetch universities
    api.get('/universities').then(res => setUniversities(res.data.universities || [])).catch(console.error);

    // 3. Featured Products from /api/featured/products (Admin/CTV curated - Max 20)
    api.get('/featured/products').then(res => setFeaturedProducts(res.data.featuredProducts || [])).catch(console.error);

    // 4. Featured Shops from /api/featured/shops (Admin/CTV curated - Max 20)
    api.get('/featured/shops').then(res => setFeaturedShops(res.data.featuredShops || [])).catch(console.error);

    // 5. Recommended products (Random: 30% Top Sellers + 70% Other Active Products)
    fetchRecommendations();

    // 6. Near items (Hai Bà Trưng / Cầu Giấy)
    api.get('/products?district=Hai Bà Trưng&limit=4').then(res => setNearProducts(res.data.products || [])).catch(console.error);

    // 7. Free products (0đ)
    api.get('/products?isFree=true&limit=4').then(res => setFreeProducts(res.data.products || [])).catch(console.error);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* 1. Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 rounded-3xl mx-3 sm:mx-6 mt-4 shadow-xl shadow-emerald-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_50%)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-5 backdrop-blur">
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>Chợ Sinh Viên UniMarket - Pass Đồ Không Qua Trung Gian</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Mua bán giáo trình, laptop &amp; đồ trọ <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-amber-200 bg-clip-text text-transparent">
              ngay tại khuôn viên trường của bạn
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            Hẹn gặp trực tiếp tại Cổng trường, KTX, Quán trà sữa. Không phí hoa hồng, không cần thẻ ngân hàng, không lộ địa chỉ riêng tư.
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl mx-auto flex items-center bg-white p-1.5 rounded-2xl shadow-2xl border border-white/20">
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Nhập tên giáo trình, máy tính, quạt, bàn học..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 shrink-0"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Popular Tag Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-emerald-100/70">
            <span className="font-semibold text-emerald-200">Gợi ý hot:</span>
            <Link to="/products?search=Giáo trình" className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur transition-colors">
              📚 Giáo trình Bách Khoa - NEU
            </Link>
            <Link to="/products?search=ThinkPad" className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur transition-colors">
              💻 ThinkPad sinh viên IT
            </Link>
            <Link to="/products?search=Bàn học" className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur transition-colors">
              🪑 Bàn gấp KTX
            </Link>
            <Link to="/products?isFree=true" className="bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 px-2.5 py-1 rounded-lg font-bold backdrop-blur transition-colors">
              🎁 Đồ tặng 0đ
            </Link>
          </div>

        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 2. 🔥 SẢN PHẨM NỔI BẬT (20 Slots Always Active) */}
        <FeaturedProductsCarousel products={featuredProducts} />

        {/* 3. ⭐ GIAN HÀNG NỔI BẬT (20 Slots Always Active) */}
        <FeaturedShopsCarousel shops={featuredShops} />

        {/* 4. ✨ GỢI Ý DÀNH CHO BẠN (30% Top Sellers / 70% Sinh Viên) */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>DÀNH CHO BẠN</span>
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Gợi Ý Dành Cho Bạn</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bốc ngẫu nhiên 30% từ các gian hàng uy tín &amp; 70% từ toàn bộ sản phẩm sinh viên trên hệ thống
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={fetchRecommendations}
                disabled={loadingRecommended}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-2xs cursor-pointer"
                title="Bốc ngẫu nhiên gợi ý mới"
              >
                <span className={loadingRecommended ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
                <span>Đổi gợi ý khác</span>
              </button>
              <Link to="/products" className="text-xs font-bold text-slate-600 hover:text-emerald-700 hover:underline flex items-center gap-1 ml-2">
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loadingRecommended ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recommendedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Đang làm mới các sản phẩm gợi ý...
            </div>
          )}
        </section>

        {/* 5. 📍 GẦN BẠN */}
        {nearProducts.length > 0 && (
          <section className="bg-white p-6 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <span>Khu Vực Gần Bạn (Hai Bà Trưng &amp; Cầu Giấy)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Gần KTX Bách Khoa, KTX NEU, KTX Mễ Trì tiện hẹn lấy đồ</p>
              </div>
              <Link to="/products?district=Hai Bà Trưng" className="text-xs font-bold text-emerald-700 hover:underline">
                Xem theo khu vực →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {nearProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* 6. 🎁 GÓC CHO TẶNG ĐỒ 0đ */}
        {freeProducts.length > 0 && (
          <section className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 rounded-3xl border border-emerald-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                    Miễn phí 100%
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    <span>Góc Cho Tặng Đồ 0đ</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Giáo trình, ấm siêu tốc, đồ trọ được các anh chị khóa trên tặng lại miễn phí cho tân sinh viên.
                </p>
              </div>
              <Link
                to="/products?isFree=true"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shrink-0"
              >
                Xem tất cả đồ 0đ
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {freeProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* 7. Khám phá theo danh mục */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Khám phá theo danh mục</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Tất cả đồ dùng thiết yếu cho đời sống sinh viên</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline">
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?categorySlug=${cat.slug}`}
                className="group p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 transition-all text-center flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-700 flex items-center justify-center text-2xl transition-all duration-200">
                  {cat.icon || '📦'}
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {cat.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {cat._count?.products || 0} món đồ
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Lọc nhanh theo Trường Đại Học */}
        <section className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Lọc nhanh theo Trường Đại Học
              </h3>
            </div>
            <Link to="/products" className="text-xs text-slate-500 hover:text-emerald-600">
              Tất cả các trường →
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveUni('')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                activeUni === ''
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Tất cả ({universities.length})
            </button>
            {universities.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  setActiveUni(u.id);
                  navigate(`/products?universityId=${u.id}`);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                  activeUni === u.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                🏫 {u.shortName}
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}