import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Smile, 
  Image as ImageIcon, 
  CheckCircle2, 
  Check, 
  Clock, 
  Star, 
  MapPin, 
  MoreVertical, 
  Trash2, 
  Ban, 
  AlertCircle, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket, setUnreadMessagesCount } = useSocket();

  const conversationIdFromUrl = searchParams.get('id');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvList, setLoadingConvList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [transaction, setTransaction] = useState(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedSuccess, setReviewedSuccess] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/messages');
      return;
    }
    fetchConversations();
  }, [isAuthenticated]);

  // Handle active conversation selection
  useEffect(() => {
    if (conversationIdFromUrl) {
      loadConversationMessages(conversationIdFromUrl);
    } else if (conversations.length > 0 && !activeConv) {
      loadConversationMessages(conversations[0].id);
    }
  }, [conversationIdFromUrl, conversations.length]);

  // Socket listener for new messages, read receipts & typing
  useEffect(() => {
    if (!socket || !activeConv) return;

    socket.emit('join_conversation', activeConv.id);
    socket.emit('mark_read', { conversationId: activeConv.id, userId: user?.id });

    const handleNewMessage = (msg) => {
      if (msg.conversationId === activeConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();

        // If message is from partner, mark it as read immediately
        if (msg.senderId !== user?.id) {
          socket.emit('mark_read', { conversationId: activeConv.id, userId: user?.id });
          api.post(`/chat/conversation/${activeConv.id}/read`).catch(() => {});
        }
      }

      // Update snippet in conversation list
      setConversations(prev => prev.map(c => {
        if (c.id === msg.conversationId) {
          const isCurrentActive = activeConv.id === msg.conversationId;
          return {
            ...c,
            lastMessage: msg,
            lastMessageAt: msg.createdAt,
            unreadCount: isCurrentActive || msg.senderId === user?.id ? 0 : (c.unreadCount || 0) + 1
          };
        }
        return c;
      }));
    };

    const handleMessagesRead = ({ conversationId }) => {
      if (conversationId === activeConv.id) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    const handleUserTyping = ({ conversationId, isTyping: typingStatus }) => {
      if (conversationId === activeConv.id) {
        setPartnerTyping(typingStatus);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.emit('leave_conversation', activeConv.id);
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, activeConv?.id, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const fetchConversations = async () => {
    setLoadingConvList(true);
    try {
      const res = await api.get('/chat/conversations');
      const list = res.data.conversations || [];
      setConversations(list);
      if (setUnreadMessagesCount) {
        const total = list.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(total);
      }
    } catch (err) {
      console.error('fetchConversations error:', err);
    } finally {
      setLoadingConvList(false);
    }
  };

  const loadConversationMessages = async (convId) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/conversation/${convId}/messages`);
      setActiveConv(res.data.conversation);
      setMessages(res.data.messages || []);
      setTransaction(res.data.transaction || null);

      // Clear unread badge in list
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
      setSearchParams({ id: convId });

      if (socket) {
        socket.emit('mark_read', { conversationId: convId, userId: user?.id });
      }

      // If URL has review param, open modal
      if (searchParams.get('review') === 'true') {
        setShowReviewModal(true);
      }
    } catch (err) {
      console.error('loadConversationMessages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !activeConv) return;

    try {
      const res = await api.post('/chat/message', {
        conversationId: activeConv.id,
        text: textToSend.trim()
      });

      const newMsg = res.data.message;
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setInputText('');

      // Notify stop typing
      if (socket) {
        socket.emit('typing', { conversationId: activeConv.id, isTyping: false });
      }

      // Update in conversation list
      setConversations(prev => prev.map(c => {
        if (c.id === activeConv.id) {
          return { ...c, lastMessage: newMsg, lastMessageAt: new Date() };
        }
        return c;
      }));

      scrollToBottom();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi tin nhắn.');
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !activeConv) return;

    socket.emit('typing', { conversationId: activeConv.id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId: activeConv.id, isTyping: false });
    }, 2000);
  };

  const handleMarkAsSoldToPartner = async () => {
    if (!window.confirm(`Xác nhận đánh dấu đã bán sản phẩm này cho bạn ${partner?.fullName}?`)) return;

    try {
      const res = await api.post(`/products/${activeConv.productId}/sold`, {
        buyerId: activeConv.buyerId
      });

      alert('Đã xác nhận giao dịch thành công! Sản phẩm đã chuyển sang trạng thái ĐÃ BÁN.');
      setActiveConv(prev => ({
        ...prev,
        product: { ...prev.product, status: 'SOLD' }
      }));
      setTransaction(res.data.transaction);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật giao dịch.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const targetUserId = isSeller ? activeConv.buyerId : activeConv.sellerId;
      await api.post('/reviews', {
        targetUserId,
        transactionId: transaction?.id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      setReviewedSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewedSuccess(false);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBlockPartner = async () => {
    if (!partner || !window.confirm(`Bạn có chắc chắn muốn chặn ${partner.fullName}?`)) return;
    try {
      await api.post(`/users/${partner.id}/block`);
      alert('Đã chặn người dùng này thành công.');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi chặn người dùng.');
    }
  };

  const handleDeleteConv = async () => {
    if (!activeConv || !window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) return;
    try {
      await api.delete(`/chat/conversation/${activeConv.id}`);
      alert('Đã xóa cuộc trò chuyện.');
      setActiveConv(null);
      fetchConversations();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa.');
    }
  };

  const isSeller = activeConv?.sellerId === user?.id;
  const partner = isSeller ? activeConv?.buyer : activeConv?.seller;
  const product = activeConv?.product;

  const formatSocialLink = (type, val) => {
    if (!val) return null;
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    if (type === 'zalo') {
      const cleanPhone = val.replace(/[^0-9]/g, '');
      return `https://zalo.me/${cleanPhone}`;
    }
    if (type === 'facebook') {
      const clean = val.replace(/^@/, '');
      return `https://facebook.com/${clean}`;
    }
    if (type === 'instagram') {
      const clean = val.replace(/^@/, '');
      return `https://instagram.com/${clean}`;
    }
    return val;
  };

  const handleShareMyProfile = () => {
    let text = `👋 Chào bạn, đây là thông tin liên hệ / Trang Cá Nhân của mình:\n`;
    if (user?.facebook) text += `🌐 Facebook: ${formatSocialLink('facebook', user.facebook)}\n`;
    if (user?.zalo) text += `📱 Zalo: ${formatSocialLink('zalo', user.zalo)}\n`;
    if (user?.instagram) text += `📷 Instagram: ${formatSocialLink('instagram', user.instagram)}\n`;
    if (!user?.facebook && !user?.zalo && !user?.instagram) {
      text += `👤 Trang cá nhân UniMarket: ${window.location.origin}/profile/${user?.id}`;
    }
    handleSendMessage(text.trim());
  };

  const quickReplies = isSeller
    ? [
        'Chào bạn, món đồ này vẫn còn nhé!',
        'Bạn qua cổng trường lấy hay mình đem qua KTX?',
        'Giá này mình chỉ fix nhẹ tiền xăng xe 10k được thôi nha.',
        'Hẹn bạn 17h chiều nay ở cổng trường nhé!'
      ]
    : [
        'Chào bạn, sản phẩm này còn không ạ?',
        'Có thể bớt thêm chút đỉnh cho sinh viên được không bạn?',
        'Chiều nay mình qua cổng trường xem đồ được không?',
        'Đồ có lỗi lầm hay trầy xước gì không bạn?'
      ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-5rem)]">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col md:flex-row">
        
        {/* Left Column: Conversations List (Spec Section 17) */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center justify-between">
              <span>Đoạn chat ({conversations.length})</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                UniMarket Chat
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {loadingConvList ? (
              <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                Đang tải danh sách tin nhắn...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Chưa có cuộc trò chuyện nào.</p>
                <p className="text-[11px] text-slate-400">
                  Hãy bấm "Nhắn tin người bán" tại trang chi tiết sản phẩm để bắt đầu trao đổi!
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const prodImg = conv.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationMessages(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-white'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.partner?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.partner?.username}`}
                        alt={conv.partner?.fullName}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {conv.partner?.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Product snippet */}
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold truncate mt-0.5">
                        <span className="truncate">📦 {conv.product?.title}</span>
                      </div>

                      {/* Last message */}
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.text || '[Hình ảnh]'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (Spec Section 15 & 16) */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
            
            {/* Top Bar: Partner info */}
            <div className="p-3 sm:px-6 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="md:hidden p-1 text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Link to={`/profile/${partner?.id}`} className="relative group flex items-center gap-2.5">
                  <img
                    src={partner?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${partner?.username}`}
                    alt=""
                    className="w-10 h-10 rounded-2xl object-cover border border-slate-200 group-hover:opacity-80"
                  />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                      <span>{partner?.fullName}</span>
                      {partner?.rating && (
                        <span className="flex items-center gap-0.5 text-amber-500 text-[11px] font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{partner.rating}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {partnerTyping ? (
                        <span className="text-emerald-600 font-bold animate-pulse">Đang nhập...</span>
                      ) : (
                        `@${partner?.username} • ${isSeller ? 'Người hỏi mua' : 'Người bán'}`
                      )}
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-1.5">
                {/* 1-Click Social Contact Buttons directly on Header */}
                {partner?.zalo && (
                  <a
                    href={formatSocialLink('zalo', partner.zalo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Mở Zalo của ${partner.fullName}`}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold border border-blue-200 flex items-center gap-1 transition-all"
                  >
                    <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded text-[9px] flex items-center justify-center font-black">Z</span>
                    <span className="hidden sm:inline">Zalo</span>
                  </a>
                )}
                {partner?.facebook && (
                  <a
                    href={formatSocialLink('facebook', partner.facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Mở Facebook cá nhân của ${partner.fullName}`}
                    className="px-2.5 py-1 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-xl text-xs font-bold border border-[#1877F2]/20 flex items-center gap-1 transition-all"
                  >
                    <span className="w-3.5 h-3.5 bg-[#1877F2] text-white rounded text-[9px] flex items-center justify-center font-black">f</span>
                    <span className="hidden sm:inline">Facebook</span>
                  </a>
                )}
                {partner?.instagram && (
                  <a
                    href={formatSocialLink('instagram', partner.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Mở Instagram của ${partner.fullName}`}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-1 transition-all"
                  >
                    <span className="w-3.5 h-3.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 text-white rounded text-[9px] flex items-center justify-center font-black">IG</span>
                    <span className="hidden sm:inline">Instagram</span>
                  </a>
                )}

                <button
                  onClick={handleBlockPartner}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 transition-colors"
                  title="Chặn người này"
                >
                  <Ban className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteConv}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 transition-colors"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Spec Section 16: "Chat phải gắn với sản phẩm" - Product Context Sticky Header Bar */}
            {product && (
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{product.title}</div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-black text-rose-600">
                        {product.isFree ? 'Miễn phí 0đ' : new Intl.NumberFormat('vi-VN').format(product.price) + ' đ'}
                      </span>
                      {product.status === 'SOLD' && (
                        <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                          ĐÃ BÁN
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/product/${product.id}`}
                    target="_blank"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-sm"
                  >
                    <span>Xem SP</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {/* Spec Section 18: [Đánh dấu đã bán] directly inside chat */}
                  {isSeller && product.status !== 'SOLD' && (
                    <button
                      onClick={handleMarkAsSoldToPartner}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-[11px] shadow-sm shadow-emerald-600/30 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đánh dấu đã bán cho bạn này</span>
                    </button>
                  )}

                  {/* Review Button if transaction completed */}
                  {transaction && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Đánh giá</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Messages Thread */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar bg-slate-50/30"
            >
              {loadingMessages ? (
                <div className="text-center py-10 text-xs text-slate-400">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-slate-400">
                  <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Bắt đầu cuộc trò chuyện!</p>
                  <p className="text-[11px]">
                    Hãy chào hỏi thân thiện và trao đổi về tình trạng đồ hoặc điểm hẹn cổng trường/KTX.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  
                  // Helper to parse URLs inside text and make them clickable
                  const renderMessageBody = (text) => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const parts = text.split(urlRegex);
                    return parts.map((part, idx) => {
                      if (part.match(urlRegex)) {
                        const isFb = part.includes('facebook.com');
                        const isZalo = part.includes('zalo.me');
                        const isIg = part.includes('instagram.com');
                        return (
                          <a
                            key={idx}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-xl text-xs font-bold shadow-xs transition-all ${
                              isMine 
                                ? 'bg-white/20 hover:bg-white/30 text-white underline' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <span>
                              {isFb ? '🌐 Mở Facebook cá nhân' : isZalo ? '📱 Mở Zalo' : isIg ? '📷 Mở Instagram' : '🔗 ' + part}
                            </span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        );
                      }
                      return <span key={idx}>{part}</span>;
                    });
                  };

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="" className="rounded-xl mb-2 max-w-xs object-cover" />
                        )}
                        <p className="whitespace-pre-wrap">{renderMessageBody(msg.text)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                        <span>{new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && (
                          <span>{msg.isRead ? '• Đã xem' : '• Đã gửi'}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips & Share Profile Button */}
            <div className="px-4 py-1.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={handleShareMyProfile}
                className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 shadow-xs flex items-center gap-1 transition-all"
                title="Gửi nhanh liên kết Zalo/Facebook/Instagram của bạn"
              >
                <span>📲 Gửi Trang Cá Nhân (Zalo/FB/IG)</span>
              </button>

              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qr)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-medium shrink-0 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Nhập tin nhắn... (Thương lượng giá, hẹn cổng trường...)"
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-slate-100 focus:bg-white text-slate-800 text-xs sm:text-sm rounded-2xl px-4 py-2.5 border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-3 p-8 text-slate-400 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300" />
            <h3 className="font-bold text-sm text-slate-700">Chưa chọn cuộc trò chuyện nào</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Chọn một bạn trong danh sách bên trái hoặc nhắn tin từ trang chi tiết sản phẩm.
            </p>
          </div>
        )}

      </div>

      {/* Review Modal (Spec Section 19) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Đánh giá người bán sau giao dịch</span>
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800">Cảm ơn bạn đã gửi đánh giá!</h4>
                <p className="text-xs text-slate-500">Điểm uy tín của đối phương đã được cập nhật.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="text-center space-y-2 py-2">
                  <span className="text-xs font-bold text-slate-600">Mức độ hài lòng của bạn:</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition-transform hover:scale-125"
                      >
                        <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-amber-600">
                    {reviewRating === 5 && 'Tuyệt vời, bán đúng mô tả, giao dịch nhanh!'}
                    {reviewRating === 4 && 'Rất tốt, hài lòng với món đồ'}
                    {reviewRating === 3 && 'Bình thường, tạm ổn'}
                    {reviewRating <= 2 && 'Chưa hài lòng'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Lời nhận xét *</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Bạn bán hàng nhiệt tình, sách giải tích nhiều ghi chú ôn thi rất tốt..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Để sau
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}