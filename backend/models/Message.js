// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Conversation',
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant'],
    },
    content: {
      type: String,
      required: true,
    },
    image: { type: String },
    segmentationMask: { type: String },
    clipResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClipResult',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);