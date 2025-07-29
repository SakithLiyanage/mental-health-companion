import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { GoalProvider } from './contexts/GoalContext.jsx';
import Navbar from './components/Layout/Navbar.jsx';
import Sidebar from './components/Layout/Sidebar.jsx';
import Auth from './components/Auth/Auth.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import Chat from './components/Chat/Chat.jsx';
import Journal from './components/Journal/Journal.jsx';
import EmotionTracker from './components/Emotions/EmotionTracker.jsx';
import Profile from './components/Profile/Profile.jsx';
import BreathingExercise from './components/Breathing/BreathingExercise.jsx';
import GuidedMeditation from './components/Meditation/GuidedMeditation.jsx';
import GratitudeLog from './components/Gratitude/GratitudeLog.jsx';
import GoalSetting from './components/Goals/GoalSetting.jsx';
import GoalAnalytics from './components/Goals/GoalAnalytics.jsx';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-mist">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-mist p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/emotions" element={<EmotionTracker />} />
            <Route path="/breathing" element={<BreathingExercise />} />
            <Route path="/meditation" element={<GuidedMeditation />} />
            <Route path="/gratitude" element={<GratitudeLog />} />
            <Route path="/goals" element={<GoalSetting />} />
            <Route path="/goals/analytics" element={<GoalAnalytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GoalProvider>
          <Router>
            <div className="App">
              <AppContent />
            </div>
          </Router>
        </GoalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
