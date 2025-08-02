// Simple test for serverless function
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Simple test endpoint
app.get('/api/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Test endpoint that doesn't require database
app.get('/api/test-simple', (req, res) => {
  res.json({
    message: 'API is working without database',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel_env: !!process.env.VERCEL,
    node_env: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 Mental Health Companion Backend is Successfully Running!',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// For Vercel serverless functions
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    try {
      return app(req, res);
    } catch (error) {
      console.error('Serverless function error:', error);
      return res.status(500).json({ 
        message: 'Server initialization error',
        error: error.message 
      });
    }
  };
} else {
  // Start server for local development
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app; 