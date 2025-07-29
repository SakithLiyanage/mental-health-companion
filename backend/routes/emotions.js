const express = require('express');
const jwt = require('jsonwebtoken');
const Emotion = require('../models/Emotion');
const JournalEntry = require('../models/JournalEntry');
const ChatMessage = require('../models/ChatMessage');

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

// ==== BASIC EMOTION CRUD OPERATIONS ====

// Create a new emotion entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { emotion, emotionName, intensity, category, trigger, note, tags } = req.body;

    // Validate required fields
    if (!emotion || !emotionName || intensity === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: emotion, emotionName, and intensity are required' 
      });
    }

    // Validate intensity range
    if (intensity < 1 || intensity > 10) {
      return res.status(400).json({ 
        message: 'Intensity must be between 1 and 10' 
      });
    }

    const newEmotion = new Emotion({
      userId: req.userId,
      emotion: emotion.trim(),
      emotionName: emotionName.trim(),
      intensity: parseInt(intensity),
      category: category || 'neutral',
      trigger: trigger ? trigger.trim() : undefined,
      note: note ? note.trim() : undefined,
      tags: tags || []
    });

    const savedEmotion = await newEmotion.save();
    res.status(201).json(savedEmotion);

  } catch (error) {
    console.error('Create emotion error:', error);
    res.status(500).json({ message: 'Server error creating emotion entry' });
  }
});

// Get all emotion entries for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0, category, dateFrom, dateTo } = req.query;

    // Build query
    const query = { userId: req.userId };
    
    if (category) {
      query.category = category;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const emotions = await Emotion.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ emotions });

  } catch (error) {
    console.error('Get emotions error:', error);
    res.status(500).json({ message: 'Server error fetching emotions' });
  }
});

// Get a specific emotion entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const emotion = await Emotion.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!emotion) {
      return res.status(404).json({ message: 'Emotion entry not found' });
    }

    res.json(emotion);

  } catch (error) {
    console.error('Get emotion error:', error);
    res.status(500).json({ message: 'Server error fetching emotion' });
  }
});

// Update an emotion entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { emotion, emotionName, intensity, category, trigger, note, tags } = req.body;

    // Find the emotion entry
    const existingEmotion = await Emotion.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!existingEmotion) {
      return res.status(404).json({ message: 'Emotion entry not found' });
    }

    // Validate intensity if provided
    if (intensity !== undefined && (intensity < 1 || intensity > 10)) {
      return res.status(400).json({ 
        message: 'Intensity must be between 1 and 10' 
      });
    }

    // Update fields
    if (emotion !== undefined) existingEmotion.emotion = emotion.trim();
    if (emotionName !== undefined) existingEmotion.emotionName = emotionName.trim();
    if (intensity !== undefined) existingEmotion.intensity = parseInt(intensity);
    if (category !== undefined) existingEmotion.category = category;
    if (trigger !== undefined) existingEmotion.trigger = trigger ? trigger.trim() : undefined;
    if (note !== undefined) existingEmotion.note = note ? note.trim() : undefined;
    if (tags !== undefined) existingEmotion.tags = tags;

    const updatedEmotion = await existingEmotion.save();
    res.json(updatedEmotion);

  } catch (error) {
    console.error('Update emotion error:', error);
    res.status(500).json({ message: 'Server error updating emotion entry' });
  }
});

// Delete an emotion entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const emotion = await Emotion.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!emotion) {
      return res.status(404).json({ message: 'Emotion entry not found' });
    }

    res.json({ message: 'Emotion entry deleted successfully' });

  } catch (error) {
    console.error('Delete emotion error:', error);
    res.status(500).json({ message: 'Server error deleting emotion entry' });
  }
});

// ==== EMOTION ANALYTICS ROUTES ====

// Get emotion trends over time
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30, type = 'journal' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let emotionData = [];

    if (type === 'journal' || type === 'both') {
      // Get journal emotion trends
      const journalTrends = await JournalEntry.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              mood: '$mood'
            },
            count: { $sum: 1 },
            avgIntensity: { $avg: '$moodIntensity' }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            moods: {
              $push: {
                mood: '$_id.mood',
                count: '$count',
                avgIntensity: '$avgIntensity'
              }
            },
            totalEntries: { $sum: '$count' },
            overallMoodScore: { $avg: '$avgIntensity' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      emotionData = [...emotionData, ...journalTrends.map(item => ({
        ...item,
        source: 'journal'
      }))];
    }

    if (type === 'chat' || type === 'both') {
      // Get chat emotion trends
      const chatTrends = await ChatMessage.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate },
            mood: { $exists: true }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              mood: '$mood'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            moods: {
              $push: {
                mood: '$_id.mood',
                count: '$count'
              }
            },
            totalSessions: { $sum: '$count' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      emotionData = [...emotionData, ...chatTrends.map(item => ({
        ...item,
        source: 'chat'
      }))];
    }

    res.json({
      trends: emotionData,
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error('Get emotion trends error:', error);
    res.status(500).json({ message: 'Server error fetching emotion trends' });
  }
});

// Get mood distribution
router.get('/distribution', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30, type = 'journal' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let distributionData = {};

    if (type === 'journal' || type === 'both') {
      const journalDistribution = await JournalEntry.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$mood',
            count: { $sum: 1 },
            avgIntensity: { $avg: '$moodIntensity' },
            minIntensity: { $min: '$moodIntensity' },
            maxIntensity: { $max: '$moodIntensity' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      distributionData.journal = journalDistribution;
    }

    if (type === 'chat' || type === 'both') {
      const chatDistribution = await ChatMessage.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate },
            mood: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$mood',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      distributionData.chat = chatDistribution;
    }

    res.json({
      distribution: distributionData,
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error('Get mood distribution error:', error);
    res.status(500).json({ message: 'Server error fetching mood distribution' });
  }
});

// Get emotion patterns by time of day
router.get('/patterns/time', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const timePatterns = await JournalEntry.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            mood: '$mood'
          },
          count: { $sum: 1 },
          avgIntensity: { $avg: '$moodIntensity' }
        }
      },
      {
        $group: {
          _id: '$_id.hour',
          moods: {
            $push: {
              mood: '$_id.mood',
              count: '$count',
              avgIntensity: '$avgIntensity'
            }
          },
          totalEntries: { $sum: '$count' },
          avgMoodScore: { $avg: '$avgIntensity' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      patterns: timePatterns,
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error('Get time patterns error:', error);
    res.status(500).json({ message: 'Server error fetching time patterns' });
  }
});

// Get emotion patterns by day of week
router.get('/patterns/weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const weeklyPatterns = await JournalEntry.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$createdAt' },
            mood: '$mood'
          },
          count: { $sum: 1 },
          avgIntensity: { $avg: '$moodIntensity' }
        }
      },
      {
        $group: {
          _id: '$_id.dayOfWeek',
          moods: {
            $push: {
              mood: '$_id.mood',
              count: '$count',
              avgIntensity: '$avgIntensity'
            }
          },
          totalEntries: { $sum: '$count' },
          avgMoodScore: { $avg: '$avgIntensity' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Map day numbers to names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedPatterns = weeklyPatterns.map(pattern => ({
      ...pattern,
      dayName: dayNames[pattern._id - 1]
    }));

    res.json({
      patterns: formattedPatterns,
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error('Get weekly patterns error:', error);
    res.status(500).json({ message: 'Server error fetching weekly patterns' });
  }
});

// Get mood insights and recommendations
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get recent mood trends
    const recentMoods = await JournalEntry.find({
      userId,
      createdAt: { $gte: startDate }
    })
    .select('mood moodIntensity createdAt')
    .sort({ createdAt: -1 })
    .limit(50);

    // Calculate insights
    const insights = {
      totalEntries: recentMoods.length,
      avgMoodIntensity: 0,
      mostCommonMood: null,
      moodTrend: 'stable', // 'improving', 'declining', 'stable'
      recommendations: []
    };

    if (recentMoods.length > 0) {
      // Calculate average mood intensity
      insights.avgMoodIntensity = recentMoods.reduce((sum, entry) => sum + entry.moodIntensity, 0) / recentMoods.length;

      // Find most common mood
      const moodCounts = {};
      recentMoods.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      });
      insights.mostCommonMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);

      // Calculate trend (compare first half with second half)
      if (recentMoods.length >= 10) {
        const firstHalf = recentMoods.slice(-Math.floor(recentMoods.length / 2));
        const secondHalf = recentMoods.slice(0, Math.floor(recentMoods.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.moodIntensity, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.moodIntensity, 0) / secondHalf.length;
        
        if (firstHalfAvg > secondHalfAvg + 0.5) {
          insights.moodTrend = 'improving';
        } else if (firstHalfAvg < secondHalfAvg - 0.5) {
          insights.moodTrend = 'declining';
        }
      }

      // Generate recommendations based on patterns
      if (insights.avgMoodIntensity < 4) {
        insights.recommendations.push({
          type: 'self-care',
          message: 'Consider incorporating more self-care activities into your routine.',
          priority: 'high'
        });
      }

      if (insights.mostCommonMood === 'anxious') {
        insights.recommendations.push({
          type: 'mindfulness',
          message: 'Try some breathing exercises or meditation to help manage anxiety.',
          priority: 'medium'
        });
      }

      if (insights.moodTrend === 'declining') {
        insights.recommendations.push({
          type: 'professional-help',
          message: 'If you continue to feel down, consider reaching out to a mental health professional.',
          priority: 'high'
        });
      } else if (insights.moodTrend === 'improving') {
        insights.recommendations.push({
          type: 'positive-reinforcement',
          message: 'Great job! Your mood has been improving. Keep up the positive habits.',
          priority: 'low'
        });
      }

      if (insights.totalEntries < 7 && parseInt(days) >= 7) {
        insights.recommendations.push({
          type: 'consistency',
          message: 'Try to journal more regularly to better track your emotional patterns.',
          priority: 'medium'
        });
      }
    }

    res.json({
      insights,
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error('Get mood insights error:', error);
    res.status(500).json({ message: 'Server error fetching mood insights' });
  }
});

module.exports = router;
