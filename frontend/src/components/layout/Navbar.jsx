import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  MessageSquare, 
  Bell, 
  User, 
  Heart, 
  LogOut, 
  ShieldCheck, 
  Package, 
  GraduationCap, 
  ChevronDown,
  Menu,
  X,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin, isCTV, canManageFeatured } = useAuth();
  const { unreadCount, unreadMessagesCount, setUnreadMessagesCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [universities, setUniversities] = useState([]);
  const [selectedUni, setSelectedUni] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    // Load universities
    api.get('/universities')
      .then(res => setUniversities(res.data.universities || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/users/my/notifications')
        .then(res => setNotifications(res.data.notifications || []))
        .catch(console.error);

      // Load unread messages count
      api.get('/chat/conversations')
        .then(res => {
          const total = (res.data.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          if (setUnreadMessagesCount) setUnreadMessagesCount(total);
        })
        .catch(console.error);
    }
  }, [isAuthenticated, location.pathname]);

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedUni) params.set('universityId', selectedUni);
    navigate(`/products?${params.toString()}`);
  };

  const handleUniChange = (e) => {
    const uniId = e.target.value;
    setSelectedUni(uniId);
    const params = new URLSearchParams(location.search);
    if (uniId) {
      params.set('universityId', uniId);
    } else {
      params.delete('universityId');
    }
    navigate(`/products?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 bg-clip-text text-transparent">
                UniMarket
              </div>
              <div className="text-[10px] font-semibold text-slate-500 -mt-1 hidden sm:block">
                Sàn pass đồ sinh viên
              </div>
            </div>
          </Link>

          {/* Campus Selector & Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center gap-2">
            {/* Quick Uni Selector */}
            <div className="relative shrink-0 w-44">
              <select
                value={selectedUni}
                onChange={handleUniChange}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-2 pr-7 truncate appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              >
                <option value="">🏫 Tất cả các trường</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.shortName} - {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm giáo trình, laptop, bàn học KTX, xe đạp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 focus:bg-white text-slate-800 text-sm rounded-lg pl-9 pr-12 py-2 border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-md transition-colors"
              >
                Tìm
              </button>
            </form>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Post button */}
            <Link
              to="/post"
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm px-3.5 py-2 rounded-xl shadow-sm shadow-emerald-600/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng bán</span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Messages icon */}
                <Link
                  to="/messages"
                  className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Tin nhắn"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center animate-pulse">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {/* Notifications dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {(unreadCount > 0 || user?.stats?.unreadNotifications > 0) && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800">Thông báo của bạn</span>
                        <span className="text-xs text-emerald-600 font-semibold cursor-pointer" onClick={() => api.put('/users/my/notifications/read-all')}>
                          Đánh dấu đã đọc
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Không có thông báo mới nào
                          </div>
                        ) : (
                          notifications.map(n => (
                            <Link
                              key={n.id}
                              to={n.link || '#'}
                              onClick={() => setShowNotifs(false)}
                              className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-emerald-50/40' : ''}`}
                            >
                              <div className="text-xs font-bold text-slate-800">{n.title}</div>
                              <div className="text-xs text-slate-600 mt-0.5">{n.content}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-lg object-cover bg-emerald-100 border border-emerald-200"
                    />
                    <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate hidden md:block">
                      {user.fullName.split(' ').pop()}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <div className="font-bold text-sm text-slate-800 truncate">{user.fullName}</div>
                        <div className="text-xs text-slate-500">@{user.username}</div>
                        {user.university && (
                          <div className="text-[11px] font-semibold text-emerald-700 mt-1 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            🏫 {user.university.shortName}
                          </div>
                        )}
                      </div>

                      <div className="py-1 text-xs font-medium text-slate-700">
                        <Link
                          to={`/profile/${user.id}`}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <Store className="w-4 h-4 text-slate-400" />
                          <span>Shop cá nhân của tôi</span>
                        </Link>

                        <Link
                          to="/my-products"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>Quản lý sản phẩm</span>
                        </Link>

                        <Link
                          to="/favorites"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span>Đồ đã lưu yêu thích</span>
                        </Link>

                        {canManageFeatured && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors font-bold"
                          >
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>{isAdmin ? 'Trang Quản Trị Admin' : 'Quản lý Nổi Bật (CTV)'}</span>
                          </Link>
                        )}

                        <div className="border-t border-slate-100 my-1"></div>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Search & Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm đồ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100 rounded-lg pl-9 pr-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </form>
            <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-slate-100">
                📦 Tất cả sản phẩm
              </Link>
              <Link to="/products?isFree=true" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg text-emerald-700 bg-emerald-50 font-bold">
                🎁 Góc Cho Tặng 0đ
              </Link>
              <Link to="/post" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg bg-emerald-600 text-white font-bold text-center">
                + Đăng bán sản phẩm
              </Link>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}