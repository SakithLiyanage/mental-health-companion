const express = require('express');
const jwt = require('jsonwebtoken');
const Goal = require('../models/Goal');

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

// Enhanced AI tips with multiple categories and contexts
const aiTips = {
  anxiety: [
    "Practice deep breathing exercises for 5 minutes daily",
    "Try progressive muscle relaxation before stressful situations",
    "Challenge negative thoughts with evidence-based thinking",
    "Create a calming morning routine to start your day peacefully",
    "Use the 5-4-3-2-1 grounding technique: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste",
    "Write down your worries in a journal to externalize anxious thoughts",
    "Practice mindful observation - focus on one object for 2 minutes"
  ],
  sleep: [
    "Establish a consistent bedtime routine",
    "Avoid screens 1 hour before sleeping",
    "Keep your bedroom cool and dark",
    "Try meditation or gentle stretches before bed",
    "Use a sleep journal to track patterns and identify what helps",
    "Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8",
    "Create a wind-down ritual with calming activities like reading or soft music"
  ],
  stress: [
    "Break large tasks into smaller, manageable steps",
    "Practice the 4-7-8 breathing technique",
    "Take regular breaks throughout your day",
    "Identify and address your stress triggers",
    "Use the Pomodoro Technique: 25 minutes focused work, 5 minute break",
    "Try physical exercise to release stress hormones",
    "Practice saying 'no' to commitments that overwhelm you"
  ],
  mood: [
    "Start a gratitude journal - write 3 things daily",
    "Spend time in nature or sunlight",
    "Connect with supportive friends and family",
    "Engage in activities that bring you joy",
    "Practice self-compassion - treat yourself like a good friend",
    "Try mood tracking to identify patterns and triggers",
    "Engage in creative activities like art, music, or writing"
  ],
  social: [
    "Schedule regular check-ins with friends",
    "Join groups or activities that interest you",
    "Practice active listening in conversations",
    "Be vulnerable and share your authentic self",
    "Set small social goals like greeting one person daily",
    "Practice conversation starters to feel more confident",
    "Use social media mindfully - limit comparison and increase genuine connection"
  ],
  mindfulness: [
    "Start with 5-minute daily meditation sessions",
    "Practice mindful eating during one meal per day",
    "Use mindfulness apps for guided exercises",
    "Focus on your breath when feeling overwhelmed",
    "Try walking meditation - focus on each step",
    "Practice body scan meditation before sleep",
    "Use mindful moments throughout the day - pause and notice your surroundings"
  ],
  exercise: [
    "Start with 10-15 minutes of daily movement",
    "Find activities you genuinely enjoy",
    "Set realistic weekly exercise goals",
    "Use movement as a stress-relief tool",
    "Try the 'exercise snacking' approach: 2-3 minute bursts throughout the day",
    "Focus on how exercise makes you feel rather than appearance goals",
    "Mix different types of movement: strength, cardio, flexibility, and fun activities"
  ],
  habits: [
    "Focus on one habit at a time",
    "Use habit stacking - link new habits to existing ones",
    "Track your progress visually",
    "Celebrate small wins along the way",
    "Start incredibly small - make it impossible to fail",
    "Use environmental design - make good habits obvious and easy",
    "Practice self-forgiveness when you miss a day - get back on track immediately"
  ]
};

// Motivational messages for different scenarios
const motivationalMessages = {
  encouragement: [
    "Excellent work! You're building a great habit! 🌟",
    "Way to go! Every step forward counts! 💪",
    "Fantastic! You're staying committed to your goals! 🎯",
    "Great job today! Consistency is key to success! ✨",
    "Awesome! You're making real progress! 🚀",
    "Proud of you for showing up today! 💙",
    "You're building something amazing, one day at a time! 🌱"
  ],
  support: [
    "That's okay! Tomorrow is a fresh start. You've got this! 💙",
    "No worries! Progress isn't always linear. Keep going! 🌱",
    "Don't be hard on yourself. Every journey has ups and downs! 🤗",
    "It's alright! What matters is that you don't give up! 💪",
    "Remember, even small steps count as progress! 👣",
    "You're human, and that's perfectly okay. Let's refocus! 💙",
    "Setbacks are part of the journey. You're still moving forward! 🌈"
  ],
  celebration: [
    "🎉 Amazing achievement! You should be proud of yourself!",
    "🏆 You've reached a major milestone! Incredible work!",
    "🌟 Look at you crushing your goals! Keep it up!",
    "💎 You're absolutely crushing it! This is fantastic progress!",
    "🎊 Celebration time! You've earned this moment of pride!",
    "🚀 You're on fire! This momentum is incredible!",
    "⭐ Star performer! Your dedication is truly inspiring!"
  ]
};

// GET /api/goals - Get all goals for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    
    let filter = { userId: req.userId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    const goals = await Goal.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const goalsWithTips = goals.map(goal => {
      const goalObj = goal.toObject();
      goalObj.aiTips = aiTips[goal.category] || [];
      return goalObj;
    });
    
    res.json(goalsWithTips);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/goals/analytics - Get comprehensive goal analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    
    const goals = await Goal.find({ userId: req.userId });
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const pausedGoals = goals.filter(g => g.status === 'paused').length;
    
    // Calculate streaks and progress
    const totalCurrentStreak = goals.reduce((sum, g) => sum + (g.currentStreak || 0), 0);
    const totalLongestStreak = goals.reduce((sum, g) => sum + (g.longestStreak || 0), 0);
    const averageProgress = goals.length > 0 ? 
      Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;
    
    // Weekly completion rates
    const weeklyStats = calculateWeeklyStats(goals, timeRange);
    
    // Category breakdown
    const categoryBreakdown = {};
    goals.forEach(goal => {
      if (!categoryBreakdown[goal.category]) {
        categoryBreakdown[goal.category] = { 
          total: 0, 
          completed: 0, 
          active: 0,
          totalProgress: 0,
          totalStreak: 0,
          averageProgress: 0
        };
      }
      categoryBreakdown[goal.category].total++;
      categoryBreakdown[goal.category].totalProgress += goal.progress || 0;
      categoryBreakdown[goal.category].totalStreak += goal.currentStreak || 0;
      
      if (goal.status === 'completed') categoryBreakdown[goal.category].completed++;
      if (goal.status === 'active') categoryBreakdown[goal.category].active++;
    });
    
    // Calculate averages for each category
    Object.keys(categoryBreakdown).forEach(category => {
      const cat = categoryBreakdown[category];
      cat.averageProgress = cat.total > 0 ? Math.round(cat.totalProgress / cat.total) : 0;
    });
    
    // Recent achievements
    const recentAchievements = goals
      .flatMap(g => g.achievements || [])
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 5);
    
    res.json({
      overview: {
        totalGoals,
        activeGoals,
        completedGoals,
        pausedGoals,
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        averageProgress,
        totalCurrentStreak,
        totalLongestStreak
      },
      weeklyStats,
      categoryBreakdown,
      recentAchievements,
      insights: generateInsights(goals)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/goals/:id - Get specific goal with detailed analytics
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];
    goalObj.weeklyCompletionRate = goal.weeklyCompletionRate;
    
    // Add progress insights
    goalObj.insights = {
      currentStreak: goal.currentStreak,
      longestStreak: goal.longestStreak,
      recentProgress: calculateRecentProgress(goal),
      nextMilestone: findNextMilestone(goal),
      suggestedActions: getSuggestedActions(goal)
    };
    
    res.json(goalObj);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/goals - Create new goal with enhanced features
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      target,
      targetValue,
      targetUnit,
      timeframe,
      deadline,
      priority,
      reminders,
      milestones
    } = req.body;

    if (!title || !category || !target) {
      return res.status(400).json({ 
        message: 'Title, category, and target are required' 
      });
    }

    const validCategories = ['anxiety', 'sleep', 'stress', 'mood', 'social', 'mindfulness', 'exercise', 'habits', 'custom'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
      });
    }

    const goal = new Goal({
      userId: req.userId,
      title,
      category,
      description,
      target,
      targetValue: targetValue ? Number(targetValue) : undefined,
      targetUnit,
      timeframe: timeframe || 'daily',
      deadline: deadline ? new Date(deadline) : null,
      priority: priority || 'medium',
      reminders: {
        enabled: true,
        frequency: 'daily',
        time: '09:00',
        message: `Time to work on your goal: ${title}`,
        ...reminders
      }
    });

    // Add initial milestones if provided
    if (milestones && Array.isArray(milestones)) {
      goal.milestones = milestones.map(m => ({
        description: m.description,
        targetDate: m.targetDate ? new Date(m.targetDate) : null,
        targetValue: m.targetValue ? Number(m.targetValue) : undefined
      }));
    }

    await goal.save();

    // Add welcome AI feedback
    const welcomeMessage = generateWelcomeMessage(goal);
    await goal.addAIFeedback('encouragement', welcomeMessage);

    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];

    res.status(201).json(goalObj);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/goals/:id/log - Log daily progress with comprehensive tracking
router.post('/:id/log', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const {
      completed,
      value,
      mood,
      challenges = [],
      notes = '',
      reflection = ''
    } = req.body;

    // Log the progress (don't save yet)
    goal.logDailyProgress({
      completed: Boolean(completed),
      value: value ? Number(value) : undefined,
      mood: mood ? Number(mood) : undefined,
      challenges: Array.isArray(challenges) ? challenges : [challenges].filter(Boolean),
      notes,
      reflection
    });

    // If this is a completion and the goal is not already completed, mark it as completed
    if (completed && goal.status !== 'completed') {
      goal.status = 'completed';
      goal.completedAt = new Date();
      // Set progress to 100% when manually marked as complete
      goal.progress = 100;
    }

    // Generate AI feedback
    const feedback = await generateProgressFeedback(goal, { completed, mood, challenges, notes });
    goal.aiFeedback.push({
      type: feedback.type,
      message: feedback.message
    });

    // Keep only last 50 feedback items
    if (goal.aiFeedback.length > 50) {
      goal.aiFeedback = goal.aiFeedback.slice(-50);
    }

    // Check for achievements (don't save yet)
    await checkAndUnlockAchievements(goal, false); // Pass false to skip saving

    // Generate suggestions if struggling
    if (!completed || (mood && mood <= 4)) {
      const suggestions = await generateSuggestions(goal, { completed, mood, challenges });
      if (suggestions.length > 0) {
        goal.aiFeedback.push({
          type: 'suggestion',
          message: suggestions.join(' ')
        });
      }
    }

    // Save once at the end
    await goal.save();

    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];

    res.json(goalObj);
  } catch (error) {
    console.error('Error logging progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/goals/:id/checkin - Daily AI check-in
router.post('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { responses } = req.body;
    
    // Generate AI feedback using OpenRouter
    const feedback = await generateAICheckinFeedback(goal, responses);
    await goal.addAIFeedback('support', feedback);
    
    res.json({ 
      message: feedback,
      goal 
    });
  } catch (error) {
    console.error('Error processing check-in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/goals/:id/adjust - Suggest goal adjustment based on AI analysis
router.post('/:id/adjust', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const adjustment = analyzeAndSuggestAdjustment(goal);
    
    if (adjustment.shouldAdjust) {
      await goal.suggestAdjustment(adjustment.newTarget, adjustment.reason);
      res.json({ 
        suggested: true,
        adjustment,
        message: adjustment.reason 
      });
    } else {
      res.json({ 
        suggested: false,
        message: "Your goal seems well-balanced! Keep up the great work!" 
      });
    }
  } catch (error) {
    console.error('Error suggesting adjustment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/goals/:id/resources - Get personalized resources
router.get('/:id/resources', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const resources = getPersonalizedResources(goal);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/goals/:id/feedback - Get AI feedback history
router.get('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { limit = 10, type } = req.query;
    let feedback = goal.aiFeedback || [];
    
    if (type) {
      feedback = feedback.filter(f => f.type === type);
    }
    
    feedback = feedback
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/goals/:id - Delete a goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await Goal.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Goal deleted successfully',
      deletedGoal: {
        id: goal._id,
        title: goal.title
      }
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper Functions

function generateWelcomeMessage(goal) {
  const messages = [
    `Welcome to your ${goal.category} journey! I'm excited to support you in achieving "${goal.title}". Remember, every small step counts! 🌟`,
    `Great choice setting up "${goal.title}"! I'll be here to cheer you on and provide guidance every step of the way. Let's make this happen! 💪`,
    `Amazing goal: "${goal.title}"! I believe in your ability to achieve this. Together, we'll track your progress and celebrate every victory! 🎯`
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

async function generateProgressFeedback(goal, logData) {
  const { completed, mood, challenges, notes } = logData;
  
  if (completed) {
    let message = motivationalMessages.encouragement[
      Math.floor(Math.random() * motivationalMessages.encouragement.length)
    ];
    
    if (goal.currentStreak > 0) {
      message += ` You're on a ${goal.currentStreak}-day streak! 🔥`;
    }
    
    if (mood && mood >= 8) {
      message += " Your positive mood is fantastic to see! 😊";
    }
    
    return { type: 'encouragement', message };
  } else {
    let message = motivationalMessages.support[
      Math.floor(Math.random() * motivationalMessages.support.length)
    ];
    
    if (challenges && challenges.length > 0) {
      message += ` I understand you faced challenges with ${challenges.join(', ')}. These experiences help us grow stronger!`;
    }
    
    return { type: 'support', message };
  }
}

async function checkAndUnlockAchievements(goal, shouldSave = true) {
  const achievements = [];
  
  // Streak achievements
  const streakAchievements = [
    { days: 3, name: "Getting Started", description: "3 days of consistency!", icon: "🌱" },
    { days: 7, name: "Week Warrior", description: "One full week of dedication!", icon: "🏆" },
    { days: 14, name: "Two Week Champion", description: "14 days of amazing progress!", icon: "🥉" },
    { days: 30, name: "Month Master", description: "30 days of incredible consistency!", icon: "🥈" },
    { days: 60, name: "Two Month Legend", description: "60 days of unwavering commitment!", icon: "🥇" },
    { days: 100, name: "Century Club", description: "100 days! You're absolutely incredible!", icon: "💎" }
  ];
  
  for (const streak of streakAchievements) {
    if (goal.currentStreak >= streak.days && 
        !goal.achievements.find(a => a.name === streak.name)) {
      achievements.push(streak);
    }
  }
  
  // Progress achievements
  const progressAchievements = [
    { progress: 25, name: "Quarter Champion", description: "25% progress achieved!", icon: "🥉" },
    { progress: 50, name: "Halfway Hero", description: "50% progress - you're crushing it!", icon: "🥈" },
    { progress: 75, name: "Almost There", description: "75% progress - the finish line is near!", icon: "🥇" },
    { progress: 100, name: "Goal Crusher", description: "100% complete! You're amazing!", icon: "💎" }
  ];
  
  for (const prog of progressAchievements) {
    if (goal.progress >= prog.progress && 
        !goal.achievements.find(a => a.name === prog.name)) {
      achievements.push(prog);
    }
  }
  
  // Unlock achievements without saving
  for (const achievement of achievements) {
    const exists = goal.achievements.find(a => a.name === achievement.name);
    if (!exists) {
      goal.achievements.push(achievement);
      goal.aiFeedback.push({
        type: 'celebration',
        message: `🎉 Achievement Unlocked: ${achievement.name}! ${achievement.description}`
      });
    }
  }
}

function generateSuggestions(goal, logData) {
  const suggestions = [];
  const { completed, mood, challenges } = logData;
  
  if (!completed) {
    suggestions.push("Consider breaking your goal into smaller, more manageable steps.");
    suggestions.push("Try the 2-minute rule: commit to just 2 minutes to get started.");
  }
  
  if (mood && mood <= 4) {
    suggestions.push("Your mood seems low today. Remember to be kind to yourself.");
    suggestions.push("Sometimes self-care is the most productive thing we can do.");
  }
  
  if (challenges && challenges.includes('time')) {
    suggestions.push("Time management tip: try time-blocking or the Pomodoro Technique.");
  }
  
  if (challenges && challenges.includes('motivation')) {
    suggestions.push("Remember your 'why' - what motivated you to start this goal?");
  }
  
  return suggestions;
}

// AI-powered check-in feedback using OpenRouter
async function generateAICheckinFeedback(goal, responses) {
  try {
    // Prepare context about the goal and responses
    const goalContext = `
    Goal: "${goal.title}" (${goal.category})
    Target: ${goal.target}
    Current Progress: ${goal.progress}%
    Current Streak: ${goal.currentStreak} days
    Recent Performance: ${goal.dailyLogs.slice(-7).filter(log => log.completed).length}/7 days completed
    
    User's Check-in Responses:
    - Feeling about progress: ${responses.feeling || 'Not specified'}
    - Overall progress: ${responses.progress || 'Not specified'}
    - Biggest challenge: ${responses.challenges || 'Not specified'}
    - Support needed: ${responses.support || 'Not specified'}
    - Tomorrow's plan: ${responses.tomorrow || 'Not specified'}
    `;

    const prompt = `As a supportive mental health AI assistant, provide personalized guidance based on this user's goal check-in:

${goalContext}

Please provide:
1. Empathetic acknowledgment of their current state
2. Specific, actionable advice based on their responses
3. Encouragement that's realistic and supportive
4. One practical suggestion for tomorrow

Keep the response warm, personal, and under 150 words. Use emojis sparingly and appropriately.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.YOUR_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.YOUR_SITE_NAME || 'Mental Health Companion'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate mental health AI assistant. Provide supportive, personalized guidance that acknowledges the user\'s feelings and offers practical help.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText);
      return "Thanks for checking in! I appreciate you taking time to reflect on your progress. Keep going - every step counts! 💙";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Thanks for checking in! I'm here to support you on your journey. Keep up the great work! 💙";

  } catch (error) {
    console.error('Error generating AI check-in feedback:', error);
    return "Thanks for checking in! I appreciate you sharing your thoughts with me. You're doing great, and I'm here to support you! 💙";
  }
}

function generateCheckinFeedback(goal, responses) {
  let feedback = "Thanks for checking in! ";
  
  if (responses.feeling === 'good') {
    feedback += "I'm so glad you're feeling good about your progress! ";
  } else if (responses.feeling === 'struggling') {
    feedback += "I hear that you're struggling, and that's completely normal. ";
  }
  
  if (responses.progress === 'on-track') {
    feedback += "Great to hear you're staying on track! ";
  } else if (responses.progress === 'behind') {
    feedback += "Don't worry about being behind - let's focus on moving forward! ";
  }
  
  feedback += "Remember, I'm here to support you every step of the way! 💙";
  
  return feedback;
}

function analyzeAndSuggestAdjustment(goal) {
  // Analyze recent logs to suggest adjustments
  const recentLogs = goal.dailyLogs.slice(-14); // Last 14 days
  const completionRate = recentLogs.filter(log => log.completed).length / recentLogs.length;
  
  if (completionRate < 0.3 && recentLogs.length >= 7) {
    return {
      shouldAdjust: true,
      newTarget: "Consider reducing the frequency or intensity",
      reason: "Your current goal might be too ambitious. Let's adjust it to build sustainable momentum!"
    };
  } else if (completionRate > 0.9 && recentLogs.length >= 14) {
    return {
      shouldAdjust: true,
      newTarget: "Consider increasing the challenge",
      reason: "You're crushing this goal! Ready to level up and take on a bigger challenge?"
    };
  }
  
  return { shouldAdjust: false };
}

function getPersonalizedResources(goal) {
  const baseResources = {
    anxiety: [
      {
        title: "Anxiety Relief Breathing Exercise",
        type: "exercise",
        description: "4-7-8 breathing technique for immediate anxiety relief",
        content: "Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 times.",
        difficulty: "beginner"
      },
      {
        title: "Progressive Muscle Relaxation",
        type: "technique",
        description: "Systematic tension and release to calm your body",
        content: "Start with your toes, tense for 5 seconds, then release. Work your way up.",
        difficulty: "intermediate"
      }
    ],
    sleep: [
      {
        title: "Sleep Hygiene Checklist",
        type: "checklist",
        description: "Evidence-based practices for better sleep",
        content: "Cool room (65-68°F), dark environment, no screens 1 hour before bed, consistent schedule",
        difficulty: "beginner"
      }
    ],
    mindfulness: [
      {
        title: "5-Minute Body Scan",
        type: "meditation",
        description: "Quick mindfulness practice for any time of day",
        content: "Focus on each part of your body from head to toe, noticing without judgment",
        difficulty: "beginner"
      }
    ]
  };
  
  return baseResources[goal.category] || [];
}

function calculateWeeklyStats(goals, timeRange) {
  // Implementation for weekly statistics calculation
  const stats = {};
  
  goals.forEach(goal => {
    const weeklyLogs = goal.dailyLogs.filter(log => {
      const logDate = new Date(log.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });
    
    if (weeklyLogs.length > 0) {
      const completedDays = weeklyLogs.filter(log => log.completed).length;
      stats[goal._id] = {
        title: goal.title,
        completionRate: Math.round((completedDays / weeklyLogs.length) * 100),
        totalDays: weeklyLogs.length,
        completedDays
      };
    }
  });
  
  return stats;
}

function calculateRecentProgress(goal) {
  const recentLogs = goal.dailyLogs.slice(-7); // Last 7 days
  if (recentLogs.length === 0) return 0;
  
  const completed = recentLogs.filter(log => log.completed).length;
  return Math.round((completed / recentLogs.length) * 100);
}

function findNextMilestone(goal) {
  return goal.milestones.find(m => !m.completed) || null;
}

function getSuggestedActions(goal) {
  const suggestions = [];
  
  if (goal.currentStreak === 0) {
    suggestions.push("Start with just 2 minutes today to build momentum");
  } else if (goal.currentStreak < 7) {
    suggestions.push("You're building a great habit! Keep the streak alive");
  }
  
  if (goal.progress < 25) {
    suggestions.push("Focus on consistency over perfection");
  }
  
  return suggestions;
}

function generateInsights(goals) {
  const insights = [];
  
  const totalStreak = goals.reduce((sum, g) => sum + (g.currentStreak || 0), 0);
  if (totalStreak > 30) {
    insights.push("🔥 You're on fire! Your combined streak is over 30 days!");
  }
  
  const completionRate = goals.filter(g => g.status === 'completed').length / goals.length;
  if (completionRate > 0.8) {
    insights.push("🏆 You're a goal-crushing machine with over 80% completion rate!");
  }
  
  return insights;
}

// Update daily progress for activity completion
router.post('/update-daily-progress', authenticateToken, async (req, res) => {
  try {
    const { category, activityType, date } = req.body;
    const userId = req.userId;

    // Find or create a daily goal for this category
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look for existing daily goal for this category
    let dailyGoal = await Goal.findOne({
      userId,
      category,
      timeframe: 'daily',
      createdAt: { $gte: today }
    });

    if (!dailyGoal) {
      // Create a daily goal for this category if it doesn't exist
      const goalTitles = {
        social: 'Daily Social Connection',
        mindfulness: 'Daily Mindfulness Practice', 
        mood: 'Daily Mood Tracking'
      };

      const goalDescriptions = {
        social: 'Connect with others through chat and social activities',
        mindfulness: 'Practice mindfulness through journaling and reflection',
        mood: 'Track and understand your emotional patterns'
      };

      dailyGoal = new Goal({
        userId,
        title: goalTitles[category] || 'Daily Wellness Activity',
        category,
        description: goalDescriptions[category] || 'Complete daily wellness activities',
        target: 'Complete daily activity',
        timeframe: 'daily',
        status: 'active',
        progress: 0,
        currentStreak: 0,
        dailyLogs: []
      });
    }

    // Check if already logged today
    const todayLog = dailyGoal.dailyLogs.find(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    if (!todayLog) {
      // Add today's log
      dailyGoal.dailyLogs.push({
        date: today,
        completed: true,
        value: 1,
        notes: `Completed ${activityType} activity`,
        mood: 'positive'
      });

      // Update progress (each daily completion = 100% for that day)
      dailyGoal.progress = Math.min(100, dailyGoal.progress + 100);
      
      // Update streak
      dailyGoal.currentStreak = (dailyGoal.currentStreak || 0) + 1;
      dailyGoal.longestStreak = Math.max(dailyGoal.longestStreak || 0, dailyGoal.currentStreak);

      // Check if goal should be marked as completed for today
      if (dailyGoal.progress >= 100) {
        dailyGoal.status = 'completed';
        dailyGoal.completedAt = new Date();
      }

      await dailyGoal.save();
    }

    res.json({ 
      success: true, 
      message: 'Daily progress updated successfully',
      goal: dailyGoal
    });

  } catch (error) {
    console.error('Error updating daily progress:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update daily progress',
      error: error.message 
    });
  }
});

// Continue with existing routes...
// [Include all the standard CRUD operations from the original file]

module.exports = router;
