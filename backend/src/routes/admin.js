const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate, requireAdmin);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.post('/users/:id/toggle-ban', adminController.toggleBanUser);
router.post('/users/:id/role', adminController.toggleUserRole);
router.get('/products', adminController.getProducts);
router.put('/products/:id/status', adminController.updateProductStatus);
router.delete('/products/:id', adminController.deleteProduct);
router.get('/reports', adminController.getReports);
router.post('/reports/:id/resolve', adminController.resolveReport);
router.get('/logs', adminController.getAdminLogs);
router.post('/universities', adminController.createUniversity);
router.post('/categories', adminController.createCategory);

module.exports = router;
