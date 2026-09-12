const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'unimarket_super_secret_student_jwt_key_2026';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { university: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { university: true }
      });
      if (user && user.status !== 'BANNED') {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ dành cho Quản trị viên (Admin).' });
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  JWT_SECRET
};