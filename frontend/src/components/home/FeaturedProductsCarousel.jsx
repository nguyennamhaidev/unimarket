import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronLeft, ChevronRight, Star, ArrowRight } from 'lucide-react';
import api from '../../api';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../../utils/imageHelper';

function build20ProductSlots(products) {
  const slots = Array.from({ length: 20 }, (_, index) => {
    const slotNum = index + 1;
    return {
      id: `placeholder-prod-${slotNum}`,
      slotNumber: slotNum,
      isPlaceholder: true,
      title: `Slot VIP #${String(slotNum).padStart(2, '0')}`,
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

export default function FeaturedProductsCarousel() {
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
      setProducts(res.data.products || res.data.featuredProducts || []);
    } catch (err) {
      console.error('Fetch featured products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const allSlots = build20ProductSlots(products);
  const activeCount = products.length;

  // Auto-scroll loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

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

  return (
    <section 
      className="relative bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 rounded-3xl border border-amber-300/60 shadow-sm overflow-hidden"
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
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {activeCount} / 20 SLOT HOẠT ĐỘNG
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Được tuyển chọn đặc biệt dành cho sinh viên, giá tốt và tình trạng kiểm định rõ ràng (Tự động luân chuyển liên tục)
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
        {allSlots.map((product, idx) => {
          const slotNum = String(product.slotNumber || idx + 1).padStart(2, '0');

          if (product.isPlaceholder) {
            return (
              <div
                key={`ph-${product.slotNumber}-${idx}`}
                className="min-w-[210px] sm:min-w-[230px] max-w-[230px] bg-gradient-to-b from-white to-amber-50/50 rounded-2xl border-2 border-dashed border-amber-300 p-4 flex flex-col justify-between text-center shrink-0 min-h-[290px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="flex items-center justify-between">
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-amber-600" />
                    <span>Slot {slotNum}</span>
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.2 rounded">
                    Đang mở
                  </span>
                </div>

                <div className="my-auto py-2 space-y-1">
                  <div className="text-2xl">✨</div>
                  <h4 className="font-bold text-xs text-slate-800">Vị Trí SP VIP #{slotNum}</h4>
                  <p className="text-[10px] text-slate-500">Tiếp cận 10.000+ sinh viên</p>
                </div>

                <Link
                  to="/messages"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                >
                  <span>Đăng ký Slot</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          }

          const mainImage = getImageUrl(product.images?.[0]?.url, DEFAULT_PRODUCT_IMAGE);
          return (
            <div
              key={product.id}
              className="group min-w-[210px] sm:min-w-[230px] max-w-[230px] bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-200 flex flex-col justify-between overflow-hidden shrink-0"
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
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                    Slot {slotNum}
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
