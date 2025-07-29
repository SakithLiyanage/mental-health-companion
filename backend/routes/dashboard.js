const express = require('express');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const JournalEntry = require('../models/JournalEntry');
const Emotion = require('../models/Emotion');

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

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get counts for this week and today
    const [
      weekChatCount,
      weekJournalCount, 
      weekEmotionCount,
      todayChatCount,
      todayJournalCount,
      todayEmotionCount,
      totalChatCount,
      totalJournalCount,
      totalEmotionCount,
      prevWeekChatCount,
      prevWeekJournalCount,
      prevWeekEmotionCount
    ] = await Promise.all([
      // This week's data
      ChatMessage.countDocuments({ 
        userId, 
        sender: 'user',
        createdAt: { $gte: weekAgo } 
      }),
      JournalEntry.countDocuments({ 
        userId, 
        createdAt: { $gte: weekAgo } 
      }),
      Emotion.countDocuments({ 
        userId, 
        createdAt: { $gte: weekAgo } 
      }),
      
      // Today's data
      ChatMessage.countDocuments({ 
        userId, 
        sender: 'user',
        createdAt: { $gte: todayStart } 
      }),
      JournalEntry.countDocuments({ 
        userId, 
        createdAt: { $gte: todayStart } 
      }),
      Emotion.countDocuments({ 
        userId, 
        createdAt: { $gte: todayStart } 
      }),
      
      // Total counts
      ChatMessage.countDocuments({ userId, sender: 'user' }),
      JournalEntry.countDocuments({ userId }),
      Emotion.countDocuments({ userId }),
      
      // Previous week's data for comparison
      ChatMessage.countDocuments({ 
        userId, 
        sender: 'user',
        createdAt: { 
          $gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lt: weekAgo 
        } 
      }),
      JournalEntry.countDocuments({ 
        userId, 
        createdAt: { 
          $gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lt: weekAgo 
        } 
      }),
      Emotion.countDocuments({ 
        userId, 
        createdAt: { 
          $gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lt: weekAgo 
        } 
      })
    ]);

    // Calculate days active (days with any activity)
    const activeDays = await ChatMessage.aggregate([
      { 
        $match: { 
          userId: req.userId, 
          createdAt: { $gte: weekAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          }
        }
      },
      { $count: "activeDays" }
    ]);

    const daysActive = activeDays[0]?.activeDays || 0;

    // Calculate current streak
    const currentStreak = await calculateCurrentStreak(req.userId);

    // Calculate mood average for the week
    const moodData = await Emotion.aggregate([
      { 
        $match: { 
          userId: req.userId, 
          createdAt: { $gte: weekAgo } 
        } 
      },
      {
        $group: {
          _id: null,
          avgMood: { $avg: "$rating" }
        }
      }
    ]);

    const moodAverage = moodData[0]?.avgMood || 0;

    // Calculate changes from previous week
    const chatChange = weekChatCount - prevWeekChatCount;
    const journalChange = weekJournalCount - prevWeekJournalCount;
    const emotionChange = weekEmotionCount - prevWeekEmotionCount;

    // Calculate today's activity count for daily goal
    const todayActivities = todayChatCount + todayJournalCount + todayEmotionCount;

    const stats = {
      wellnessMetrics: [
        { 
          label: 'Days Active', 
          value: daysActive, 
          change: daysActive, // This week vs last week would need more complex calculation
          color: 'text-blue-600', 
          icon: '🗓️' 
        },
        { 
          label: 'Journal Entries', 
          value: weekJournalCount, 
          change: journalChange, 
          color: 'text-purple-600', 
          icon: '📔' 
        },
        { 
          label: 'Chat Sessions', 
          value: weekChatCount, 
          change: chatChange, 
          color: 'text-green-600', 
          icon: '💬' 
        },
        { 
          label: 'Mood Average', 
          value: moodAverage > 0 ? Number(moodAverage.toFixed(1)) : 0, 
          change: 0, // Would need historical comparison
          color: 'text-orange-600', 
          icon: '😊' 
        }
      ],
      totalActivities: weekChatCount + weekJournalCount + weekEmotionCount,
      todayActivities: todayActivities, // Add today's activities for daily goal
      weeklyProgress: Math.min(100, Math.round(((weekChatCount + weekJournalCount + weekEmotionCount) / 10) * 100)),
      currentStreak: currentStreak
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Get recent activities
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 5;

    // Get recent activities from different collections
    const [recentChats, recentJournals, recentEmotions] = await Promise.all([
      ChatMessage.find({ userId, sender: 'user' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('message createdAt'),
      
      JournalEntry.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title content createdAt'),
      
      Emotion.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('emotion emotionName intensity category trigger note createdAt')
    ]);

    // Combine and sort all activities
    const allActivities = [
      ...recentChats.map(chat => ({
        type: 'chat',
        action: 'Had a chat session with Luna',
        description: chat.message.length > 50 ? chat.message.substring(0, 50) + '...' : chat.message,
        time: chat.createdAt,
        icon: '💬',
        color: 'bg-blue-100 text-blue-700'
      })),
      ...recentJournals.map(journal => ({
        type: 'journal',
        action: 'Completed journal entry',
        description: journal.title || (journal.content && journal.content.length > 50 ? journal.content.substring(0, 50) + '...' : 'Personal reflection'),
        time: journal.createdAt,
        icon: '📝',
        color: 'bg-purple-100 text-purple-700'
      })),
      ...recentEmotions.map(emotion => ({
        type: 'emotion',
        emotion: emotion.emotion,
        emotionName: emotion.emotionName,
        intensity: emotion.intensity,
        action: 'Tracked emotions',
        description: `Feeling ${emotion.emotion} (${emotion.intensity}/10)${emotion.note ? `: ${emotion.note}` : ''}`,
        time: emotion.createdAt,
        icon: emotion.emotion,
        color: 'bg-green-100 text-green-700'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time))
     .slice(0, limit)
     .map(activity => ({
       ...activity,
       timeAgo: getTimeAgo(activity.time)
     }));

    res.json(allActivities);
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

// Helper function to calculate current streak
async function calculateCurrentStreak(userId) {
  try {
    // Get all days with activity (combine all activity types)
    const activeDates = new Set();
    
    // Get dates from chat messages
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
    
    // Get dates from journal entries
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
    
    // Get dates from emotion tracking
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
    
    // Convert to sorted array of dates
    const sortedDates = Array.from(activeDates)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b - a); // Sort descending (most recent first)
    
    if (sortedDates.length === 0) return 0;
    
    // Calculate streak from today backwards
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const activityDate = new Date(sortedDates[i]);
      activityDate.setHours(0, 0, 0, 0);
      
      if (activityDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (activityDate.getTime() < currentDate.getTime()) {
        // Gap found, streak broken
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

module.exports = router;
