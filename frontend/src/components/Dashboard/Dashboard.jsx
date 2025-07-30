import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api.js';

const emotionTypes = [
  { emoji: '😊', name: 'Happy', category: 'positive', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { emoji: '😢', name: 'Sad', category: 'negative', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { emoji: '😰', name: 'Anxious', category: 'negative', color: 'text-red-600', bgColor: 'bg-red-100' },
  { emoji: '\u{1F620}', name: 'Frustrated', category: 'negative', color: 'text-red-700', bgColor: 'bg-red-200' },
  { emoji: '😌', name: 'Peaceful', category: 'positive', color: 'text-green-600', bgColor: 'bg-green-100' },
  { emoji: '🤔', name: 'Thoughtful', category: 'neutral', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { emoji: '😴', name: 'Tired', category: 'neutral', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { emoji: '🥺', name: 'Vulnerable', category: 'negative', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { emoji: '💪', name: 'Confident', category: 'positive', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { emoji: '😵', name: 'Overwhelmed', category: 'negative', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [wellnessMetrics, setWellnessMetrics] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [todayActivities, setTodayActivities] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Dynamic greeting based on time
  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, [currentTime]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch stats and activities in parallel
        const [statsResponse, activitiesResponse] = await Promise.all([
          fetch(API_ENDPOINTS.dashboardStats, { headers }),
          fetch(`${API_ENDPOINTS.dashboardActivities}?limit=4`, { headers })
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setWellnessMetrics(statsData.wellnessMetrics);
          setWeeklyProgress(statsData.weeklyProgress);
          setTotalActivities(statsData.totalActivities);
          setTodayActivities(statsData.todayActivities || 0);
          setCurrentStreak(statsData.currentStreak || 0);
        } else {
          // Fallback data when database is not available
          setWellnessMetrics([
            { label: 'Days Active', value: 2, change: 1, color: 'text-blue-600', icon: '🗓️' },
            { label: 'Journal Entries', value: 1, change: 1, color: 'text-purple-600', icon: '📔' },
            { label: 'Chat Sessions', value: 3, change: 2, color: 'text-green-600', icon: '💬' },
            { label: 'Mood Average', value: 7.5, change: 0.5, color: 'text-orange-600', icon: '😊' }
          ]);
          setWeeklyProgress(60);
          setTotalActivities(6);
          setTodayActivities(2);
          setCurrentStreak(3);
        }

        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          const formattedActivities = activitiesData.map(activity => {
            if (activity.type === 'emotion' && activity.emotion) {
              const emotionType = emotionTypes.find(e => e.emoji === activity.emotion);
              const emotionName = emotionType ? emotionType.name : (activity.emotionName || 'Emotion');
              const emotionBgColor = emotionType ? emotionType.bgColor : 'bg-gray-100';
              const emotionTextColor = emotionType ? emotionType.color : 'text-gray-700';
              const intensityValue = activity.intensity !== undefined ? activity.intensity : 5;

              return {
                ...activity,
                action: `Logged ${emotionName} emotion`,
                description: `Feeling ${activity.emotion} (${intensityValue}/10)${activity.note ? `: ${activity.note}` : ''}`,
                icon: activity.emotion, // Use the actual emotion emoji as icon
                color: `${emotionBgColor} ${emotionTextColor}`
              };
            }
            return activity;
          });
          setRecentActivities(formattedActivities);
        } else {
          // Fallback activities when database is not available
          setRecentActivities([
            {
              type: 'chat',
              action: 'Had a chat session with Luna',
              description: 'Discussed stress management and mindfulness techniques',
              timeAgo: '2 hours ago',
              icon: '💬',
              color: 'bg-blue-100 text-blue-700'
            },
            {
              type: 'journal',
              action: 'Completed journal entry',
              description: 'Reflected on daily goals and personal growth',
              timeAgo: '1 day ago',
              icon: '📝',
              color: 'bg-purple-100 text-purple-700'
            }
          ]);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Chat with Luna',
      description: 'Talk to your empathetic AI companion about anything on your mind',
      link: '/chat',
      emoji: '🌙',
      color: 'text-blue-700',
      bgGradient: 'from-blue-50 to-indigo-100'
    },
    {
      title: 'Journal Entry',
      description: 'Capture your thoughts, feelings, and daily reflections',
      link: '/journal',
      emoji: '📝',
      color: 'text-purple-700',
      bgGradient: 'from-purple-50 to-pink-100'
    },
    {
      title: 'Emotion Tracker',
      description: 'Track your emotional journey and discover patterns',
      link: '/emotions',
      emoji: '📊',
      color: 'text-green-700',
      bgGradient: 'from-green-50 to-emerald-100'
    }
  ];

  const inspirationalQuotes = [
    "Every day is a new beginning. Take a deep breath, smile, and start again.",
    "Your mental health is just as important as your physical health.",
    "Progress, not perfection. Every small step counts.",
    "You are stronger than you think and more resilient than you know.",
    "Healing isn't linear, and that's perfectly okay.",
    "Be patient with yourself. Growth takes time.",
    "You have survived 100% of your worst days. You're doing amazing.",
    "Small steps in the right direction can turn out to be the biggest steps of your life.",
    "Your current situation is not your final destination.",
    "Mental health is not a destination, but a process. It's about how you drive, not where you're going."
  ];

  // Get quote based on current date so it changes daily
  const [currentQuote] = useState(() => {
    const today = new Date().toDateString(); // Gets date like "Sat Jul 25 2025"
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return inspirationalQuotes[seed % inspirationalQuotes.length];
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl mb-8 border border-calm-200">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-500/10"></div>
          <div className="relative px-8 py-12 sm:px-12 sm:py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="text-center lg:text-left mb-8 lg:mb-0">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  You're doing great today
                </div>
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-calm-900 mb-4">
                  {greeting}, {user?.firstName || 'Friend'}! 
                  <span className="text-primary-600">🌟</span>
                </h1>
                <p className="text-xl text-calm-600 max-w-2xl">
                  Welcome to your personal sanctuary for mental wellness. 
                  How are you feeling today? Your journey continues here.
                </p>
                {currentStreak > 0 && (
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
                    <span className="text-orange-600 font-semibold">🔥 {currentStreak} day streak!</span>
                  </div>
                )}
                <div className="mt-6 text-sm text-calm-500">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-6xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  🧠
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Quick Actions Grid - Removed Double Icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-calm-100"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
              <div className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {action.emoji}
                  </div>
                </div>
                <h3 className={`text-2xl font-display font-bold ${action.color} mb-3 group-hover:text-opacity-80 transition-colors duration-300`}>
                  {action.title}
                </h3>
                <p className="text-calm-600 leading-relaxed mb-6">
                  {action.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-calm-500 group-hover:text-calm-600 transition-colors duration-300">
                    Get started
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Completely Redesigned Daily Inspiration */}
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-calm-100">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-100 opacity-50"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                    ✨
                  </div>
                  <h2 className="text-2xl font-display font-bold text-calm-900 ml-4">
                    Daily Inspiration
                  </h2>
                </div>
                <span className="text-xs bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-medium">
                  {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              {/* Featured Quote */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-6 mb-6 border border-amber-200">
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 bg-amber-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-amber-800 text-lg">"</span>
                  </div>
                  <blockquote className="text-lg text-amber-900 italic leading-relaxed font-medium">
                    {currentQuote}
                  </blockquote>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-700 font-medium">— Daily Mindfulness</span>
                  <button className="text-amber-600 hover:text-amber-800 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Daily Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-calm-900 mb-3">Today's Mindful Actions</h3>
                {[
                  { icon: '🌅', action: 'Morning Gratitude', desc: 'Start with 3 things you\'re grateful for', color: 'amber' },
                  { icon: '🧘‍♀️', action: 'Mindful Break', desc: 'Take 5 minutes to breathe deeply', color: 'emerald' },
                  { icon: '📝', action: 'Evening Reflection', desc: 'Journal about your day', color: 'purple' }
                ].map((item, index) => (
                  <div key={index} className={`flex items-center p-3 bg-${item.color}-50 rounded-lg border border-${item.color}-200 hover:shadow-sm transition-all duration-200`}>
                    <span className="text-2xl mr-3">{item.icon}</span>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-${item.color}-800 text-sm`}>{item.action}</h4>
                      <p className={`text-${item.color}-600 text-xs`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Progress Section - More Substantial */}
          <div className="bg-white rounded-2xl shadow-lg border border-calm-100 p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                📈
              </div>
              <h2 className="text-2xl font-display font-bold text-calm-900 ml-4">
                Your Progress
              </h2>
            </div>
            
            {/* Progress Overview */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 mb-6 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-emerald-800 text-lg">Weekly Goal Progress</h3>
                  <p className="text-emerald-600 text-sm">You're doing amazing! Keep it up.</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-700">{weeklyProgress}%</div>
                  <div className="text-xs text-emerald-600">Complete</div>
                </div>
              </div>
              <div className="mt-3 bg-white rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" style={{width: `${weeklyProgress}%`}}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {wellnessMetrics.map((metric, index) => (
                <div key={index} className="bg-calm-50 rounded-xl p-4 hover:bg-calm-100 transition-colors duration-200 border border-calm-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{metric.icon}</span>
                    <div className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${metric.change > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}
                      <svg className={`w-3 h-3 ml-1 ${metric.change > 0 ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${metric.color} mb-2`}>
                    {typeof metric.value === 'number' && metric.value % 1 !== 0 
                      ? metric.value.toFixed(1) 
                      : metric.value}
                  </div>
                  <div className="text-sm font-medium text-calm-800 mb-1">{metric.label}</div>
                  <div className="text-xs text-calm-600">This week</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Recent Activity - Better Visibility */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-calm-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  🕐
                </div>
                <h2 className="text-2xl font-display font-bold text-calm-900 ml-4">
                  Recent Activity
                </h2>
              </div>
              <Link to="/profile" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                // Loading skeleton
                [...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-start p-5 bg-gradient-to-r from-calm-50 to-white rounded-xl border border-calm-200">
                    <div className="w-12 h-12 rounded-xl bg-calm-200 animate-pulse mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-calm-200 animate-pulse rounded mb-2"></div>
                      <div className="h-3 bg-calm-200 animate-pulse rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : recentActivities.length > 0 ? (
                recentActivities.map((item, index) => (
                  <div key={index} className="flex items-start p-5 bg-gradient-to-r from-calm-50 to-white rounded-xl hover:shadow-md transition-all duration-200 border border-calm-200 hover:border-calm-300">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} mr-4 text-xl shadow-sm`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-calm-900 font-semibold text-lg">{item.action}</h4>
                        <span className="text-calm-500 text-sm bg-calm-100 px-3 py-1 rounded-full">{item.timeAgo}</span>
                      </div>
                      <p className="text-calm-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-calm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-calm-900 font-semibold mb-2">No recent activity</h3>
                  <p className="text-calm-600 text-sm">Start journaling, chatting, or tracking emotions to see your activity here!</p>
                </div>
              )}
            </div>
            
            {/* Activity Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-purple-800">This Week's Summary</h4>
                  <p className="text-purple-600 text-sm">You've been consistently active</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-700">{totalActivities}</div>
                  <div className="text-xs text-purple-600">Activities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Wellness Tips */}
          <div className="bg-white rounded-2xl shadow-lg border border-calm-100 p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                💡
              </div>
              <h2 className="text-xl font-display font-bold text-calm-900 ml-4">
                Wellness Tips
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { tip: 'Deep Breathing', description: 'Take 5 mindful breaths', time: '2 min', icon: '🫁', color: 'teal' },
                { tip: 'Practice Gratitude', description: 'List 3 things you\'re grateful for', time: '3 min', icon: '🙏', color: 'emerald' },
                { tip: 'Stay Hydrated', description: 'Drink a glass of water mindfully', time: '1 min', icon: '💧', color: 'blue' },
                { tip: 'Nature Break', description: 'Step outside for fresh air', time: '5 min', icon: '🌱', color: 'green' }
              ].map((item, index) => (
                <div key={index} className={`p-4 bg-gradient-to-r from-${item.color}-50 to-${item.color}-50 rounded-xl border border-${item.color}-200 hover:shadow-md transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <h4 className="font-semibold text-calm-900">{item.tip}</h4>
                    </div>
                    <span className={`text-xs bg-${item.color}-200 text-${item.color}-700 px-2 py-1 rounded-full font-medium`}>
                      {item.time}
                    </span>
                  </div>
                  <p className="text-calm-600 text-sm ml-8">{item.description}</p>
                </div>
              ))}
            </div>
            
            {/* Daily Goal Progress */}
            <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-teal-800 text-sm">Daily Wellness Goal</h4>
                  <p className="text-teal-600 text-xs">Complete 3 wellness activities today</p>
                </div>
                <div className="text-teal-700 font-bold">{Math.min(todayActivities, 3)}/3</div>
              </div>
              <div className="bg-white rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full" style={{width: `${Math.min(100, (todayActivities / 3) * 100)}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
