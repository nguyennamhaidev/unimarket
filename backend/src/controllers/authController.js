const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../middlewares/auth');

exports.register = async (req, res) => {
  try {
    const { fullName, username, email, password, universityId, faculty, studentCohort, district } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, tên tài khoản, email và mật khẩu.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      }
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        return res.status(400).json({ message: 'Tên tài khoản (username) này đã có người sử dụng.' });
      }
      return res.status(400).json({ message: 'Email này đã được đăng ký tài khoản.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        universityId: universityId || null,
        faculty: faculty || null,
        studentCohort: studentCohort || null,
        district: district || 'Cầu Giấy',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`
      },
      include: {
        university: true
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userSafe } = user;
    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đăng ký.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { account, password } = req.body; // account = email or username

    if (!account || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email/username và mật khẩu.' });
    }

    const rawAccount = account.trim();
    const cleanAccount = rawAccount.toLowerCase();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanAccount },
          { email: rawAccount },
          { username: cleanAccount },
          { username: rawAccount }
        ]
      },
      include: {
        university: true
      }
    });

    if (!user) {
      // Find case-insensitively across all users in database
      const candidates = await prisma.user.findMany({
        include: { university: true }
      });
      user = candidates.find(
        (u) =>
          u.email.toLowerCase() === cleanAccount ||
          u.username.toLowerCase() === cleanAccount
      );
    }

    if (!user) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa do vi phạm chính sách.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userSafe } = user;
    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đăng nhập.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [activeProductsCount, soldProductsCount, favoritesCount, unreadMessagesCount, unreadNotifsCount] = await Promise.all([
      prisma.product.count({ where: { sellerId: req.user.id, status: 'ACTIVE' } }),
      prisma.product.count({ where: { sellerId: req.user.id, status: 'SOLD' } }),
      prisma.favorite.count({ where: { userId: req.user.id } }),
      prisma.message.count({
        where: {
          conversation: {
            OR: [
              { buyerId: req.user.id },
              { sellerId: req.user.id }
            ]
          },
          senderId: { not: req.user.id },
          isRead: false
        }
      }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
    ]);

    const { password: _, ...userSafe } = req.user;
    res.json({
      user: {
        ...userSafe,
        stats: {
          activeProducts: activeProductsCount,
          soldProducts: soldProductsCount,
          favorites: favoritesCount,
          unreadMessages: unreadMessagesCount,
          unreadNotifications: unreadNotifsCount
        }
      }
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Lỗi khi tải thông tin cá nhân.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, faculty, studentCohort, district, universityId, avatar, zalo, facebook, instagram } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName !== undefined ? fullName.trim() : req.user.fullName,
        bio: bio !== undefined ? bio : req.user.bio,
        faculty: faculty !== undefined ? faculty : req.user.faculty,
        studentCohort: studentCohort !== undefined ? studentCohort : req.user.studentCohort,
        district: district !== undefined ? district : req.user.district,
        universityId: universityId !== undefined ? universityId : req.user.universityId,
        avatar: avatar !== undefined ? avatar : req.user.avatar,
        zalo: zalo !== undefined ? zalo : req.user.zalo,
        facebook: facebook !== undefined ? facebook : req.user.facebook,
        instagram: instagram !== undefined ? instagram : req.user.instagram
      },
      include: { university: true }
    });

    const { password: _, ...userSafe } = updatedUser;
    res.json({
      message: 'Cập nhật hồ sơ thành công!',
      user: userSafe
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật hồ sơ.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới.' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới và Nhập lại mật khẩu mới không trùng khớp.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Đổi mật khẩu tài khoản thành công!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id }
    });
    res.json({ message: 'Tài khoản của bạn đã được xóa thành công.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa tài khoản.' });
  }
};