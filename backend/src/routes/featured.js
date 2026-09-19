const express = require('express');
const router = express.Router();
const featuredController = require('../controllers/featuredController');
const { authenticate, requireAdminOrCTV } = require('../middlewares/auth');

// Public routes for Homepage
router.get('/products', featuredController.getPublicFeaturedProducts);
router.get('/shops', featuredController.getPublicFeaturedShops);

// Admin / CTV Management routes
router.use('/admin', authenticate, requireAdminOrCTV);

router.get('/admin/products', featuredController.getAdminFeaturedProducts);
router.post('/admin/product', featuredController.assignFeaturedProduct);
router.delete('/admin/product/:slotNumber', featuredController.removeFeaturedProduct);

router.get('/admin/shops', featuredController.getAdminFeaturedShops);
router.post('/admin/shop', featuredController.assignFeaturedShop);
router.delete('/admin/shop/:slotNumber', featuredController.removeFeaturedShop);

router.get('/admin/logs', featuredController.getFeaturedLogs);
router.get('/admin/search-products', featuredController.searchProductsForFeatured);
router.get('/admin/search-sellers', featuredController.searchSellersForFeatured);

module.exports = router;
