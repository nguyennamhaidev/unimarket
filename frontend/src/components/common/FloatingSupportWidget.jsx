import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Headphones, 
  X, 
  MessageSquare, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Phone, 
  Send, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function FloatingSupportWidget() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'report'
  const [supportStaff, setSupportStaff] = useState({ admins: [], qtvs: [] });
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [connectingId, setConnectingId] = useState(null);
  const [systemSettings, setSystemSettings] = useState({
    zaloContact: 'https://zalo.me/0987654321',
    telegramContact: 'https://t.me/unimarket_support'
  });

  useEffect(() => {
    // Fetch public settings (Zalo & Telegram) and support staff
    api.get('/settings').then(res => {
      if (res.data?.settings) setSystemSettings(res.data.settings);
    }).catch(console.error);

    fetchSupportStaff();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSupportStaff();
    }
  }, [isOpen]);

  const fetchSupportStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await api.get('/chat/support-staff');
      setSupportStaff({
        admins: res.data.admins || [],
        qtvs: res.data.qtvs || res.data.ctvs || []
      });
    } catch (err) {
      console.error('Fetch support staff error:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleStartChat = async (staff) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      setIsOpen(false);
      return;
    }

    setConnectingId(staff.id);
    try {
      const roleTitle = staff.role === 'ADMIN' ? 'Admin' : 'Quản Trị Viên (QTV)';
      const topic = `Hỗ trợ trực tuyến Chợ Sinh Viên UniMarket`;
      const initialMessage = `👋 Chào ${roleTitle}, mình cần hỗ trợ trực tiếp từ UniMarket. Hỗ trợ giúp mình nhé!`;

      const res = await api.post('/chat/start-support', {
        staffId: staff.id,
        topic,
        initialMessage
      });

      setIsOpen(false);
      navigate(`/messages?id=${res.data.conversationId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi kết nối hỗ trợ viên.');
    } finally {
      setConnectingId(null);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportDesc.trim()) {
      alert('Vui lòng nhập mô tả chi tiết nội dung sự cố / vi phạm.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      setIsOpen(false);
      return;
    }

    setSubmittingReport(true);
    try {
      const reasonLabels = {
        SCAM: 'Lừa đảo / Gian lận tiền cọc',
        FAKE_ITEM: 'Hàng giả / Sai mô tả thực tế',
        IMPERSONATION: 'Tài khoản giả mạo sinh viên',
        SPAM: 'Spam tin / Đăng sai danh mục',
        BUG: 'Lỗi giao diện / Lỗi hệ thống website',
        OTHER: 'Vấn đề khác'
      };

      const fullDesc = reportTarget.trim() 
        ? `[Đối tượng vi phạm/Liên kết]: ${reportTarget.trim()}\n[Chi tiết]: ${reportDesc.trim()}`
        : reportDesc.trim();

      await api.post('/reports', {
        reason: reasonLabels[reportReason] || reportReason,
        description: fullDesc
      });

      setReportSuccess(true);
      setReportDesc('');
      setReportTarget('');
      setTimeout(() => {
        setReportSuccess(false);
        setActiveTab('chat');
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi báo cáo sự cố.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Popover Card */}
      {isOpen && (
        <div 
          className="mb-3 w-[360px] sm:w-[400px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-black shadow-inner">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                  <span>Trung Tâm Hỗ Trợ 24/7</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </h3>
                <p className="text-[11px] text-white/90">Chợ Sinh Viên UniMarket</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="p-2 bg-slate-100/90 border-b border-slate-200 flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
              <span>1. Nhắn Tin Support</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'report'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>2. Gửi Báo Cáo Sự Cố</span>
            </button>
          </div>

          {/* Tab 1: Chat Support */}
          {activeTab === 'chat' && (
            <div className="p-4 flex-1 overflow-y-auto space-y-3.5 custom-scrollbar text-xs">
              <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-3 rounded-2xl border border-rose-100">
                <p className="font-bold text-slate-800">👋 Chào bạn, bạn cần hỗ trợ gì?</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chọn kết nối trực tiếp với Quản Trị Viên hoặc Cộng Tác Viên sinh viên trường bạn để được giải đáp ngay:
                </p>
              </div>

              {/* Staff List */}
              <div className="space-y-2">
                <div className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ban Quản Trị &amp; QTV Hỗ Trợ 24/7</span>
                </div>

                {loadingStaff ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                ) : [...supportStaff.admins, ...(supportStaff.qtvs || [])].length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    Đang kết nối hệ thống hỗ trợ...
                  </div>
                ) : (
                  Array.from(new Map([...supportStaff.admins, ...(supportStaff.qtvs || [])].map(s => [s.id, s])).values()).map((staff) => {
                    const avatarUrl = staff.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${staff.username}`;
                    const isConnecting = connectingId === staff.id;

                    return (
                      <div
                        key={staff.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-xs transition-all flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={avatarUrl}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                              <span>{staff.fullName}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                staff.role === 'ADMIN' 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : staff.role === 'QTV' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {staff.role === 'ADMIN' ? 'Admin' : staff.role === 'QTV' ? 'QTV' : 'CTV'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              @{staff.username} • {staff.university?.shortName || 'UniMarket Support'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartChat(staff)}
                          disabled={isConnecting}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[11px] rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isConnecting ? (
                            <span>Đang mở...</span>
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat ngay</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Links: Zalo & Telegram */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-600">Kênh hỗ trợ khẩn cấp mạng xã hội:</div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={systemSettings.zaloContact?.startsWith('http') ? systemSettings.zaloContact : `https://zalo.me/${systemSettings.zaloContact || '0987654321'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-blue-200 transition-colors text-[11px]"
                  >
                    <span className="w-4 h-4 bg-blue-600 text-white rounded-md text-[10px] font-black flex items-center justify-center">Z</span>
                    <span>Zalo Hỗ Trợ</span>
                  </a>
                  <a
                    href={systemSettings.telegramContact?.startsWith('http') ? systemSettings.telegramContact : `https://t.me/${(systemSettings.telegramContact || 'unimarket_support').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-sky-200 transition-colors text-[11px]"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>Telegram Hỗ Trợ</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Report Form */}
          {activeTab === 'report' && (
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar text-xs">
              {reportSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">Gửi Báo Cáo Thành Công!</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Ban Quản Trị UniMarket đã tiếp nhận thông tin và sẽ tiến hành kiểm tra xử lý trong vòng 24h.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendReport} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Loại sự cố / Vi phạm:</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-red-500 transition-all font-medium"
                    >
                      <option value="SCAM">🚨 Lừa đảo / Gian lận tiền cọc</option>
                      <option value="FAKE_ITEM">📦 Hàng giả / Sai mô tả thực tế</option>
                      <option value="IMPERSONATION">👤 Tài khoản mạo danh sinh viên</option>
                      <option value="SPAM">📢 Spam bài đăng / Nội dung phản cảm</option>
                      <option value="BUG">🛠️ Lỗi giao diện / Tính năng website</option>
                      <option value="OTHER">❓ Vấn đề khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tên người vi phạm hoặc Link sản phẩm (tùy chọn):
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: @username_nghiban hoặc link sản phẩm..."
                      value={reportTarget}
                      onChange={(e) => setReportTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mô tả chi tiết nội dung sự cố <span className="text-red-500">*</span>:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Mô tả cụ thể sự việc, bằng chứng trao đổi hoặc lỗi bạn gặp phải để Admin xử lý nhanh nhất..."
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-red-500 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReport || !reportDesc.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white font-black rounded-xl transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReport ? (
                      <span>Đang gửi báo cáo...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi Báo Cáo Cho Admin</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
            UniMarket bảo vệ thông tin người dùng &amp; xử lý vi phạm nghiêm ngặt.
          </div>
        </div>
      )}

      {/* Floating Action Button (Red Circle with Headset Icon 🎧 matching user's image) */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center shadow-xl shadow-red-600/40 ring-4 ring-red-100 hover:ring-red-200 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
        title="Hỗ trợ trực tiếp & Báo cáo UniMarket"
      >
        {/* Pulse Ring */}
        <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping pointer-events-none"></span>

        {/* Online Indicator Green Dot */}
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs"></span>

        {/* Headset Icon */}
        {isOpen ? (
          <X className="w-6 h-6 text-white transition-transform group-hover:rotate-90" />
        ) : (
          <Headphones className="w-6 h-6 text-white drop-shadow-sm transition-transform group-hover:scale-110" />
        )}
      </button>

    </div>
  );
}
