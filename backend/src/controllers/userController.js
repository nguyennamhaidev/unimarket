const prisma = require('../prisma');

exports.getUserPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatar: true,
        bio: true,
        zalo: true,
        facebook: true,
        instagram: true,
        faculty: true,
        studentCohort: true,
        city: true,
        district: true,
        rating: true,
        totalReviews: true,
        totalSold: true,
        createdAt: true,
        university: true,
        _count: {
          select: {
            followers: true,
            following: true,
            products: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng này.' });
    }

    // Fetch active products
    const activeProducts = await prisma.product.findMany({
      where: { sellerId: id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { take: 1 },
        category: true,
        university: true
      }
    });

    // Fetch sold products
    const soldProducts = await prisma.product.findMany({
      where: { sellerId: id, status: 'SOLD' },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { take: 1 },
        category: true,
        university: true
      }
    });

    // Fetch reviews received
    const reviews = await prisma.review.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: { id: true, fullName: true, username: true, avatar: true, university: true }
        }
      }
    });

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: id
          }
        }
      });
      isFollowing = !!follow;
    }

    res.json({
      user: {
        ...user,
        isFollowing,
        activeProductsCount: activeProducts.length,
        soldProductsCount: soldProducts.length
      },
      activeProducts,
      soldProducts,
      reviews
    });
  } catch (err) {
    console.error('getUserPublicProfile error:', err);
    res.status(500).json({ message: 'Lỗi khi tải thông tin người dùng.' });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    const { id } = req.params; // target user id
    const currentUserId = req.user.id;

    if (id === currentUserId) {
      return res.status(400).json({ message: 'Bạn không thể tự theo dõi chính mình.' });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: id
        }
      }
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.json({ isFollowing: false, message: 'Đã hủy theo dõi người bán này.' });
    } else {
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: id
        }
      });

      // Notification
      await prisma.notification.create({
        data: {
          userId: id,
          title: 'Người theo dõi mới',
          content: `${req.user.fullName} đã bắt đầu theo dõi bạn.`,
          type: 'SYSTEM',
          link: `/profile/${currentUserId}`
        }
      });

      return res.json({ isFollowing: true, message: 'Đã theo dõi người bán thành công!' });
    }
  } catch (err) {
    console.error('toggleFollow error:', err);
    res.status(500).json({ message: 'Lỗi khi thao tác theo dõi.' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params; // target to block
    const blockerId = req.user.id;

    if (id === blockerId) {
      return res.status(400).json({ message: 'Bạn không thể tự chặn chính mình.' });
    }

    await prisma.blockedUser.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: id
        }
      },
      update: {},
      create: {
        blockerId,
        blockedId: id
      }
    });

    res.json({ message: 'Đã chặn người dùng này thành công.' });
  } catch (err) {
    console.error('blockUser error:', err);
    res.status(500).json({ message: 'Lỗi khi chặn người dùng.' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const blockerId = req.user.id;

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId,
        blockedId: id
      }
    });

    res.json({ message: 'Đã bỏ chặn người dùng.' });
  } catch (err) {
    console.error('unblockUser error:', err);
    res.status(500).json({ message: 'Lỗi khi bỏ chặn người dùng.' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: req.user.id },
      include: {
        blocked: {
          select: { id: true, fullName: true, username: true, avatar: true }
        }
      }
    });

    res.json({ blockedUsers: blocked.map(b => b.blocked) });
  } catch (err) {
    console.error('getBlockedUsers error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách chặn.' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    res.json({ notifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Lỗi khi tải thông báo.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true }
    });
    res.json({ message: 'Đã đánh dấu đã đọc.' });
  } catch (err) {
    console.error('markNotificationRead error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật thông báo.' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
  } catch (err) {
    console.error('markAllNotificationsRead error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật thông báo.' });
  }
};