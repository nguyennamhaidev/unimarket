const prisma = require('../prisma');
const { checkFeaturedExpirations } = require('../services/featuredExpiryService');

// Helper to log featured changes
async function logFeaturedAction(type, targetId, action, slotNumber, createdBy, details) {
  try {
    await prisma.featuredLog.create({
      data: {
        type,
        targetId: String(targetId),
        action,
        slotNumber: parseInt(slotNumber),
        createdBy,
        details
      }
    });
  } catch (err) {
    console.error('Error logging featured action:', err);
  }
}

// Helper to compute live countdown and urgency status
function computeCountdown(startDate, endDate) {
  if (!endDate) {
    return {
      remainingDays: 0,
      remainingHours: 0,
      remainingText: 'Không giới hạn',
      urgency: 'SAFE',
      isExpired: false
    };
  }

  const now = Date.now();
  const endMs = new Date(endDate).getTime();
  const diffMs = endMs - now;

  if (diffMs <= 0) {
    return {
      remainingDays: 0,
      remainingHours: 0,
      remainingText: 'Đã hết hạn',
      urgency: 'EXPIRED',
      isExpired: true
    };
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  let urgency = 'SAFE';
  if (days <= 1) urgency = 'URGENT_1D';
  else if (days <= 3) urgency = 'WARNING_3D';
  else if (days <= 7) urgency = 'WARNING_7D';

  const remainingText = days > 0 
    ? `${days} ngày ${hours > 0 ? hours + ' giờ' : ''}`.trim()
    : `${hours} giờ`;

  return {
    remainingDays: days,
    remainingHours: hours,
    remainingText,
    urgency,
    isExpired: false
  };
}

// 1. Public: Get active featured products for Homepage (Max 20)
exports.getPublicFeaturedProducts = async (req, res) => {
  try {
    // Run expiration check first
    const io = req.app.get('io');
    await checkFeaturedExpirations(io);

    const now = new Date();
    const featured = await prisma.featuredProduct.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { endDate: null },
          { endDate: { gt: now } }
        ],
        product: {
          status: 'ACTIVE'
        }
      },
      orderBy: { slotNumber: 'asc' },
      take: 20,
      include: {
        product: {
          include: {
            images: {
              orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
            },
            category: true,
            university: true,
            seller: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatar: true,
                rating: true,
                totalSold: true,
                status: true
              }
            },
            _count: {
              select: { favorites: true }
            }
          }
        }
      }
    });

    const products = featured.map(f => {
      const countdown = computeCountdown(f.startDate, f.endDate);
      return {
        slotNumber: f.slotNumber,
        featuredId: f.id,
        startDate: f.startDate,
        endDate: f.endDate,
        durationDays: f.durationDays,
        countdown,
        ...f.product,
        favoritesCount: f.product._count.favorites
      };
    });

    res.json({ products, featuredProducts: products });
  } catch (err) {
    console.error('getPublicFeaturedProducts error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách sản phẩm nổi bật.' });
  }
};

// 2. Public: Get active featured shops for Homepage (Max 20)
exports.getPublicFeaturedShops = async (req, res) => {
  try {
    const io = req.app.get('io');
    await checkFeaturedExpirations(io);

    const now = new Date();
    const featured = await prisma.featuredShop.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { endDate: null },
          { endDate: { gt: now } }
        ],
        user: {
          status: 'ACTIVE'
        }
      },
      orderBy: { slotNumber: 'asc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
            bio: true,
            city: true,
            district: true,
            rating: true,
            totalReviews: true,
            totalSold: true,
            createdAt: true,
            university: true,
            _count: {
              select: {
                products: {
                  where: { status: 'ACTIVE' }
                }
              }
            }
          }
        }
      }
    });

    const shops = featured.map(f => {
      const countdown = computeCountdown(f.startDate, f.endDate);
      return {
        slotNumber: f.slotNumber,
        featuredId: f.id,
        startDate: f.startDate,
        endDate: f.endDate,
        durationDays: f.durationDays,
        countdown,
        ...f.user,
        activeProductsCount: f.user._count?.products || 0
      };
    });

    res.json({ shops, featuredShops: shops });
  } catch (err) {
    console.error('getPublicFeaturedShops error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách gian hàng nổi bật.' });
  }
};

// 3. Admin/CTV: Get all 20 product slots with status, duration, and live countdown
exports.getAdminFeaturedProducts = async (req, res) => {
  try {
    const io = req.app.get('io');
    await checkFeaturedExpirations(io);

    const allAssigned = await prisma.featuredProduct.findMany({
      include: {
        product: {
          include: {
            images: { take: 1 },
            category: true,
            university: true,
            seller: {
              select: { id: true, fullName: true, username: true }
            }
          }
        },
        creator: {
          select: { id: true, fullName: true, username: true, role: true }
        }
      }
    });

    const slotMap = new Map();
    allAssigned.forEach(item => {
      const countdown = computeCountdown(item.startDate, item.endDate);
      slotMap.set(item.slotNumber, {
        ...item,
        countdown
      });
    });

    // Build array of 20 slots (1 to 20)
    const slots = [];
    for (let i = 1; i <= 20; i++) {
      const assigned = slotMap.get(i) || null;
      slots.push({
        slotNumber: i,
        isOccupied: !!assigned,
        data: assigned
      });
    }

    res.json({ slots, totalOccupied: allAssigned.length });
  } catch (err) {
    console.error('getAdminFeaturedProducts error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách slot sản phẩm nổi bật.' });
  }
};

// 4. Admin/CTV: Assign or replace product in a slot with marketing duration
exports.assignFeaturedProduct = async (req, res) => {
  try {
    const { productId, slotNumber, confirmReplace, durationDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role; // ADMIN or CTV

    const slot = parseInt(slotNumber);
    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (phải từ 1 đến 20).' });
    }

    if (!productId) {
      return res.status(400).json({ message: 'Thiếu mã sản phẩm (productId).' });
    }

    const duration = parseInt(durationDays) || 30;
    if (duration <= 0 || duration > 365) {
      return res.status(400).json({ message: 'Thời hạn hiển thị phải từ 1 đến 365 ngày.' });
    }

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
    }

    if (product.status !== 'ACTIVE') {
      return res.status(400).json({ message: `Không thể đưa sản phẩm có trạng thái "${product.status}" lên nổi bật.` });
    }

    // Check if slot currently occupied
    const existingSlotItem = await prisma.featuredProduct.findUnique({
      where: { slotNumber: slot },
      include: { product: true }
    });

    // Check if this product is already in another slot
    const existingProductFeatured = await prisma.featuredProduct.findUnique({
      where: { productId }
    });

    if (existingProductFeatured && existingProductFeatured.slotNumber !== slot) {
      await prisma.featuredProduct.delete({
        where: { id: existingProductFeatured.id }
      });
      await logFeaturedAction(
        'PRODUCT',
        productId,
        'MOVE',
        slot,
        userId,
        `${userRole} ${req.user.fullName} đã chuyển sản phẩm "${product.title}" từ Slot ${existingProductFeatured.slotNumber} sang Slot ${slot}`
      );
    }

    let actionType = 'ADD';
    let details = `${userRole} ${req.user.fullName} đã thêm sản phẩm "${product.title}" vào Slot ${slot} (Thời hạn: ${duration} ngày)`;

    if (existingSlotItem) {
      if (!confirmReplace) {
        return res.status(409).json({
          requiresConfirmation: true,
          message: `Slot ${slot < 10 ? '0' + slot : slot} đang được sử dụng bởi sản phẩm "${existingSlotItem.product?.title}". Bạn có muốn thay thế không?`,
          existingProduct: existingSlotItem.product
        });
      }

      actionType = 'REPLACE';
      details = `${userRole} ${req.user.fullName} đã thay thế sản phẩm "${existingSlotItem.product?.title}" bằng "${product.title}" tại Slot ${slot} (Thời hạn: ${duration} ngày)`;
      
      await prisma.featuredProduct.delete({
        where: { id: existingSlotItem.id }
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    // Create new assignment
    const featuredProduct = await prisma.featuredProduct.create({
      data: {
        productId,
        slotNumber: slot,
        status: 'ACTIVE',
        durationDays: duration,
        startDate,
        endDate,
        notified7d: false,
        notified3d: false,
        notified1d: false,
        notifiedExpired: false,
        createdBy: userId
      },
      include: {
        product: {
          include: {
            images: { take: 1 },
            seller: { select: { fullName: true, username: true } }
          }
        }
      }
    });

    // Send notification to seller
    if (product.sellerId) {
      const notif = await prisma.notification.create({
        data: {
          userId: product.sellerId,
          title: '🎉 Sản phẩm của bạn đã được lên Vị Trí Nổi Bật!',
          content: `Sản phẩm "${product.title}" đã được BQT kích hoạt gói Nổi Bật tại Slot #${slot < 10 ? '0' + slot : slot} trên Trang Chủ trong ${duration} ngày (đến ${endDate.toLocaleDateString('vi-VN')}).`,
          type: 'SYSTEM',
          link: `/product/${product.id}`
        }
      });
      const io = req.app.get('io');
      if (io) io.to(`user_${product.sellerId}`).emit('notification', notif);
    }

    // Log the action
    await logFeaturedAction('PRODUCT', productId, actionType, slot, userId, details);

    res.json({
      message: `Đã đưa sản phẩm "${product.title}" vào Slot ${slot < 10 ? '0' + slot : slot} thành công (${duration} ngày)!`,
      featuredProduct
    });
  } catch (err) {
    console.error('assignFeaturedProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi đưa sản phẩm lên nổi bật.' });
  }
};

// 5. Admin/CTV: Extend product duration
exports.extendFeaturedProduct = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const { extraDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const slot = parseInt(slotNumber);
    const daysToAdd = parseInt(extraDays) || 30;

    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (1-20).' });
    }

    const item = await prisma.featuredProduct.findUnique({
      where: { slotNumber: slot },
      include: { product: true }
    });

    if (!item) {
      return res.status(404).json({ message: `Slot ${slot} hiện đang trống.` });
    }

    const now = new Date();
    // If already expired, base off now; otherwise add to current endDate
    const baseDate = item.endDate && new Date(item.endDate) > now ? new Date(item.endDate) : now;
    const newEndDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const newTotalDays = item.durationDays + daysToAdd;

    const updated = await prisma.featuredProduct.update({
      where: { id: item.id },
      data: {
        status: 'ACTIVE',
        durationDays: newTotalDays,
        endDate: newEndDate,
        notified7d: false,
        notified3d: false,
        notified1d: false,
        notifiedExpired: false
      }
    });

    // Notify seller
    if (item.product?.sellerId) {
      const notif = await prisma.notification.create({
        data: {
          userId: item.product.sellerId,
          title: '✨ Gói Nổi Bật của bạn đã được gia hạn!',
          content: `Sản phẩm "${item.product.title}" tại Slot #${slot < 10 ? '0' + slot : slot} đã được cộng thêm ${daysToAdd} ngày hiển thị (Hết hạn vào: ${newEndDate.toLocaleDateString('vi-VN')}).`,
          type: 'SYSTEM',
          link: `/product/${item.productId}`
        }
      });
      const io = req.app.get('io');
      if (io) io.to(`user_${item.product.sellerId}`).emit('notification', notif);
    }

    await logFeaturedAction(
      'PRODUCT',
      item.productId,
      'EXTEND',
      slot,
      userId,
      `${userRole} ${req.user.fullName} đã gia hạn thêm ${daysToAdd} ngày cho sản phẩm "${item.product?.title}" tại Slot ${slot} (Đến ngày: ${newEndDate.toLocaleDateString('vi-VN')})`
    );

    res.json({
      message: `Đã gia hạn thêm ${daysToAdd} ngày cho Slot ${slot < 10 ? '0' + slot : slot} thành công!`,
      featuredProduct: updated
    });
  } catch (err) {
    console.error('extendFeaturedProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi gia hạn sản phẩm nổi bật.' });
  }
};

// 6. Admin/CTV: Remove product from featured slot
exports.removeFeaturedProduct = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const slot = parseInt(slotNumber);
    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (1-20).' });
    }

    const item = await prisma.featuredProduct.findUnique({
      where: { slotNumber: slot },
      include: { product: true }
    });

    if (!item) {
      return res.status(404).json({ message: `Slot ${slot} hiện đang trống.` });
    }

    await prisma.featuredProduct.delete({
      where: { id: item.id }
    });

    await logFeaturedAction(
      'PRODUCT',
      item.productId,
      'REMOVE',
      slot,
      userId,
      `${userRole} ${req.user.fullName} đã gỡ sản phẩm "${item.product?.title || item.productId}" khỏi Slot ${slot}`
    );

    res.json({
      message: `Đã gỡ sản phẩm khỏi Slot ${slot < 10 ? '0' + slot : slot}.`
    });
  } catch (err) {
    console.error('removeFeaturedProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi gỡ sản phẩm nổi bật.' });
  }
};

// 7. Admin/CTV: Get all 20 shop slots
exports.getAdminFeaturedShops = async (req, res) => {
  try {
    const io = req.app.get('io');
    await checkFeaturedExpirations(io);

    const allAssigned = await prisma.featuredShop.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
            rating: true,
            totalSold: true,
            university: true,
            _count: {
              select: { products: { where: { status: 'ACTIVE' } } }
            }
          }
        },
        creator: {
          select: { id: true, fullName: true, username: true, role: true }
        }
      }
    });

    const slotMap = new Map();
    allAssigned.forEach(item => {
      const countdown = computeCountdown(item.startDate, item.endDate);
      slotMap.set(item.slotNumber, {
        ...item,
        countdown
      });
    });

    const slots = [];
    for (let i = 1; i <= 20; i++) {
      const assigned = slotMap.get(i) || null;
      slots.push({
        slotNumber: i,
        isOccupied: !!assigned,
        data: assigned
      });
    }

    res.json({ slots, totalOccupied: allAssigned.length });
  } catch (err) {
    console.error('getAdminFeaturedShops error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách slot gian hàng.' });
  }
};

// 8. Admin/CTV: Assign or replace shop in a slot with marketing duration
exports.assignFeaturedShop = async (req, res) => {
  try {
    const { userId: targetUserId, slotNumber, confirmReplace, durationDays } = req.body;
    const actorId = req.user.id;
    const actorRole = req.user.role;

    const slot = parseInt(slotNumber);
    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (phải từ 1 đến 20).' });
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'Thiếu mã người dùng (userId).' });
    }

    const duration = parseInt(durationDays) || 30;
    if (duration <= 0 || duration > 365) {
      return res.status(400).json({ message: 'Thời hạn hiển thị phải từ 1 đến 365 ngày.' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người bán này.' });
    }

    if (targetUser.status === 'BANNED') {
      return res.status(400).json({ message: 'Không thể đưa tài khoản đang bị khóa lên gian hàng nổi bật.' });
    }

    // Check if slot currently occupied
    const existingSlotItem = await prisma.featuredShop.findUnique({
      where: { slotNumber: slot },
      include: { user: true }
    });

    // Check if this user is already in another slot
    const existingShopFeatured = await prisma.featuredShop.findUnique({
      where: { userId: targetUserId }
    });

    if (existingShopFeatured && existingShopFeatured.slotNumber !== slot) {
      await prisma.featuredShop.delete({
        where: { id: existingShopFeatured.id }
      });
      await logFeaturedAction(
        'SHOP',
        targetUserId,
        'MOVE',
        slot,
        actorId,
        `${actorRole} ${req.user.fullName} đã chuyển gian hàng "${targetUser.fullName}" từ Slot ${existingShopFeatured.slotNumber} sang Slot ${slot}`
      );
    }

    let actionType = 'ADD';
    let details = `${actorRole} ${req.user.fullName} đã thêm gian hàng "${targetUser.fullName}" vào Slot ${slot} (Thời hạn: ${duration} ngày)`;

    if (existingSlotItem) {
      if (!confirmReplace) {
        return res.status(409).json({
          requiresConfirmation: true,
          message: `Slot ${slot < 10 ? '0' + slot : slot} đang được sử dụng bởi gian hàng "${existingSlotItem.user?.fullName}". Bạn có muốn thay thế không?`,
          existingShop: existingSlotItem.user
        });
      }

      actionType = 'REPLACE';
      details = `${actorRole} ${req.user.fullName} đã thay thế gian hàng "${existingSlotItem.user?.fullName}" bằng "${targetUser.fullName}" tại Slot ${slot} (Thời hạn: ${duration} ngày)`;

      await prisma.featuredShop.delete({
        where: { id: existingSlotItem.id }
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    const featuredShop = await prisma.featuredShop.create({
      data: {
        userId: targetUserId,
        slotNumber: slot,
        status: 'ACTIVE',
        durationDays: duration,
        startDate,
        endDate,
        notified7d: false,
        notified3d: false,
        notified1d: false,
        notifiedExpired: false,
        createdBy: actorId
      },
      include: {
        user: {
          select: { id: true, fullName: true, username: true, avatar: true, rating: true, totalSold: true }
        }
      }
    });

    // Notify seller
    const notif = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: '⭐ Gian hàng của bạn đã lên Vị Trí Nổi Bật Trang Chủ!',
        content: `Gian hàng của bạn đã được BQT tuyển chọn hiển thị tại Shop Slot #${slot < 10 ? '0' + slot : slot} trong ${duration} ngày (đến ${endDate.toLocaleDateString('vi-VN')}).`,
        type: 'SYSTEM',
        link: `/profile/${targetUserId}`
      }
    });
    const io = req.app.get('io');
    if (io) io.to(`user_${targetUserId}`).emit('notification', notif);

    await logFeaturedAction('SHOP', targetUserId, actionType, slot, actorId, details);

    res.json({
      message: `Đã đưa gian hàng "${targetUser.fullName}" vào Slot ${slot < 10 ? '0' + slot : slot} thành công (${duration} ngày)!`,
      featuredShop
    });
  } catch (err) {
    console.error('assignFeaturedShop error:', err);
    res.status(500).json({ message: 'Lỗi khi đưa gian hàng lên nổi bật.' });
  }
};

// 9. Admin/CTV: Extend shop duration
exports.extendFeaturedShop = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const { extraDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const slot = parseInt(slotNumber);
    const daysToAdd = parseInt(extraDays) || 30;

    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (1-20).' });
    }

    const item = await prisma.featuredShop.findUnique({
      where: { slotNumber: slot },
      include: { user: true }
    });

    if (!item) {
      return res.status(404).json({ message: `Slot ${slot} hiện đang trống.` });
    }

    const now = new Date();
    const baseDate = item.endDate && new Date(item.endDate) > now ? new Date(item.endDate) : now;
    const newEndDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const newTotalDays = item.durationDays + daysToAdd;

    const updated = await prisma.featuredShop.update({
      where: { id: item.id },
      data: {
        status: 'ACTIVE',
        durationDays: newTotalDays,
        endDate: newEndDate,
        notified7d: false,
        notified3d: false,
        notified1d: false,
        notifiedExpired: false
      }
    });

    // Notify seller
    const notif = await prisma.notification.create({
      data: {
        userId: item.userId,
        title: '✨ Gian hàng Nổi Bật của bạn đã được gia hạn!',
        content: `Gian hàng của bạn tại Shop Slot #${slot < 10 ? '0' + slot : slot} đã được cộng thêm ${daysToAdd} ngày hiển thị (Hết hạn vào: ${newEndDate.toLocaleDateString('vi-VN')}).`,
        type: 'SYSTEM',
        link: `/profile/${item.userId}`
      }
    });
    const io = req.app.get('io');
    if (io) io.to(`user_${item.userId}`).emit('notification', notif);

    await logFeaturedAction(
      'SHOP',
      item.userId,
      'EXTEND',
      slot,
      userId,
      `${userRole} ${req.user.fullName} đã gia hạn thêm ${daysToAdd} ngày cho gian hàng "${item.user?.fullName}" tại Slot ${slot} (Đến ngày: ${newEndDate.toLocaleDateString('vi-VN')})`
    );

    res.json({
      message: `Đã gia hạn thêm ${daysToAdd} ngày cho Shop Slot ${slot < 10 ? '0' + slot : slot} thành công!`,
      featuredShop: updated
    });
  } catch (err) {
    console.error('extendFeaturedShop error:', err);
    res.status(500).json({ message: 'Lỗi khi gia hạn gian hàng nổi bật.' });
  }
};

// 10. Admin/CTV: Remove shop from featured slot
exports.removeFeaturedShop = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const actorId = req.user.id;
    const actorRole = req.user.role;

    const slot = parseInt(slotNumber);
    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (1-20).' });
    }

    const item = await prisma.featuredShop.findUnique({
      where: { slotNumber: slot },
      include: { user: true }
    });

    if (!item) {
      return res.status(404).json({ message: `Slot ${slot} hiện đang trống.` });
    }

    await prisma.featuredShop.delete({
      where: { id: item.id }
    });

    await logFeaturedAction(
      'SHOP',
      item.userId,
      'REMOVE',
      slot,
      actorId,
      `${actorRole} ${req.user.fullName} đã gỡ gian hàng "${item.user?.fullName || item.userId}" khỏi Slot ${slot}`
    );

    res.json({
      message: `Đã gỡ gian hàng khỏi Slot ${slot < 10 ? '0' + slot : slot}.`
    });
  } catch (err) {
    console.error('removeFeaturedShop error:', err);
    res.status(500).json({ message: 'Lỗi khi gỡ gian hàng nổi bật.' });
  }
};

// 11. Admin/CTV: Get Featured Logs
exports.getFeaturedLogs = async (req, res) => {
  try {
    const logs = await prisma.featuredLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        creator: {
          select: { id: true, fullName: true, username: true, role: true }
        }
      }
    });

    res.json({ logs });
  } catch (err) {
    console.error('getFeaturedLogs error:', err);
    res.status(500).json({ message: 'Lỗi khi tải lịch sử thao tác Featured.' });
  }
};

// 12. Admin/CTV: Search products to add to featured
exports.searchProductsForFeatured = async (req, res) => {
  try {
    const { query } = req.query;
    const q = query ? query.trim() : '';

    let whereClause = { status: 'ACTIVE' };

    if (q) {
      whereClause = {
        status: 'ACTIVE',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { district: { contains: q, mode: 'insensitive' } },
          { seller: { username: { contains: q, mode: 'insensitive' } } },
          { seller: { fullName: { contains: q, mode: 'insensitive' } } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
          { university: { name: { contains: q, mode: 'insensitive' } } },
          { university: { shortName: { contains: q, mode: 'insensitive' } } }
        ]
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { take: 1 },
        category: true,
        university: true,
        seller: {
          select: { 
            id: true, 
            fullName: true, 
            username: true, 
            avatar: true,
            rating: true,
            totalSold: true,
            university: true 
          }
        },
        featuredProduct: true
      }
    });

    res.json({ products });
  } catch (err) {
    console.error('searchProductsForFeatured error:', err);
    res.status(500).json({ message: 'Lỗi khi tìm kiếm sản phẩm.' });
  }
};

// 13. Admin/CTV: Search users/sellers to add to featured
exports.searchSellersForFeatured = async (req, res) => {
  try {
    const { query } = req.query;
    const q = query ? query.trim() : '';

    let whereClause = { status: 'ACTIVE' };

    if (q) {
      whereClause = {
        status: 'ACTIVE',
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { university: { name: { contains: q, mode: 'insensitive' } } },
          { university: { shortName: { contains: q, mode: 'insensitive' } } }
        ]
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      take: 20,
      orderBy: [
        { totalSold: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        rating: true,
        totalSold: true,
        university: true,
        featuredShop: true,
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } }
          }
        }
      }
    });

    res.json({ sellers: users });
  } catch (err) {
    console.error('searchSellersForFeatured error:', err);
    res.status(500).json({ message: 'Lỗi khi tìm kiếm người bán.' });
  }
};
