const express = require('express');
const jwt = require('jsonwebtoken');
const JournalEntry = require('../models/JournalEntry');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Test endpoint
router.get('/test', authenticateToken, (req, res) => {
  res.json({ message: 'Journal API is working', userId: req.userId });
});

// Create a new journal entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, mood, moodIntensity, tags, activities, weather } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const journalEntry = new JournalEntry({
      userId: req.userId,
      title: title || `Entry from ${new Date().toLocaleDateString()}`,
      content: content.trim(),
      mood: mood || 'neutral',
      moodIntensity: moodIntensity || 5,
      tags: tags || [],
      activities: activities || [],
      weather: weather || 'unknown'
    });

    await journalEntry.save();

    res.status(201).json({
      message: 'Journal entry created successfully',
      entry: journalEntry
    });

  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ message: 'Server error creating journal entry' });
  }
});

// Get all journal entries for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0, mood, dateFrom, dateTo } = req.query;

    // Build query
    const query = { userId: req.userId };
    
    if (mood) {
      query.mood = mood;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const entries = await JournalEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalEntries = await JournalEntry.countDocuments({ userId: req.userId });

    res.json({ 
      entries,
      totalEntries,
      hasMore: totalEntries > (parseInt(skip) + entries.length)
    });

  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Server error fetching journal entries' });
  }
});

// Get a specific journal entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json(entry);

  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ message: 'Server error fetching journal entry' });
  }
});

// Update a journal entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, mood, moodIntensity, tags, activities, weather } = req.body;

    const entry = await JournalEntry.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Update fields
    if (title !== undefined) entry.title = title;
    if (content !== undefined) entry.content = content.trim();
    if (mood !== undefined) entry.mood = mood;
    if (moodIntensity !== undefined) entry.moodIntensity = moodIntensity;
    if (tags !== undefined) entry.tags = tags;
    if (activities !== undefined) entry.activities = activities;
    if (weather !== undefined) entry.weather = weather;

    await entry.save();

    res.json({
      message: 'Journal entry updated successfully',
      entry
    });

  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ message: 'Server error updating journal entry' });
  }
});

// Delete a journal entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted successfully' });

  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ message: 'Server error deleting journal entry' });
  }
});

// Get user stats overview for profile
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get journal entry count
    const journalEntries = await JournalEntry.countDocuments({ userId });
    
    // For emotion logs and chat sessions, we need to import those models
    const ChatMessage = require('../models/ChatMessage');
    const Emotion = require('../models/Emotion');
    
    const [emotionLogs, chatSessions] = await Promise.all([
      Emotion.countDocuments({ userId }),
      ChatMessage.countDocuments({ userId, sender: 'user' })
    ]);

    // Calculate streak (days with any activity)
    const streakDays = await calculateUserStreak(userId);

    res.json({
      stats: {
        journalEntries,
        emotionLogs,
        chatSessions,
        streakDays
      }
    });

  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// Helper function to calculate user streak
async function calculateUserStreak(userId) {
  try {
    const ChatMessage = require('../models/ChatMessage');
    const Emotion = require('../models/Emotion');
    
    // Get all unique activity dates
    const activeDates = new Set();
    
    // Get journal entry dates
    const journalDates = await JournalEntry.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          }
        }
      }
    ]);
    
    journalDates.forEach(dateObj => {
      const date = new Date(dateObj._id.year, dateObj._id.month - 1, dateObj._id.day);
      activeDates.add(date.toDateString());
    });
    
    // Get chat dates
    const chatDates = await ChatMessage.aggregate([
      { $match: { userId, sender: 'user' } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          }
        }
      }
    ]);
    
    chatDates.forEach(dateObj => {
      const date = new Date(dateObj._id.year, dateObj._id.month - 1, dateObj._id.day);
      activeDates.add(date.toDateString());
    });
    
    // Get emotion dates
    const emotionDates = await Emotion.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          }
        }
      }
    ]);
    
    emotionDates.forEach(dateObj => {
      const date = new Date(dateObj._id.year, dateObj._id.month - 1, dateObj._id.day);
      activeDates.add(date.toDateString());
    });
    
    // Calculate consecutive days from today backwards
    const sortedDates = Array.from(activeDates)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b - a); // Sort descending
    
    if (sortedDates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    
    // Check for consecutive days starting from today
    for (let i = 0; i < sortedDates.length; i++) {
      const activityDate = new Date(sortedDates[i]);
      activityDate.setHours(0, 0, 0, 0);
      
      if (activityDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (activityDate.getTime() < currentDate.getTime()) {
        break; // Gap found
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

module.exports = router;
