import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronLeft, ChevronRight, Heart, MapPin, Sparkles } from 'lucide-react';
import api from '../../api';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../../utils/imageHelper';
import { useAuth } from '../../context/AuthContext';

export default function FeaturedProductsCarousel() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await api.get('/featured/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Fetch featured products error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll loop
  useEffect(() => {
    if (products.length <= 4 || isPaused) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [products, isPaused]);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatPrice = (p) => {
    if (p.isFree || p.price === 0) return 'Tặng miễn phí 0đ';
    return new Intl.NumberFormat('vi-VN').format(p.price) + ' đ';
  };

  const conditionLabels = {
    NEW: 'Mới 100%',
    LIKE_NEW: 'Như mới 99%',
    GOOD: 'Dùng tốt',
    USED: 'Đã dùng',
    OLD: 'Cũ / Pass nhanh'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse">
        <div className="h-6 bg-slate-100 rounded-md w-48 mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="min-w-[220px] h-56 bg-slate-50 rounded-2xl border border-slate-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't render section if admin hasn't selected any featured products
  }

  return (
    <section 
      className="relative bg-white p-5 sm:p-6 rounded-3xl border border-rose-200/70 shadow-sm overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                SẢN PHẨM NỔI BẬT
              </h2>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {products.length} / 20 HOT DEALS
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Được tuyển chọn đặc biệt dành cho sinh viên, giá tốt và tình trạng kiểm định rõ ràng
            </p>
          </div>
        </div>

        {/* Desktop Navigation Buttons */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
            title="Xem trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
            title="Xem tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Ribbon Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth no-scrollbar py-1 px-0.5 touch-pan-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product) => {
          const mainImage = getImageUrl(product.images?.[0]?.url, DEFAULT_PRODUCT_IMAGE);
          return (
            <div
              key={product.id}
              className="group min-w-[210px] sm:min-w-[230px] max-w-[230px] bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-200 flex flex-col justify-between overflow-hidden shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Product Image */}
              <Link to={`/product/${product.id}`} className="relative block aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={mainImage}
                  alt={product.title}
                  onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Condition Badge */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  <span className="bg-slate-900/80 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {conditionLabels[product.condition] || product.condition}
                  </span>
                </div>

                {/* Hot Badge */}
                <span className="absolute bottom-2 left-2 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  <span>HOT</span>
                </span>
              </Link>

              {/* Product Details */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-1 mb-1">
                    <span className={`font-extrabold text-sm ${
                      product.isFree || product.price === 0 ? 'text-emerald-600 font-black' : 'text-rose-600'
                    }`}>
                      {formatPrice(product)}
                    </span>
                  </div>

                  <Link to={`/product/${product.id}`} className="block">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-rose-600 transition-colors leading-snug">
                      {product.title}
                    </h3>
                  </Link>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-semibold text-emerald-700 truncate max-w-[110px]">
                    🏫 {product.university?.shortName || product.district}
                  </span>
                  <span className="text-slate-400">
                    @{product.seller?.username}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
