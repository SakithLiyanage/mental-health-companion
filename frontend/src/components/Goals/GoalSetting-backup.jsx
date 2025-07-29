import React, { useState, useEffect } from 'react';

const GoalSetting = () => {
  const [goals, setGoals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'anxiety',
    description: '',
    target: '',
    deadline: '',
    priority: 'medium',
    progress: 0
  });

  const categories = {
    anxiety: { name: 'Reduce Anxiety', icon: '😌', color: 'blue' },
    sleep: { name: 'Improve Sleep', icon: '😴', color: 'purple' },
    stress: { name: 'Manage Stress', icon: '🧘', color: 'green' },
    mood: { name: 'Boost Mood', icon: '😊', color: 'yellow' },
    social: { name: 'Social Connection', icon: '👥', color: 'pink' },
    mindfulness: { name: 'Mindfulness', icon: '🧠', color: 'indigo' },
    exercise: { name: 'Physical Activity', icon: '💪', color: 'red' },
    habits: { name: 'Healthy Habits', icon: '✅', color: 'emerald' }
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

      const response = await fetch('http://localhost:5000/api/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoal)
      });

      if (response.ok) {
        const savedGoal = await response.json();
        setGoals([savedGoal, ...goals]);
        setNewGoal({
          title: '',
          category: 'anxiety',
          description: '',
          target: '',
          deadline: '',
          priority: 'medium',
          progress: 0
        });
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

  const updateProgress = async (goalId, newProgress) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to update progress');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          progress: Math.min(100, Math.max(0, newProgress)) 
        })
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(goals.map(goal => 
          goal._id === goalId ? updatedGoal : goal
        ));
      } else {
        const error = await response.json();
        alert(`Failed to update progress: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress. Please try again.');
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

  const getRandomTip = (aiTips) => {
    if (!aiTips || aiTips.length === 0) return "Keep up the great work!";
    return aiTips[Math.floor(Math.random() * aiTips.length)];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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
      emerald: 'from-emerald-500 to-emerald-600'
    };
    return colors[categories[category]?.color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-calm-900 mb-4">
            🎯 Goal Setting
          </h1>
          <p className="text-lg text-calm-600">
            Set and track your personal mental health goals with AI-powered support
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-calm-600">Loading your goals...</p>
          </div>
        ) : (
          <>
        {/* Add Goal Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-calm-900">Your Goals</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {showAddForm ? 'Cancel' : '+ Add New Goal'}
          </button>
        </div>

        {/* Add Goal Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-calm-200">
            <h3 className="text-xl font-semibold text-calm-900 mb-4">Create New Goal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Practice daily meditation"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Target</label>
                <input
                  type="text"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  placeholder="e.g., 10 minutes daily"
                  className="w-full p-3 border border-calm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
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
            <p className="text-calm-600">Start by creating your first mental health goal!</p>
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
                      <span className="text-sm font-medium opacity-90">{categories[goal.category].name}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
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

                  {/* Progress Controls */}
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => updateProgress(goal._id, goal.progress - 10)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      -10%
                    </button>
                    <button
                      onClick={() => updateProgress(goal._id, goal.progress + 10)}
                      className="flex-1 bg-primary-100 text-primary-700 py-2 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
                    >
                      +10%
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

                  {/* Actions */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => updateProgress(goal._id, 100)}
                      className="text-green-600 text-sm font-medium hover:text-green-700"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => deleteGoal(goal._id)}
                      className="text-red-600 text-sm font-medium hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default GoalSetting;
