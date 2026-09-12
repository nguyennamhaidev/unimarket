import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, PlusCircle, CheckCircle2, EyeOff, Eye, Trash2, Edit3, Heart, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';
import api from '../api';

export default function MyProductsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, SOLD, HIDDEN
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/my-products');
      return;
    }
    loadMyProducts();
  }, [isAuthenticated, activeTab]);

  const loadMyProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/my-products', { params: { status: activeTab } });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = async (id) => {
    if (!window.confirm('Đánh dấu sản phẩm này là ĐÃ BÁN?')) return;
    try {
      await api.post(`/products/${id}/sold`);
      loadMyProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi');
    }
  };

  const handleToggleHide = async (id) => {
    try {
      await api.post(`/products/${id}/toggle-hide`);
      loadMyProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này?')) return;
    try {
      await api.delete(`/products/${id}`);
      loadMyProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý sản phẩm của tôi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi, chỉnh sửa và cập nhật trạng thái đồ bạn đang đăng bán
          </p>
        </div>

        <Link
          to="/post"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Đăng bán món mới</span>
        </Link>
      </div>

      {/* Tabs (Spec Section 25) */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'ACTIVE', label: 'Đang bán' },
          { id: 'SOLD', label: 'Đã bán' },
          { id: 'HIDDEN', label: 'Đã ẩn' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách...</div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">Chưa có sản phẩm nào ở mục này</h3>
          <Link
            to="/post"
            className="inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            Đăng món đồ đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={getImageUrl(p.images?.[0]?.url || p.images?.[0])}
                  onError={handleImageError}
                  alt={p.title || 'Sản phẩm'}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <Link to={`/product/${p.id}`} className="font-bold text-sm text-slate-900 hover:text-emerald-600 truncate block">
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="font-black text-rose-600">
                      {p.isFree ? '0đ - Cho tặng' : new Intl.NumberFormat('vi-VN').format(p.price) + ' đ'}
                    </span>
                    <span className="text-slate-400">• {p.category?.name}</span>
                    <span className="text-slate-400">• {p.district}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>❤️ {p._count?.favorites || 0} yêu thích</span>
                    <span>💬 {p._count?.conversations || 0} cuộc chat</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Spec Section 25) */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                {p.status !== 'SOLD' && (
                  <button
                    onClick={() => handleMarkAsSold(p.id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã bán</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleHide(p.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  {p.status === 'HIDDEN' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{p.status === 'HIDDEN' ? 'Hiện tin' : 'Ẩn tin'}</span>
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                  title="Xóa tin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}