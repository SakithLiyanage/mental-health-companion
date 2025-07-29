import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Remove the useEffect and dailyGoal state as it's now managed by context
  // const [dailyGoal, setDailyGoal] = useState({
  //   description: 'Journal & Chat',
  //   completed: 2,
  //   total: 3,
  // });
  // useEffect(() => {
  //   // Simulate fetching daily goal data
  //   // setDailyGoal({ description: 'Meditate & Read', completed: 1, total: 2 });
  // }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      emoji: '🏠', 
      description: 'Your wellness overview',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      name: 'Chat', 
      href: '/chat', 
      emoji: '🌙', 
      description: 'Talk with Luna AI',
      badge: 'AI',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      name: 'Journal', 
      href: '/journal', 
      emoji: '📝', 
      description: 'Daily reflections',
      badge: 'New',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      name: 'Emotions', 
      href: '/emotions', 
      emoji: '🎭', 
      description: 'Track your feelings',
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      name: 'Profile', 
      href: '/profile', 
      emoji: '👤', 
      description: 'Account settings',
      color: 'from-indigo-500 to-purple-500'
    },
  ];

  const handleGuidedMeditation = () => {
    navigate('/meditation');
    setSidebarOpen(false);
  };

  const handleGratitudeLog = () => {
    navigate('/gratitude');
    setSidebarOpen(false);
  };

  const handleBreathingExercise = () => {
    navigate('/breathing'); // Navigate to the new breathing exercise page
    setSidebarOpen(false);
  };

  const handleMoodCheckIn = () => {
    navigate('/emotions'); // Navigate to emotions tracker for quick mood check
    setSidebarOpen(false);
  };

  const handleGoalSetting = () => {
    navigate('/goals'); // Navigate to goal setting page
    setSidebarOpen(false);
  };

  const quickActions = [
    { name: 'Guided Meditation', icon: '🧘‍♀️', action: handleGuidedMeditation },
    { name: 'Breathing Exercise', icon: '🫁', action: handleBreathingExercise },
    { name: 'Goal Setting', icon: '🎯', action: handleGoalSetting },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-br from-indigo-50 via-white to-purple-50 
        shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-indigo-100/50
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <span className="text-lg font-semibold text-white">🧠</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                MindCare
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Daily Goal Progress */}
          <div className="p-6 border-b border-indigo-100/50">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Today's Goal</h3>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Complete your daily wellness routine</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-800">2/3 tasks</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: '67%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-[1.02]` 
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:transform hover:scale-[1.01]'
                    }
                  `}
                >
                  <span className={`text-lg mr-3 transition-transform duration-200 ${isActive || hoveredItem === item.name ? 'scale-110' : ''}`}>
                    {item.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      isActive ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-6 border-t border-indigo-100/50">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  onClick={action.action}
                  className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-white to-indigo-50 hover:from-indigo-50 hover:to-purple-50 border border-indigo-100/50 hover:border-indigo-200 transition-all duration-200 hover:transform hover:scale-105 hover:shadow-md group"
                >
                  <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">
                    {action.icon}
                  </span>
                  <span className="text-xs text-gray-700 text-center leading-tight">
                    {action.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-indigo-100/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">User</p>
                <p className="text-xs text-gray-500">Wellness Journey</p>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
