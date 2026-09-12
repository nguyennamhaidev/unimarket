const prisma = require('../prisma');

exports.createReport = async (req, res) => {
  try {
    const { productId, reportedUserId, reason, description } = req.body;
    const reporterId = req.user.id;

    if (!reason || !description) {
      return res.status(400).json({ message: 'Vui lòng chọn lý do và nhập mô tả nội dung báo cáo.' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        productId: productId || null,
        reportedUserId: reportedUserId || null,
        reason,
        description: description.trim(),
        status: 'PENDING'
      }
    });

    res.status(201).json({
      message: 'UniMarket đã tiếp nhận báo cáo của bạn và sẽ tiến hành kiểm duyệt.',
      report
    });
  } catch (err) {
    console.error('createReport error:', err);
    res.status(500).json({ message: 'Lỗi khi gửi báo cáo vi phạm.' });
  }
};