import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  Flag, 
  MessageSquare, 
  Star, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Eye, 
  ShieldCheck, 
  Store, 
  AlertCircle,
  Clock,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/common/ProductCard';
import api from '../api';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('SCAM');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.product);
      setRelatedProducts(res.data.relatedProducts || []);
      setIsFav(res.data.product.isFavorited);
      setIsFollowing(res.data.product.isFollowing);
      setActiveImageIndex(0);
    } catch (err) {
      console.error('Fetch product error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const res = await api.post(`/products/${id}/favorite`);
      setIsFav(res.data.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const res = await api.post(`/users/${product.sellerId}/follow`);
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (product.sellerId === user?.id) {
      alert('Đây là sản phẩm của bạn đăng bán!');
      return;
    }
    try {
      const res = await api.post('/chat/conversation', { productId: product.id });
      navigate(`/messages?id=${res.data.conversation.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi mở cuộc trò chuyện.');
    }
  };

  const handleMarkAsSold = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đánh dấu sản phẩm này là ĐÃ BÁN?')) return;
    try {
      await api.post(`/products/${id}/sold`);
      alert('Đã cập nhật trạng thái ĐÃ BÁN!');
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi đánh dấu đã bán.');
    }
  };

  const handleToggleHide = async () => {
    try {
      const res = await api.post(`/products/${id}/toggle-hide`);
      alert(res.data.message);
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thao tác.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này?')) return;
    try {
      await api.delete(`/products/${id}`);
      alert('Đã xóa sản phẩm thành công!');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa sản phẩm.');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setReporting(true);
    try {
      await api.post('/reports', {
        productId: product.id,
        reportedUserId: product.sellerId,
        reason: reportReason,
        description: reportDescription
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportDescription('');
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi báo cáo.');
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100"></div>
          <div className="font-semibold text-sm">Đang tải thông tin sản phẩm...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy sản phẩm</h2>
        <p className="text-xs text-slate-500">Sản phẩm này có thể đã bị xóa hoặc người bán đã ẩn đi.</p>
        <Link to="/products" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === product.sellerId;
  const conditionLabels = {
    NEW: 'Mới 100% (Chưa sử dụng)',
    LIKE_NEW: 'Như mới 99% (Dùng rất ít)',
    GOOD: 'Dùng tốt (Không lỗi lầm)',
    USED: 'Đã qua sử dụng',
    OLD: 'Cũ / Pass nhanh giá rẻ'
  };

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80' }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-600">Trang chủ</Link>
        <span>/</span>
        <Link to={`/products?categorySlug=${product.category?.slug}`} className="hover:text-emerald-600">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
            <img
              src={images[activeImageIndex]?.url}
              alt={product.title}
              className="w-full h-full object-contain bg-slate-900/5"
            />
            {product.status === 'SOLD' && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-rose-600 text-white font-black text-sm sm:text-base px-5 py-2 rounded-2xl shadow-xl uppercase tracking-widest">
                  ĐÃ BÁN THÀNH CÔNG
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail list */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-emerald-600 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Safe Campus Trading Tips Box */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Mẹo giao dịch sinh viên an toàn:</span>
              <p className="text-emerald-800 leading-relaxed">
                Hẹn gặp tại nơi công cộng (Cổng trường, thư viện, canteen, KTX). Kiểm tra kỹ chất lượng đồ trước khi thanh toán trực tiếp. Không chuyển cọc trước cho người lạ.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Pricing, Meeting Spot & Seller (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Header & Title */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between gap-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                {conditionLabels[product.condition] || product.condition}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-xl border transition-colors ${
                    isFav ? 'bg-rose-50 text-rose-500 border-rose-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Lưu tin yêu thích"
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                  title="Báo cáo vi phạm"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {product.title}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1 border-t border-slate-100">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                product.isFree || product.price === 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {product.isFree || product.price === 0 ? 'TẶNG MIỄN PHÍ 0đ' : new Intl.NumberFormat('vi-VN').format(product.price) + ' đ'}
              </span>

              {product.isNegotiable && !product.isFree && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                  Có thể thương lượng
                </span>
              )}
            </div>

            {/* Meeting Spot / Campus (Safe Location - No Private Address) */}
            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2 border border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Khu vực: <strong>{product.district}, {product.city || 'Hà Nội'}</strong></span>
              </div>
              {product.university && (
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="shrink-0 text-base">🏫</span>
                  <span>Trường: <strong>{product.university.name} ({product.university.shortName})</strong></span>
                </div>
              )}
              {product.meetingSpotNote && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/70 p-2 rounded-xl">
                  <span className="font-semibold shrink-0">📍 Điểm hẹn đề xuất:</span>
                  <span className="font-bold">{product.meetingSpotNote}</span>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            {isOwner ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center">
                  Bạn là người đăng bán sản phẩm này
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMarkAsSold}
                    disabled={product.status === 'SOLD'}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    {product.status === 'SOLD' ? 'Đã đánh dấu bán' : '✅ Đánh dấu đã bán'}
                  </button>
                  <button
                    onClick={handleToggleHide}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    {product.status === 'HIDDEN' ? 'Hiện lại tin' : 'Ẩn tin bán'}
                  </button>
                </div>
                <button
                  onClick={handleDelete}
                  className="w-full py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
                >
                  Xóa sản phẩm này
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => setShowContactModal(true)}
                  disabled={product.status === 'SOLD'}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{product.status === 'SOLD' ? 'Sản phẩm đã bán' : '💬 Nhắn tin / Liên hệ người bán (Zalo, FB, IG)'}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Bấm để nhắn tin trên sàn hoặc mở Zalo, Facebook, Instagram của bạn ấy!
                </p>
              </div>
            )}

          </div>

          {/* Seller Card (Spec Section 4 & 24) */}
          {product.seller && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <Link to={`/profile/${product.seller.id}`} className="flex items-center gap-3 group">
                  <img
                    src={product.seller.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${product.seller.username}`}
                    alt={product.seller.fullName}
                    className="w-12 h-12 rounded-2xl object-cover bg-emerald-50 border border-emerald-100 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {product.seller.fullName}
                    </h3>
                    <div className="text-xs text-slate-400">@{product.seller.username}</div>
                    {product.seller.university && (
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        🏫 {product.seller.university.shortName} • {product.seller.studentCohort || 'Sinh viên'}
                      </div>
                    )}
                  </div>
                </Link>

                {!isOwner && (
                  <button
                    onClick={handleToggleFollow}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                      isFollowing
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isFollowing ? 'Đang theo dõi' : '+ Theo dõi'}
                  </button>
                )}
              </div>

              {product.seller.bio && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic">
                  "{product.seller.bio}"
                </p>
              )}

              {/* Seller stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{product.seller.rating || 5.0} / 5</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {product.seller.totalReviews || 0} lượt đánh giá
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded-xl">
                  <div className="font-bold text-slate-800">
                    {product.seller.totalSold || 0} đồ
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Đã bán thành công
                  </div>
                </div>
              </div>

              <Link
                to={`/profile/${product.seller.id}`}
                className="block text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-1"
              >
                Xem trang shop cá nhân của người bán →
              </Link>
            </div>
          )}

        </div>

      </div>

      {/* Description & Product Details */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Mô tả chi tiết sản phẩm
          </h3>
          <div className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Danh mục:</span>
            <div className="font-bold text-slate-800 mt-0.5">{product.category?.name}</div>
          </div>
          <div>
            <span className="text-slate-400">Tình trạng:</span>
            <div className="font-bold text-slate-800 mt-0.5">{conditionLabels[product.condition]}</div>
          </div>
          <div>
            <span className="text-slate-400">Ngày đăng:</span>
            <div className="font-bold text-slate-800 mt-0.5">
              {new Date(product.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Lượt xem:</span>
            <div className="font-bold text-slate-800 mt-0.5">{product.views} lượt</div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Sản phẩm tương tự cùng trường / danh mục
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Report Modal (Spec Section 20) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-500" />
                <span>Báo cáo sản phẩm vi phạm</span>
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800">Đã gửi báo cáo thành công!</h4>
                <p className="text-xs text-slate-500">Ban Quản Trị UniMarket sẽ xác minh và xử lý nghiêm.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Lý do báo cáo *</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SCAM">Lừa đảo / Đòi cọc trước</option>
                    <option value="COUNTERFEIT">Hàng giả / Nhái kém chất lượng</option>
                    <option value="PROHIBITED">Hàng cấm / Vũ khí / Chất cấm</option>
                    <option value="WRONG_PRICE">Giá ảo / Giá không đúng thực tế</option>
                    <option value="SPAM">Spam / Đăng tin trùng lặp liên tục</option>
                    <option value="INAPPROPRIATE">Nội dung phản cảm, không phù hợp</option>
                    <option value="OTHER">Lý do khác</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mô tả cụ thể vi phạm *</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả bằng chứng vi phạm của người bán này..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20"
                  >
                    {reporting ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Contact Modal (Zalo, FB, IG & Onsite Chat) */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Link to={`/profile/${product.seller?.id}`} className="hover:opacity-80 transition-opacity">
                  <img
                    src={product.seller?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${product.seller?.username}`}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                  />
                </Link>
                <div>
                  <Link to={`/profile/${product.seller?.id}`} className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors">
                    {product.seller?.fullName}
                  </Link>
                  <div className="text-[11px] text-slate-400">@{product.seller?.username}</div>
                </div>
              </div>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-extrabold text-base text-slate-900">
                Chọn phương thức liên hệ người bán
              </h4>
              <p className="text-xs text-slate-500">
                Bạn có thể chat trực tiếp trên sàn hoặc mở Zalo / Facebook / Instagram của người bán!
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              
              {/* Option 1: On-site Chat */}
              <button
                onClick={() => {
                  setShowContactModal(false);
                  handleStartChat();
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-emerald-600/20 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5" />
                  <span>Nhắn tin trực tiếp trên UniMarket</span>
                </div>
                <span className="text-[11px] opacity-80">Mở chat →</span>
              </button>

              {/* Option 2: Zalo */}
              {(product.zalo || product.seller?.zalo) ? (
                <a
                  href={
                    (product.zalo || product.seller?.zalo).startsWith('http')
                      ? (product.zalo || product.seller?.zalo)
                      : `https://zalo.me/${(product.zalo || product.seller?.zalo).replace(/[^0-9]/g, '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-blue-500/20 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white text-blue-600 font-black text-xs flex items-center justify-center">Z</span>
                    <span>Chat qua Zalo: {product.zalo || product.seller?.zalo}</span>
                  </div>
                  <span className="text-[11px] opacity-80">Mở Zalo →</span>
                </a>
              ) : (
                <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center">Z</span>
                  <span>Người bán chưa cập nhật Zalo</span>
                </div>
              )}

              {/* Option 3: Facebook (Trang cá nhân) */}
              {(product.facebook || product.seller?.facebook) ? (
                <a
                  href={
                    (product.facebook || product.seller?.facebook).startsWith('http')
                      ? (product.facebook || product.seller?.facebook)
                      : `https://facebook.com/${(product.facebook || product.seller?.facebook).replace(/^@/, '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#0c63d4] text-white font-bold text-xs flex items-center justify-between shadow-md shadow-[#1877F2]/20 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white text-[#1877F2] font-black text-xs flex items-center justify-center">f</span>
                    <span>Mở Facebook Trang Cá Nhân (TCN)</span>
                  </div>
                  <span className="text-[11px] opacity-80">Mở Facebook →</span>
                </a>
              ) : (
                <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center">f</span>
                  <span>Người bán chưa cập nhật Facebook</span>
                </div>
              )}

              {/* Option 4: Instagram (Trang cá nhân) */}
              {(product.instagram || product.seller?.instagram) ? (
                <a
                  href={
                    (product.instagram || product.seller?.instagram).startsWith('http')
                      ? (product.instagram || product.seller?.instagram)
                      : `https://instagram.com/${(product.instagram || product.seller?.instagram).replace(/^@/, '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-bold text-xs flex items-center justify-between shadow-md transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white text-rose-600 font-black text-xs flex items-center justify-center">IG</span>
                    <span>Mở Instagram Trang Cá Nhân (TCN)</span>
                  </div>
                  <span className="text-[11px] opacity-80">Mở IG →</span>
                </a>
              ) : (
                <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center">IG</span>
                  <span>Người bán chưa cập nhật Instagram</span>
                </div>
              )}

              {/* Option 5: View Seller Profile */}
              <Link
                to={`/profile/${product.seller?.id}`}
                onClick={() => setShowContactModal(false)}
                className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <Store className="w-4 h-4 text-slate-500" />
                <span>Xem trang cá nhân & shop của {product.seller?.fullName}</span>
              </Link>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}