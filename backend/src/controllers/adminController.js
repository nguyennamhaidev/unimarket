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

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalMessages,
      pendingReports,
      bannedUsers,
      recentProducts,
      recentUsers,
      recentLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.message.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'BANNED' } }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { seller: { select: { fullName: true, username: true } }, category: true }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, username: true, email: true, role: true, status: true, createdAt: true }
      }),
      prisma.adminLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { fullName: true, username: true } } }
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalMessages,
        pendingReports,
        bannedUsers
      },
      recentProducts,
      recentUsers,
      recentLogs
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Lỗi khi tải thống kê quản trị.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } }
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const take = parseInt(limit) || 20;
    const skip = ((parseInt(page) || 1) - 1) * take;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          role: true,
          status: true,
          city: true,
          district: true,
          rating: true,
          totalSold: true,
          createdAt: true,
          university: true,
          _count: {
            select: { products: true, reportsAgainst: true }
          }
        }
      })
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách người dùng.' });
  }
};

exports.toggleBanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Vi phạm tiêu chuẩn cộng đồng' } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    if (targetUser.role === 'ADMIN') {
      return res.status(400).json({ message: 'Không thể khóa tài khoản Admin.' });
    }

    const nextStatus = targetUser.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    const updated = await prisma.user.update({
      where: { id },
      data: { status: nextStatus }
    });

    // Also hide user's products and remove from featured if banned
    if (nextStatus === 'BANNED') {
      await prisma.product.updateMany({
        where: { sellerId: id, status: 'ACTIVE' },
        data: { status: 'HIDDEN' }
      });
      await prisma.featuredShop.deleteMany({ where: { userId: id } }).catch(() => {});
      await prisma.featuredProduct.deleteMany({ where: { product: { sellerId: id } } }).catch(() => {});
    }

    await logAdminAction(
      req.user.id,
      nextStatus === 'BANNED' ? 'BAN_USER' : 'UNBAN_USER',
      'USER',
      id,
      `Admin ${req.user.fullName} đã ${nextStatus === 'BANNED' ? 'khóa' : 'mở khóa'} user @${targetUser.username}. Lý do: ${reason}`
    );

    res.json({
      message: nextStatus === 'BANNED' ? `Đã khóa tài khoản @${targetUser.username}.` : `Đã mở khóa tài khoản @${targetUser.username}.`,
      user: updated
    });
  } catch (err) {
    console.error('toggleBanUser error:', err);
    res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái user.' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, status, categoryId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { seller: { username: { contains: search } } }
      ];
    }
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const take = parseInt(limit) || 20;
    const skip = ((parseInt(page) || 1) - 1) * take;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { take: 1 },
          category: true,
          university: true,
          seller: {
            select: { id: true, fullName: true, username: true, email: true, status: true }
          },
          _count: {
            select: { reports: true }
          }
        }
      })
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    console.error('admin getProducts error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách sản phẩm.' });
  }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason = 'Quyết định từ Quản trị viên' } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    if (status !== 'ACTIVE') {
      await prisma.featuredProduct.deleteMany({ where: { productId: id } }).catch(() => {});
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { status }
    });

    await logAdminAction(
      req.user.id,
      'UPDATE_PRODUCT_STATUS',
      'PRODUCT',
      id,
      `Admin ${req.user.fullName} đã chuyển trạng thái sản phẩm "${product.title}" thành ${status}. Lý do: ${reason}`
    );

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: 'Thông báo quản trị sản phẩm',
        content: `Sản phẩm "${product.title}" của bạn đã được chuyển trạng thái: ${status}. Lý do: ${reason}`,
        type: 'SYSTEM',
        link: `/product/${id}`
      }
    });

    res.json({
      message: `Đã cập nhật trạng thái sản phẩm thành ${status}`,
      product: updated
    });
  } catch (err) {
    console.error('updateProductStatus error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Vi phạm chính sách nghiêm trọng' } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    await prisma.featuredProduct.deleteMany({ where: { productId: id } }).catch(() => {});
    await prisma.product.delete({ where: { id } });

    await logAdminAction(
      req.user.id,
      'DELETE_PRODUCT',
      'PRODUCT',
      id,
      `Admin ${req.user.fullName} đã XÓA sản phẩm "${product.title}" của user @${product.seller.username}. Lý do: ${reason}`
    );

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: 'Sản phẩm đã bị xóa',
        content: `Sản phẩm "${product.title}" của bạn đã bị Quản trị viên xóa. Lý do: ${reason}`,
        type: 'SYSTEM'
      }
    });

    res.json({ message: 'Đã xóa sản phẩm vi phạm thành công.' });
  } catch (err) {
    console.error('admin deleteProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, fullName: true, username: true }
        },
        product: {
          include: {
            images: { take: 1 },
            seller: { select: { id: true, fullName: true, username: true, status: true } }
          }
        },
        reportedUser: {
          select: { id: true, fullName: true, username: true, status: true }
        }
      }
    });

    res.json({ reports });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách báo cáo.' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body; // action: 'DISMISS', 'DELETE_PRODUCT', 'WARN_USER', 'BAN_USER'

    const report = await prisma.report.findUnique({
      where: { id },
      include: { product: { include: { seller: true } }, reportedUser: true }
    });

    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo.' });
    }

    if (action === 'DELETE_PRODUCT' && report.productId) {
      await prisma.product.delete({ where: { id: report.productId } }).catch(() => {});
      if (report.product && report.product.seller) {
        await prisma.notification.create({
          data: {
            userId: report.product.seller.id,
            title: 'Sản phẩm bị gỡ bỏ',
            content: `Sản phẩm "${report.product.title}" đã bị xóa do nhận được khiếu nại vi phạm.`,
            type: 'SYSTEM'
          }
        });
      }
    } else if (action === 'BAN_USER') {
      const targetUserId = report.reportedUserId || (report.product && report.product.sellerId);
      if (targetUserId) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { status: 'BANNED' }
        });
        await prisma.product.updateMany({
          where: { sellerId: targetUserId, status: 'ACTIVE' },
          data: { status: 'HIDDEN' }
        });
      }
    } else if (action === 'WARN_USER') {
      const targetUserId = report.reportedUserId || (report.product && report.product.sellerId);
      if (targetUserId) {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            title: 'Cảnh báo vi phạm từ Ban Quản Trị',
            content: `Tài khoản của bạn nhận được khiếu nại: "${report.reason} - ${report.description}". Vui lòng tuân thủ quy tắc ứng xử sinh viên.`,
            type: 'SYSTEM'
          }
        });
      }
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
        adminNote: adminNote || `Đã xử lý bằng hành động: ${action}`
      }
    });

    await logAdminAction(
      req.user.id,
      'RESOLVE_REPORT',
      'REPORT',
      id,
      `Xử lý report #${id}: Hành động [${action}]. Ghi chú: ${adminNote || 'Không có'}`
    );

    res.json({
      message: 'Đã xử lý khiếu nại thành công!',
      report: updated
    });
  } catch (err) {
    console.error('resolveReport error:', err);
    res.status(500).json({ message: 'Lỗi khi xử lý báo cáo.' });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        admin: {
          select: { id: true, fullName: true, username: true }
        }
      }
    });

    res.json({ logs });
  } catch (err) {
    console.error('getAdminLogs error:', err);
    res.status(500).json({ message: 'Lỗi khi tải lịch sử quản trị.' });
  }
};

exports.createUniversity = async (req, res) => {
  try {
    const { name, shortName, city, isPopular, logoUrl } = req.body;
    if (!name || !shortName || !city) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ tên, tên viết tắt và thành phố.' });
    }

    const uni = await prisma.university.create({
      data: {
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        city: city.trim(),
        isPopular: Boolean(isPopular),
        logoUrl: logoUrl || null
      }
    });

    await logAdminAction(req.user.id, 'CREATE_UNIVERSITY', 'UNIVERSITY', uni.id, `Thêm trường đại học ${uni.name} (${uni.shortName})`);
    res.status(201).json({ message: 'Đã thêm trường đại học.', university: uni });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thêm trường đại học.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, icon, parentId } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'Vui lòng điền tên và slug danh mục.' });
    }

    const cat = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        icon: icon || '📦',
        parentId: parentId || null
      }
    });

    await logAdminAction(req.user.id, 'CREATE_CATEGORY', 'CATEGORY', cat.id, `Thêm danh mục ${cat.name}`);
    res.status(201).json({ message: 'Đã thêm danh mục mới.', category: cat });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thêm danh mục.' });
  }
};
exports.toggleUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // "ADMIN", "QTV", "CTV", or "USER"

    if (!role || !['ADMIN', 'QTV', 'CTV', 'USER'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ (chấp nhận ADMIN, QTV, CTV hoặc USER).' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng này.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role }
    });

    const roleName = role === 'ADMIN' 
      ? 'Quản trị viên cấp cao (Admin)' 
      : role === 'QTV' 
      ? 'Quản trị viên (QTV)' 
      : role === 'CTV' 
      ? 'Cộng tác viên (CTV)' 
      : 'Người dùng (User)';

    await logAdminAction(
      req.user.id,
      'UPDATE_USER_ROLE',
      'USER',
      id,
      `Admin ${req.user.fullName} đã thay đổi vai trò của @${targetUser.username} thành [${role} - ${roleName}].`
    );

    res.json({
      message: `Đã cập nhật vai trò của @${targetUser.username} thành ${roleName}.`,
      user: updated
    });
  } catch (err) {
    console.error('toggleUserRole error:', err);
    res.status(500).json({ message: 'Lỗi khi phân quyền người dùng.' });
  }
};

exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = {
      zaloContact: 'https://zalo.me/0987654321',
      telegramContact: 'https://t.me/unimarket_support'
    };
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({ success: true, settings: settingsMap });
  } catch (err) {
    console.error('getSystemSettings error:', err);
    res.status(500).json({ message: 'Lỗi khi tải cấu hình hệ thống.' });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const { zaloContact, telegramContact } = req.body;

    if (zaloContact !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'zaloContact' },
        update: { value: String(zaloContact).trim() },
        create: { key: 'zaloContact', value: String(zaloContact).trim(), label: 'Zalo Hỗ Trợ' }
      });
    }

    if (telegramContact !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'telegramContact' },
        update: { value: String(telegramContact).trim() },
        create: { key: 'telegramContact', value: String(telegramContact).trim(), label: 'Telegram Hỗ Trợ' }
      });
    }

    await logAdminAction(
      req.user.id,
      'UPDATE_SETTINGS',
      'SYSTEM',
      'CONTACT_SETTINGS',
      `Admin ${req.user.fullName} đã cập nhật cấu hình liên hệ: Zalo (${zaloContact}), Telegram (${telegramContact})`
    );

    const updated = await prisma.systemSetting.findMany();
    const settingsMap = {
      zaloContact: 'https://zalo.me/0987654321',
      telegramContact: 'https://t.me/unimarket_support'
    };
    updated.forEach(s => { settingsMap[s.key] = s.value; });

    res.json({
      success: true,
      message: 'Đã cập nhật cấu hình hệ thống thành công!',
      settings: settingsMap
    });
  } catch (err) {
    console.error('updateSystemSettings error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật cấu hình hệ thống.' });
  }
};