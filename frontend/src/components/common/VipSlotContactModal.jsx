import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Phone, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function VipSlotContactModal({ isOpen, onClose, slotNumber, slotType = 'product' }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [supportStaff, setSupportStaff] = useState({ admins: [], qtvs: [] });
  const [loading, setLoading] = useState(true);
  const [selectedStaffType, setSelectedStaffType] = useState('admin'); // 'admin' | 'qtv'
  const [connectingId, setConnectingId] = useState(null);
  const [systemSettings, setSystemSettings] = useState({
    zaloContact: 'https://zalo.me/0987654321',
    telegramContact: 'https://t.me/unimarket_support'
  });

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      api.get('/settings').then(res => {
        if (res.data?.settings) setSystemSettings(res.data.settings);
      }).catch(console.error);
    }
  }, [isOpen]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chat/support-staff');
      setSupportStaff({
        admins: res.data.admins || [],
        qtvs: res.data.qtvs || res.data.ctvs || []
      });
    } catch (err) {
      console.error('Fetch support staff error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleStartChat = async (staff) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/');
      return;
    }

    setConnectingId(staff.id);
    try {
      const isShop = slotType === 'shop';
      const roleTitle = staff.role === 'ADMIN' ? 'Admin' : 'Quản Trị Viên (QTV)';
      const topic = isShop 
        ? `Đăng ký Gian Hàng Top Shop #${String(slotNumber).padStart(2, '0')}`
        : `Đăng ký Sản Phẩm Nổi Bật Slot #${String(slotNumber).padStart(2, '0')}`;
      
      const initialMessage = `👋 Chào ${roleTitle}, mình muốn đăng ký đưa ${isShop ? 'gian hàng' : 'sản phẩm'} lên Vị Trí VIP #${String(slotNumber).padStart(2, '0')} trên Chợ Sinh Viên UniMarket. Tư vấn & duyệt slot giúp mình nhé!`;

      const res = await api.post('/chat/start-support', {
        staffId: staff.id,
        topic,
        slotNumber,
        initialMessage
      });

      onClose();
      navigate(`/messages?id=${res.data.conversationId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi kết nối hỗ trợ viên.');
    } finally {
      setConnectingId(null);
    }
  };

  const isShop = slotType === 'shop';
  const staffList = selectedStaffType === 'admin' ? supportStaff.admins : supportStaff.qtvs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 bg-black/20 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full backdrop-blur-xs w-max mb-1">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>ĐĂNG KÝ VỊ TRÍ VIP</span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              {isShop ? `Gian Hàng VIP #${String(slotNumber).padStart(2, '0')}` : `Sản Phẩm VIP #${String(slotNumber).padStart(2, '0')}`}
            </h3>
            <p className="text-xs text-white/90 mt-0.5">
              Chọn kênh hỗ trợ để nhắn tin trực tiếp và kích hoạt hiển thị
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Type Switcher Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStaffType('admin')}
            className={`flex-1 py-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              selectedStaffType === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Nhắn Quản Trị Viên (Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStaffType('qtv')}
            className={`flex-1 py-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              selectedStaffType === 'qtv'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Nhắn Ban Quản Trị (QTV)</span>
          </button>
        </div>

        {/* Body: Staff List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          <div className="text-[11px] font-semibold text-slate-500">
            {selectedStaffType === 'admin' 
              ? '🛡️ Đội ngũ Quản trị viên duyệt slot trực tiếp & nhanh nhất:' 
              : '🤝 Cộng tác viên sinh viên hỗ trợ tư vấn các trường & KTX:'}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Chưa có nhân viên hỗ trợ nào trực tuyến trong mục này.
            </div>
          ) : (
            staffList.map((staff) => {
              const avatarUrl = staff.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${staff.username}`;
              const isConnecting = connectingId === staff.id;

              return (
                <div
                  key={staff.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={avatarUrl}
                        alt={staff.fullName}
                        className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white">
                        ✓
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                        <span>{staff.fullName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          staff.role === 'ADMIN' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {staff.role === 'ADMIN' ? 'Admin' : 'CTV'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        @{staff.username} • {staff.university?.shortName || 'UniMarket Support'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-emerald-700 font-semibold">
                        <span>⚡ Đang trực tuyến phản hồi ngay</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartChat(staff)}
                    disabled={isConnecting}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {isConnecting ? (
                      <span>Đang kết nối...</span>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Nhắn tin</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}

          {/* Quick Zalo & Telegram section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-700 mb-2">
              Hoặc liên hệ nhanh qua mạng xã hội:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={systemSettings.zaloContact?.startsWith('http') ? systemSettings.zaloContact : `https://zalo.me/${systemSettings.zaloContact || '0987654321'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 transition-colors"
              >
                <span className="w-4 h-4 bg-blue-600 text-white rounded text-[10px] font-black flex items-center justify-center">Z</span>
                <span>Zalo Hỗ Trợ 24/7</span>
              </a>
              <a
                href={systemSettings.telegramContact?.startsWith('http') ? systemSettings.telegramContact : `https://t.me/${(systemSettings.telegramContact || 'unimarket_support').replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-sky-200 transition-colors"
              >
                <span className="text-sm">✈️</span>
                <span>Telegram Duyệt VIP</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Chợ Sinh Viên UniMarket cam kết duyệt slot công khai, minh bạch &amp; hỗ trợ 24/7.
        </div>
      </div>
    </div>
  );
}
