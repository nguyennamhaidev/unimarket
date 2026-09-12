import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/common/ProductCard';
import api from '../api';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/favorites');
      return;
    }
    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/my-favorites');
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = (productId, isFav) => {
    if (!isFav) {
      setFavorites(prev => prev.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <span>Sản phẩm yêu thích đã lưu</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Danh sách các món đồ bạn đã đánh dấu quan tâm để theo dõi giá và liên hệ
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách đã lưu...</div>
      ) : favorites.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Heart className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">Chưa có sản phẩm yêu thích nào</h3>
          <p className="text-xs text-slate-400">Bấm biểu tượng trái tim ở bất kỳ sản phẩm nào để lưu lại xem sau.</p>
          <Link
            to="/products"
            className="inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            Khám phá ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {favorites.map(p => (
            <ProductCard
              key={p.id}
              product={{ ...p, isFavorited: true }}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}