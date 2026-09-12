const prisma = require('../prisma');

// Helper to log admin actions
async function logAdminAction(adminId, action, targetType, targetId, details) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: String(targetId),
        details
      }
    });
  } catch (e) {
    console.error('Error logging admin action:', e);
  }
}

// === PUBLIC ENDPOINTS ===

// 1. Get Featured Shops (Max 15 slots)
exports.getFeaturedShops = async (req, res) => {
  try {
    const shops = await prisma.user.findMany({
      where: {
        isFeaturedShop: true,
        status: 'ACTIVE'
      },
      orderBy: [
        { featuredShopOrder: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 15,
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
        featuredShopOrder: true,
        university: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true
          }
        },
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      total: shops.length,
      maxSlots: 15,
      shops
    });
  } catch (err) {
    console.error('getFeaturedShops error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách gian hàng nổi bật.' });
  }
};

// 2. Get Featured Products (Max 20 slots)
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        status: 'ACTIVE'
      },
      orderBy: [
        { featuredOrder: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 20,
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
            university: { select: { shortName: true } }
          }
        },
        _count: {
          select: { favorites: true }
        }
      }
    });

    res.json({
      success: true,
      total: products.length,
      maxSlots: 20,
      products
    });
  } catch (err) {
    console.error('getFeaturedProducts error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách sản phẩm nổi bật.' });
  }
};

// === ADMIN MANAGEMENT ENDPOINTS ===

// 3. Admin: Get all featured configuration + stats
exports.adminGetFeaturedOverview = async (req, res) => {
  try {
    const [featuredShops, featuredProducts] = await Promise.all([
      prisma.user.findMany({
        where: { isFeaturedShop: true },
        orderBy: { featuredShopOrder: 'asc' },
        select: {
          id: true,
          fullName: true,
          username: true,
          avatar: true,
          status: true,
          featuredShopOrder: true,
          isFeaturedShop: true,
          university: { select: { shortName: true } },
          _count: { select: { products: true } }
        }
      }),
      prisma.product.findMany({
        where: { isFeatured: true },
        orderBy: { featuredOrder: 'asc' },
        include: {
          images: { take: 1 },
          category: true,
          seller: { select: { fullName: true, username: true } }
        }
      })
    ]);

    res.json({
      featuredShops,
      featuredProducts,
      maxShopSlots: 15,
      maxProductSlots: 20
    });
  } catch (err) {
    console.error('adminGetFeaturedOverview error:', err);
    res.status(500).json({ message: 'Lỗi khi tải quản lý mục nổi bật.' });
  }
};

// 4. Admin: Toggle or Set Featured Shop (Max 15 slots)
exports.adminToggleFeaturedShop = async (req, res) => {
  try {
    const { userId, isFeatured, order = 0 } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp userId.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    if (isFeatured) {
      const currentCount = await prisma.user.count({
        where: { isFeaturedShop: true, id: { not: userId } }
      });
      if (currentCount >= 15) {
        return res.status(400).json({ message: 'Đã đạt giới hạn tối đa 15 Gian hàng nổi bật. Vui lòng gỡ bớt gian hàng khác trước.' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isFeaturedShop: Boolean(isFeatured),
        featuredShopOrder: parseInt(order) || 0
      }
    });

    await logAdminAction(
      req.user.id,
      isFeatured ? 'ADD_FEATURED_SHOP' : 'REMOVE_FEATURED_SHOP',
      'USER',
      userId,
      `Admin ${req.user.fullName} đã ${isFeatured ? 'thêm' : 'gỡ'} gian hàng @${user.username} khỏi danh sách Nổi Bật (thứ tự: ${order}).`
    );

    res.json({
      message: isFeatured ? `Đã thêm @${user.username} vào Gian hàng nổi bật!` : `Đã gỡ @${user.username} khỏi Gian hàng nổi bật.`,
      shop: updated
    });
  } catch (err) {
    console.error('adminToggleFeaturedShop error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật gian hàng nổi bật.' });
  }
};

// 5. Admin: Toggle or Set Featured Product (Max 20 slots)
exports.adminToggleFeaturedProduct = async (req, res) => {
  try {
    const { productId, isFeatured, order = 0 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp productId.' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    if (isFeatured) {
      const currentCount = await prisma.product.count({
        where: { isFeatured: true, id: { not: productId } }
      });
      if (currentCount >= 20) {
        return res.status(400).json({ message: 'Đã đạt giới hạn tối đa 20 Sản phẩm nổi bật. Vui lòng gỡ bớt sản phẩm khác trước.' });
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        isFeatured: Boolean(isFeatured),
        featuredOrder: parseInt(order) || 0
      }
    });

    await logAdminAction(
      req.user.id,
      isFeatured ? 'ADD_FEATURED_PRODUCT' : 'REMOVE_FEATURED_PRODUCT',
      'PRODUCT',
      productId,
      `Admin ${req.user.fullName} đã ${isFeatured ? 'thêm' : 'gỡ'} sản phẩm "${product.title}" khỏi danh sách Nổi Bật (thứ tự: ${order}).`
    );

    res.json({
      message: isFeatured ? `Đã thêm sản phẩm "${product.title}" vào mục Nổi Bật!` : `Đã gỡ sản phẩm khỏi mục Nổi Bật.`,
      product: updated
    });
  } catch (err) {
    console.error('adminToggleFeaturedProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm nổi bật.' });
  }
};
