const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  mood: {
    type: String,
    enum: ['very-happy', 'happy', 'peaceful', 'neutral', 'thoughtful', 'sad', 'anxious', 'angry', 'tired', 'frustrated', 'vulnerable', 'very-sad', 'excited', 'grateful'],
    default: 'neutral'
  },
  moodIntensity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  tags: [String],
  activities: [String],
  weather: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy', 'unknown'],
    default: 'unknown'
  },
  isPrivate: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
journalEntrySchema.index({ userId: 1, createdAt: -1 });
journalEntrySchema.index({ userId: 1, mood: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
