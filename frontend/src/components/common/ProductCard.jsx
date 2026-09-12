import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function ProductCard({ product, onFavoriteToggle }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(product.isFavorited || false);
  const [favCount, setFavCount] = useState(product.favoritesCount || 0);

  const formatPrice = (price) => {
    if (product.isFree || price === 0) return 'Tặng miễn phí 0đ';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const conditionLabels = {
    NEW: 'Mới 100%',
    LIKE_NEW: 'Như mới 99%',
    GOOD: 'Dùng tốt',
    USED: 'Đã sử dụng',
    OLD: 'Cũ / Pass nhanh'
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      const res = await api.post(`/products/${product.id}/favorite`);
      setIsFav(res.data.favorited);
      setFavCount(prev => res.data.favorited ? prev + 1 : Math.max(0, prev - 1));
      if (onFavoriteToggle) onFavoriteToggle(product.id, res.data.favorited);
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 flex flex-col overflow-hidden">
      
      {/* Image Wrap */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={mainImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Condition Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            {conditionLabels[product.condition] || product.condition}
          </span>
          {product.isNegotiable && !product.isFree && (
            <span className="bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              Có thương lượng
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition-all ${
            isFav
              ? 'bg-rose-50 text-rose-500 shadow-md shadow-rose-500/20 scale-105'
              : 'bg-white/80 text-slate-500 hover:bg-white hover:text-rose-500 shadow-sm'
          }`}
          title={isFav ? 'Bỏ yêu thích' : 'Lưu sản phẩm'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Sold Overlay */}
        {product.status === 'SOLD' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-lg tracking-wider uppercase">
              Đã bán
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          
          {/* Price */}
          <div className="flex items-baseline justify-between gap-1 mb-1">
            <span className={`font-extrabold text-base tracking-tight ${
              product.isFree || product.price === 0
                ? 'text-emerald-600 font-black'
                : 'text-rose-600'
            }`}>
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 hover:text-emerald-600 transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Meta details */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-500">
          
          {/* University & Location */}
          <div className="flex items-center justify-between text-slate-500 truncate gap-1">
            <div className="flex items-center gap-1 font-semibold text-emerald-700 truncate bg-emerald-50/70 px-1.5 py-0.5 rounded">
              <span className="truncate">🏫 {product.university?.shortName || 'Khuôn viên'}</span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 text-slate-400">
              <MapPin className="w-3 h-3" />
              <span>{product.district}</span>
            </div>
          </div>

          {/* Seller snippet */}
          {product.seller && (
            <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1">
              <span className="truncate max-w-[120px]">Bởi {product.seller.fullName}</span>
              <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                <Star className="w-3 h-3 fill-current" />
                <span>{product.seller.rating || 5.0}</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}