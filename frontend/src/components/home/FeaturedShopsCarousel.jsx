import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Store, ChevronLeft, ChevronRight, Star, GraduationCap, Sparkles } from 'lucide-react';
import api from '../../api';
import { getImageUrl, handleImageError, DEFAULT_AVATAR } from '../../utils/imageHelper';

export default function FeaturedShopsCarousel() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchFeaturedShops();
  }, []);

  const fetchFeaturedShops = async () => {
    try {
      const res = await api.get('/featured/shops');
      setShops(res.data.shops || []);
    } catch (err) {
      console.error('Fetch featured shops error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll loop
  useEffect(() => {
    if (shops.length <= 3 || isPaused) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          // Wrap around to start smoothly
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [shops, isPaused]);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse">
        <div className="h-6 bg-slate-100 rounded-md w-48 mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[200px] h-36 bg-slate-50 rounded-2xl border border-slate-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return null; // Don't render section if admin hasn't selected any featured shops
  }

  return (
    <section 
      className="relative bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-5 sm:p-6 rounded-3xl border border-amber-200/80 shadow-sm overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                GIAN HÀNG NỔI BẬT
              </h2>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {shops.length} / 15 TOP SHOP
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Các bạn sinh viên uy tín, phản hồi nhanh và được Ban Quản Trị đề xuất
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
        {shops.map((shop) => {
          const avatarUrl = getImageUrl(shop.avatar, DEFAULT_AVATAR);
          return (
            <Link
              key={shop.id}
              to={`/profile/${shop.id}`}
              className="group min-w-[200px] sm:min-w-[220px] max-w-[220px] bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 flex flex-col justify-between shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={shop.fullName}
                    onError={(e) => handleImageError(e, DEFAULT_AVATAR)}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-300 group-hover:scale-105 transition-transform bg-amber-50"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">
                    ★
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                    {shop.fullName}
                  </h3>
                  <div className="text-[10px] text-slate-400 truncate">@{shop.username}</div>
                  {shop.university && (
                    <div className="text-[10px] font-semibold text-emerald-700 truncate mt-0.5">
                      🏫 {shop.university.shortName}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{shop.rating || 5.0}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {shop.totalSold || 0} đã bán • {shop._count?.products || 0} tin
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
