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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, products, reports, categories, logs
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

  // Modals / forms
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
    if (!isAdmin) {
      alert('Bạn không có quyền truy cập trang quản trị!');
      navigate('/');
      return;
    }
    loadDashboardStats();
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'products') loadProducts();
    else if (activeTab === 'reports') loadReports();
    else if (activeTab === 'logs') loadLogs();
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

  const handleToggleBanUser = async (userId, username, currentStatus) => {
    const action = currentStatus === 'BANNED' ? 'mở khóa' : 'khóa';
    const reason = prompt(`Nhập lý do ${action} tài khoản @${username}:`, 'Vi phạm quy định cộng đồng');
    if (!reason) return;

    try {
      await api.post(`/admin/users/${userId}/toggle-ban`, { reason });
      alert(`Đã ${action} tài khoản thành công.`);
      loadUsers();
      loadDashboardStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thao tác.');
    }
  };

  const handleToggleRole = async (userId, username, currentRole) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmMsg = currentRole === 'ADMIN'
      ? `Bạn có chắc muốn hạ quyền tài khoản @${username} xuống làm Người dùng thường (USER)?`
      : `Bạn có chắc chắn muốn phong tài khoản @${username} làm QUẢN TRỊ VIÊN (ADMIN)? Người này sẽ có toàn quyền kiểm duyệt và quản trị nền tảng!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post(`/admin/users/${userId}/role`, { role: nextRole });
      alert(res.data.message);
      loadUsers();
      loadDashboardStats();
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
      loadDashboardStats();
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
      loadDashboardStats();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Trang Quản Trị Hệ Thống UniMarket</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Admin Management Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị sinh viên, sản phẩm, khiếu nại báo cáo và nhật ký audit log
          </p>
        </div>

        <button
          onClick={loadDashboardStats}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* Overview Stat Cards (Spec Section 27) */}
      {stats?.stats && (
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
              <span className="text-xs font-bold">Báo cáo chờ xử lý</span>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '📊 Tổng quan hoạt động' },
          { id: 'users', label: '👥 Quản lý Người Dùng' },
          { id: 'products', label: '📦 Quản lý Sản Phẩm' },
          { id: 'reports', label: `🚩 Xử lý Báo Cáo (${stats?.stats?.pendingReports || 0})` },
          { id: 'categories', label: '🏫 Trường & Danh mục' },
          { id: 'logs', label: '📜 Nhật ký Thao tác (Logs)' }
        ].map(tab => (
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

      {/* Tab 2: Users Management (Spec Section 28 & 29) */}
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
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/profile/${u.id}`}
                        target="_blank"
                        className="p-1.5 text-slate-500 hover:text-slate-800 inline-block"
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
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/product/${p.id}`}
                        target="_blank"
                        className="p-1.5 text-slate-500 hover:text-slate-800 inline-block"
                        title="Xem chi tiết"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.title)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded inline-block"
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

    </div>
  );
}