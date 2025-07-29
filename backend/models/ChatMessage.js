const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  mood: {
    type: String,
    enum: ['😊', '😢', '😰', '😡', '😌', '🤔', '😴', '🥺', '💪', '😵'],
    required: false
  },
  sessionId: {
    type: String,
    default: null
  },
  aiModel: {
    type: String,
    default: 'luna-v1'
  },
  metadata: {
    responseTime: Number,
    confidence: Number,
    intent: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
