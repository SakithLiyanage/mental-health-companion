// API Configuration
// CRITICAL: Force the correct backend URL - completely ignore any environment variables
// The frontend deployment might have REACT_APP_API_URL set to the wrong backend
const FORCED_BACKEND_URL = 'https://mental-health-companion-nine.vercel.app';
export const API_BASE_URL = FORCED_BACKEND_URL;

console.log('=== API CONFIGURATION DEBUG ===');
console.log('process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('FORCED_BACKEND_URL:', FORCED_BACKEND_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('Timestamp:', new Date().toISOString());
console.log('===============================');

// API endpoints - use forced URL to ensure no environment variable interference
export const API_ENDPOINTS = {
  // Auth
  auth: `${FORCED_BACKEND_URL}/api/auth`,
  authProfile: `${FORCED_BACKEND_URL}/api/auth/profile`,
  
  // Chat
  chat: `${FORCED_BACKEND_URL}/api/chat`,
  chatHistory: `${FORCED_BACKEND_URL}/api/chat/history`,
  
  // Goals
  goals: `${FORCED_BACKEND_URL}/api/goals`,
  goalsAnalytics: `${FORCED_BACKEND_URL}/api/goals/analytics`,
  goalsDailyProgress: `${FORCED_BACKEND_URL}/api/goals/update-daily-progress`,
  goalsLog: (goalId) => `${FORCED_BACKEND_URL}/api/goals/${goalId}/log`,
  goalsCheckin: (goalId) => `${FORCED_BACKEND_URL}/api/goals/${goalId}/checkin`,
  goalsById: (goalId) => `${FORCED_BACKEND_URL}/api/goals/${goalId}`,
  
  // Journal
  journal: `${FORCED_BACKEND_URL}/api/journal`,
  journalStats: `${FORCED_BACKEND_URL}/api/journal/stats/overview`,
  journalTest: `${FORCED_BACKEND_URL}/api/journal/test`,
  journalById: (entryId) => `${FORCED_BACKEND_URL}/api/journal/${entryId}`,
  
  // Emotions
  emotions: `${FORCED_BACKEND_URL}/api/emotions`,
  // Emotions
  emotions: `${FORCED_BACKEND_URL}/api/emotions`,
  emotionsById: (entryId) => `${FORCED_BACKEND_URL}/api/emotions/${entryId}`,
  
  // Dashboard
  dashboardStats: `${FORCED_BACKEND_URL}/api/dashboard/stats`,
  dashboardActivities: `${FORCED_BACKEND_URL}/api/dashboard/activities`,
};

export default API_BASE_URL;
