const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = {
      zaloContact: 'https://zalo.me/0987654321',
      telegramContact: 'https://t.me/unimarket_support',
      hotline: '0987654321'
    };
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({ success: true, settings: settingsMap });
  } catch (err) {
    console.error('getPublicSettings error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin liên hệ.' });
  }
});

module.exports = router;
