import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoalSetting = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressLog, setShowProgressLog] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'anxiety',
    description: '',
    target: '',
    targetValue: '',
    targetUnit: '',
    timeframe: 'daily',
    deadline: '',
    priority: 'medium',
    reminders: {
      enabled: true,
      frequency: 'daily',
      time: '09:00',
      message: ''
    }
  });

  const categories = {
    anxiety: { name: 'Reduce Anxiety', icon: '😌', color: 'blue' },
    sleep: { name: 'Improve Sleep', icon: '😴', color: 'purple' },
    stress: { name: 'Manage Stress', icon: '🧘', color: 'green' },
    mood: { name: 'Boost Mood', icon: '😊', color: 'yellow' },
    social: { name: 'Social Connection', icon: '👥', color: 'pink' },
    mindfulness: { name: 'Mindfulness', icon: '🧠', color: 'indigo' },
    exercise: { name: 'Physical Activity', icon: '💪', color: 'red' },
    habits: { name: 'Healthy Habits', icon: '✅', color: 'emerald' },
    custom: { name: 'Custom Goal', icon: '🎯', color: 'gray' }
  };

  const timeframes = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom: 'Custom'
  };

  // Load goals from backend API
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        console.error('Failed to fetch goals:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!newGoal.title || !newGoal.target) {
      alert('Title and target are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to create goals');
        return;
      }

      const goalData = {
        ...newGoal,
        reminders: {
          ...newGoal.reminders,
          message: newGoal.reminders.message || `Time to work on your goal: ${newGoal.title}`
        }
      };

      const response = await fetch('http://localhost:5000/api/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
      });

      if (response.ok) {
        const savedGoal = await response.json();
        setGoals([savedGoal, ...goals]);
        resetNewGoal();
        setShowAddForm(false);
      } else {
        const error = await response.json();
        alert(`Failed to create goal: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const logProgress = async (goalId, progressData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to log progress');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/goals/${goalId}/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(progressData)
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(goals.map(goal => 
          goal._id === goalId ? updatedGoal : goal
        ));
        
        // Force a re-fetch of goals to ensure fresh data for analytics
        fetchGoals();
        
        return updatedGoal;
      } else {
        const error = await response.json();
        alert(`Failed to log progress: ${error.message}`);
      }
    } catch (error) {
      console.error('Error logging progress:', error);
      alert('Failed to log progress. Please try again.');
    }
  };

  const checkIn = async (goalId, responses) => {
    try {
      setAiLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/goals/${goalId}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responses })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Check-in completed:', result.message);
        await fetchGoals(); // Refresh to get updated feedback
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to delete goals');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setGoals(goals.filter(goal => goal._id !== goalId));
      } else {
        const error = await response.json();
        alert(`Failed to delete goal: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const resetNewGoal = () => {
    setNewGoal({
      title: '',
      category: 'anxiety',
      description: '',
      target: '',
      targetValue: '',
      targetUnit: '',
      timeframe: 'daily',
      deadline: '',
      priority: 'medium',
      reminders: {
        enabled: true,
        frequency: 'daily',
        time: '09:00',
        message: ''
      }
    });
  };

  const getRandomTip = (aiTips) => {
    if (!aiTips || aiTips.length === 0) return "Keep up the great work!";
    return aiTips[Math.floor(Math.random() * aiTips.length)];
  };

  const getCategoryColor = (category) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      yellow: 'from-yellow-500 to-yellow-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600',
      red: 'from-red-500 to-red-600',
      emerald: 'from-emerald-500 to-emerald-600',
      gray: 'from-gray-500 to-gray-600'
    };
    return colors[categories[category]?.color] || 'from-gray-500 to-gray-600';
  };

  const formatStreak = (streak) => {
    if (streak === 0) return 'No streak';
    if (streak === 1) return '1 day';
    return `${streak} days`;
  };

  // Progress Log Modal Component
  const ProgressLogModal = ({ goal, onClose, onSubmit }) => {
    const [logData, setLogData] = useState({
      completed: false,
      value: '',
      mood: 5,
      challenges: [],
      notes: '',
      reflection: ''
    });

    const challengeOptions = [
      'time', 'motivation', 'energy', 'stress', 'circumstances', 'health', 'other'
    ];

    const handleSubmit = () => {
      onSubmit(logData);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col">
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-calm-900">Track Today's Progress</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Record your daily progress and reflections</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-4">
              {/* Completion Status */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={logData.completed}
                    onChange={(e) => setLogData({...logData, completed: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">I completed my goal today</span>
                </label>
              </div>

              {/* Value Input */}
              {goal.targetValue && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value ({goal.targetUnit || 'units'})
                  </label>
                  <input
                    type="number"
                    value={logData.value}
                    onChange={(e) => setLogData({...logData, value: e.target.value})}
                    placeholder={`Target: ${goal.targetValue}`}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How's your mood? (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logData.mood}
                  onChange={(e) => setLogData({...logData, mood: Number(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 (Poor)</span>
                  <span className="font-medium">{logData.mood}</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>

              {/* Challenges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenges faced (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {challengeOptions.map(challenge => (
                    <label key={challenge} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={logData.challenges.includes(challenge)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLogData({
                              ...logData, 
                              challenges: [...logData.challenges, challenge]
                            });
                          } else {
                            setLogData({
                              ...logData,
                              challenges: logData.challenges.filter(c => c !== challenge)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{challenge}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={logData.notes}
                  onChange={(e) => setLogData({...logData, notes: e.target.value})}
                  placeholder="How did it go? Any observations?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>

              {/* Reflection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reflection
                </label>
                <textarea
                  value={logData.reflection}
                  onChange={(e) => setLogData({...logData, reflection: e.target.value})}
                  placeholder="What did you learn? How do you feel?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all"
            >
              Save Today's Progress
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Check-in Modal Component
  const CheckInModal = ({ goal, onClose, onSubmit, isLoading }) => {
    const [responses, setResponses] = useState({
      feeling: '',
      progress: '',
      challenges: '',
      support: '',
      tomorrow: ''
    });

    const questions = [
      { key: 'feeling', text: 'How are you feeling about your progress today?', options: ['great', 'good', 'okay', 'struggling'] },
      { key: 'progress', text: 'How is your progress overall?', options: ['ahead', 'on-track', 'behind', 'stuck'] },
      { key: 'challenges', text: 'What\'s been your biggest challenge?', type: 'text' },
      { key: 'support', text: 'How can I support you better?', type: 'text' },
      { key: 'tomorrow', text: 'What\'s your plan for tomorrow?', type: 'text' }
    ];

    const handleSubmit = () => {
      onSubmit(responses);
      onClose(); // Close modal immediately after submitting
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col">
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-calm-900">Quick Mental Health Check</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Get personalized AI guidance and reflection</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {index + 1}. {question.text}
                  </label>
                  
                  {question.options ? (
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map(option => (
                        <button
                          key={option}
                          onClick={() => setResponses({...responses, [question.key]: option})}
                          className={`p-2 text-sm rounded-lg border ${
                            responses[question.key] === option
                              ? 'bg-primary-100 border-primary-500 text-primary-700'
                              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={responses[question.key]}
                      onChange={(e) => setResponses({...responses, [question.key]: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows="2"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 p-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Getting AI Guidance...</span>
                </div>
              ) : (
                'Get AI Guidance'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-calm-900">Goal Setting & Progress Tracking</h1>
                <p className="text-calm-600">Set custom mental health goals, track daily progress, and get AI-powered motivation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/goals/analytics')}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
              >
                📊 View Analytics
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-600 hover:to-purple-600 transition-all shadow-lg"
              >
                {showAddForm ? (
                  <span className="text-white font-bold">✕ Close</span>
                ) : (
                  <span className="text-white font-bold">+ Add New Goal</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-calm-600">Loading your goals...</p>
          </div>
        ) : (
          <>

        {/* Enhanced Add Goal Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-calm-200">
            <h3 className="text-xl font-semibold text-calm-900 mb-4">Create Custom Goal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Reduce anxiety by 50% over the next month"
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-calm-700 mb-2">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Describe your goal and why it's important to you..."
                className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Target Description</label>
                <input
                  type="text"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  placeholder="e.g., Practice mindfulness for 10 minutes daily"
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Timeframe</label>
                <select
                  value={newGoal.timeframe}
                  onChange={(e) => setNewGoal({...newGoal, timeframe: e.target.value})}
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(timeframes).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Target Value (optional)</label>
                <input
                  type="number"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({...newGoal, targetValue: e.target.value})}
                  placeholder="e.g., 8 (hours), 50 (percentage)"
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Unit (optional)</label>
                <input
                  type="text"
                  value={newGoal.targetUnit}
                  onChange={(e) => setNewGoal({...newGoal, targetUnit: e.target.value})}
                  placeholder="e.g., hours, minutes, percentage"
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Priority</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Deadline (optional)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Reminder Time</label>
                <input
                  type="time"
                  value={newGoal.reminders.time}
                  onChange={(e) => setNewGoal({
                    ...newGoal, 
                    reminders: {...newGoal.reminders, time: e.target.value}
                  })}
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newGoal.reminders.enabled}
                  onChange={(e) => setNewGoal({
                    ...newGoal, 
                    reminders: {...newGoal.reminders, enabled: e.target.checked}
                  })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-calm-700">Enable daily reminders</span>
              </label>
            </div>

            <button
              onClick={addGoal}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
            >
              Create Goal
            </button>
          </div>
        )}


        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-calm-700 mb-2">No goals yet</h3>
            <p className="text-calm-600">Start by creating your first custom mental health goal!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal._id} className="bg-white rounded-3xl shadow-xl border border-calm-200 overflow-hidden">
                
                {/* Goal Header */}
                <div className={`bg-gradient-to-r ${getCategoryColor(goal.category)} p-4 text-white`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{categories[goal.category].icon}</span>
                      <div>
                        <span className="text-sm font-medium opacity-90 block">{categories[goal.category].name}</span>
                        <span className="text-xs opacity-75">{timeframes[goal.timeframe] || 'Daily'}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20`}>
                      {goal.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{goal.title}</h3>
                </div>

                {/* Goal Content */}
                <div className="p-4">
                  {goal.description && (
                    <p className="text-calm-600 text-sm mb-3">{goal.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-calm-600">Target:</span>
                      <span className="font-medium text-calm-800">{goal.target}</span>
                    </div>
                    {goal.deadline && (
                      <div className="flex justify-between text-sm">
                        <span className="text-calm-600">Deadline:</span>
                        <span className="font-medium text-calm-800">
                          {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {goal.currentStreak !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-calm-600">Current Streak:</span>
                        <span className="font-medium text-orange-600">
                          🔥 {formatStreak(goal.currentStreak)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-calm-700">Progress</span>
                      <span className="text-sm font-bold text-calm-800">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${getCategoryColor(goal.category)} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Progress Buttons */}
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowProgressLog(true);
                      }}
                      className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      title="Record today's progress with details"
                    >
                      ✅ Track Today
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowCheckIn(true);
                      }}
                      className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      title="Quick reflection and AI guidance"
                    >
                      💭 Quick Check
                    </button>
                  </div>

                  {/* AI Tip */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-4">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">🤖</span>
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-1">AI Tip</p>
                        <p className="text-sm text-blue-800">{getRandomTip(goal.aiTips)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Latest AI Feedback */}
                  {(goal.aiFeedback && goal.aiFeedback.length > 0) || aiLoading ? (
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-3 rounded-lg mb-4">
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">💭</span>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-green-700 mb-1">Latest Feedback</p>
                          {aiLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                              <p className="text-sm text-green-600 italic">Getting personalized AI guidance...</p>
                            </div>
                          ) : (
                            <p className="text-sm text-green-800">
                              {goal.aiFeedback[goal.aiFeedback.length - 1].message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Achievements */}
                  {goal.achievements && goal.achievements.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Achievements</p>
                      <div className="flex flex-wrap gap-1">
                        {goal.achievements.slice(-3).map((achievement, index) => (
                          <span
                            key={index}
                            className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                            title={achievement.description}
                          >
                            {achievement.icon} {achievement.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => logProgress(goal._id, { completed: true })}
                      className="text-green-600 text-sm font-medium hover:text-green-700"
                    >
                      ✅ Mark Complete
                    </button>
                    <button
                      onClick={() => deleteGoal(goal._id)}
                      className="text-red-600 text-sm font-medium hover:text-red-700"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* Progress Log Modal */}
        {showProgressLog && selectedGoal && (
          <ProgressLogModal
            goal={selectedGoal}
            onClose={() => {
              setShowProgressLog(false);
              setSelectedGoal(null);
            }}
            onSubmit={(logData) => logProgress(selectedGoal._id, logData)}
          />
        )}

        {/* Check-in Modal */}
        {showCheckIn && selectedGoal && (
          <CheckInModal
            goal={selectedGoal}
            isLoading={aiLoading}
            onClose={() => {
              setShowCheckIn(false);
              setSelectedGoal(null);
            }}
            onSubmit={(responses) => checkIn(selectedGoal._id, responses)}
          />
        )}
      </div>
    </div>
  );
};

export default GoalSetting;
