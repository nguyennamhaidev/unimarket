const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middlewares/auth');
const { uploadImageToStorage } = require('../services/storageService');

// Use memory storage for cloud/persistent upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận tệp hình ảnh (JPG, PNG, WEBP, GIF, SVG)!'), false);
    }
  }
});

// Single image upload
router.post('/single', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn hình ảnh để tải lên.' });
    }

    const url = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({ url, message: 'Tải ảnh lên thành công!' });
  } catch (err) {
    console.error('Upload single image error:', err);
    res.status(500).json({ message: err.message || 'Lỗi khi tải ảnh lên hệ thống.' });
  }
});

// Multiple image upload (up to 8 images per product)
router.post('/multiple', authenticate, upload.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 hình ảnh.' });
    }

    const uploadPromises = req.files.map(file => 
      uploadImageToStorage(file.buffer, file.originalname, file.mimetype)
    );

    const urls = await Promise.all(uploadPromises);

    res.json({ urls, message: `Tải thành công ${urls.length} hình ảnh!` });
  } catch (err) {
    console.error('Upload multiple images error:', err);
    res.status(500).json({ message: err.message || 'Lỗi khi tải nhiều ảnh lên hệ thống.' });
  }
});

module.exports = router;
