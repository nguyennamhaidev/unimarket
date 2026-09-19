import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  MessageSquare, 
  AlertTriangle, 
  UserX, 
  ShieldCheck, 
  Clock, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Ban, 
  Eye, 
  PlusCircle, 
  GraduationCap, 
  FolderPlus,
  RefreshCw,
  ExternalLink,
  Star,
  Store,
  Flame,
  ArrowRight,
  History,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isCTV, canManageFeatured, isAuthenticated } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState(isAdmin ? 'overview' : 'featured_products');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Users Tab state
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Products Tab state
  const [productsList, setProductsList] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');

  // Reports Tab state
  const [reportsList, setReportsList] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');

  // Logs state
  const [logsList, setLogsList] = useState([]);

  // Featured Module State
  const [featuredProductSlots, setFeaturedProductSlots] = useState([]);
  const [featuredShopSlots, setFeaturedShopSlots] = useState([]);
  const [featuredLogsList, setFeaturedLogsList] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);

  // Modals for assigning featured
  const [showProductModal, setShowProductModal] = useState(false);
  const [targetSlotForProduct, setTargetSlotForProduct] = useState(1);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProductDuration, setSelectedProductDuration] = useState(30);
  const [customProductDuration, setCustomProductDuration] = useState('');

  const [showShopModal, setShowShopModal] = useState(false);
  const [targetSlotForShop, setTargetSlotForShop] = useState(1);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState([]);
  const [searchingShops, setSearchingShops] = useState(false);
  const [selectedShopDuration, setSelectedShopDuration] = useState(30);
  const [customShopDuration, setCustomShopDuration] = useState('');

  // Modals / forms for category & uni
  const [newUniName, setNewUniName] = useState('');
  const [newUniShort, setNewUniShort] = useState('');
  const [newUniCity, setNewUniCity] = useState('Hà Nội');
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin');
      return;
    }
    if (!canManageFeatured) {
      alert('Bạn không có quyền truy cập trang quản trị!');
      navigate('/');
      return;
    }
    if (isAdmin) {
      loadDashboardStats();
    }
  }, [isAuthenticated, isAdmin, canManageFeatured]);

  useEffect(() => {
    if (activeTab === 'overview' && isAdmin) loadDashboardStats();
    else if (activeTab === 'users' && isAdmin) loadUsers();
    else if (activeTab === 'products' && isAdmin) loadProducts();
    else if (activeTab === 'reports' && isAdmin) loadReports();
    else if (activeTab === 'logs' && isAdmin) loadLogs();
    else if (activeTab === 'featured_products') loadFeaturedProducts();
    else if (activeTab === 'featured_shops') loadFeaturedShops();
    else if (activeTab === 'featured_logs') loadFeaturedLogs();
  }, [activeTab]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('loadDashboardStats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { search: userSearch } });
      setUsersList(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/admin/products', {
        params: { search: productSearch, status: productStatusFilter }
      });
      setProductsList(res.data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    try {
      const res = await api.get('/admin/reports', { params: { status: reportStatusFilter } });
      setReportsList(res.data.reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get('/admin/logs');
      setLogsList(res.data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // Featured Handlers
  // -------------------------------------------------------------
  const loadFeaturedProducts = async () => {
    setLoadingFeatured(true);
    try {
      const res = await api.get('/featured/admin/products');
      setFeaturedProductSlots(res.data.slots || []);
    } catch (err) {
      console.error('loadFeaturedProducts error:', err);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const loadFeaturedShops = async () => {
    setLoadingFeatured(true);
    try {
      const res = await api.get('/featured/admin/shops');
      setFeaturedShopSlots(res.data.slots || []);
    } catch (err) {
      console.error('loadFeaturedShops error:', err);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const loadFeaturedLogs = async () => {
    setLoadingFeatured(true);
    try {
      const res = await api.get('/featured/admin/logs');
      setFeaturedLogsList(res.data.logs || []);
    } catch (err) {
      console.error('loadFeaturedLogs error:', err);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const handleSearchProducts = async (query = '') => {
    setProductSearchQuery(query);
    setSearchingProducts(true);
    try {
      const q = query ? query.trim() : '';
      const res = await api.get(`/featured/admin/search-products?query=${encodeURIComponent(q)}`);
      setProductSearchResults(res.data.products || []);
    } catch (err) {
      console.error('handleSearchProducts error:', err);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleSearchShops = async (query = '') => {
    setShopSearchQuery(query);
    setSearchingShops(true);
    try {
      const q = query ? query.trim() : '';
      const res = await api.get(`/featured/admin/search-sellers?query=${encodeURIComponent(q)}`);
      setShopSearchResults(res.data.sellers || []);
    } catch (err) {
      console.error('handleSearchShops error:', err);
    } finally {
      setSearchingShops(false);
    }
  };

  const openProductModal = (slotNum = null, initialQuery = '') => {
    const chosenSlot = slotNum || featuredProductSlots.find(s => !s.isOccupied)?.slotNumber || 1;
    setTargetSlotForProduct(chosenSlot);
    setProductSearchQuery(initialQuery);
    setShowProductModal(true);
    handleSearchProducts(initialQuery);
  };

  const openShopModal = (slotNum = null, initialQuery = '') => {
    const chosenSlot = slotNum || featuredShopSlots.find(s => !s.isOccupied)?.slotNumber || 1;
    setTargetSlotForShop(chosenSlot);
    setShopSearchQuery(initialQuery);
    setShowShopModal(true);
    handleSearchShops(initialQuery);
  };

  const handleAssignProduct = async (product, slotNum) => {
    const targetSlot = featuredProductSlots.find(s => s.slotNumber === slotNum);
    let confirmReplace = false;

    if (targetSlot?.isOccupied) {
      const currentTitle = targetSlot.data?.product?.title || 'Sản phẩm hiện tại';
      const msg = `Slot ${slotNum < 10 ? '0' + slotNum : slotNum} đang chứa:\n"${currentTitle}"\n\nBạn có chắc chắn muốn thay thế bằng sản phẩm:\n"${product.title}"?`;
      if (!window.confirm(msg)) return;
      confirmReplace = true;
    }

    const durationDays = customProductDuration ? parseInt(customProductDuration) : selectedProductDuration;

    try {
      const res = await api.post('/featured/admin/product', {
        productId: product.id,
        slotNumber: slotNum,
        confirmReplace,
        durationDays
      });
      alert(res.data.message);
      setShowProductModal(false);
      setProductSearchQuery('');
      setProductSearchResults([]);
      setCustomProductDuration('');
      loadFeaturedProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi đưa sản phẩm vào slot.');
    }
  };

  const handleExtendProduct = async (slotNum) => {
    const slot = featuredProductSlots.find(s => s.slotNumber === slotNum);
    const title = slot?.data?.product?.title || `Slot ${slotNum}`;
    const daysStr = prompt(`GIA HẠN GÓI MARKETING CHO SẢN PHẨM:\n"${title}"\n\nNhập số ngày muốn cộng thêm (ví dụ: 7, 14, 30, 60):`, '30');
    if (!daysStr) return;
    const extraDays = parseInt(daysStr);
    if (isNaN(extraDays) || extraDays <= 0) {
      alert('Số ngày gia hạn không hợp lệ.');
      return;
    }

    try {
      const res = await api.post(`/featured/admin/product/${slotNum}/extend`, { extraDays });
      alert(res.data.message);
      loadFeaturedProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gia hạn sản phẩm.');
    }
  };

  const handleRemoveProduct = async (slotNum) => {
    if (!window.confirm(`Xác nhận gỡ sản phẩm khỏi Slot ${slotNum < 10 ? '0' + slotNum : slotNum}?`)) return;
    try {
      const res = await api.delete(`/featured/admin/product/${slotNum}`);
      alert(res.data.message);
      loadFeaturedProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gỡ sản phẩm.');
    }
  };


  const handleAssignShop = async (targetUser, slotNum) => {
    const targetSlot = featuredShopSlots.find(s => s.slotNumber === slotNum);
    let confirmReplace = false;

    if (targetSlot?.isOccupied) {
      const currentShopName = targetSlot.data?.user?.fullName || 'Gian hàng hiện tại';
      const msg = `Slot ${slotNum < 10 ? '0' + slotNum : slotNum} đang chứa gian hàng:\n"${currentShopName}"\n\nBạn có chắc chắn muốn thay thế bằng gian hàng:\n"${targetUser.fullName}"?`;
      if (!window.confirm(msg)) return;
      confirmReplace = true;
    }

    const durationDays = customShopDuration ? parseInt(customShopDuration) : selectedShopDuration;

    try {
      const res = await api.post('/featured/admin/shop', {
        userId: targetUser.id,
        slotNumber: slotNum,
        confirmReplace,
        durationDays
      });
      alert(res.data.message);
      setShowShopModal(false);
      setShopSearchQuery('');
      setShopSearchResults([]);
      setCustomShopDuration('');
      loadFeaturedShops();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi đưa gian hàng vào slot.');
    }
  };

  const handleExtendShop = async (slotNum) => {
    const slot = featuredShopSlots.find(s => s.slotNumber === slotNum);
    const shopName = slot?.data?.user?.fullName || `Shop Slot ${slotNum}`;
    const daysStr = prompt(`GIA HẠN GÓI MARKETING CHO GIAN HÀNG:\n"${shopName}"\n\nNhập số ngày muốn cộng thêm (ví dụ: 7, 14, 30, 60):`, '30');
    if (!daysStr) return;
    const extraDays = parseInt(daysStr);
    if (isNaN(extraDays) || extraDays <= 0) {
      alert('Số ngày gia hạn không hợp lệ.');
      return;
    }

    try {
      const res = await api.post(`/featured/admin/shop/${slotNum}/extend`, { extraDays });
      alert(res.data.message);
      loadFeaturedShops();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gia hạn gian hàng.');
    }
  };

  const handleRemoveShop = async (slotNum) => {
    if (!window.confirm(`Xác nhận gỡ gian hàng khỏi Slot ${slotNum < 10 ? '0' + slotNum : slotNum}?`)) return;
    try {
      const res = await api.delete(`/featured/admin/shop/${slotNum}`);
      alert(res.data.message);
      loadFeaturedShops();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gỡ gian hàng.');
    }
  };

  // -------------------------------------------------------------
  // User Management & Admin Handlers
  // -------------------------------------------------------------
  const handleToggleBanUser = async (userId, username, currentStatus) => {
    const action = currentStatus === 'BANNED' ? 'mở khóa' : 'khóa';
    const reason = prompt(`Nhập lý do ${action} tài khoản @${username}:`, 'Vi phạm quy định cộng đồng');
    if (!reason) return;

    try {
      await api.post(`/admin/users/${userId}/toggle-ban`, { reason });
      alert(`Đã ${action} tài khoản thành công.`);
      loadUsers();
      if (isAdmin) loadDashboardStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thao tác.');
    }
  };

  const handleSetRole = async (userId, username, nextRole) => {
    const roleTitle = nextRole === 'ADMIN' ? 'QUẢN TRỊ VIÊN (ADMIN)' : nextRole === 'CTV' ? 'CỘNG TÁC VIÊN (CTV - Chỉ quản lý Nổi Bật)' : 'NGƯỜI DÙNG THƯỜNG (USER)';
    if (!window.confirm(`Xác nhận phân quyền cho @${username} thành: [${roleTitle}]?`)) return;

    try {
      const res = await api.post(`/admin/users/${userId}/role`, { role: nextRole });
      alert(res.data.message);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi phân quyền.');
    }
  };

  const handleDeleteProduct = async (productId, title) => {
    const reason = prompt(`Nhập lý do xóa sản phẩm "${title}":`, 'Sản phẩm vi phạm chính sách sinh viên');
    if (!reason) return;

    try {
      await api.delete(`/admin/products/${productId}`, { data: { reason } });
      alert('Đã xóa sản phẩm vi phạm.');
      loadProducts();
      if (isAdmin) loadDashboardStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa.');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    const note = prompt(`Ghi chú xử lý báo cáo #${reportId}:`, `Thực hiện hành động: ${action}`);
    if (note === null) return;

    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { action, adminNote: note });
      alert('Đã xử lý báo cáo vi phạm thành công!');
      loadReports();
      if (isAdmin) loadDashboardStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xử lý báo cáo.');
    }
  };

  const handleCreateUniversity = async (e) => {
    e.preventDefault();
    if (!newUniName || !newUniShort) return;
    try {
      await api.post('/admin/universities', {
        name: newUniName,
        shortName: newUniShort,
        city: newUniCity
      });
      alert('Đã thêm trường đại học thành công!');
      setNewUniName('');
      setNewUniShort('');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thêm trường.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    try {
      await api.post('/admin/categories', {
        name: newCatName,
        slug: newCatSlug,
        icon: newCatIcon
      });
      alert('Đã thêm danh mục mới thành công!');
      setNewCatName('');
      setNewCatSlug('');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thêm danh mục.');
    }
  };

  // Build Tab List dynamically
  const tabs = [
    { id: 'featured_products', label: '🔥 Sản phẩm nổi bật (20 Slot)' },
    { id: 'featured_shops', label: '⭐ Gian hàng nổi bật (20 Slot)' },
    { id: 'featured_logs', label: '📜 Lịch sử Featured' },
    ...(isAdmin ? [
      { id: 'overview', label: '📊 Tổng quan hệ thống' },
      { id: 'users', label: '👥 Người dùng & Phân quyền' },
      { id: 'products', label: '📦 Quản lý Tất cả Sản Phẩm' },
      { id: 'reports', label: `🚩 Xử lý Báo Cáo (${stats?.stats?.pendingReports || 0})` },
      { id: 'categories', label: '🏫 Trường & Danh mục' },
      { id: 'logs', label: '🛡️ Audit Trail Admin' }
    ] : [])
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>{isAdmin ? 'Trang Quản Trị Hệ Thống (ADMIN)' : 'Bảng Điều Khiển Cộng Tác Viên (CTV)'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Admin Management Console' : 'Quản Lý Sản Phẩm & Gian Hàng Nổi Bật'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Quản trị sinh viên, sản phẩm, 20 slot nổi bật, báo cáo và audit log' : 'Bạn có quyền tuyển chọn và quản lý 20 slot Sản phẩm nổi bật & 20 slot Gian hàng nổi bật'}
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'featured_products') loadFeaturedProducts();
            else if (activeTab === 'featured_shops') loadFeaturedShops();
            else if (activeTab === 'featured_logs') loadFeaturedLogs();
            else if (isAdmin) loadDashboardStats();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Overview Stat Cards (Only for ADMIN) */}
      {isAdmin && stats?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold">Người dùng</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.stats.totalUsers}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold">Sản phẩm</span>
              <Package className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.stats.totalProducts}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold">Tin nhắn</span>
              <MessageSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.stats.totalMessages}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold">Báo cáo chờ</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {stats.stats.pendingReports}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold">User bị khóa</span>
              <UserX className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600">
              {stats.stats.bannedUsers}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Featured Products (20 Slots) */}
      {activeTab === 'featured_products' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 border border-orange-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-500 text-white rounded-xl shadow-xs">
                  <Flame className="w-4 h-4" />
                </span>
                <h3 className="font-black text-slate-900 text-base">20 Slot Sản Phẩm Nổi Bật Trang Chủ (Gói Marketing)</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Cài đặt số ngày hiển thị cho từng slot. Hệ thống sẽ tự động đếm ngược thời gian, gửi thông báo nhắc hạn (7 ngày, 3 ngày, 1 ngày trước) cho người bán và tự động gỡ khi hết hạn.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-2xl text-slate-700 shadow-sm">
                Đang dùng: <strong className="text-orange-600 font-black">{featuredProductSlots.filter(s => s.isOccupied && !s.data?.countdown?.isExpired).length} / 20</strong> slot
              </span>
              <button
                onClick={() => openProductModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-500/20 transition-all active:scale-95"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>+ CHỌN &amp; ĐƯA SP LÊN NỔI BẬT</span>
              </button>
            </div>
          </div>

          {loadingFeatured ? (
            <div className="text-center py-20 text-xs text-slate-400">Đang tải danh sách 20 slot nổi bật...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {featuredProductSlots.map((slot) => {
                const isOcc = slot.isOccupied && slot.data?.product;
                const prod = slot.data?.product;
                const slotLabel = slot.slotNumber < 10 ? `0${slot.slotNumber}` : slot.slotNumber;
                const countdown = slot.data?.countdown;

                return (
                  <div
                    key={slot.slotNumber}
                    className={`relative rounded-3xl border transition-all flex flex-col justify-between p-4 ${
                      isOcc 
                        ? countdown?.isExpired
                          ? 'bg-slate-50 border-slate-200 opacity-80'
                          : 'bg-white border-slate-200 shadow-sm hover:shadow-md' 
                        : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-white rounded-xl shadow-xs">
                        SLOT #{slotLabel}
                      </span>
                      {isOcc ? (
                        countdown?.isExpired ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                            Đã hết hạn
                          </span>
                        ) : countdown?.urgency === 'URGENT_1D' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            Hết hạn trong 24h
                          </span>
                        ) : countdown?.urgency === 'WARNING_3D' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                            Còn {countdown.remainingDays} ngày
                          </span>
                        ) : countdown?.urgency === 'WARNING_7D' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            Còn {countdown.remainingDays} ngày
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Còn {countdown?.remainingDays || 30} ngày
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600">
                          Slot trống
                        </span>
                      )}
                    </div>

                    {isOcc ? (
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-2.5 border border-slate-100">
                            {prod.images && prod.images.length > 0 ? (
                              <img
                                src={prod.images[0]?.url || prod.images[0]}
                                alt={prod.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-8 h-8" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                              <Star className="w-3 h-3 fill-white" />
                              <span>VIP SLOT</span>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white">
                              {prod.category?.name || 'Danh mục'}
                            </div>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug" title={prod.title}>
                            {prod.title}
                          </h4>

                          <div className="mt-1 font-black text-rose-600 text-xs flex items-center justify-between">
                            <span>{prod.isFree ? 'Miễn phí (0đ)' : `${new Intl.NumberFormat('vi-VN').format(prod.price)} đ`}</span>
                            <span className="text-[10px] font-normal text-slate-400">Đã bán {prod.totalSold || 0}</span>
                          </div>

                          {/* Countdown Timer Box */}
                          <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Thời hạn:</span>
                              </span>
                              <span className={`font-bold ${
                                countdown?.isExpired
                                  ? 'text-rose-600'
                                  : countdown?.urgency === 'URGENT_1D'
                                  ? 'text-rose-600 animate-pulse'
                                  : countdown?.urgency === 'WARNING_3D'
                                  ? 'text-orange-600'
                                  : 'text-emerald-700'
                              }`}>
                                {countdown?.remainingText || '30 ngày'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Hạn: {slot.data.endDate ? new Date(slot.data.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</span>
                              <span>(Gói {slot.data.durationDays || 30} ngày)</span>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate">Người bán: <strong>@{prod.seller?.username}</strong></span>
                            <span className="font-semibold text-emerald-700 shrink-0">{prod.seller?.university?.shortName || ''}</span>
                          </div>
                        </div>

                        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center gap-1.5">
                          <button
                            onClick={() => handleExtendProduct(slot.slotNumber)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Gia hạn thêm số ngày hiển thị"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Gia hạn</span>
                          </button>
                          <button
                            onClick={() => openProductModal(slot.slotNumber)}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all text-center"
                          >
                            Đổi SP
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(slot.slotNumber)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Gỡ sản phẩm khỏi slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/product/${prod.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            title="Xem chi tiết"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-emerald-600">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 max-w-[140px]">
                          Vị trí hiển thị số {slot.slotNumber}
                        </p>
                        <button
                          onClick={() => openProductModal(slot.slotNumber)}
                          className="mt-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5 fill-white" />
                          <span>+ Thêm Sản Phẩm</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Featured Shops (20 Slots) */}
      {activeTab === 'featured_shops' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 border border-teal-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-600 text-white rounded-xl shadow-xs">
                  <Star className="w-4 h-4" />
                </span>
                <h3 className="font-black text-slate-900 text-base">20 Slot Gian Hàng Sinh Viên Nổi Bật (Gói Marketing)</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Cài đặt số ngày hiển thị cho từng gian hàng sinh viên uy tín. Hệ thống tự động đếm ngược và thông báo nhắc gia hạn trước 7 ngày, 3 ngày, 1 ngày.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-2xl text-slate-700 shadow-sm">
                Đang dùng: <strong className="text-teal-700 font-black">{featuredShopSlots.filter(s => s.isOccupied && !s.data?.countdown?.isExpired).length} / 20</strong> slot
              </span>
              <button
                onClick={() => openShopModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black rounded-2xl shadow-md shadow-teal-600/20 transition-all active:scale-95"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>+ CHỌN &amp; ĐƯA GIAN HÀNG LÊN NỔI BẬT</span>
              </button>
            </div>
          </div>

          {loadingFeatured ? (
            <div className="text-center py-20 text-xs text-slate-400">Đang tải danh sách 20 gian hàng...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {featuredShopSlots.map((slot) => {
                const isOcc = slot.isOccupied && slot.data?.user;
                const shopUser = slot.data?.user;
                const slotLabel = slot.slotNumber < 10 ? `0${slot.slotNumber}` : slot.slotNumber;
                const countdown = slot.data?.countdown;

                return (
                  <div
                    key={slot.slotNumber}
                    className={`relative rounded-3xl border transition-all flex flex-col justify-between p-4 ${
                      isOcc 
                        ? countdown?.isExpired
                          ? 'bg-slate-50 border-slate-200 opacity-80'
                          : 'bg-white border-slate-200 shadow-sm hover:shadow-md' 
                        : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/30'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 bg-teal-800 text-white rounded-xl shadow-xs">
                        SHOP #{slotLabel}
                      </span>
                      {isOcc ? (
                        countdown?.isExpired ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                            Đã hết hạn
                          </span>
                        ) : countdown?.urgency === 'URGENT_1D' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            Hết hạn trong 24h
                          </span>
                        ) : countdown?.urgency === 'WARNING_3D' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                            Còn {countdown.remainingDays} ngày
                          </span>
                        ) : countdown?.urgency === 'WARNING_7D' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            Còn {countdown.remainingDays} ngày
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                            Còn {countdown?.remainingDays || 30} ngày
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600">
                          Slot trống
                        </span>
                      )}
                    </div>

                    {isOcc ? (
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                              {shopUser.avatar ? (
                                <img src={shopUser.avatar} alt={shopUser.fullName} className="w-full h-full object-cover" />
                              ) : (
                                shopUser.fullName?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-xs text-slate-900 truncate" title={shopUser.fullName}>
                                {shopUser.fullName}
                              </h4>
                              <div className="text-[11px] text-slate-400">@{shopUser.username}</div>
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                {shopUser.university?.shortName || 'Sinh viên'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl text-[11px]">
                            <div className="flex items-center gap-1 text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{shopUser.rating?.toFixed(1) || '5.0'}</span>
                              <span className="text-slate-400 font-normal text-[10px]">({shopUser.totalSold || 0} đã bán)</span>
                            </div>
                            <div className="text-right text-slate-700 font-bold">
                              {shopUser._count?.products || 0} <span className="font-normal text-slate-400 text-[10px]">đồ bán</span>
                            </div>
                          </div>

                          {/* Countdown Box */}
                          <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Thời hạn:</span>
                              </span>
                              <span className={`font-bold ${
                                countdown?.isExpired
                                  ? 'text-rose-600'
                                  : countdown?.urgency === 'URGENT_1D'
                                  ? 'text-rose-600 animate-pulse'
                                  : countdown?.urgency === 'WARNING_3D'
                                  ? 'text-orange-600'
                                  : 'text-teal-700'
                              }`}>
                                {countdown?.remainingText || '30 ngày'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Hạn: {slot.data.endDate ? new Date(slot.data.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</span>
                              <span>(Gói {slot.data.durationDays || 30} ngày)</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center gap-1.5">
                          <button
                            onClick={() => handleExtendShop(slot.slotNumber)}
                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Gia hạn thêm số ngày hiển thị"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Gia hạn</span>
                          </button>
                          <button
                            onClick={() => openShopModal(slot.slotNumber)}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all text-center"
                          >
                            Đổi Shop
                          </button>
                          <button
                            onClick={() => handleRemoveShop(slot.slotNumber)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Gỡ gian hàng khỏi slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/profile/${shopUser.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            title="Xem shop"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-teal-600">
                          <Store className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 max-w-[140px]">
                          Vị trí gian hàng số {slot.slotNumber}
                        </p>
                        <button
                          onClick={() => openShopModal(slot.slotNumber)}
                          className="mt-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>+ Thêm Gian Hàng</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Featured Audit Logs */}
      {activeTab === 'featured_logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Lịch sử thay đổi Featured Products & Shops</h3>
              <p className="text-xs text-slate-500">Ghi lại toàn bộ thao tác gán, thay thế hoặc gỡ bỏ của Admin & CTV</p>
            </div>
            <button
              onClick={loadFeaturedLogs}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"
              title="Tải lại nhật ký"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {featuredLogsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">Chưa có bản ghi lịch sử featured nào.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {featuredLogsList.map((log) => {
                const isAdd = log.action?.includes('ADD');
                const isReplace = log.action?.includes('REPLACE');
                const isRemove = log.action?.includes('REMOVE');

                const badgeColor = isAdd
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isReplace
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                          {log.action}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                          SLOT {log.slotNumber < 10 ? `0${log.slotNumber}` : log.slotNumber}
                        </span>
                        <span className="font-semibold text-slate-800">{log.details}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Thực hiện bởi: <strong>{log.performer?.fullName}</strong> (@{log.performer?.username}) • Vai trò: <span className="font-bold text-slate-600">{log.performer?.role}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Products */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Sản phẩm mới đăng gần nhất</h3>
            <div className="divide-y divide-slate-100">
              {stats?.recentProducts?.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{p.title}</div>
                    <div className="text-[11px] text-slate-400">
                      Bởi {p.seller?.fullName} • {p.category?.name}
                    </div>
                  </div>
                  <span className="font-bold text-rose-600 shrink-0">
                    {p.isFree ? '0đ' : new Intl.NumberFormat('vi-VN').format(p.price) + ' đ'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Sinh viên mới đăng ký gần nhất</h3>
            <div className="divide-y divide-slate-100">
              {stats?.recentUsers?.map(u => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">@{u.username} • {u.email}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Users Management & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Tìm username, email, tên sinh viên..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
            >
              Tìm kiếm
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sinh viên</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Trường ĐH</th>
                  <th className="py-3 px-4">Vai trò (Role)</th>
                  <th className="py-3 px-4">Số đồ đăng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{u.fullName}</div>
                      <div className="text-[10px] text-slate-400">@{u.username}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {u.university?.shortName || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {u.id === user?.id ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-[11px]">
                          {u.role} (Bạn)
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleSetRole(u.id, u.username, e.target.value)}
                          className={`font-bold text-[11px] px-2 py-1 rounded-lg border cursor-pointer ${
                            u.role === 'ADMIN'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : u.role === 'CTV'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="USER">USER (Thường)</option>
                          <option value="CTV">CTV (Cộng tác viên)</option>
                          <option value="ADMIN">ADMIN (Quản trị)</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {u._count?.products || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 flex items-center justify-end">
                      {u.status === 'ACTIVE' && (
                        <button
                          onClick={() => openShopModal(null, u.username)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs transition-all"
                          title="Đưa gian hàng này lên 20 Slot Nổi Bật Trang Chủ"
                        >
                          <Star className="w-3 h-3 fill-teal-500 text-teal-500" />
                          <span>Lên Top Shop</span>
                        </button>
                      )}
                      <Link
                        to={`/profile/${u.id}`}
                        target="_blank"
                        className="p-1.5 text-slate-500 hover:text-slate-800 inline-block rounded-lg hover:bg-slate-100"
                        title="Xem shop"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleBanUser(u.id, u.username, u.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            u.status === 'BANNED'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {u.status === 'BANNED' ? 'Mở khóa' : 'Khóa tài khoản'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Products Management (Spec Section 30) */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-sm">
              <input
                type="text"
                placeholder="Tìm tiêu đề, người bán..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang bán (ACTIVE)</option>
                <option value="SOLD">Đã bán (SOLD)</option>
                <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
              </select>

              <button
                onClick={loadProducts}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Lọc
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Giá</th>
                  <th className="py-3 px-4">Người đăng</th>
                  <th className="py-3 px-4">Trường</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productsList.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 truncate">{p.title}</div>
                      <div className="text-[10px] text-slate-400">{p.category?.name}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600">
                      {p.isFree ? '0đ' : new Intl.NumberFormat('vi-VN').format(p.price) + ' đ'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      @{p.seller?.username}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {p.university?.shortName || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 flex items-center justify-end">
                      {p.status === 'ACTIVE' && (
                        <button
                          onClick={() => openProductModal(null, p.title)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs transition-all"
                          title="Đưa sản phẩm này lên 20 Slot Nổi Bật Trang Chủ"
                        >
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Lên VIP Slot</span>
                        </button>
                      )}
                      <Link
                        to={`/product/${p.id}`}
                        target="_blank"
                        className="p-1.5 text-slate-500 hover:text-slate-800 inline-block rounded-lg hover:bg-slate-100"
                        title="Xem chi tiết"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.title)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg inline-block"
                        title="Xóa vi phạm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Reports Management (Spec Section 31) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['PENDING', 'RESOLVED', 'DISMISSED'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setReportStatusFilter(status);
                  loadReports();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  reportStatusFilter === status ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'
                }`}
              >
                {status === 'PENDING' ? 'Chờ xử lý' : status === 'RESOLVED' ? 'Đã giải quyết' : 'Đã bỏ qua'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reportsList.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
                Không có báo cáo nào ở trạng thái này.
              </div>
            ) : (
              reportsList.map(rep => (
                <div key={rep.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded">
                        REPORT #{rep.id.slice(-6)}
                      </span>
                      <span className="text-xs font-bold text-slate-800">Lý do: {rep.reason}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Ngày báo cáo: {new Date(rep.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Người tố cáo:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{rep.reporter?.fullName} (@{rep.reporter?.username})</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Đối tượng bị tố cáo:</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {rep.product ? `Sản phẩm: "${rep.product.title}" của @${rep.product.seller?.username}` : `@${rep.reportedUser?.username}`}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700">
                    <span className="font-bold text-slate-800">Nội dung tố cáo:</span> {rep.description}
                  </div>

                  {rep.adminNote && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                      Ghi chú admin: {rep.adminNote}
                    </div>
                  )}

                  {rep.status === 'PENDING' && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'DISMISS')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Giữ sản phẩm (Bỏ qua)
                      </button>
                      {rep.productId && (
                        <button
                          onClick={() => handleResolveReport(rep.id, 'DELETE_PRODUCT')}
                          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-xl"
                        >
                          Xóa sản phẩm vi phạm
                        </button>
                      )}
                      <button
                        onClick={() => handleResolveReport(rep.id, 'WARN_USER')}
                        className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs rounded-xl"
                      >
                        Gửi cảnh cáo sinh viên
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'BAN_USER')}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
                      >
                        Khóa tài khoản user
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Categories & Universities Management (Spec Section 32 & 34) */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Add University Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>Thêm Trường Đại Học mới</span>
            </h3>

            <form onSubmit={handleCreateUniversity} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Tên trường đầy đủ *</label>
                <input
                  type="text"
                  placeholder="VD: Trường Đại học Bách Khoa Hà Nội"
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Tên viết tắt *</label>
                <input
                  type="text"
                  placeholder="VD: HUST, NEU, FTU..."
                  value={newUniShort}
                  onChange={(e) => setNewUniShort(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Thành phố *</label>
                <input
                  type="text"
                  value={newUniCity}
                  onChange={(e) => setNewUniCity(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
              >
                + Thêm Trường Đại Học
              </button>
            </form>
          </div>

          {/* Add Category Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-teal-600" />
              <span>Thêm Danh Mục Sản Phẩm</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Tên danh mục *</label>
                <input
                  type="text"
                  placeholder="VD: Đồ Dã Ngoại Sinh Viên"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Slug (URL) *</label>
                <input
                  type="text"
                  placeholder="VD: do-da-ngoai"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Icon Emoji</label>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm"
              >
                + Thêm Danh Mục
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 6: Admin Audit Logs (Spec Section 54) */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900">Nhật ký Audit Trail</h3>
          <div className="divide-y divide-slate-100">
            {logsList.map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    <span className="text-indigo-600 font-mono">[{log.action}]</span> {log.details}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Thực hiện bởi: {log.admin?.fullName} (@{log.admin?.username})
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Select Product for Slot */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 via-white to-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Đưa Sản Phẩm Lên Vị Trí Nổi Bật (Marketing)</h3>
                  <p className="text-xs text-slate-500">Tìm kiếm và chọn sản phẩm để hiển thị trên Carousel Trang Chủ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setProductSearchQuery('');
                  setProductSearchResults([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Slot Target Selector */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Chọn Slot đưa sản phẩm vào:</span>
                </label>
                <select
                  value={targetSlotForProduct}
                  onChange={(e) => setTargetSlotForProduct(parseInt(e.target.value))}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300 w-full sm:w-auto"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
                    const slotData = featuredProductSlots.find(s => s.slotNumber === num);
                    const isOcc = slotData?.isOccupied && !slotData?.data?.countdown?.isExpired;
                    const title = slotData?.data?.product?.title;
                    return (
                      <option key={num} value={num}>
                        Slot {num < 10 ? `0${num}` : num} {isOcc ? `(Đang có: ${title?.slice(0, 20)}...)` : '(Slot Trống)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {featuredProductSlots.find(s => s.slotNumber === targetSlotForProduct)?.isOccupied && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <div>
                    <strong>Chú ý:</strong> Slot #{targetSlotForProduct < 10 ? `0${targetSlotForProduct}` : targetSlotForProduct} hiện đang có sản phẩm (
                    <em>"{featuredProductSlots.find(s => s.slotNumber === targetSlotForProduct)?.data?.product?.title}"</em>). Chọn sản phẩm mới sẽ thay thế sản phẩm này.
                  </div>
                </div>
              )}

              {/* Duration Selector */}
              <div className="bg-orange-50/50 border border-orange-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Cài đặt thời hạn hiển thị:</span>
                  </label>
                  <span className="text-[11px] font-black text-orange-600">
                    {customProductDuration ? `${customProductDuration} ngày` : `${selectedProductDuration} ngày`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[3, 7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setSelectedProductDuration(days);
                        setCustomProductDuration('');
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        !customProductDuration && selectedProductDuration === days
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {days === 30 ? '30 ngày (1T)' : days === 60 ? '60 ngày (2T)' : days === 90 ? '90 ngày (3T)' : `${days} ngày`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-slate-500">Hoặc tự nhập:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="Số ngày..."
                    value={customProductDuration}
                    onChange={(e) => setCustomProductDuration(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs w-24 font-bold"
                  />
                  <span className="text-[11px] text-slate-400">ngày</span>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm, tên gian hàng, tên người bán (@username), trường ĐH..."
                  value={productSearchQuery}
                  onChange={(e) => handleSearchProducts(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Results List */}
              {searchingProducts ? (
                <div className="py-12 text-center text-xs text-slate-400">Đang tìm kiếm sản phẩm...</div>
              ) : productSearchResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  {productSearchQuery.trim() ? 'Không tìm thấy sản phẩm phù hợp.' : 'Không có sản phẩm nào đang hoạt động.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {productSearchResults.map((prod) => {
                    const isAlreadyFeatured = prod.featuredProduct && prod.featuredProduct.status === 'ACTIVE';
                    return (
                      <div key={prod.id} className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-2xl transition-all border border-transparent hover:border-slate-200">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                            {prod.images && prod.images.length > 0 ? (
                              <img src={prod.images[0]?.url || prod.images[0]} alt={prod.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            {isAlreadyFeatured && (
                              <span className="absolute bottom-0 inset-x-0 bg-orange-600 text-white text-[8px] font-black text-center py-0.5">
                                Slot {prod.featuredProduct.slotNumber < 10 ? `0${prod.featuredProduct.slotNumber}` : prod.featuredProduct.slotNumber}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-slate-900 truncate" title={prod.title}>
                                {prod.title}
                              </h4>
                              {isAlreadyFeatured && (
                                <span className="bg-orange-100 text-orange-800 text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0">
                                  Đang ở Slot #{prod.featuredProduct.slotNumber}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-[11px] mt-0.5">
                              <span className="font-black text-rose-600">
                                {prod.isFree ? '0đ Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(prod.price)} đ`}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-semibold">{prod.category?.name || 'Danh mục'}</span>
                            </div>

                            {/* Seller & University Info */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-1">
                              <span className="text-slate-700 font-bold">
                                👤 {prod.seller?.fullName} (@{prod.seller?.username})
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                🏫 {prod.university?.shortName || prod.seller?.university?.shortName || 'Hà Nội'}
                              </span>
                              {prod.seller?.totalSold > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 font-bold">★ Đã bán {prod.seller.totalSold}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAssignProduct(prod, targetSlotForProduct)}
                          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-xs shrink-0 transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Flame className="w-3.5 h-3.5 fill-white" />
                          <span>Đưa vào Slot {targetSlotForProduct < 10 ? `0${targetSlotForProduct}` : targetSlotForProduct}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setProductSearchQuery('');
                  setProductSearchResults([]);
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Select Shop for Slot */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Đưa Gian Hàng Lên Vị Trí Nổi Bật (Marketing)</h3>
                  <p className="text-xs text-slate-500">Tìm kiếm và chọn gian hàng sinh viên uy tín để hiển thị trên Carousel Trang Chủ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShopModal(false);
                  setShopSearchQuery('');
                  setShopSearchResults([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Slot Target Selector */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                  <Store className="w-4 h-4 text-teal-600" />
                  <span>Chọn Shop Slot đưa gian hàng vào:</span>
                </label>
                <select
                  value={targetSlotForShop}
                  onChange={(e) => setTargetSlotForShop(parseInt(e.target.value))}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-300 w-full sm:w-auto"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
                    const slotData = featuredShopSlots.find(s => s.slotNumber === num);
                    const isOcc = slotData?.isOccupied && !slotData?.data?.countdown?.isExpired;
                    const shopName = slotData?.data?.user?.fullName;
                    return (
                      <option key={num} value={num}>
                        Shop Slot {num < 10 ? `0${num}` : num} {isOcc ? `(Đang có: ${shopName?.slice(0, 20)}...)` : '(Slot Trống)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {featuredShopSlots.find(s => s.slotNumber === targetSlotForShop)?.isOccupied && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <div>
                    <strong>Chú ý:</strong> Shop Slot #{targetSlotForShop < 10 ? `0${targetSlotForShop}` : targetSlotForShop} hiện đang có gian hàng (
                    <em>"{featuredShopSlots.find(s => s.slotNumber === targetSlotForShop)?.data?.user?.fullName}"</em>). Chọn gian hàng mới sẽ thay thế gian hàng này.
                  </div>
                </div>
              )}

              {/* Duration Selector */}
              <div className="bg-teal-50/50 border border-teal-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Cài đặt thời hạn hiển thị gian hàng:</span>
                  </label>
                  <span className="text-[11px] font-black text-teal-700">
                    {customShopDuration ? `${customShopDuration} ngày` : `${selectedShopDuration} ngày`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[3, 7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setSelectedShopDuration(days);
                        setCustomShopDuration('');
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        !customShopDuration && selectedShopDuration === days
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {days === 30 ? '30 ngày (1T)' : days === 60 ? '60 ngày (2T)' : days === 90 ? '90 ngày (3T)' : `${days} ngày`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-slate-500">Hoặc tự nhập:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="Số ngày..."
                    value={customShopDuration}
                    onChange={(e) => setCustomShopDuration(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs w-24 font-bold"
                  />
                  <span className="text-[11px] text-slate-400">ngày</span>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo tên gian hàng, tên chủ shop, username, email, trường ĐH..."
                  value={shopSearchQuery}
                  onChange={(e) => handleSearchShops(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Results List */}
              {searchingShops ? (
                <div className="py-12 text-center text-xs text-slate-400">Đang tìm kiếm gian hàng...</div>
              ) : shopSearchResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  {shopSearchQuery.trim() ? 'Không tìm thấy người bán phù hợp.' : 'Không có người bán nào khả dụng.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {shopSearchResults.map((seller) => {
                    const isAlreadyFeatured = seller.featuredShop && seller.featuredShop.status === 'ACTIVE';
                    return (
                      <div key={seller.id} className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-2xl transition-all border border-transparent hover:border-slate-200">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative">
                            {seller.avatar ? (
                              <img src={seller.avatar} alt={seller.fullName} className="w-full h-full object-cover" />
                            ) : (
                              seller.fullName?.charAt(0) || 'U'
                            )}
                            {isAlreadyFeatured && (
                              <span className="absolute bottom-0 inset-x-0 bg-teal-800 text-white text-[8px] font-black text-center py-0.5">
                                Shop {seller.featuredShop.slotNumber < 10 ? `0${seller.featuredShop.slotNumber}` : seller.featuredShop.slotNumber}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-slate-900 truncate" title={seller.fullName}>
                                {seller.fullName}
                              </h4>
                              {isAlreadyFeatured && (
                                <span className="bg-teal-100 text-teal-800 text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0">
                                  Đang ở Shop Slot #{seller.featuredShop.slotNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>@{seller.username}</span>
                              {seller.email && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{seller.email}</span>
                                </>
                              )}
                            </div>

                            {/* Shop Stats */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                              <span className="text-teal-700 font-bold">
                                🏫 {seller.university?.shortName || seller.university?.name || 'Sinh viên'}
                              </span>
                              <span>•</span>
                              <span className="text-amber-600 font-bold">
                                ★ {seller.rating ? seller.rating.toFixed(1) : '5.0'} ({seller.totalSold || 0} đã bán)
                              </span>
                              <span>•</span>
                              <span className="text-slate-700 font-bold">
                                📦 {seller._count?.products || 0} tin đăng
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAssignShop(seller, targetSlotForShop)}
                          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-xs shrink-0 transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Đưa vào Shop Slot {targetSlotForShop < 10 ? `0${targetSlotForShop}` : targetSlotForShop}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setShowShopModal(false);
                  setShopSearchQuery('');
                  setShopSearchResults([]);
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}