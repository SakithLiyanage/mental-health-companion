import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGoal } from '../../contexts/GoalContext.jsx';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const { dailyGoal } = useGoal();

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
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      name: 'Emotions', 
      href: '/emotions', 
      emoji: '📊', 
      description: 'Track your mood',
      color: 'from-orange-500 to-red-500'
    },
    { 
      name: 'Goal Setting', 
      href: '/goals', 
      emoji: '🎯', 
      description: 'Set and track goals',
      color: 'from-indigo-500 to-purple-500'
    },
  ];

  const handleGuidedMeditation = () => {
    navigate('/meditation');
    setSidebarOpen(false);
  };

  const handleBreathingExercise = () => {
    navigate('/breathing'); // Navigate to the new breathing exercise page
    setSidebarOpen(false);
  };

  const handleProfile = () => {
    navigate('/profile'); // Navigate to profile page
    setSidebarOpen(false);
  };

  const quickActions = [
    { name: 'Guided Meditation', icon: '🧘‍♀️', action: handleGuidedMeditation },
    { name: 'Breathing Exercise', icon: '🫁', action: handleBreathingExercise },
    { name: 'Profile Settings', icon: '👤', action: handleProfile },
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
        fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-lg shadow-2xl transform transition-all duration-300 z-50 border-r border-calm-200
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-calm-100">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-3xl">🌙</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                MindfulSpace
              </h2>
              <p className="text-sm text-calm-500 mt-1">Your wellness companion</p>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-calm-300 scrollbar-track-calm-100 hover:scrollbar-thumb-calm-400">
            {/* Navigation */}
            <nav className="px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group relative flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-300 ease-out will-change-transform
                    ${isActive 
                      ? `bg-gradient-to-r text-white shadow-lg scale-[1.02] ${item.color}`
                      : 'text-calm-700 hover:bg-calm-50 hover:text-calm-900 hover:shadow-md hover:scale-[1.02]'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Background glow effect */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-20 blur-xl transition-all duration-300`}></div>
                  )}
                  
                  <div className="relative flex items-center w-full">
                    <span className={`text-2xl mr-4 transition-all duration-300 ease-out will-change-transform ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
                      {item.emoji}
                    </span>
                    
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold transition-colors duration-300">{item.name}</span>
                        {item.badge && (
                          <span className={`px-2 py-1 text-xs rounded-full font-medium transition-all duration-300 will-change-transform ${
                            isActive ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700 group-hover:bg-primary-200'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {/* Smooth description with height transition */}
                      <div className={`overflow-hidden transition-all duration-400 ease-out ${
                        (hoveredItem === item.name || isActive) ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <p className={`text-xs mt-1 transform transition-all duration-300 ease-out ${
                          isActive ? 'text-white/80 translate-y-0' : 'text-calm-500 translate-y-0'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    {!isActive && (
                      <div className="w-2 h-2 bg-transparent group-hover:bg-primary-400 rounded-full transition-all duration-300 ease-out will-change-transform"></div>
                    )}
                  </div>
                </Link>
              );
            })}
            </nav>
            
            {/* Quick Actions */}
            <div className="px-4 py-4 border-t border-calm-100">
              <h3 className="text-xs font-semibold text-calm-500 uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={action.action}
                    className="flex flex-col items-center p-3 bg-calm-50 hover:bg-calm-100 rounded-xl transition-all duration-300 ease-out will-change-transform hover:scale-105 hover:shadow-md group"
                  >
                    <span className="text-lg mb-1 group-hover:scale-110 transition-all duration-300 ease-out will-change-transform">
                      {action.icon}
                    </span>
                    <span className="text-xs text-calm-600 text-center leading-tight group-hover:text-calm-800 transition-colors duration-300">
                      {action.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-calm-100">
              <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-lg shadow-lg">
                    🎯
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-calm-900">Daily Goal</p>
                    <p className="text-xs text-calm-600">{dailyGoal.description}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-calm-600 mb-1">
                    <span>Progress</span>
                    <span>{dailyGoal.completed}/{dailyGoal.total}</span>
                  </div>
                  <div className="w-full bg-calm-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(dailyGoal.completed / dailyGoal.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
