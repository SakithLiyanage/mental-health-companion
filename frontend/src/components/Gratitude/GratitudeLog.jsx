import React, { useState, useEffect } from 'react';

const GratitudeLog = () => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [filter, setFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    // Load entries from local storage or sample data
    const savedEntries = JSON.parse(localStorage.getItem('gratitudeEntries')) || [];
    setEntries(savedEntries);
  }, []);

  useEffect(() => {
    localStorage.setItem('gratitudeEntries', JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      const entryToAdd = {
        id: Date.now(),
        text: newEntry.trim(),
        date: new Date().toISOString().split('T')[0],
      };
      setEntries(prev => [entryToAdd, ...prev]);
      setNewEntry('');
    }
  };

  const handleDeleteEntry = (id) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const getFilteredEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    return entries.filter(entry => {
      switch (filter) {
        case 'today':
          return entry.date === today;
        case 'week':
          const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
          return entry.date >= sevenDaysAgo;
        case 'month':
          const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
          return entry.date >= thirtyDaysAgo;
        default:
          return true;
      }
    });
  };

  const filteredEntries = getFilteredEntries();

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-calm-200">
          <h1 className="text-4xl font-display font-bold text-calm-900 mb-4">Gratitude Log 🙏</h1>
          <p className="text-lg text-calm-600">
            Cultivate a positive mindset by listing things you're grateful for.
          </p>
        </div>

        {/* Add New Entry */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-calm-100">
          <h2 className="text-2xl font-semibold text-calm-900 mb-4">What are you grateful for today?</h2>
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="I'm grateful for..."
            className="w-full px-4 py-3 border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
            rows={3}
          />
          <button
            onClick={handleAddEntry}
            className="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-lg hover:from-primary-600 hover:to-purple-700 transition-colors shadow-lg"
          >
            Add to Log
          </button>
        </div>

        {/* Entry List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-calm-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-calm-900">Your Gratitude Entries</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-calm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-calm-600">
              No entries found for this period. Start adding what you're grateful for!
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="flex items-start bg-calm-50 rounded-xl p-4 shadow-sm border border-calm-100">
                  <div className="flex-1">
                    <p className="text-calm-800 text-base leading-relaxed mb-2">{entry.text}</p>
                    <span className="text-xs text-calm-500">
                      {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors"
                    title="Delete entry"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GratitudeLog;
