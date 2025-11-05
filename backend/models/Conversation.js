const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      default: 'New Analysis',
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;