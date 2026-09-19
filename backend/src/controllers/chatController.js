const prisma = require('../prisma');

// Track rate limit in memory (Map of userId -> array of timestamps)
const userMessageTimestamps = new Map();

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user.id;

    if (!productId) {
      return res.status(400).json({ message: 'Thiếu productId' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { take: 1 },
        seller: {
          select: { id: true, fullName: true, username: true, avatar: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
    }

    if (product.sellerId === buyerId) {
      return res.status(400).json({ message: 'Bạn không thể tự chat với chính mình.' });
    }

    // Check if blocked
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: product.sellerId, blockedId: buyerId },
          { blockerId: buyerId, blockedId: product.sellerId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({ message: 'Không thể mở cuộc trò chuyện do bạn hoặc người bán đã chặn nhau.' });
    }

    let conversation = await prisma.conversation.findUnique({
      where: {
        productId_buyerId_sellerId: {
          productId,
          buyerId,
          sellerId: product.sellerId
        }
      },
      include: {
        product: {
          include: { images: { take: 1 }, seller: { select: { fullName: true } } }
        },
        buyer: { select: { id: true, fullName: true, username: true, avatar: true } },
        seller: { select: { id: true, fullName: true, username: true, avatar: true } }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          productId,
          buyerId,
          sellerId: product.sellerId,
        },
        include: {
          product: {
            include: { images: { take: 1 }, seller: { select: { fullName: true } } }
          },
          buyer: { select: { id: true, fullName: true, username: true, avatar: true } },
          seller: { select: { id: true, fullName: true, username: true, avatar: true } }
        }
      });
    }

    res.json({ conversation });
  } catch (err) {
    console.error('getOrCreateConversation error:', err);
    res.status(500).json({ message: 'Lỗi khi khởi tạo cuộc trò chuyện.' });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        product: {
          include: {
            images: { take: 1 },
            seller: { select: { id: true, fullName: true, avatar: true } }
          }
        },
        buyer: { select: { id: true, fullName: true, username: true, avatar: true } },
        seller: { select: { id: true, fullName: true, username: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Compute unread counts for each conversation
    const formatted = await Promise.all(conversations.map(async (c) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          isRead: false
        }
      });

      const partner = (c.buyerId === userId ? c.seller : c.buyer) || {
        id: 'deleted_user',
        fullName: 'Người dùng UniMarket',
        username: 'unimarket_user',
        avatar: null
      };

      const product = c.product || {
        id: c.productId,
        title: 'Sản phẩm đã gỡ hoặc không tồn tại',
        price: 0,
        isFree: false,
        status: 'DELETED',
        images: []
      };

      return {
        id: c.id,
        productId: c.productId,
        product,
        partner,
        isSeller: c.sellerId === userId,
        lastMessage: c.messages[0] || null,
        unreadCount,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt
      };
    }));

    res.json({ conversations: formatted });
  } catch (err) {
    console.error('getMyConversations error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách hội thoại.' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            images: { take: 1 },
            seller: { select: { id: true, fullName: true, avatar: true, rating: true, totalSold: true } }
          }
        },
        buyer: { select: { id: true, fullName: true, username: true, avatar: true, rating: true, totalSold: true, zalo: true, facebook: true, instagram: true } },
        seller: { select: { id: true, fullName: true, username: true, avatar: true, rating: true, totalSold: true, zalo: true, facebook: true, instagram: true } }
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Cuộc trò chuyện không tồn tại hoặc đã bị xóa.' });
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bạn không có quyền xem cuộc trò chuyện này.' });
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    });

    // Notify other party via socket that messages are read
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${id}`).emit('messages_read', {
        conversationId: id,
        readBy: userId
      });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, fullName: true, avatar: true }
        }
      }
    });

    // Safe fallbacks for deleted product or partner
    const safeProduct = conversation.product || {
      id: conversation.productId,
      title: 'Sản phẩm đã gỡ hoặc không tồn tại',
      price: 0,
      isFree: false,
      status: 'DELETED',
      images: []
    };

    const safeBuyer = conversation.buyer || {
      id: conversation.buyerId,
      fullName: 'Người mua UniMarket',
      username: 'buyer',
      avatar: null,
      rating: 5.0
    };

    const safeSeller = conversation.seller || {
      id: conversation.sellerId,
      fullName: 'Người bán UniMarket',
      username: 'seller',
      avatar: null,
      rating: 5.0
    };

    // Check if there's an existing transaction / review
    let transaction = null;
    if (conversation.productId) {
      transaction = await prisma.transaction.findFirst({
        where: {
          productId: conversation.productId,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId
        },
        include: {
          reviews: true
        }
      });
    }

    res.json({
      conversation: {
        ...conversation,
        product: safeProduct,
        buyer: safeBuyer,
        seller: safeSeller
      },
      messages,
      transaction
    });
  } catch (err) {
    console.error('getConversationMessages error:', err);
    res.status(500).json({ message: 'Lỗi khi tải tin nhắn.' });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${id}`).emit('messages_read', {
        conversationId: id,
        readBy: userId
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('markConversationRead error:', err);
    res.status(500).json({ message: 'Lỗi khi đánh dấu tin nhắn đã đọc.' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text, imageUrl } = req.body;
    const senderId = req.user.id;

    if ((!text || text.trim() === '') && !imageUrl) {
      return res.status(400).json({ message: 'Tin nhắn không được để trống.' });
    }

    // Anti-spam rule (Spec Section 40: "Không gửi quá 20 tin / 10 giây")
    const now = Date.now();
    const timestamps = (userMessageTimestamps.get(senderId) || []).filter(t => now - t < 10000);
    if (timestamps.length >= 20) {
      return res.status(429).json({ message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau vài giây!' });
    }
    timestamps.push(now);
    userMessageTimestamps.set(senderId, timestamps);

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        product: true,
        buyer: true,
        seller: true
      }
    });

    if (!conv) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện.' });
    }

    if (conv.buyerId !== senderId && conv.sellerId !== senderId) {
      return res.status(403).json({ message: 'Bạn không thuộc cuộc trò chuyện này.' });
    }

    const recipientId = conv.buyerId === senderId ? conv.sellerId : conv.buyerId;

    // Check block
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: recipientId, blockedId: senderId },
          { blockerId: senderId, blockedId: recipientId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({ message: 'Không thể gửi tin nhắn vì hai người đã chặn nhau.' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text: (text || '').trim(),
        imageUrl: imageUrl || null
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatar: true }
        }
      }
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: `Tin nhắn từ ${req.user.fullName}`,
        content: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : '[Hình ảnh]',
        type: 'MESSAGE',
        link: `/messages?id=${conversationId}`
      }
    });

    // If socket server is available, emit event
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', message);
      io.to(`user_${recipientId}`).emit('notification', {
        title: `Tin nhắn từ ${req.user.fullName}`,
        content: text || '[Hình ảnh]',
        type: 'MESSAGE',
        conversationId
      });
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Lỗi khi gửi tin nhắn.' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện.' });
    }

    if (conv.buyerId !== userId && conv.sellerId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa cuộc trò chuyện này.' });
    }

    // Delete conversation and messages
    await prisma.conversation.delete({ where: { id } });

    res.json({ message: 'Đã xóa cuộc trò chuyện.' });
  } catch (err) {
    console.error('deleteConversation error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa cuộc trò chuyện.' });
  }
};

// Lấy danh sách nhân sự hỗ trợ (Admin & CTV)
// Lấy danh sách nhân sự hỗ trợ (Quản trị viên Admin & QTV)
exports.getSupportStaff = async (req, res) => {
  try {
    let staff = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'QTV', 'CTV'] },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatar: true,
        role: true,
        rating: true,
        totalSold: true,
        zalo: true,
        facebook: true,
        telegram: true,
        university: { select: { shortName: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Nếu trong DB chưa có user nào role ADMIN/QTV thì lấy user đầu tiên
    if (staff.length === 0) {
      const firstUser = await prisma.user.findFirst({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          fullName: true,
          username: true,
          avatar: true,
          role: true,
          rating: true,
          totalSold: true,
          zalo: true,
          facebook: true,
          telegram: true,
          university: { select: { shortName: true, name: true } }
        }
      });
      if (firstUser) {
        staff = [{ ...firstUser, role: 'ADMIN', fullName: firstUser.fullName || 'Admin UniMarket' }];
      }
    }

    const admins = staff.filter(s => s.role === 'ADMIN');
    const qtvs = staff.filter(s => ['QTV', 'CTV'].includes(s.role));

    res.json({
      success: true,
      admins: admins.length > 0 ? admins : staff,
      qtvs: qtvs.length > 0 ? qtvs : (admins.length > 0 ? admins : staff),
      ctvs: qtvs.length > 0 ? qtvs : (admins.length > 0 ? admins : staff),
      allStaff: staff
    });
  } catch (err) {
    console.error('getSupportStaff error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách hỗ trợ viên.' });
  }
};

// Bắt đầu cuộc trò chuyện hỗ trợ trực tiếp hoặc đăng ký VIP Slot
exports.startSupportConversation = async (req, res) => {
  try {
    const { staffId, topic, initialMessage, slotNumber } = req.body;
    const userId = req.user.id;

    if (!staffId) {
      return res.status(400).json({ message: 'Vui lòng chọn nhân viên hỗ trợ.' });
    }

    if (staffId === userId) {
      return res.status(400).json({ message: 'Bạn không thể tự chat hỗ trợ với chính mình.' });
    }

    const staffUser = await prisma.user.findUnique({
      where: { id: staffId },
      select: { id: true, fullName: true, username: true, role: true }
    });

    if (!staffUser) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản hỗ trợ viên.' });
    }

    // Tìm product của staff hoặc user, hoặc product hệ thống
    let product = await prisma.product.findFirst({
      where: { sellerId: staffId }
    });

    if (!product) {
      product = await prisma.product.findFirst({
        where: { sellerId: userId }
      });
    }

    if (!product) {
      product = await prisma.product.findFirst({
        where: { status: 'ACTIVE' }
      });
    }

    if (!product) {
      let cat = await prisma.category.findFirst();
      if (!cat) {
        cat = await prisma.category.create({
          data: { name: 'Dịch vụ sinh viên', slug: 'dich-vu-sinh-vien' }
        });
      }
      product = await prisma.product.create({
        data: {
          title: 'Trung Tâm Hỗ Trợ & Đăng Ký VIP UniMarket',
          description: 'Kênh hỗ trợ trực tiếp từ Ban Quản Trị và CTV UniMarket',
          price: 0,
          isFree: true,
          condition: 'NEW',
          status: 'ACTIVE',
          sellerId: staffId,
          categoryId: cat.id,
          district: 'Hai Bà Trưng',
          meetingSpotType: 'CAMPUS'
        }
      });
    }

    // Tìm hoặc tạo cuộc trò chuyện
    let conversation = await prisma.conversation.findFirst({
      where: {
        productId: product.id,
        OR: [
          { buyerId: userId, sellerId: staffId },
          { buyerId: staffId, sellerId: userId }
        ]
      },
      include: {
        product: { include: { images: { take: 1 }, seller: { select: { fullName: true } } } },
        buyer: { select: { id: true, fullName: true, username: true, avatar: true } },
        seller: { select: { id: true, fullName: true, username: true, avatar: true } }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          productId: product.id,
          buyerId: userId,
          sellerId: staffId
        },
        include: {
          product: { include: { images: { take: 1 }, seller: { select: { fullName: true } } } },
          buyer: { select: { id: true, fullName: true, username: true, avatar: true } },
          seller: { select: { id: true, fullName: true, username: true, avatar: true } }
        }
      });
    }

    // Gửi tin nhắn mở đầu nếu cần
    const textToSend = initialMessage || (slotNumber 
      ? `👋 Chào ${staffUser.role === 'ADMIN' ? 'Admin' : 'bạn CTV'}, mình muốn đăng ký hiển thị trên Slot VIP #${String(slotNumber).padStart(2, '0')}. Tư vấn duyệt slot giúp mình nhé!`
      : `👋 Chào ${staffUser.role === 'ADMIN' ? 'Admin' : 'bạn CTV'}, mình cần hỗ trợ về: ${topic || 'Hỗ trợ dịch vụ Chợ Sinh Viên UniMarket'}.`
    );

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        text: textToSend,
        isRead: false
      }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversation.id}`).emit('new_message', message);
      io.to(`user_${staffId}`).emit('notification', {
        title: `Hỗ trợ mới từ ${req.user.fullName}`,
        content: textToSend,
        type: 'MESSAGE',
        conversationId: conversation.id
      });
    }

    res.json({
      success: true,
      conversationId: conversation.id,
      conversation,
      message
    });
  } catch (err) {
    console.error('startSupportConversation error:', err);
    res.status(500).json({ message: 'Lỗi khi khởi tạo cuộc trò chuyện hỗ trợ.' });
  }
};