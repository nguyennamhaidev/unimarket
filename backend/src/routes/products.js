const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middlewares/auth');

router.get('/', optionalAuth, productController.getProducts);
router.get('/recommended', optionalAuth, productController.getRecommendedProducts);
router.get('/my-products', authenticate, productController.getMyProducts);
router.get('/my-favorites', authenticate, productController.getMyFavorites);
router.get('/:id', optionalAuth, productController.getProductById);

router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

router.post('/:id/favorite', authenticate, productController.toggleFavorite);
router.post('/:id/sold', authenticate, productController.markAsSold);
router.post('/:id/toggle-hide', authenticate, productController.toggleHide);

module.exports = router;
