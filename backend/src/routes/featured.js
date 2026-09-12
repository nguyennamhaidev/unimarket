const express = require('express');
const router = express.Router();
const featuredController = require('../controllers/featuredController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// Public routes for Homepage Carousel
router.get('/shops', featuredController.getFeaturedShops);
router.get('/products', featuredController.getFeaturedProducts);

// Admin management routes
router.get('/admin/overview', authenticate, requireAdmin, featuredController.adminGetFeaturedOverview);
router.post('/admin/toggle-shop', authenticate, requireAdmin, featuredController.adminToggleFeaturedShop);
router.post('/admin/toggle-product', authenticate, requireAdmin, featuredController.adminToggleFeaturedProduct);

module.exports = router;
