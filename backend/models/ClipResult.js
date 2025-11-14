// backend/models/ClipResult.js
const mongoose = require('mongoose');

module.exports = mongoose.model(
  'ClipResult',
  mongoose.Schema(
    {
      message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
      },
      threatScore: { type: Number },
      topThreat: { type: String },
      justification: { type: String },
      topExplanations: [
        {
          prompt: String,
          score: Number,
        },
      ],
    },
    { timestamps: true }
  )
);