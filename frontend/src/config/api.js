// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mental-health-companion-nine.vercel.app';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  auth: `${API_BASE_URL}/api/auth`,
  authProfile: `${API_BASE_URL}/api/auth/profile`,
  
  // Chat
  chat: `${API_BASE_URL}/api/chat`,
  chatHistory: `${API_BASE_URL}/api/chat/history`,
  
  // Goals
  goals: `${API_BASE_URL}/api/goals`,
  goalsAnalytics: `${API_BASE_URL}/api/goals/analytics`,
  goalsDailyProgress: `${API_BASE_URL}/api/goals/update-daily-progress`,
  goalsLog: (goalId) => `${API_BASE_URL}/api/goals/${goalId}/log`,
  goalsCheckin: (goalId) => `${API_BASE_URL}/api/goals/${goalId}/checkin`,
  goalsById: (goalId) => `${API_BASE_URL}/api/goals/${goalId}`,
  
  // Journal
  journal: `${API_BASE_URL}/api/journal`,
  journalStats: `${API_BASE_URL}/api/journal/stats/overview`,
  journalTest: `${API_BASE_URL}/api/journal/test`,
  journalById: (entryId) => `${API_BASE_URL}/api/journal/${entryId}`,
  
  // Emotions
  emotions: `${API_BASE_URL}/api/emotions`,
  emotionsById: (entryId) => `${API_BASE_URL}/api/emotions/${entryId}`,
  
  // Dashboard
  dashboardStats: `${API_BASE_URL}/api/dashboard/stats`,
  dashboardActivities: `${API_BASE_URL}/api/dashboard/activities`,
  journalTest: `${API_BASE_URL}/api/journal/test`,
  
  // Emotions
  emotions: `${API_BASE_URL}/api/emotions`,
  
  // Dashboard
  dashboardStats: `${API_BASE_URL}/api/dashboard/stats`,
  dashboardActivities: `${API_BASE_URL}/api/dashboard/activities`,
};

export default API_BASE_URL;
