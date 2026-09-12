const prisma = require('../prisma');

exports.createReview = async (req, res) => {
  try {
    const { targetUserId, transactionId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    if (!targetUserId || !rating || !comment) {
      return res.status(400).json({ message: 'Vui lòng chọn số sao (1-5) và nhập lời nhận xét.' });
    }

    if (targetUserId === reviewerId) {
      return res.status(400).json({ message: 'Bạn không thể tự đánh giá chính mình.' });
    }

    const starRating = Math.min(5, Math.max(1, parseInt(rating) || 5));

    // Create review
    const review = await prisma.review.create({
      data: {
        reviewerId,
        targetUserId,
        transactionId: transactionId || null,
        rating: starRating,
        comment: comment.trim()
      },
      include: {
        reviewer: {
          select: { id: true, fullName: true, avatar: true }
        }
      }
    });

    // Recalculate average rating for target user
    const allReviews = await prisma.review.findMany({
      where: { targetUserId },
      select: { rating: true }
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        totalReviews: allReviews.length
      }
    });

    // Notify target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: `Đánh giá mới ${'⭐'.repeat(starRating)}`,
        content: `${req.user.fullName} vừa gửi đánh giá ${starRating} sao cho bạn: "${comment.trim()}"`,
        type: 'REVIEW',
        link: `/profile/${targetUserId}`
      }
    });

    res.status(201).json({
      message: 'Cảm ơn bạn đã gửi đánh giá!',
      review
    });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ message: 'Lỗi khi gửi đánh giá.' });
  }
};