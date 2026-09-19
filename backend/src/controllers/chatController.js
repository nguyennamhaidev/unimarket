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

      const partner = c.buyerId === userId ? c.seller : c.buyer;

      return {
        id: c.id,
        productId: c.productId,
        product: c.product,
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
      return res.status(404).json({ message: 'Cuộc trò chuyện không tồn tại.' });
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

    // Check if there's an existing transaction / review
    const transaction = await prisma.transaction.findFirst({
      where: {
        productId: conversation.productId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId
      },
      include: {
        reviews: true
      }
    });

    res.json({
      conversation,
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