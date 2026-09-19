const prisma = require('../prisma');

/**
 * Checks all active featured products and shops for upcoming or reached expirations.
 * Sends notifications to sellers at 7 days, 3 days, 1 day, and on expiration (to both seller and admins).
 * @param {object} [io] Socket.IO server instance for real-time notification dispatch
 */
async function checkFeaturedExpirations(io = null) {
  try {
    const now = new Date();

    // -------------------------------------------------------------
    // 1. Process Featured Products
    // -------------------------------------------------------------
    const activeProducts = await prisma.featuredProduct.findMany({
      where: { status: 'ACTIVE' },
      include: {
        product: {
          include: {
            seller: {
              select: { id: true, fullName: true, username: true }
            }
          }
        }
      }
    });

    for (const fp of activeProducts) {
      if (!fp.endDate) continue;

      const remainingMs = new Date(fp.endDate).getTime() - now.getTime();
      const remainingDays = remainingMs / (1000 * 60 * 60 * 24);
      const sellerId = fp.product?.sellerId;
      const slotStr = fp.slotNumber < 10 ? `0${fp.slotNumber}` : `${fp.slotNumber}`;
      const productTitle = fp.product?.title || 'Sản phẩm';

      // Stage A: 7 Days Remaining (<= 7 days and > 3 days)
      if (remainingDays <= 7 && remainingDays > 3 && !fp.notified7d) {
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '⚡ Gói Nổi Bật sắp hết hạn (Còn 7 ngày)',
              content: `Sản phẩm "${productTitle}" trên Slot #${slotStr} chỉ còn 7 ngày hiển thị trên Carousel Trang Chủ. Hãy liên hệ BQT UniMarket để gia hạn!`,
              type: 'SYSTEM',
              link: `/product/${fp.productId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }
        await prisma.featuredProduct.update({
          where: { id: fp.id },
          data: { notified7d: true }
        });
      }

      // Stage B: 3 Days Remaining (<= 3 days and > 1 day)
      if (remainingDays <= 3 && remainingDays > 1 && !fp.notified3d) {
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '⚠️ Gói Nổi Bật sắp hết hạn (Còn 3 ngày)',
              content: `Sản phẩm "${productTitle}" trên Slot #${slotStr} chỉ còn 3 ngày hiển thị trên Trang Chủ. Hãy gia hạn để duy trì lượng tiếp cận!`,
              type: 'SYSTEM',
              link: `/product/${fp.productId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }
        await prisma.featuredProduct.update({
          where: { id: fp.id },
          data: { notified3d: true }
        });
      }

      // Stage C: 1 Day Remaining (<= 1 day and > 0)
      if (remainingDays <= 1 && remainingDays > 0 && !fp.notified1d) {
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '🚨 Gói Nổi Bật hết hạn vào ngày mai!',
              content: `Gói Nổi Bật cho "${productTitle}" trên Slot #${slotStr} sẽ kết thúc trong 24 giờ tới!`,
              type: 'SYSTEM',
              link: `/product/${fp.productId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }
        await prisma.featuredProduct.update({
          where: { id: fp.id },
          data: { notified1d: true }
        });
      }

      // Stage D: Expired (remainingMs <= 0)
      if (remainingMs <= 0 && !fp.notifiedExpired) {
        // 1. Notify Seller
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '❌ Gói Nổi Bật đã hết hạn',
              content: `Sản phẩm "${productTitle}" trên Slot #${slotStr} đã hết hạn hiển thị và đã được tự động gỡ khỏi Trang Chủ. Liên hệ BQT để tiếp tục quảng bá!`,
              type: 'SYSTEM',
              link: `/product/${fp.productId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }

        // 2. Notify all Admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });
        for (const admin of admins) {
          const adminNotif = await prisma.notification.create({
            data: {
              userId: admin.id,
              title: '🔔 Slot Sản Phẩm Nổi Bật đã hết hạn',
              content: `Slot #${slotStr} ("${productTitle}" của @${fp.product?.seller?.username || 'seller'}) đã hết thời hạn marketing và được tự động giải phóng.`,
              type: 'SYSTEM',
              link: '/admin'
            }
          });
          if (io) io.to(`user_${admin.id}`).emit('notification', adminNotif);
        }

        // 3. Mark as EXPIRED & Log
        await prisma.featuredProduct.update({
          where: { id: fp.id },
          data: {
            status: 'EXPIRED',
            notifiedExpired: true
          }
        });

        await prisma.featuredLog.create({
          data: {
            type: 'PRODUCT',
            targetId: fp.productId,
            action: 'EXPIRE',
            slotNumber: fp.slotNumber,
            createdBy: fp.createdBy,
            details: `Hệ thống tự động ngắt Slot #${slotStr} của sản phẩm "${productTitle}" do hết thời hạn marketing`
          }
        });
      }
    }

    // -------------------------------------------------------------
    // 2. Process Featured Shops
    // -------------------------------------------------------------
    const activeShops = await prisma.featuredShop.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: { id: true, fullName: true, username: true }
        }
      }
    });

    for (const fs of activeShops) {
      if (!fs.endDate) continue;

      const remainingMs = new Date(fs.endDate).getTime() - now.getTime();
      const remainingDays = remainingMs / (1000 * 60 * 60 * 24);
      const sellerId = fs.userId;
      const slotStr = fs.slotNumber < 10 ? `0${fs.slotNumber}` : `${fs.slotNumber}`;
      const shopName = fs.user?.fullName || 'Gian hàng';

      // Stage A: 7 Days
      if (remainingDays <= 7 && remainingDays > 3 && !fs.notified7d) {
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '⚡ Gói Gian Hàng Nổi Bật sắp hết hạn (Còn 7 ngày)',
              content: `Gian hàng "${shopName}" trên Shop Slot #${slotStr} chỉ còn 7 ngày hiển thị trên Trang Chủ. Hãy liên hệ BQT UniMarket để gia hạn!`,
              type: 'SYSTEM',
              link: `/profile/${sellerId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }
        await prisma.featuredShop.update({
          where: { id: fs.id },
          data: { notified7d: true }
        });
      }

      // Stage B: 3 Days
      if (remainingDays <= 3 && remainingDays > 1 && !fs.notified3d) {
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '⚠️ Gói Gian Hàng Nổi Bật sắp hết hạn (Còn 3 ngày)',
              content: `Gian hàng "${shopName}" trên Shop Slot #${slotStr} chỉ còn 3 ngày hiển thị trên Trang Chủ!`,
              type: 'SYSTEM',
              link: `/profile/${sellerId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }
        await prisma.featuredShop.update({
          where: { id: fs.id },
          data: { notified3d: true }
        });
      }

      // Stage C: 1 Day
      if (remainingDays <= 1 && remainingDays > 0 && !fs.notified1d) {
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '🚨 Gói Gian Hàng Nổi Bật hết hạn vào ngày mai!',
              content: `Gian hàng "${shopName}" trên Shop Slot #${slotStr} sẽ kết thúc trong 24 giờ tới!`,
              type: 'SYSTEM',
              link: `/profile/${sellerId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }
        await prisma.featuredShop.update({
          where: { id: fs.id },
          data: { notified1d: true }
        });
      }

      // Stage D: Expired
      if (remainingMs <= 0 && !fs.notifiedExpired) {
        // 1. Notify Seller
        if (sellerId) {
          const notif = await prisma.notification.create({
            data: {
              userId: sellerId,
              title: '❌ Gói Gian Hàng Nổi Bật đã hết hạn',
              content: `Gian hàng "${shopName}" trên Shop Slot #${slotStr} đã hết hạn hiển thị và đã được tự động gỡ khỏi Trang Chủ.`,
              type: 'SYSTEM',
              link: `/profile/${sellerId}`
            }
          });
          if (io) io.to(`user_${sellerId}`).emit('notification', notif);
        }

        // 2. Notify Admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });
        for (const admin of admins) {
          const adminNotif = await prisma.notification.create({
            data: {
              userId: admin.id,
              title: '🔔 Slot Gian Hàng Nổi Bật đã hết hạn',
              content: `Shop Slot #${slotStr} (Gian hàng: "${shopName}" của @${fs.user?.username || 'seller'}) đã hết thời hạn marketing và được tự động giải phóng.`,
              type: 'SYSTEM',
              link: '/admin'
            }
          });
          if (io) io.to(`user_${admin.id}`).emit('notification', adminNotif);
        }

        // 3. Mark EXPIRED & Log
        await prisma.featuredShop.update({
          where: { id: fs.id },
          data: {
            status: 'EXPIRED',
            notifiedExpired: true
          }
        });

        await prisma.featuredLog.create({
          data: {
            type: 'SHOP',
            targetId: fs.userId,
            action: 'EXPIRE',
            slotNumber: fs.slotNumber,
            createdBy: fs.createdBy,
            details: `Hệ thống tự động ngắt Shop Slot #${slotStr} của gian hàng "${shopName}" do hết thời hạn marketing`
          }
        });
      }
    }
  } catch (err) {
    console.error('checkFeaturedExpirations error:', err);
  }
}

module.exports = {
  checkFeaturedExpirations
};
