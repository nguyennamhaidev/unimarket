const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middlewares/auth');

router.post('/conversation', authenticate, chatController.getOrCreateConversation);
router.get('/conversations', authenticate, chatController.getMyConversations);
router.get('/conversation/:id/messages', authenticate, chatController.getConversationMessages);
router.post('/conversation/:id/read', authenticate, chatController.markConversationRead);
router.post('/message', authenticate, chatController.sendMessage);
router.get('/support-staff', chatController.getSupportStaff);
router.post('/start-support', authenticate, chatController.startSupportConversation);
router.delete('/conversation/:id', authenticate, chatController.deleteConversation);

module.exports = router;

