// const Conversation = require('../models/Conversation.js');
// const Message = require('../models/Message.js');

// // @desc    Get all conversations for a user
// // @route   GET /api/conversations
// const getConversations = async (req, res) => {
//   const conversations = await Conversation.find({ user: req.user._id }).sort({
//     updatedAt: -1,
//   });
//   res.json(conversations);
// };

// // @desc    Get all messages for a specific conversation
// // @route   GET /api/conversations/:id/messages
// const getMessagesForConversation = async (req, res) => {
//   const conversation = await Conversation.findOne({
//     _id: req.params.id,
//     user: req.user._id,
//   });

//   if (!conversation) {
//     return res.status(404).json({ message: 'Conversation not found' });
//   }

//   const messages = await Message.find({
//     conversation: req.params.id,
//   }).sort({ createdAt: 1 });
  
//   res.json(messages);
// };

// module.exports = { getConversations, getMessagesForConversation };
// controllers/conversationController.js
// backend/controllers/conversationController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const getConversations = async (req, res) => {
  const convos = await Conversation.find({ user: req.user._id }).sort({ updatedAt: -1 });
  res.json(convos);
};

const getMessagesForConversation = async (req, res) => {
  const convo = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!convo) return res.status(404).json({ message: 'Not found' });

  const messages = await Message.find({ conversation: req.params.id })
    .sort({ createdAt: 1 })
    .populate('clipResult');

  res.json(messages);
};

module.exports = { getConversations, getMessagesForConversation };