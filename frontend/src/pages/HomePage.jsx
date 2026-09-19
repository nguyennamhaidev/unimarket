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
  Award
} from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import api from '../api';

// -------------------------------------------------------------
// Component: Featured Products Carousel (20 Slots, Auto Slide, Mobile Swipe)
// -------------------------------------------------------------
function FeaturedProductsCarousel({ products }) {
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const total = products.length;
  // Determine visible count based on screen width (default desktop 5, tablet 3, mobile 1.5)
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(3);
      else setVisibleCount(5);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto slide effect
  useEffect(() => {
    if (total <= visibleCount || isHovered) return;

    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % total);
    }, 3500);

    return () => clearInterval(timer);
  }, [total, visibleCount, isHovered]);

  if (!products || products.length === 0) return null;

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % total);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) handleNext();
    else if (distance < -50) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Slice items with wrap-around
  const displayItems = [];
  const countToTake = Math.min(total, visibleCount);
  for (let i = 0; i < countToTake; i++) {
    const idx = (startIndex + i) % total;
    displayItems.push(products[idx]);
  }

  return (
    <section 
      className="relative bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-6 rounded-3xl border border-amber-500/20 shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-5">
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
            Tuyển chọn đặc biệt bởi Admin &amp; CTV UniMarket ({total}/20 Slot đang hoạt động)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {total > visibleCount && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95"
                title="Sản phẩm trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95"
                title="Sản phẩm tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {displayItems.map((prod, idx) => {
          const imgUrl = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
          const slotNum = prod.slotNumber ? String(prod.slotNumber).padStart(2, '0') : String(idx + 1).padStart(2, '0');

          return (
            <div
              key={`${prod.id}-${idx}`}
              className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Image & Slot Badge */}
              <Link to={`/product/${prod.id}`} className="relative block aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={imgUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Top badges */}
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

                {/* Footer snippet */}
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
    </section>
  );
}

// -------------------------------------------------------------
// Component: Featured Shops Carousel (20 Slots, Auto Slide)
// -------------------------------------------------------------
function FeaturedShopsCarousel({ shops }) {
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const total = shops.length;
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(3);
      else setVisibleCount(5);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (total <= visibleCount || isHovered) return;

    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % total);
    }, 4000);

    return () => clearInterval(timer);
  }, [total, visibleCount, isHovered]);

  if (!shops || shops.length === 0) return null;

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % total);
  };

  const displayItems = [];
  const countToTake = Math.min(total, visibleCount);
  for (let i = 0; i < countToTake; i++) {
    const idx = (startIndex + i) % total;
    displayItems.push(shops[idx]);
  }

  return (
    <section 
      className="relative bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent p-4 sm:p-6 rounded-3xl border border-indigo-500/20 shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => { touchStartX.current = e.targetTouches[0].clientX; }}
      onTouchMove={(e) => { touchEndX.current = e.targetTouches[0].clientX; }}
      onTouchEnd={() => {
        if (!touchStartX.current || !touchEndX.current) return;
        const dist = touchStartX.current - touchEndX.current;
        if (dist > 50) handleNext();
        else if (dist < -50) handlePrev();
        touchStartX.current = null;
        touchEndX.current = null;
      }}
    >
      <div className="flex items-center justify-between mb-5">
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
            Các gian hàng &amp; người bán uy tín được chứng thực bởi Admin ({total}/20 Gian hàng)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {total > visibleCount && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95"
                title="Gian hàng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95"
                title="Gian hàng tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {displayItems.map((shop, idx) => {
          const avatarUrl = shop.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${shop.username}`;
          const slotNum = shop.slotNumber ? String(shop.slotNumber).padStart(2, '0') : String(idx + 1).padStart(2, '0');

          return (
            <div
              key={`${shop.id}-${idx}`}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 p-4 flex flex-col justify-between items-center text-center transition-all duration-300 relative group"
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
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
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
  const [newestProducts, setNewestProducts] = useState([]);
  const [nearProducts, setNearProducts] = useState([]);
  const [activeUni, setActiveUni] = useState('');
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    // 1. Fetch categories
    api.get('/categories').then(res => setCategories(res.data.categories || [])).catch(console.error);

    // 2. Fetch universities
    api.get('/universities').then(res => setUniversities(res.data.universities || [])).catch(console.error);

    // 3. Featured Products from /api/featured/products (Admin/CTV curated - Max 20)
    api.get('/featured/products').then(res => setFeaturedProducts(res.data.featuredProducts || [])).catch(console.error);

    // 4. Featured Shops from /api/featured/shops (Admin/CTV curated - Max 20)
    api.get('/featured/shops').then(res => setFeaturedShops(res.data.featuredShops || [])).catch(console.error);

    // 5. Newest products
    api.get('/products?sortBy=newest&limit=8').then(res => setNewestProducts(res.data.products || [])).catch(console.error);

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
        
        {/* 2. 🔥 SẢN PHẨM NỔI BẬT (Featured Products Carousel) */}
        {featuredProducts.length > 0 && (
          <FeaturedProductsCarousel products={featuredProducts} />
        )}

        {/* 3. ⭐ GIAN HÀNG NỔI BẬT (Featured Shops Carousel) */}
        {featuredShops.length > 0 && (
          <FeaturedShopsCarousel shops={featuredShops} />
        )}

        {/* 4. 🆕 SẢN PHẨM MỚI ĐĂNG */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Sản Phẩm Mới Đăng</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Vừa được các bạn sinh viên đăng bán hôm nay</p>
            </div>
            <Link to="/products?sortBy=newest" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {newestProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
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