import React, { useState, useEffect } from 'react';
import { useGoal } from '../../contexts/GoalContext.jsx';

const EmotionTracker = () => {
  const { markEmotionCompleted } = useGoal();
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [note, setNote] = useState('');
  const [viewMode, setViewMode] = useState('track');
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

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

  const commonTriggers = [
    'Work stress', 'Relationships', 'Health concerns', 'Financial worries',
    'Social situations', 'Family issues', 'Personal goals', 'Weather',
    'Sleep quality', 'Exercise', 'News/media', 'Other'
  ];

  const loadSampleData = React.useCallback(() => {
    const sampleEntries = [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        emotion: '😊',
        intensity: 7,
        trigger: 'Good morning routine',
        note: 'Started the day with meditation',
        category: 'positive'
      },
      {
        id: '2',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '14:30',
        emotion: '😰',
        intensity: 6,
        trigger: 'Work deadline',
        note: 'Feeling pressure about upcoming presentation',
        category: 'negative'
      },
    ];
    setEntries(sampleEntries);
  }, []);

  const loadEmotionEntries = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load emotion data from dedicated emotion API
      const response = await fetch('https://mental-health-companion-wine.vercel.app/api/emotions?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend data to match our format
        const transformedEntries = data.emotions.map((item, index) => ({
          id: item._id,
          date: new Date(item.date).toISOString().split('T')[0],
          time: new Date(item.createdAt || item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emotion: item.emotion || '😊',
          intensity: item.intensity || 5,
          trigger: item.trigger || '',
          note: item.note || '',
          category: item.category || 'neutral'
        }));
        setEntries(transformedEntries);
      } else {
        // Fallback to sample data if API fails
        loadSampleData();
      }
    } catch (error) {
      console.error('Failed to load emotion entries:', error);
      // Fallback to sample data
      loadSampleData();
    }
  }, [loadSampleData]);

  // Load emotion data from backend
  useEffect(() => {
    loadEmotionEntries();
  }, [loadEmotionEntries]);

  const handleLogEmotion = async () => {
    if (!selectedEmotion) return;

    const newEntry = {
      emotion: selectedEmotion.emoji,
      emotionName: selectedEmotion.name,
      intensity,
      category: selectedEmotion.category,
      trigger: trigger || undefined,
      note: note || undefined,
      tags: [selectedEmotion.category, 'manual-log']
    };

    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Save to dedicated emotion API
        const response = await fetch('https://mental-health-companion-wine.vercel.app/api/emotions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newEntry)
        });

        if (response.ok) {
          const savedEmotion = await response.json();
          console.log('Emotion logged successfully');
          
          // Add to local state
          const displayEntry = {
            id: savedEmotion._id,
            date: new Date(savedEmotion.date).toISOString().split('T')[0],
            time: new Date(savedEmotion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            emotion: savedEmotion.emotion,
            intensity: savedEmotion.intensity,
            trigger: savedEmotion.trigger || '',
            note: savedEmotion.note || '',
            category: savedEmotion.category
          };
          
          setEntries(prev => [displayEntry, ...prev]);
          
          // Mark emotion tracking as completed for daily goal
          markEmotionCompleted();
        } else {
          const error = await response.json();
          alert(`Failed to log emotion: ${error.message}`);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to save emotion log:', error);
      alert('Failed to save emotion. Please try again.');
      return;
    }
    
    // Reset form
    setSelectedEmotion(null);
    setIntensity(5);
    setTrigger('');
    setNote('');
  };

  const quickLogEmotion = async (emotion) => {
    console.log('Quick logging emotion:', emotion);
    
    const newEntry = {
      emotion: emotion.emoji,
      emotionName: emotion.name,
      intensity: 5,
      category: emotion.category,
      tags: [emotion.category, 'quick-log']
    };

    console.log('Emotion entry data:', newEntry);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        alert('Please log in to track emotions');
        return;
      }
      
      // Save to dedicated emotion API
      const response = await fetch('https://mental-health-companion-wine.vercel.app/api/emotions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEntry)
      });

      if (response.ok) {
        const savedEmotion = await response.json();
        console.log('Quick emotion logged successfully:', savedEmotion);
        
        // Add to local state
        const displayEntry = {
          id: savedEmotion._id,
          date: new Date(savedEmotion.date || savedEmotion.createdAt).toISOString().split('T')[0],
          time: new Date(savedEmotion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emotion: savedEmotion.emotion,
          intensity: savedEmotion.intensity,
          trigger: savedEmotion.trigger || '',
          note: savedEmotion.note || '',
          category: savedEmotion.category
        };
        
        setEntries(prev => [displayEntry, ...prev]);
        
        // Show success feedback
        alert(`${emotion.name} emotion logged successfully!`);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`Failed to log emotion: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to save quick emotion log:', error);
      alert('Failed to log emotion. Please try again.');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setSelectedEmotion(emotionTypes.find(e => e.emoji === entry.emotion) || emotionTypes[0]);
    setIntensity(entry.intensity);
    setTrigger(entry.trigger || '');
    setNote(entry.note || '');
    setViewMode('track'); // Switch to track view to show the editing form
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !selectedEmotion) return;

    const updateData = {
      emotion: selectedEmotion.emoji,
      emotionName: selectedEmotion.name,
      intensity,
      category: selectedEmotion.category,
      trigger: trigger || undefined,
      note: note || undefined
    };

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`https://mental-health-companion-wine.vercel.app/api/emotions/${editingEntry.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          const updatedEmotion = await response.json();
          
          // Update local state
          const updatedEntry = {
            id: updatedEmotion._id,
            date: new Date(updatedEmotion.date).toISOString().split('T')[0],
            time: new Date(updatedEmotion.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            emotion: updatedEmotion.emotion,
            intensity: updatedEmotion.intensity,
            trigger: updatedEmotion.trigger || '',
            note: updatedEmotion.note || '',
            category: updatedEmotion.category
          };
          
          setEntries(prev => prev.map(entry => 
            entry.id === editingEntry.id ? updatedEntry : entry
          ));
          
          // Reset form
          setEditingEntry(null);
          setSelectedEmotion(null);
          setIntensity(5);
          setTrigger('');
          setNote('');
        } else {
          const error = await response.json();
          alert(`Failed to update emotion: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to update emotion:', error);
      alert('Failed to update emotion. Please try again.');
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this emotion entry?')) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`https://mental-health-companion-wine.vercel.app/api/emotions/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setEntries(prev => prev.filter(entry => entry.id !== entryId));
        } else {
          const error = await response.json();
          alert(`Failed to delete emotion: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to delete emotion:', error);
      alert('Failed to delete emotion. Please try again.');
    }
  };

  const getWeeklyMoodData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayEntries = entries.filter(entry => entry.date === date);
      const avgIntensity = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.intensity, 0) / dayEntries.length 
        : 0;
      
      const emotionCounts = dayEntries.reduce((acc, entry) => {
        acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
        return acc;
      }, {});
      
      const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b, '😐');

      return {
        date,
        averageIntensity: Math.round(avgIntensity * 10) / 10,
        dominantEmotion: dayEntries.length > 0 ? dominantEmotion : '😐',
        entryCount: dayEntries.length,
      };
    });
  };

  const getTodaysEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(entry => entry.date === today);
    console.log('Today\'s date:', today);
    console.log('All entries:', entries);
    console.log('Today\'s entries:', todayEntries);
    return todayEntries;
  };

  const getEmotionStats = () => {
    const total = entries.length;
    const positive = entries.filter(e => e.category === 'positive').length;
    const negative = entries.filter(e => e.category === 'negative').length;
    const neutral = entries.filter(e => e.category === 'neutral').length;

    return {
      total,
      positive: total > 0 ? Math.round((positive / total) * 100) : 0,
      negative: total > 0 ? Math.round((negative / total) * 100) : 0,
      neutral: total > 0 ? Math.round((neutral / total) * 100) : 0,
    };
  };

  const weeklyData = getWeeklyMoodData();
  const todaysEntries = getTodaysEntries();
  const stats = getEmotionStats();

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-calm-300 scrollbar-track-calm-100 hover:scrollbar-thumb-calm-400">
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-calm-900">Emotion Tracker</h1>
                <p className="text-calm-600">Track and understand your emotional patterns</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('track')}
                className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  viewMode === 'track' 
                    ? 'bg-primary-500 text-white shadow-lg' 
                    : 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50'
                }`}
              >
                📝 Track
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  viewMode === 'history' 
                    ? 'bg-primary-500 text-white shadow-lg' 
                    : 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50'
                }`}
              >
                📋 History
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  viewMode === 'analytics' 
                    ? 'bg-primary-500 text-white shadow-lg' 
                    : 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50'
                }`}
              >
                📈 Analytics
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'track' ? (
          /* Tracking Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Mood Check */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h2 className="text-2xl font-semibold text-calm-900 mb-6">How are you feeling right now?</h2>
                
                <div className="grid grid-cols-5 gap-4 mb-6">
                  {emotionTypes.map((emotion) => (
                    <button
                      key={emotion.emoji}
                      onClick={() => setSelectedEmotion(emotion)}
                      className={`p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${
                        selectedEmotion?.emoji === emotion.emoji
                          ? `${emotion.bgColor} ring-2 ring-primary-500 scale-110 shadow-lg`
                          : 'bg-calm-50 hover:bg-calm-100'
                      }`}
                    >
                      <div className="text-3xl mb-2">{emotion.emoji}</div>
                      <div className={`text-xs font-medium ${emotion.color}`}>{emotion.name}</div>
                    </button>
                  ))}
                </div>

                {selectedEmotion && (
                  <div className="space-y-6 border-t border-calm-200 pt-6">
                    
                    {/* Intensity Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-lg font-semibold text-calm-900">Intensity</label>
                        <span className="text-2xl font-bold text-primary-600">{intensity}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full h-3 bg-calm-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-calm-500 mt-1">
                        <span>Very Low</span>
                        <span>Moderate</span>
                        <span>Very High</span>
                      </div>
                    </div>

                    {/* Trigger */}
                    <div>
                      <label className="block text-lg font-semibold text-calm-900 mb-3">What triggered this feeling?</label>
                      <select
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                      >
                        <option value="">Select a trigger (optional)</option>
                        {commonTriggers.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-lg font-semibold text-calm-900 mb-3">Additional notes</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Any additional thoughts or context..."
                        className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={editingEntry ? handleSaveEdit : handleLogEmotion}
                      className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:shadow-lg"
                    >
                      {editingEntry ? '✏️ Update Emotion' : '💾 Log Emotion'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Log */}
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-lg font-semibold text-calm-900 mb-4">Quick Log</h3>
                <p className="text-sm text-calm-600 mb-4">Tap to quickly log an emotion</p>
                <div className="grid grid-cols-2 gap-3">
                  {emotionTypes.slice(0, 6).map((emotion) => (
                    <button
                      key={emotion.emoji}
                      onClick={() => quickLogEmotion(emotion)}
                      className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${emotion.bgColor} hover:shadow-lg`}
                    >
                      <div className="text-2xl mb-1">{emotion.emoji}</div>
                      <div className={`text-xs font-medium ${emotion.color}`}>{emotion.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Today's Summary */}
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-lg font-semibold text-calm-900 mb-4">Today's Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-calm-600">Entries logged</span>
                    <span className="font-semibold text-calm-900">{todaysEntries.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-calm-600">Current streak</span>
                    <span className="font-semibold text-calm-900">5 days 🔥</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-calm-600">Most frequent</span>
                    <span className="text-xl">{todaysEntries.length > 0 ? todaysEntries[0].emotion : '😐'}</span>
                  </div>
                </div>
              </div>

              {/* Recent Entries */}
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-lg font-semibold text-calm-900 mb-4">Recent Entries</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {entries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-calm-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{entry.emotion}</span>
                        <div>
                          <div className="text-sm font-medium text-calm-900">{entry.time}</div>
                          {entry.trigger && (
                            <div className="text-xs text-calm-600">{entry.trigger}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-calm-900">{entry.intensity}/10</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'history' ? (
          /* History Table Interface */
          <div className="space-y-6">
            
            {/* Table Controls */}
            <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-semibold text-calm-900">Emotion History</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="px-4 py-2 border border-calm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="quarter">Past 3 Months</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emotions Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-calm-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary-50 to-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-calm-900">Date & Time</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-calm-900">Emotion</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-calm-900">Intensity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-calm-900">Trigger</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-calm-900">Note</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-calm-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-calm-100">
                    {entries.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-calm-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="text-sm text-calm-900 font-medium">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-calm-600">{entry.time}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{entry.emotion}</span>
                            <div>
                              <div className="text-sm font-medium text-calm-900">
                                {emotionTypes.find(e => e.emoji === entry.emotion)?.name || 'Unknown'}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                entry.category === 'positive' ? 'bg-green-100 text-green-700' :
                                entry.category === 'negative' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {entry.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  entry.intensity <= 3 ? 'bg-red-500' :
                                  entry.intensity <= 6 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${(entry.intensity / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-calm-900">{entry.intensity}/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-calm-700">
                            {entry.trigger || <span className="text-calm-400 italic">No trigger</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-calm-700 max-w-xs">
                            {entry.note ? (
                              <span className="line-clamp-2">{entry.note}</span>
                            ) : (
                              <span className="text-calm-400 italic">No note</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-primary-600 hover:text-primary-700 p-1 rounded"
                              title="Edit entry"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-700 p-1 rounded"
                              title="Delete entry"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {entries.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-calm-900 mb-2">No emotions logged yet</h3>
                  <p className="text-calm-600 mb-4">Start tracking your emotions to see your history here.</p>
                  <button
                    onClick={() => setViewMode('track')}
                    className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    Start Tracking
                  </button>
                </div>
              )}
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">{entries.length}</div>
                <div className="text-calm-600">Total Entries</div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {entries.length > 0 ? Math.round((entries.filter(e => e.category === 'positive').length / entries.length) * 100) : 0}%
                </div>
                <div className="text-calm-600">Positive Emotions</div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {entries.length > 0 ? (entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length).toFixed(1) : 0}
                </div>
                <div className="text-calm-600">Average Intensity</div>
              </div>
            </div>
          </div>
        ) : (
          /* Analytics Interface */
          <div className="space-y-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">{stats.total}</div>
                <div className="text-calm-600">Total Entries</div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.positive}%</div>
                <div className="text-calm-600">Positive Emotions</div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{stats.negative}%</div>
                <div className="text-calm-600">Negative Emotions</div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6 text-center">
                <div className="text-3xl font-bold text-gray-600 mb-2">{stats.neutral}%</div>
                <div className="text-calm-600">Neutral Emotions</div>
              </div>
            </div>

            {/* Weekly Mood Chart */}
            <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
              <h3 className="text-2xl font-semibold text-calm-900 mb-6">Weekly Mood Overview</h3>
              <div className="grid grid-cols-7 gap-4">
                {weeklyData.map((day, index) => (
                  <div key={day.date} className="text-center">
                    <div className="text-sm font-medium text-calm-600 mb-2">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="bg-calm-50 rounded-2xl p-4 hover:bg-calm-100 transition-colors">
                      <div className="text-3xl mb-2">{day.dominantEmotion}</div>
                      <div className="text-xs text-calm-600">
                        {day.entryCount} {day.entryCount === 1 ? 'entry' : 'entries'}
                      </div>
                      {day.averageIntensity > 0 && (
                        <div className="text-xs font-medium text-primary-600 mt-1">
                          Avg: {day.averageIntensity}/10
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion Pattern Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-xl font-semibold text-calm-900 mb-4">Most Common Emotions</h3>
                <div className="space-y-3">
                  {Object.entries(
                    entries.reduce((acc, entry) => {
                      acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
                      return acc;
                    }, {})
                  )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([emotion, count]) => (
                    <div key={emotion} className="flex items-center justify-between p-3 bg-calm-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{emotion}</span>
                        <span className="font-medium text-calm-900">
                          {emotionTypes.find(e => e.emoji === emotion)?.name || 'Unknown'}
                        </span>
                      </div>
                      <span className="font-semibold text-primary-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-xl font-semibold text-calm-900 mb-4">Common Triggers</h3>
                <div className="space-y-3">
                  {Object.entries(
                    entries
                      .filter(entry => entry.trigger)
                      .reduce((acc, entry) => {
                        if (entry.trigger) {
                          acc[entry.trigger] = (acc[entry.trigger] || 0) + 1;
                        }
                        return acc;
                      }, {})
                  )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([trigger, count]) => (
                    <div key={trigger} className="flex items-center justify-between p-3 bg-calm-50 rounded-xl">
                      <span className="font-medium text-calm-900">{trigger}</span>
                      <span className="font-semibold text-primary-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionTracker;
