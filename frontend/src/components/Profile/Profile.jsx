import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api.js';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [journalStats, setJournalStats] = useState({
    journalEntries: 0,
    emotionLogs: 0,
    chatSessions: 0,
    streakDays: 0,
  });
  
  // Initialize profile data from authenticated user or use defaults
  const [profile, setProfile] = useState({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User',
    email: user?.email || 'user@example.com',
    bio: user?.bio || 'On a journey of self-discovery and mental wellness. Passionate about mindfulness, journaling, and personal growth.',
    joinDate: user?.createdAt ? user.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    timezone: user?.timezone || 'America/New_York',
    preferences: {
      theme: user?.preferences?.theme || 'light',
      notifications: user?.preferences?.notifications !== undefined ? user.preferences.notifications : true,
      reminderTime: user?.preferences?.reminderTime || '20:00',
      privateMode: user?.preferences?.privateMode || false,
      dataRetention: user?.preferences?.dataRetention || 365,
    },
    stats: journalStats,
  });

  const [tempProfile, setTempProfile] = useState(profile);

  // Load user statistics from backend
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Load journal stats
        const journalResponse = await fetch(API_ENDPOINTS.journalStats, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (journalResponse.ok) {
          const journalData = await journalResponse.json();
          const stats = {
            journalEntries: journalData.stats.journalEntries || 0,
            emotionLogs: journalData.stats.emotionLogs || 0,
            chatSessions: journalData.stats.chatSessions || 0,
            streakDays: journalData.stats.streakDays || 0,
          };
          setJournalStats(stats);
          setProfile(prev => ({ ...prev, stats }));
        }
      } catch (error) {
        console.error('Failed to load user stats:', error);
      }
    };

    loadUserStats();
  }, []);

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      const updatedProfile = {
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'User',
        email: user.email || 'user@example.com',
        bio: user.bio || 'On a journey of self-discovery and mental wellness. Passionate about mindfulness, journaling, and personal growth.',
        joinDate: user.createdAt ? user.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        timezone: user.timezone || 'America/New_York',
        preferences: {
          theme: user.preferences?.theme || 'light',
          notifications: user.preferences?.notifications !== undefined ? user.preferences.notifications : true,
          reminderTime: user.preferences?.reminderTime || '20:00',
          privateMode: user.preferences?.privateMode || false,
          dataRetention: user.preferences?.dataRetention || 365,
        },
        stats: journalStats,
      };
      setProfile(updatedProfile);
      setTempProfile(updatedProfile);
    }
  }, [user, journalStats]);

  const achievements = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first journal entry',
      emoji: '🌱',
      unlocked: true,
      unlockedDate: '2024-01-16',
    },
    {
      id: '2',
      title: 'Consistent Writer',
      description: 'Write 30 journal entries',
      emoji: '📚',
      unlocked: true,
      unlockedDate: '2024-02-10',
      progress: 45,
      maxProgress: 30,
    },
    {
      id: '3',
      title: 'Emotion Tracker',
      description: 'Log emotions for 50 days',
      emoji: '📊',
      unlocked: true,
      unlockedDate: '2024-02-01',
      progress: 128,
      maxProgress: 50,
    },
    {
      id: '4',
      title: 'Chat Enthusiast',
      description: 'Have 25 chat sessions with Luna',
      emoji: '💬',
      unlocked: true,
      unlockedDate: '2024-02-15',
      progress: 28,
      maxProgress: 25,
    },
    {
      id: '5',
      title: 'Mindful Month',
      description: 'Maintain a 30-day streak',
      emoji: '🔥',
      unlocked: false,
      progress: 7,
      maxProgress: 30,
    },
    {
      id: '6',
      title: 'Emotion Explorer',
      description: 'Log 100 different emotions',
      emoji: '🎭',
      unlocked: false,
      progress: 123,
      maxProgress: 100,
    },
  ];

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required');
        return;
      }

      // Prepare user update data
      const updateData = {
        bio: tempProfile.bio,
        timezone: tempProfile.timezone,
        preferences: tempProfile.preferences,
      };

      // Update user profile on backend
      const response = await fetch(API_ENDPOINTS.authProfile, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update local context and state
        if (updateUser) {
          updateUser(updatedUser);
        }
        setProfile(tempProfile);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const getDaysActive = () => {
    const joinDate = new Date(profile.joinDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', emoji: '👤' },
    { id: 'preferences', label: 'Preferences', emoji: '⚙️' },
    { id: 'stats', label: 'Statistics', emoji: '📊' },
    { id: 'achievements', label: 'Achievements', emoji: '🏆' },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-calm-300 scrollbar-track-calm-100 hover:scrollbar-thumb-calm-400">
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl text-white">👤</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                <span className="text-xs">✨</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-calm-900 mb-2">{profile.name}</h1>
              <p className="text-calm-600 mb-2">{profile.email}</p>
              <p className="text-calm-700 leading-relaxed">{profile.bio}</p>
              
              <div className="flex items-center mt-4 text-sm text-calm-500">
                <span>🗓️ Member since {new Date(profile.joinDate).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>🔥 {profile.stats.streakDays} day streak</span>
                <span className="mx-2">•</span>
                <span>⏰ {getDaysActive()} days active</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors font-semibold"
            >
              {isEditing ? '✅ Save' : '✏️ Edit Profile'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-calm-200 overflow-hidden">
          <div className="flex border-b border-calm-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-calm-600 hover:text-calm-900 hover:bg-calm-50'
                }`}
              >
                <span className="mr-2">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-calm-900 mb-6">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-calm-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={isEditing ? tempProfile.name : profile.name}
                      onChange={(e) => isEditing && setTempProfile({...tempProfile, name: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-calm-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-calm-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={isEditing ? tempProfile.email : profile.email}
                      onChange={(e) => isEditing && setTempProfile({...tempProfile, email: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-calm-50"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-calm-700 mb-2">Bio</label>
                    <textarea
                      value={isEditing ? tempProfile.bio : profile.bio}
                      onChange={(e) => isEditing && setTempProfile({...tempProfile, bio: e.target.value})}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-calm-50 resize-none"
                      placeholder="Tell us a bit about yourself..."
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors font-semibold"
                    >
                      💾 Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-calm-900 mb-6">Preferences</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-calm-700 mb-2">Theme</label>
                      <select className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="light">🌞 Light</option>
                        <option value="dark">🌙 Dark</option>
                        <option value="auto">🔄 Auto</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-calm-700 mb-2">Daily Reminder</label>
                      <input
                        type="time"
                        value={profile.preferences.reminderTime}
                        className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-calm-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-calm-900">Push Notifications</div>
                        <div className="text-sm text-calm-600">Receive daily check-in reminders</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={profile.preferences.notifications} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-calm-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-calm-900">Private Mode</div>
                        <div className="text-sm text-calm-600">Hide your activity from analytics</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={profile.preferences.privateMode} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-calm-900 mb-6">Your Statistics</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">{profile.stats.journalEntries}</div>
                    <div className="text-blue-600 font-medium">Journal Entries</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">😊</div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">{profile.stats.emotionLogs}</div>
                    <div className="text-purple-600 font-medium">Emotion Logs</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <div className="text-3xl font-bold text-green-600 mb-1">{profile.stats.chatSessions}</div>
                    <div className="text-green-600 font-medium">Chat Sessions</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">🔥</div>
                    <div className="text-3xl font-bold text-orange-600 mb-1">{profile.stats.streakDays}</div>
                    <div className="text-orange-600 font-medium">Day Streak</div>
                  </div>
                </div>

                <div className="bg-calm-50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-calm-900 mb-4">Weekly Activity</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xs text-calm-600 mb-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                        </div>
                        <div className={`w-8 h-8 rounded-lg mx-auto ${
                          Math.random() > 0.3 ? 'bg-primary-500' : 'bg-calm-200'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-calm-900 mb-6">Achievements & Milestones</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg'
                          : 'bg-calm-50 border-calm-200'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`text-4xl ${achievement.unlocked ? 'scale-110' : 'grayscale opacity-50'}`}>
                          {achievement.emoji}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-2 ${
                            achievement.unlocked ? 'text-yellow-700' : 'text-calm-600'
                          }`}>
                            {achievement.title}
                          </h3>
                          <p className={`text-sm mb-3 ${
                            achievement.unlocked ? 'text-yellow-600' : 'text-calm-500'
                          }`}>
                            {achievement.description}
                          </p>
                          
                          {achievement.progress !== undefined && achievement.maxProgress && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-calm-600 mb-1">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.maxProgress}</span>
                              </div>
                              <div className="w-full bg-calm-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    achievement.unlocked ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-calm-400'
                                  }`}
                                  style={{ width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {achievement.unlocked && achievement.unlockedDate && (
                            <div className="text-xs text-yellow-600">
                              🎉 Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
