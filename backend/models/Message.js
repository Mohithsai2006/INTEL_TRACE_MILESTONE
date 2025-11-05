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
    image: {
      type: String, // Will store the path to the image, e.g., /uploads/image.png
      required: false,
    },
    segmentationMask: {
      type: String, // Will store the path to the generated mask
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;