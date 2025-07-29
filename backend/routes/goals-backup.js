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

// AI tips for each category
const aiTips = {
  anxiety: [
    "Practice deep breathing exercises for 5 minutes daily",
    "Try progressive muscle relaxation before stressful situations",
    "Challenge negative thoughts with evidence-based thinking",
    "Create a calming morning routine to start your day peacefully"
  ],
  sleep: [
    "Establish a consistent bedtime routine",
    "Avoid screens 1 hour before sleeping",
    "Keep your bedroom cool and dark",
    "Try meditation or gentle stretches before bed"
  ],
  stress: [
    "Break large tasks into smaller, manageable steps",
    "Practice the 4-7-8 breathing technique",
    "Take regular breaks throughout your day",
    "Identify and address your stress triggers"
  ],
  mood: [
    "Start a gratitude journal - write 3 things daily",
    "Spend time in nature or sunlight",
    "Connect with supportive friends and family",
    "Engage in activities that bring you joy"
  ],
  social: [
    "Schedule regular check-ins with friends",
    "Join groups or activities that interest you",
    "Practice active listening in conversations",
    "Be vulnerable and share your authentic self"
  ],
  mindfulness: [
    "Start with 5-minute daily meditation sessions",
    "Practice mindful eating during one meal per day",
    "Use mindfulness apps for guided exercises",
    "Focus on your breath when feeling overwhelmed"
  ],
  exercise: [
    "Start with 10-15 minutes of daily movement",
    "Find activities you genuinely enjoy",
    "Set realistic weekly exercise goals",
    "Use movement as a stress-relief tool"
  ],
  habits: [
    "Focus on one habit at a time",
    "Use habit stacking - link new habits to existing ones",
    "Track your progress visually",
    "Celebrate small wins along the way"
  ]
};

// Get all goals for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    
    let filter = { userId: req.userId };
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    const goals = await Goal.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Add AI tips for each goal
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

// Get a specific goal
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];
    
    res.json(goalObj);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, target, deadline, priority } = req.body;
    
    if (!title || !category || !target) {
      return res.status(400).json({ 
        message: 'Title, category, and target are required' 
      });
    }
    
    // Validate category
    const validCategories = ['anxiety', 'sleep', 'stress', 'mood', 'social', 'mindfulness', 'exercise', 'habits'];
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
      deadline: deadline ? new Date(deadline) : null,
      priority: priority || 'medium'
    });
    
    await goal.save();
    
    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];
    
    res.status(201).json(goalObj);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a goal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, target, deadline, priority, status } = req.body;
    
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Update fields
    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (target !== undefined) goal.target = target;
    if (deadline !== undefined) goal.deadline = deadline ? new Date(deadline) : null;
    if (priority !== undefined) goal.priority = priority;
    if (status !== undefined) goal.status = status;
    
    await goal.save();
    
    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];
    
    res.json(goalObj);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update goal progress
router.patch('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { progress, note } = req.body;
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ 
        message: 'Progress must be a number between 0 and 100' 
      });
    }
    
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    await goal.addProgress(progress, note);
    
    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];
    
    res.json(goalObj);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add milestone to a goal
router.post('/:id/milestones', authenticateToken, async (req, res) => {
  try {
    const { description, targetDate } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: 'Milestone description is required' });
    }
    
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    await goal.addMilestone(description, targetDate ? new Date(targetDate) : null);
    
    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];
    
    res.json(goalObj);
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete a milestone
router.patch('/:id/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    await goal.completeMilestone(req.params.milestoneId);
    
    const goalObj = goal.toObject();
    goalObj.aiTips = aiTips[goal.category] || [];
    
    res.json(goalObj);
  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get goal statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Goal.getGoalStats(req.userId);
    
    // Get overall statistics
    const totalGoals = await Goal.countDocuments({ userId: req.userId });
    const completedGoals = await Goal.countDocuments({ 
      userId: req.userId, 
      status: 'completed' 
    });
    const activeGoals = await Goal.countDocuments({ 
      userId: req.userId, 
      status: 'active' 
    });
    
    // Get goals with upcoming deadlines (next 7 days)
    const upcomingDeadlines = await Goal.find({
      userId: req.userId,
      status: 'active',
      deadline: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).sort({ deadline: 1 });
    
    res.json({
      totalGoals,
      completedGoals,
      activeGoals,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      categoryStats: stats,
      upcomingDeadlines
    });
  } catch (error) {
    console.error('Error fetching goal statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get AI tip for a category
router.get('/tips/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const tips = aiTips[category];
    
    if (!tips) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Return a random tip
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    res.json({ 
      category,
      tip: randomTip,
      allTips: tips 
    });
  } catch (error) {
    console.error('Error fetching AI tip:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
