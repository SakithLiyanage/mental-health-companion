import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGoal } from '../../contexts/GoalContext.jsx';
import { API_ENDPOINTS } from '../../config/api.js';

const Journal = () => {
  const { user } = useAuth();
  const { markJournalCompleted } = useGoal();
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriting, setIsWriting] = useState(true);
  const [startTime, setStartTime] = useState(new Date());
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // New filter states
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [moodFilter, setMoodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, mood, wordCount

  const moodOptions = [
    { emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-400' },
    { emoji: '😌', label: 'Peaceful', color: 'from-green-400 to-blue-400' },
    { emoji: '🤔', label: 'Thoughtful', color: 'from-purple-400 to-pink-400' },
    { emoji: '😢', label: 'Sad', color: 'from-blue-400 to-indigo-400' },
    { emoji: '😰', label: 'Anxious', color: 'from-red-400 to-pink-400' },
    { emoji: '😴', label: 'Tired', color: 'from-gray-400 to-gray-500' },
    { emoji: '\u{1F620}', label: 'Frustrated', color: 'from-red-500 to-red-600' },
    { emoji: '🥺', label: 'Vulnerable', color: 'from-pink-400 to-purple-400' },
  ];

  const commonTags = ['gratitude', 'work', 'relationships', 'health', 'goals', 'reflection', 'anxiety', 'happiness'];

  // Update word count
  useEffect(() => {
    const words = currentEntry.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [currentEntry]);

  // Load journal entries from database
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Loading entries - token exists:', !!token);
        
        if (!token) {
          console.log('No token found, loading sample entries');
          loadSampleEntries();
          return;
        }

        // Test the API first
        try {
          const testResponse = await fetch(API_ENDPOINTS.journalTest, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log('API test successful:', testResult);
          } else {
            console.log('API test failed:', testResponse.status);
        }
        } catch (testError) {
          console.log('API test error:', testError);
        }

        const response = await fetch(API_ENDPOINTS.journal, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          // Convert backend enum mood values back to emojis for display
          const enumToMood = {
            'very-happy': '😊',
            'happy': '😊',
            'peaceful': '😌',
            'neutral': '🤔',
            'sad': '😢',
            'anxious': '😰',
            'angry': '😡',
            'very-sad': '😢',
            'excited': '😊',
            'grateful': '😌',
            'thoughtful': '🤔',
            'frustrated': '\u{1F620}',
            'tired': '😴',
            'vulnerable': '🥺'
          };
          
          const formattedEntries = result.entries ? result.entries.map(entry => ({
            id: entry._id,
            date: new Date(entry.createdAt).toISOString().split('T')[0],
            createdAt: entry.createdAt, // Keep full timestamp for time display
            title: entry.title,
            content: entry.content,
            mood: enumToMood[entry.mood] || '🤔', // Convert back to emoji
            tags: entry.tags || [],
            wordCount: entry.content.trim().split(/\s+/).filter(word => word.length > 0).length,
            timeSpent: Math.max(1, Math.floor(entry.content.length / 50)) // Estimate based on content length
          })) : [];
          
          setEntries(formattedEntries);
          console.log('Loaded entries from database:', formattedEntries.length);
        } else {
          const errorText = await response.text();
          console.error('Failed to load journal entries, status:', response.status, 'error:', errorText);
          loadSampleEntries();
        }
      } catch (error) {
        console.error('Error loading journal entries:', error);
        console.log('Backend might not be running, loading sample entries');
        loadSampleEntries();
      }
    };

    const loadSampleEntries = () => {
      const sampleEntries = [
        {
          id: '1',
          date: new Date().toISOString().split('T')[0],
          title: 'Welcome to Your Journal',
          content: 'This is a sample entry. Start writing your thoughts and they will be saved to the database when you log in and the backend is running.',
          mood: '😌',
          tags: ['welcome', 'sample'],
          wordCount: 27,
          timeSpent: 2,
        },
      ];
      setEntries(sampleEntries);
    };

    loadEntries();
  }, []);

  const handleSaveEntry = async () => {
    if (!currentEntry.trim()) return;

    console.log('=== SAVE ENTRY DEBUG ===');
    console.log('User:', user);
    console.log('Token exists:', !!localStorage.getItem('token'));
    console.log('Current entry length:', currentEntry.length);

    setIsSaving(true);
    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
    
    // Convert mood emoji to backend enum values
    const moodToEnum = {
      '😊': 'happy',
      '😌': 'peaceful', 
      '🤔': 'thoughtful',
      '😢': 'sad',
      '😰': 'anxious',
      '😴': 'tired',
      '\u{1F620}': 'frustrated',
      '🥺': 'vulnerable'
    };

    // Convert mood emoji to intensity for backend
    const moodToIntensity = {
      '😊': 8, '😌': 7, '🤔': 5, '😢': 3, 
      '😰': 4, '😴': 5, '\u{1F620}': 2, '🥺': 4
    };

    const newEntry = {
      title: entryTitle || `Entry from ${new Date().toLocaleDateString()}`,
      content: currentEntry,
      mood: moodToEnum[selectedMood] || 'neutral',
      moodIntensity: moodToIntensity[selectedMood] || 5,
      tags,
      activities: [],
      weather: 'sunny' // Default weather
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found - user needs to log in');
        alert('Please log in to save your journal entry. Saving locally for now.');
        
        // Save locally as fallback
        const localEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          title: newEntry.title,
          content: newEntry.content,
          mood: selectedMood, // Keep emoji for display
          tags: newEntry.tags,
          wordCount: currentEntry.trim().split(/\s+/).filter(word => word.length > 0).length,
          timeSpent
        };
        setEntries(prev => [localEntry, ...prev]);
        setCurrentEntry('');
        setEntryTitle('');
        setTags([]);
        setStartTime(new Date());
        setIsSaving(false);
        return;
      }

      console.log('Sending journal entry:', newEntry); // Debug log

      const response = await fetch(API_ENDPOINTS.journal, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEntry)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Journal entry saved successfully:', result);
        
        const savedEntry = {
          id: result.entry._id,
          date: new Date(result.entry.createdAt).toISOString().split('T')[0],
          title: result.entry.title,
          content: result.entry.content,
          mood: selectedMood, // Keep emoji for display
          tags: result.entry.tags,
          wordCount: currentEntry.trim().split(/\s+/).filter(word => word.length > 0).length,
          timeSpent
        };
        
        setEntries(prev => [savedEntry, ...prev]);
        setCurrentEntry('');
        setEntryTitle('');
        setTags([]);
        setStartTime(new Date());

        // Mark journal as completed for daily goal
        markJournalCompleted();

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Journal entry saved to database! ✅';
        document.body.appendChild(successDiv);
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        
        let errorMessage;
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || 'Unknown error';
          console.error('Parsed error:', error);
        } catch (e) {
          errorMessage = errorText || 'Unknown server error';
        }
        
        alert(`Failed to save journal entry: ${errorMessage}`);
        
        // Save locally as fallback
        const localEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          title: newEntry.title,
          content: newEntry.content,
          mood: selectedMood, // Keep emoji for display
          tags: newEntry.tags,
          wordCount: currentEntry.trim().split(/\s+/).filter(word => word.length > 0).length,
          timeSpent
        };
        setEntries(prev => [localEntry, ...prev]);
        setCurrentEntry('');
        setEntryTitle('');
        setTags([]);
        setStartTime(new Date());
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Failed to save journal entry. Please check your internet connection and try again.');
      
      // Save locally as fallback
      const localEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        title: newEntry.title,
        content: newEntry.content,
        mood: selectedMood, // Keep emoji for display
        tags: newEntry.tags,
        wordCount: currentEntry.trim().split(/\s+/).filter(word => word.length > 0).length,
        timeSpent
      };
      setEntries(prev => [localEntry, ...prev]);
      setCurrentEntry('');
      setEntryTitle('');
      setTags([]);
      setStartTime(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // Delete entry function
  const handleDeleteEntry = async (entryId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // For local entries, just remove from state
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        setShowDeleteConfirm(null);
        return;
      }

      const response = await fetch(API_ENDPOINTS.journalById(entryId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        console.log('Entry deleted successfully');
      } else {
        console.error('Failed to delete entry');
        alert('Failed to delete entry. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry. Please try again.');
    }
    setShowDeleteConfirm(null);
  };

  // Get filtered and sorted entries
  const getFilteredEntries = () => {
    let filtered = entries.filter(entry => {
      // Text search
      const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Date filter
      const entryDate = new Date(entry.date);
      const today = new Date();
      let matchesDate = true;

      switch (dateFilter) {
        case 'today':
          matchesDate = entryDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= monthAgo;
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            const startDate = new Date(customDateRange.start);
            const endDate = new Date(customDateRange.end);
            matchesDate = entryDate >= startDate && entryDate <= endDate;
          }
          break;
        default:
          matchesDate = true;
      }

      // Mood filter
      const matchesMood = moodFilter === 'all' || entry.mood === moodFilter;

      return matchesSearch && matchesDate && matchesMood;
    });

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'mood':
          return a.mood.localeCompare(b.mood);
        case 'wordCount':
          return b.wordCount - a.wordCount;
        default: // newest
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  };

  const filteredEntries = getFilteredEntries();

  const getTimeSpent = () => {
    const minutes = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
    return minutes;
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-calm-300 scrollbar-track-calm-100 hover:scrollbar-thumb-calm-400">
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📝</span>
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-calm-900">Daily Journal</h1>
                <p className="text-calm-600">Capture your thoughts, feelings, and daily reflections</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsWriting(!isWriting)}
                className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  isWriting 
                    ? 'bg-primary-500 text-white shadow-lg hover:bg-primary-600' 
                    : 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50'
                }`}
              >
                {isWriting ? '📖 View Entries' : '✍️ New Entry'}
              </button>
            </div>
          </div>
        </div>

        {isWriting ? (
          /* Writing Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 overflow-hidden">
                <div className="bg-gradient-to-r from-calm-50 to-primary-50 px-6 py-4 border-b border-calm-200">
                  <input
                    type="text"
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    placeholder="Give your entry a title..."
                    className="w-full text-xl font-semibold bg-transparent placeholder-calm-500 focus:outline-none text-calm-900"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm text-calm-600">
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <div className="flex items-center space-x-4">
                      <span>⏱️ {getTimeSpent()} min</span>
                      <span>📝 {wordCount} words</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <textarea
                    value={currentEntry}
                    onChange={(e) => setCurrentEntry(e.target.value)}
                    placeholder="What's on your mind today? How are you feeling? What happened that you'd like to remember or reflect on?"
                    className="w-full h-96 text-calm-900 placeholder-calm-400 bg-transparent resize-none focus:outline-none text-lg leading-relaxed"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-lg font-semibold text-calm-900 mb-4">Tags</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-primary-900 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-2 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => addTag(newTag)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="px-3 py-1 bg-calm-100 text-calm-700 rounded-full text-sm hover:bg-calm-200 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Mood Selector */}
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-lg font-semibold text-calm-900 mb-4">How are you feeling?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.emoji}
                      onClick={() => setSelectedMood(mood.emoji)}
                      className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
                        selectedMood === mood.emoji
                          ? `bg-gradient-to-br ${mood.color} text-white shadow-lg scale-105`
                          : 'bg-calm-50 hover:bg-calm-100 text-calm-700'
                      }`}
                    >
                      <span className="text-2xl mb-1">{mood.emoji}</span>
                      <span className="text-xs font-medium">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Writing Stats */}
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
                <h3 className="text-lg font-semibold text-calm-900 mb-4">Today's Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-calm-600">Words written</span>
                    <span className="font-semibold text-calm-900">{wordCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-calm-600">Time writing</span>
                    <span className="font-semibold text-calm-900">{getTimeSpent()} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-calm-600">Current streak</span>
                    <span className="font-semibold text-calm-900">7 days 🔥</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveEntry}
                disabled={!currentEntry.trim() || isSaving}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Entry'
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Entries List */
          <div className="space-y-6">
            
            {/* Enhanced Filters and Search */}
            <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-6">
              <div className="space-y-6">
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your entries by content, title, or tags..."
                    className="w-full px-4 py-3 pl-12 pr-4 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-calm-50 transition-all duration-200"
                  />
                  <svg className="absolute left-4 top-3.5 w-5 h-5 text-calm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3.5 text-calm-400 hover:text-calm-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-calm-700 mb-2">📅 Date Range</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-calm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* Mood Filter */}
                  <div>
                    <label className="block text-sm font-medium text-calm-700 mb-2">😊 Mood</label>
                    <select
                      value={moodFilter}
                      onChange={(e) => setMoodFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-calm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="all">All Moods</option>
                      {moodOptions.map(mood => (
                        <option key={mood.emoji} value={mood.emoji}>
                          {mood.emoji} {mood.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-calm-700 mb-2">🔄 Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-calm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="mood">By Mood</option>
                      <option value="wordCount">By Word Count</option>
                    </select>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end">
                    <div className="bg-primary-50 px-4 py-2 rounded-lg border border-primary-200">
                      <p className="text-primary-700 font-medium">
                        {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-calm-50 rounded-lg border border-calm-200">
                    <div>
                      <label className="block text-sm font-medium text-calm-700 mb-1">From</label>
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 border border-calm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-calm-700 mb-1">To</label>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border border-calm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}

                {/* Quick Filter Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-calm-700">Quick filters:</span>
                  {['gratitude', 'work', 'relationships', 'health'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm hover:bg-primary-200 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setDateFilter('all');
                      setMoodFilter('all');
                      setSortBy('newest');
                      setCustomDateRange({ start: '', end: '' });
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Entries Grid */}
            {filteredEntries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-calm-200 p-12 text-center">
                <div className="w-24 h-24 bg-calm-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-xl font-semibold text-calm-900 mb-2">No entries found</h3>
                <p className="text-calm-600 mb-6">
                  {searchQuery || dateFilter !== 'all' || moodFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start writing your first journal entry to capture your thoughts and feelings'
                  }
                </p>
                {!searchQuery && dateFilter === 'all' && moodFilter === 'all' && (
                  <button
                    onClick={() => setIsWriting(true)}
                    className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    ✍️ Write First Entry
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-2xl shadow-xl border border-calm-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className="text-4xl">{entry.mood}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-calm-900 mb-1">{entry.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-calm-600">
                              <span className="flex items-center">
                                📅 {new Date(entry.createdAt || entry.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="flex items-center">
                                🕒 {new Date(entry.createdAt || entry.date).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              <span>📝 {entry.wordCount} words</span>
                              <span>⏱️ {entry.timeSpent} min</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
                            className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Toggle full view"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(entry.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete entry"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Entry Content */}
                      <div className={`text-calm-700 leading-relaxed mb-4 ${
                        selectedEntry === entry.id ? '' : 'line-clamp-3'
                      }`}>
                        {entry.content}
                      </div>
                      
                      {/* Tags and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium cursor-pointer hover:bg-primary-200 transition-colors"
                              onClick={() => setSearchQuery(tag)}
                              title={`Filter by ${tag}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {selectedEntry !== entry.id && entry.content.length > 200 && (
                          <button 
                            onClick={() => setSelectedEntry(entry.id)}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
                          >
                            Read more 
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-calm-900 mb-2">Delete Entry</h3>
                    <p className="text-calm-600 mb-6">
                      Are you sure you want to delete this journal entry? This action cannot be undone.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 px-4 py-3 bg-calm-100 text-calm-700 rounded-xl hover:bg-calm-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(showDeleteConfirm)}
                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
