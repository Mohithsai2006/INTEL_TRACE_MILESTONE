const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessagesForConversation,
} = require('../controllers/conversationController.js');
const { protect } = require('../middleware/authMiddleware.js');

// All routes here are protected
router.use(protect);

router.get('/', getConversations);
router.get('/:id/messages', getMessagesForConversation);

module.exports = router;