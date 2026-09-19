const prisma = require('../prisma');

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

// 1. Public: Get active featured products for Homepage (Max 20)
exports.getPublicFeaturedProducts = async (req, res) => {
  try {
    const featured = await prisma.featuredProduct.findMany({
      where: {
        status: 'ACTIVE',
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

    const products = featured.map(f => ({
      slotNumber: f.slotNumber,
      featuredId: f.id,
      ...f.product,
      favoritesCount: f.product._count.favorites
    }));

    res.json({ featuredProducts: products });
  } catch (err) {
    console.error('getPublicFeaturedProducts error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách sản phẩm nổi bật.' });
  }
};

// 2. Public: Get active featured shops for Homepage (Max 20)
exports.getPublicFeaturedShops = async (req, res) => {
  try {
    const featured = await prisma.featuredShop.findMany({
      where: {
        status: 'ACTIVE',
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

    const shops = featured.map(f => ({
      slotNumber: f.slotNumber,
      featuredId: f.id,
      ...f.user,
      activeProductsCount: f.user._count?.products || 0
    }));

    res.json({ featuredShops: shops });
  } catch (err) {
    console.error('getPublicFeaturedShops error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách gian hàng nổi bật.' });
  }
};

// 3. Admin/CTV: Get all 20 product slots with status
exports.getAdminFeaturedProducts = async (req, res) => {
  try {
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
      slotMap.set(item.slotNumber, item);
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

// 4. Admin/CTV: Assign or replace product in a slot
exports.assignFeaturedProduct = async (req, res) => {
  try {
    const { productId, slotNumber, confirmReplace } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role; // ADMIN or CTV

    const slot = parseInt(slotNumber);
    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (phải từ 1 đến 20).' });
    }

    if (!productId) {
      return res.status(400).json({ message: 'Thiếu mã sản phẩm (productId).' });
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
      // Remove from old slot
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
    let details = `${userRole} ${req.user.fullName} đã thêm sản phẩm "${product.title}" vào Slot ${slot}`;

    if (existingSlotItem) {
      if (!confirmReplace) {
        return res.status(409).json({
          requiresConfirmation: true,
          message: `Slot ${slot < 10 ? '0' + slot : slot} đang được sử dụng bởi sản phẩm "${existingSlotItem.product?.title}". Bạn có muốn thay thế không?`,
          existingProduct: existingSlotItem.product
        });
      }

      actionType = 'REPLACE';
      details = `${userRole} ${req.user.fullName} đã thay thế sản phẩm "${existingSlotItem.product?.title}" bằng "${product.title}" tại Slot ${slot}`;
      
      // Delete previous assignment
      await prisma.featuredProduct.delete({
        where: { id: existingSlotItem.id }
      });
    }

    // Create new assignment
    const featuredProduct = await prisma.featuredProduct.create({
      data: {
        productId,
        slotNumber: slot,
        status: 'ACTIVE',
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

    // Log the action
    await logFeaturedAction('PRODUCT', productId, actionType, slot, userId, details);

    res.json({
      message: `Đã đưa sản phẩm "${product.title}" vào Slot ${slot < 10 ? '0' + slot : slot} thành công!`,
      featuredProduct
    });
  } catch (err) {
    console.error('assignFeaturedProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi đưa sản phẩm lên nổi bật.' });
  }
};

// 5. Admin/CTV: Remove product from featured slot
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

// 6. Admin/CTV: Get all 20 shop slots
exports.getAdminFeaturedShops = async (req, res) => {
  try {
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
      slotMap.set(item.slotNumber, item);
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

// 7. Admin/CTV: Assign or replace shop in a slot
exports.assignFeaturedShop = async (req, res) => {
  try {
    const { userId: targetUserId, slotNumber, confirmReplace } = req.body;
    const actorId = req.user.id;
    const actorRole = req.user.role;

    const slot = parseInt(slotNumber);
    if (!slot || slot < 1 || slot > 20) {
      return res.status(400).json({ message: 'Slot không hợp lệ (phải từ 1 đến 20).' });
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'Thiếu mã người dùng (userId).' });
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
    let details = `${actorRole} ${req.user.fullName} đã thêm gian hàng "${targetUser.fullName}" vào Slot ${slot}`;

    if (existingSlotItem) {
      if (!confirmReplace) {
        return res.status(409).json({
          requiresConfirmation: true,
          message: `Slot ${slot < 10 ? '0' + slot : slot} đang được sử dụng bởi gian hàng "${existingSlotItem.user?.fullName}". Bạn có muốn thay thế không?`,
          existingShop: existingSlotItem.user
        });
      }

      actionType = 'REPLACE';
      details = `${actorRole} ${req.user.fullName} đã thay thế gian hàng "${existingSlotItem.user?.fullName}" bằng "${targetUser.fullName}" tại Slot ${slot}`;

      await prisma.featuredShop.delete({
        where: { id: existingSlotItem.id }
      });
    }

    const featuredShop = await prisma.featuredShop.create({
      data: {
        userId: targetUserId,
        slotNumber: slot,
        status: 'ACTIVE',
        createdBy: actorId
      },
      include: {
        user: {
          select: { id: true, fullName: true, username: true, avatar: true, rating: true, totalSold: true }
        }
      }
    });

    await logFeaturedAction('SHOP', targetUserId, actionType, slot, actorId, details);

    res.json({
      message: `Đã đưa gian hàng "${targetUser.fullName}" vào Slot ${slot < 10 ? '0' + slot : slot} thành công!`,
      featuredShop
    });
  } catch (err) {
    console.error('assignFeaturedShop error:', err);
    res.status(500).json({ message: 'Lỗi khi đưa gian hàng lên nổi bật.' });
  }
};

// 8. Admin/CTV: Remove shop from featured slot
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

// 9. Admin/CTV: Get Featured Logs
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

// 10. Admin/CTV: Search products to add to featured
exports.searchProductsForFeatured = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.json({ products: [] });
    }

    const q = query.trim();
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: q } },
          { seller: { username: { contains: q } } },
          { seller: { fullName: { contains: q } } }
        ]
      },
      take: 15,
      include: {
        images: { take: 1 },
        category: true,
        university: true,
        seller: {
          select: { id: true, fullName: true, username: true, avatar: true }
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

// 11. Admin/CTV: Search users/sellers to add to featured
exports.searchSellersForFeatured = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.json({ sellers: [] });
    }

    const q = query.trim();
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { fullName: { contains: q } },
          { username: { contains: q } },
          { email: { contains: q } }
        ]
      },
      take: 15,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
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
