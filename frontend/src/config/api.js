// API Configuration
// CRITICAL: Force the correct backend URL - completely ignore any environment variables
// The frontend deployment might have REACT_APP_API_URL set to the wrong backend
const FORCED_BACKEND_URL = 'https://mental-health-companion-backend-eight.vercel.app';
export const API_BASE_URL = FORCED_BACKEND_URL + '/api';

// Helper function to ensure no double slashes
const cleanUrl = (baseUrl, endpoint) => {
  const cleanBase = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
  return `${cleanBase}/${cleanEndpoint}`;
};

console.log('=== API CONFIGURATION DEBUG ===');
console.log('process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('FORCED_BACKEND_URL:', FORCED_BACKEND_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('Timestamp:', new Date().toISOString());
console.log('===============================');

// API endpoints - use clean URLs to prevent double slashes
export const API_ENDPOINTS = {
  // Auth
  auth: cleanUrl(FORCED_BACKEND_URL, 'api/auth'),
  authProfile: cleanUrl(FORCED_BACKEND_URL, 'api/auth/profile'),
  
  // Chat
  chat: cleanUrl(FORCED_BACKEND_URL, 'api/chat'),
  chatHistory: cleanUrl(FORCED_BACKEND_URL, 'api/chat/history'),
  
  // Goals
  goals: cleanUrl(FORCED_BACKEND_URL, 'api/goals'),
  goalsAnalytics: cleanUrl(FORCED_BACKEND_URL, 'api/goals/analytics'),
  goalsDailyProgress: cleanUrl(FORCED_BACKEND_URL, 'api/goals/update-daily-progress'),
  goalsLog: (goalId) => cleanUrl(FORCED_BACKEND_URL, `api/goals/${goalId}/log`),
  goalsCheckin: (goalId) => cleanUrl(FORCED_BACKEND_URL, `api/goals/${goalId}/checkin`),
  goalsById: (goalId) => cleanUrl(FORCED_BACKEND_URL, `api/goals/${goalId}`),
  
  // Journal
  journal: cleanUrl(FORCED_BACKEND_URL, 'api/journal'),
  journalStats: cleanUrl(FORCED_BACKEND_URL, 'api/journal/stats/overview'),
  journalTest: cleanUrl(FORCED_BACKEND_URL, 'api/journal/test'),
  journalById: (entryId) => cleanUrl(FORCED_BACKEND_URL, `api/journal/${entryId}`),
  
  // Emotions
  emotions: cleanUrl(FORCED_BACKEND_URL, 'api/emotions'),
  emotionsById: (entryId) => cleanUrl(FORCED_BACKEND_URL, `api/emotions/${entryId}`),
  
  // Dashboard
  dashboardStats: cleanUrl(FORCED_BACKEND_URL, 'api/dashboard/stats'),
  dashboardActivities: cleanUrl(FORCED_BACKEND_URL, 'api/dashboard/activities'),
};

export default API_BASE_URL;
