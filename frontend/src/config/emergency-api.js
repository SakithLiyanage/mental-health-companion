// EMERGENCY API CONFIGURATION - BYPASSES ALL OTHER CONFIGS
// This file is created to completely override any cached or environment-based API configuration

const EMERGENCY_BACKEND_URL = 'https://mental-health-companion-nine.vercel.app';

console.log('🚨 EMERGENCY API CONFIG LOADED 🚨');
console.log('Emergency backend URL:', EMERGENCY_BACKEND_URL);
console.log('Timestamp:', new Date().toISOString());

export const EMERGENCY_API_ENDPOINTS = {
  login: `${EMERGENCY_BACKEND_URL}/api/auth/login`,
  register: `${EMERGENCY_BACKEND_URL}/api/auth/register`,
  me: `${EMERGENCY_BACKEND_URL}/api/auth/me`,
};

export { EMERGENCY_BACKEND_URL };
