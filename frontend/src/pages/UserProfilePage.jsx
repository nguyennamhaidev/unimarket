import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Store, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Package, 
  Settings, 
  Heart, 
  BarChart3, 
  MessageSquare, 
  ShieldAlert, 
  Lock, 
  Trash2,
  Check,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/common/ProductCard';
import { getImageUrl, handleImageError, DEFAULT_AVATAR } from '../utils/imageHelper';
import api from '../api';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout, updateProfile } = useAuth();

  const isMyProfile = currentUser?.id === id;

  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'active';
  });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit profile state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studentCohort, setStudentCohort] = useState('');
  const [district, setDistrict] = useState('');
  const [zalo, setZalo] = useState('');
  const [facebook, setFacebook] = useState('');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [window.location.search]);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}/public-profile`);
      setProfileData(res.data);
      setIsFollowing(res.data.user.isFollowing);

      if (currentUser?.id === id) {
        setFullName(res.data.user.fullName || '');
        setBio(res.data.user.bio || '');
        setFaculty(res.data.user.faculty || '');
        setStudentCohort(res.data.user.studentCohort || '');
        setDistrict(res.data.user.district || '');
        setZalo(res.data.user.zalo || '');
        setFacebook(res.data.user.facebook || '');
        setTelegram(res.data.user.telegram || '');
        setInstagram(res.data.user.instagram || '');
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const res = await api.post(`/users/${id}/follow`);
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi theo dõi.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName,
        bio,
        faculty,
        studentCohort,
        district,
        zalo,
        facebook,
        telegram,
        instagram
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu hồ sơ.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('Vui lòng điền đầy đủ 3 trường mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg('Mật khẩu mới và Nhập lại mật khẩu mới không khớp.');
      return;
    }

    try {
      const res = await api.put('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword
      });
      setPasswordMsg(res.data.message || 'Đổi mật khẩu thành công!');
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordSuccess(false);
      setPasswordMsg(err.response?.data?.message || 'Lỗi khi đổi mật khẩu.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('CẢNH BÁO: Dữ liệu của bạn sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn xóa tài khoản không?')) return;
    try {
      await api.delete('/auth/account');
      alert('Tài khoản đã được xóa.');
      logout();
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa tài khoản.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        Đang tải thông tin hồ sơ...
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-600">
        Không tìm thấy thông tin sinh viên này.
      </div>
    );
  }

  const { user, activeProducts, soldProducts, reviews } = profileData;

  // Total views counter
  const totalViews = [...activeProducts, ...soldProducts].reduce((sum, p) => sum + (p.views || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card (Spec Section 4 & 24) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4 sm:gap-6">
            <img
              src={getImageUrl(user.avatar, DEFAULT_AVATAR)}
              alt={user.fullName}
              onError={(e) => handleImageError(e, DEFAULT_AVATAR)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover bg-emerald-50 border-2 border-emerald-100 shadow-md shadow-emerald-600/10"
            />
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {user.fullName}
                </h1>
                <span className="text-xs text-slate-400 font-semibold">@{user.username}</span>
              </div>

              {user.university && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <GraduationCap className="w-4 h-4" />
                  <span>Sinh viên {user.university.name} ({user.university.shortName})</span>
                  {user.studentCohort && <span>• Khóa {user.studentCohort}</span>}
                </div>
              )}

              {user.faculty && (
                <div className="text-xs text-slate-500 font-medium">
                  Chuyên ngành: {user.faculty}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{user.district || 'Hà Nội'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-4 text-center">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 min-w-[70px]">
                <div className="flex items-center justify-center gap-1 font-black text-amber-500 text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{user.rating || 5.0}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{reviews.length} đánh giá</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 min-w-[70px]">
                <div className="font-black text-slate-800 text-sm">{activeProducts.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Đang bán</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 min-w-[70px]">
                <div className="font-black text-emerald-600 text-sm">{user.totalSold || soldProducts.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Đã pass</div>
              </div>
            </div>

            {!isMyProfile && (
              <div className="flex items-center gap-2 w-full sm:w-auto pt-1">
                <button
                  onClick={handleToggleFollow}
                  className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi người bán'}
                </button>
              </div>
            )}
          </div>

        </div>

        {user.bio && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 italic">
            "{user.bio}"
          </div>
        )}

        {/* Social Contact Links */}
        {(user.zalo || user.facebook || user.telegram || user.instagram) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-400 text-[11px]">Kênh liên hệ:</span>
            {user.zalo && (
              <a
                href={user.zalo.startsWith('http') ? user.zalo : `https://zalo.me/${user.zalo.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl border border-blue-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-blue-500 text-white font-black text-[10px] flex items-center justify-center">Z</span>
                <span>Zalo: {user.zalo}</span>
              </a>
            )}
            {user.facebook && (
              <a
                href={user.facebook.startsWith('http') ? user.facebook : `https://facebook.com/${user.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] font-bold rounded-xl border border-[#1877F2]/20 inline-flex items-center gap-1.5 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-[#1877F2] text-white font-black text-[10px] flex items-center justify-center">f</span>
                <span>Facebook</span>
              </a>
            )}
            {user.telegram && (
              <a
                href={user.telegram.startsWith('http') ? user.telegram : `https://t.me/${user.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold rounded-xl border border-sky-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <span className="text-xs">✈️</span>
                <span>Telegram: {user.telegram.startsWith('@') ? user.telegram : `@${user.telegram}`}</span>
              </a>
            )}
            {user.instagram && (
              <a
                href={user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 text-white font-black text-[10px] flex items-center justify-center">IG</span>
                <span>Instagram</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shrink-0 ${
            activeTab === 'active'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đang bán ({activeProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('sold')}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shrink-0 ${
            activeTab === 'sold'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã bán ({soldProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đánh giá uy tín ({reviews.length})
        </button>

        {isMyProfile && (
          <>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shrink-0 ${
                activeTab === 'stats'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Thống kê shop
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cài đặt tài khoản
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Products Active */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              Người bán hiện chưa có sản phẩm nào đang rao bán.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {activeProducts.map(p => (
                <ProductCard key={p.id} product={{ ...p, seller: user }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Products Sold */}
      {activeTab === 'sold' && (
        <div className="space-y-4">
          {soldProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              Chưa có sản phẩm nào đã bán thành công.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {soldProducts.map(p => (
                <ProductCard key={p.id} product={{ ...p, seller: user }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Reviews (Spec Section 19) */}
      {activeTab === 'reviews' && (
        <div className="space-y-4 max-w-3xl">
          {reviews.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              Chưa có nhận xét hay đánh giá nào.
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getImageUrl(r.reviewer?.avatar, DEFAULT_AVATAR)}
                      alt=""
                      onError={(e) => handleImageError(e, DEFAULT_AVATAR)}
                      className="w-8 h-8 rounded-xl object-cover bg-emerald-50"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-800">{r.reviewer?.fullName}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 pl-10 leading-relaxed">
                  "{r.comment}"
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Seller Statistics (Spec Section 26) */}
      {isMyProfile && activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-400">Tổng lượt xem các tin</div>
            <div className="text-3xl font-black text-slate-800">{totalViews}</div>
            <p className="text-[11px] text-slate-500">Lượng sinh viên quan tâm xem đồ của bạn</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-400">Đồ pass thành công</div>
            <div className="text-3xl font-black text-emerald-600">{user.totalSold || soldProducts.length}</div>
            <p className="text-[11px] text-slate-500">Giao dịch trực tiếp đã hoàn thành</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-400">Điểm uy tín trung bình</div>
            <div className="text-3xl font-black text-amber-500 flex items-center gap-1">
              <span>{user.rating || 5.0}</span>
              <Star className="w-6 h-6 fill-current text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-500">Dựa trên {reviews.length} đánh giá sinh viên</p>
          </div>
        </div>
      )}

      {/* Tab 5: Account Settings (Spec Section 43 & 44) */}
      {isMyProfile && activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Profile form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-5">
            <h3 className="font-bold text-base text-slate-800">Thông tin cá nhân sinh viên</h3>
            
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Cập nhật hồ sơ thành công!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Khoa / Viện đào tạo</label>
                <input
                  type="text"
                  placeholder="VD: Viện CNTT, Khoa Marketing..."
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Khóa sinh viên</label>
                  <input
                    type="text"
                    placeholder="VD: K65, K66..."
                    value={studentCohort}
                    onChange={(e) => setStudentCohort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Khu vực sinh sống</label>
                  <input
                    type="text"
                    placeholder="Cầu Giấy, Hai Bà Trưng..."
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bio giới thiệu ngắn</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Giới thiệu về bạn..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                ></textarea>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Liên kết liên hệ (Zalo, Facebook, Telegram, Instagram)
                </span>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Số điện thoại hoặc Link Zalo</label>
                  <input
                    type="text"
                    placeholder="VD: 0912345678 hoặc https://zalo.me/..."
                    value={zalo}
                    onChange={(e) => setZalo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Link Facebook cá nhân</label>
                  <input
                    type="text"
                    placeholder="https://facebook.com/..."
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Username hoặc Link Telegram</label>
                  <input
                    type="text"
                    placeholder="VD: @unimarket_student hoặc https://t.me/..."
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Link Instagram cá nhân</label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/..."
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>

          {/* Password & Security */}
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-base text-slate-800">Đổi mật khẩu</h3>

              {passwordMsg && (
                <div className="p-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
                  {passwordMsg}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Cập nhật mật khẩu
                </button>
              </form>
            </div>

            {/* Spec Section 44: Xóa tài khoản */}
            <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-200 space-y-3">
              <h3 className="font-bold text-sm text-rose-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Xóa vĩnh viễn tài khoản</span>
              </h3>
              <p className="text-xs text-rose-600 leading-relaxed">
                Sau khi xóa tài khoản, tất cả tin đăng bán, tin nhắn và lịch sử giao dịch của bạn sẽ không thể khôi phục.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Xóa tài khoản của tôi
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}