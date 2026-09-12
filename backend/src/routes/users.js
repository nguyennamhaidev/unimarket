const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middlewares/auth');

router.get('/:id/public-profile', optionalAuth, userController.getUserPublicProfile);
router.post('/:id/follow', authenticate, userController.toggleFollow);
router.post('/:id/block', authenticate, userController.blockUser);
router.post('/:id/unblock', authenticate, userController.unblockUser);
router.get('/my/blocked', authenticate, userController.getBlockedUsers);
router.get('/my/notifications', authenticate, userController.getNotifications);
router.put('/my/notifications/:id/read', authenticate, userController.markNotificationRead);
router.put('/my/notifications/read-all', authenticate, userController.markAllNotificationsRead);

module.exports = router;
