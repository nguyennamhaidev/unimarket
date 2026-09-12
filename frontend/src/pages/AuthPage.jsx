import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function AuthPage({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [universities, setUniversities] = useState([]);

  // Login Form
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  // Register Form
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studentCohort, setStudentCohort] = useState('');
  const [district, setDistrict] = useState('Cầu Giấy');

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl);
    }
    api.get('/universities').then(res => setUniversities(res.data.universities || [])).catch(console.error);
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await login(account, password);
      navigate(redirectUrl);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await register({
        fullName,
        username,
        email,
        password: regPassword,
        universityId,
        faculty,
        studentCohort,
        district
      });
      navigate(redirectUrl);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-600/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Đăng nhập UniMarket' : 'Đăng ký tài khoản Sinh viên'}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Tham gia trao đổi giáo trình & đồ cũ khuôn viên trường'
              : 'Đăng ký siêu nhanh - Không cần CCCD, không cần KYC'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Email hoặc Username *</label>
              <input
                type="text"
                placeholder="VD: NguyenNamHai hoặc nguyennamhaibusiness@gmail.com"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mật khẩu *</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Họ và tên sinh viên *</label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tên tài khoản (username) *</label>
                <input
                  type="text"
                  placeholder="VD: nguyenvana"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email *</label>
                <input
                  type="email"
                  placeholder="abc@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mật khẩu *</label>
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            {/* University & Cohort info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Trường Đại Học</label>
                <select
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">Chọn trường</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Khóa (K64, K65...)</label>
                <input
                  type="text"
                  placeholder="VD: K65"
                  value={studentCohort}
                  onChange={(e) => setStudentCohort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Khu vực sinh sống / trọ</label>
              <input
                type="text"
                placeholder="VD: Cầu Giấy, Hai Bà Trưng, Đống Đa..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all mt-2"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất Đăng ký'}
            </button>
          </form>
        )}

        {/* Toggle Mode */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {mode === 'login' ? (
            <div>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-600 font-bold hover:underline"
              >
                Đăng ký tài khoản ngay
              </button>
            </div>
          ) : (
            <div>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-600 font-bold hover:underline"
              >
                Đăng nhập tại đây
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}