const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin, requireQtvOrAdmin } = require('../middlewares/auth');

// Base authentication check for all admin routes
router.use(authenticate);

// === QTV + ADMIN ACCESSIBLE ROUTES (Moderation) ===
router.get('/products', requireQtvOrAdmin, adminController.getProducts);
router.put('/products/:id/status', requireQtvOrAdmin, adminController.updateProductStatus);
router.delete('/products/:id', requireQtvOrAdmin, adminController.deleteProduct);
router.get('/reports', requireQtvOrAdmin, adminController.getReports);
router.post('/reports/:id/resolve', requireQtvOrAdmin, adminController.resolveReport);

// === ADMIN ONLY ROUTES (Full System Management) ===
router.get('/stats', requireAdmin, adminController.getDashboardStats);
router.get('/users', requireAdmin, adminController.getUsers);
router.post('/users/:id/toggle-ban', requireAdmin, adminController.toggleBanUser);
router.post('/users/:id/role', requireAdmin, adminController.toggleUserRole);
router.delete('/users/:id', requireAdmin, adminController.deleteUser);
router.get('/logs', requireAdmin, adminController.getAdminLogs);
router.post('/universities', requireAdmin, adminController.createUniversity);
router.post('/categories', requireAdmin, adminController.createCategory);
router.get('/settings', requireAdmin, adminController.getSystemSettings);
router.put('/settings', requireAdmin, adminController.updateSystemSettings);

module.exports = router;
