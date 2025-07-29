const mongoose = require('mongoose');

const emotionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emotion: {
    type: String,
    required: true
  },
  emotionName: {
    type: String,
    required: true
  },
  intensity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  category: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  trigger: {
    type: String,
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  tags: [String],
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
emotionSchema.index({ userId: 1, date: -1 });
emotionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Emotion', emotionSchema);
