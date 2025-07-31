import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoal } from '../../contexts/GoalContext.jsx';

const GoalAnalytics = () => {
  const navigate = useNavigate();
  const { dailyGoal } = useGoal();
  const [analytics, setAnalytics] = useState(null);
  const [goals, setGoals] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    fetchAnalytics();
    fetchGoals();
  }, [timeRange, dailyGoal, lastRefresh]); // Add lastRefresh as dependency
  
  // Add an interval to periodically refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/goals/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  // Calculate category breakdown from goals data if not available in analytics
  const calculateCategoryBreakdown = (goals) => {
    const breakdown = {};
    
    goals.forEach(goal => {
      const category = goal.category || 'custom';
      if (!breakdown[category]) {
        breakdown[category] = {
          total: 0,
          active: 0,
          completed: 0,
          totalProgress: 0,
          totalStreak: 0
        };
      }
      
      breakdown[category].total++;
      breakdown[category].totalProgress += goal.progress || 0;
      breakdown[category].totalStreak += goal.currentStreak || 0;
      
      if (goal.status === 'completed') {
        breakdown[category].completed++;
      } else if (goal.status === 'active') {
        breakdown[category].active++;
      }
    });
    
    // Calculate averages
    Object.keys(breakdown).forEach(category => {
      const cat = breakdown[category];
      cat.averageProgress = cat.total > 0 ? cat.totalProgress / cat.total : 0;
    });
    
    return breakdown;
  };

  const generateProgressChart = (goal) => {
    const logs = goal.dailyLogs || [];
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = logs.find(l => {
        const logDate = new Date(l.date).toISOString().split('T')[0];
        return logDate === dateStr;
      });
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: log ? log.completed : false,
        value: log ? log.value : 0,
        mood: log ? log.mood : null
      });
    }
    
    return last7Days;
  };

  const ProgressChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value || 0), 1);
    
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h4 className="font-medium text-gray-800 mb-3">{title}</h4>
        <div className="flex items-end space-x-2 h-24">
          {data.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t transition-all duration-300 ${
                  day.completed ? 'bg-green-500' : 'bg-gray-200'
                }`}
                style={{ 
                  height: `${day.value ? (day.value / maxValue) * 60 : (day.completed ? 60 : 8)}px`,
                  minHeight: '8px'
                }}
                title={`${day.date}: ${day.completed ? 'Completed' : 'Not completed'}${day.value ? ` (${day.value})` : ''}`}
              />
              <span className="text-xs text-gray-600 mt-1">{day.date}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MoodChart = ({ data, title }) => {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h4 className="font-medium text-gray-800 mb-3">{title}</h4>
        <div className="flex items-end space-x-2 h-24">
          {data.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t transition-all duration-300 ${
                  day.mood ? getMoodColor(day.mood) : 'bg-gray-200'
                }`}
                style={{ 
                  height: `${day.mood ? (day.mood / 10) * 60 : 8}px`,
                  minHeight: '8px'
                }}
                title={`${day.date}: Mood ${day.mood || 'Not recorded'}/10`}
              />
              <span className="text-xs text-gray-600 mt-1">{day.date}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getMoodColor = (mood) => {
    if (mood <= 3) return 'bg-red-500';
    if (mood <= 5) return 'bg-orange-500';
    if (mood <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStreakColor = (streak) => {
    if (streak === 0) return 'text-gray-500';
    if (streak < 7) return 'text-blue-500';
    if (streak < 30) return 'text-green-500';
    return 'text-purple-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calm-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-calm-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100 mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/goals')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Goals</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl font-display font-bold text-calm-900 mb-2">
                📊 Goal Analytics & Progress Insights
              </h1>
              <p className="text-calm-600">
                Visualize your progress and get insights into your mental health journey
              </p>
            </div>
            
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            {['week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {analytics && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Goals</p>
                    <p className="text-3xl font-bold text-primary-600">{analytics.overview.totalGoals}</p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-full">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{analytics.overview.completedGoals}</p>
                    <p className="text-sm text-gray-500">{analytics.overview.completionRate}% rate</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Streak</p>
                    <p className={`text-3xl font-bold ${getStreakColor(analytics.overview.totalCurrentStreak)}`}>
                      {analytics.overview.totalCurrentStreak}
                    </p>
                    <p className="text-sm text-gray-500">days</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                    <p className="text-3xl font-bold text-purple-600">{analytics.overview.averageProgress}%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Goals by Category */}
            {(analytics?.categoryBreakdown || goals.length > 0) && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-calm-900 flex items-center">
                      <span className="text-2xl mr-3">📂</span>
                      Goals by Category
                    </h2>
                    <p className="text-calm-600 mt-1">Track your progress across different wellness areas</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-calm-600">Total Categories</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {Object.keys(analytics?.categoryBreakdown || calculateCategoryBreakdown(goals)).length}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analytics?.categoryBreakdown || calculateCategoryBreakdown(goals)).map(([category, stats]) => {
                    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                    const progressRate = stats.total > 0 ? (stats.averageProgress || 0) : 0;
                    
                    // Category info mapping
                    const categoryInfo = {
                      anxiety: { name: 'Reduce Anxiety', icon: '😌', color: 'blue', gradient: 'from-blue-500 to-blue-600' },
                      sleep: { name: 'Improve Sleep', icon: '😴', color: 'purple', gradient: 'from-purple-500 to-purple-600' },
                      stress: { name: 'Manage Stress', icon: '🧘', color: 'green', gradient: 'from-green-500 to-green-600' },
                      mood: { name: 'Boost Mood', icon: '😊', color: 'yellow', gradient: 'from-yellow-500 to-yellow-600' },
                      social: { name: 'Social Connection', icon: '👥', color: 'pink', gradient: 'from-pink-500 to-pink-600' },
                      mindfulness: { name: 'Mindfulness', icon: '🧠', color: 'indigo', gradient: 'from-indigo-500 to-indigo-600' },
                      exercise: { name: 'Physical Activity', icon: '💪', color: 'red', gradient: 'from-red-500 to-red-600' },
                      habits: { name: 'Healthy Habits', icon: '✅', color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
                      custom: { name: 'Custom Goals', icon: '🎯', color: 'gray', gradient: 'from-gray-500 to-gray-600' }
                    };
                    
                    const info = categoryInfo[category] || categoryInfo.custom;
                    
                    return (
                      <div 
                        key={category} 
                        className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                          stats.total > 0 
                            ? `border-${info.color}-200 bg-gradient-to-br from-${info.color}-50 to-white` 
                            : 'border-gray-200 bg-gray-50 opacity-75'
                        }`}
                      >
                        {/* Header */}
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center shadow-lg`}>
                                <span className="text-2xl">{info.icon}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-calm-900">{info.name}</h3>
                                <p className="text-sm text-calm-600 capitalize">{category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold text-${info.color}-600`}>{stats.total}</div>
                              <div className="text-xs text-calm-600">goal{stats.total !== 1 ? 's' : ''}</div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-2 bg-white/50 rounded-lg">
                              <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                              <div className="text-xs text-calm-600">Completed</div>
                            </div>
                            <div className="text-center p-2 bg-white/50 rounded-lg">
                              <div className="text-lg font-bold text-blue-600">{stats.active}</div>
                              <div className="text-xs text-calm-600">Active</div>
                            </div>
                            <div className="text-center p-2 bg-white/50 rounded-lg">
                              <div className="text-lg font-bold text-purple-600">{Math.round(progressRate)}%</div>
                              <div className="text-xs text-calm-600">Avg Progress</div>
                            </div>
                          </div>

                          {/* Progress Bars */}
                          <div className="space-y-3">
                            {/* Completion Rate */}
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-calm-700 font-medium">Completion Rate</span>
                                <span className="text-calm-600">{Math.round(completionRate)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full transition-all duration-500`}
                                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Average Progress */}
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-calm-700 font-medium">Average Progress</span>
                                <span className="text-calm-600">{Math.round(progressRate)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`bg-gradient-to-r ${info.gradient} h-2.5 rounded-full transition-all duration-500`}
                                  style={{ width: `${Math.min(progressRate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          {stats.totalStreak > 0 && (
                            <div className="mt-4 p-3 bg-white/70 rounded-lg border border-white/50">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-calm-700">🔥 Combined Streak</span>
                                <span className="font-bold text-orange-600">{stats.totalStreak} days</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Bottom accent */}
                        <div className={`h-1 bg-gradient-to-r ${info.gradient}`}></div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Category Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg border border-primary-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📈</span>
                      <div>
                        <h4 className="font-medium text-calm-900">Overall Category Performance</h4>
                        <p className="text-sm text-calm-600">Your wellness journey across all areas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {(() => {
                          const categoryData = analytics?.categoryBreakdown || calculateCategoryBreakdown(goals);
                          const values = Object.values(categoryData);
                          return values.length > 0 
                            ? Math.round(values.reduce((sum, cat) => sum + (cat.averageProgress || 0), 0) / values.length)
                            : 0;
                        })()}%
                      </div>
                      <div className="text-sm text-calm-600">Overall Average</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Achievements */}
            {analytics.recentAchievements && analytics.recentAchievements.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200 mb-8">
                <h2 className="text-xl font-semibold text-calm-900 mb-4">Recent Achievements 🏆</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.recentAchievements.map((achievement, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <p className="font-semibold text-yellow-800">{achievement.name}</p>
                          <p className="text-sm text-yellow-700">{achievement.description}</p>
                          <p className="text-xs text-yellow-600">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {analytics.insights && analytics.insights.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200 mb-8">
                <h2 className="text-xl font-semibold text-calm-900 mb-4">AI Insights 🤖</h2>
                <div className="space-y-3">
                  {analytics.insights.map((insight, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Individual Goal Progress Charts */}
        {goals.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200 mb-8">
            <h2 className="text-xl font-semibold text-calm-900 mb-6">7-Day Progress Visualization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.slice(0, 4).map((goal) => {
                const chartData = generateProgressChart(goal);
                return (
                  <div key={goal._id}>
                    <ProgressChart 
                      data={chartData} 
                      title={`${goal.title} - Completion`}
                    />
                    <div className="mt-4">
                      <MoodChart 
                        data={chartData} 
                        title={`${goal.title} - Mood Tracking`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        {analytics && analytics.weeklyStats && Object.keys(analytics.weeklyStats).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-calm-200">
            <h2 className="text-xl font-semibold text-calm-900 mb-4">Weekly Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.weeklyStats).map(([goalId, stats]) => (
                <div key={goalId} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">{stats.title}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completion Rate:</span>
                      <span className={`font-medium ${
                        stats.completionRate >= 80 ? 'text-green-600' :
                        stats.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stats.completionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Days Completed:</span>
                      <span className="font-medium text-gray-800">
                        {stats.completedDays}/{stats.totalDays}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          stats.completionRate >= 80 ? 'bg-green-500' :
                          stats.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <div className="text-center mt-8 p-6 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border border-primary-200">
          <h3 className="text-lg font-semibold text-primary-800 mb-2">
            Keep Up the Amazing Work! 🌟
          </h3>
          <p className="text-primary-700">
            Every small step you take is building toward a healthier, happier you. 
            Your consistency and dedication are truly inspiring!
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoalAnalytics;
