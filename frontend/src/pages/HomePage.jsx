import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  Gift, 
  Clock, 
  MapPin, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Users,
  Search
} from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import FeaturedShopsCarousel from '../components/home/FeaturedShopsCarousel';
import FeaturedProductsCarousel from '../components/home/FeaturedProductsCarousel';
import api from '../api';

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
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

    // 3. Featured products (sort by views)
    api.get('/products?sortBy=views&limit=8').then(res => setFeaturedProducts(res.data.products || [])).catch(console.error);

    // 4. Free products (0đ)
    api.get('/products?isFree=true&limit=4').then(res => setFreeProducts(res.data.products || [])).catch(console.error);

    // 5. Newest products
    api.get('/products?sortBy=newest&limit=8').then(res => setNewestProducts(res.data.products || [])).catch(console.error);

    // 6. Near items (e.g. Cầu Giấy or Hai Bà Trưng)
    api.get('/products?district=Hai Bà Trưng&limit=4').then(res => setNearProducts(res.data.products || [])).catch(console.error);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Banner Section */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* SECTION 1: GIAN HÀNG NỔI BẬT (15 SLOTS CAROUSEL) */}
        <FeaturedShopsCarousel />

        {/* SECTION 2: SẢN PHẨM NỔI BẬT (20 SLOTS CAROUSEL) */}
        <FeaturedProductsCarousel />

        {/* Categories Grid */}
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

        {/* University Fast Selector Bar */}
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

        {/* Free Stuff Section (0đ - Spec Section 39) */}
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

        {/* Featured Products (Spec Section 5 & 38) */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Sản phẩm được quan tâm nhiều</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Nhiều lượt xem và trao đổi nhất tuần này</p>
            </div>
            <Link to="/products?sortBy=views" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              <span>Xem thêm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Near Campus / Dorm Section (Spec Section 36) */}
        {nearProducts.length > 0 && (
          <section className="bg-white p-6 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <span>Khu vực Hai Bà Trưng &amp; Cầu Giấy</span>
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

        {/* Newest Products (Spec Section 37) */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Mới đăng gần đây</span>
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

      </div>
    </div>
  );
}