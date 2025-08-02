require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const journalRoutes = require('./routes/journal');
const emotionRoutes = require('./routes/emotions');
const dashboardRoutes = require('./routes/dashboard');
const goalRoutes = require('./routes/goals');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://mental-health-companion-seven.vercel.app',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://mental-health-companion-seven.vercel.app', // Your frontend URL
    'https://mental-health-companion-backend-eight.vercel.app', // Your backend URL
    'https://*.vercel.app' // Allow all Vercel deployments
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Stricter rate limiting for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // limit each IP to 10 chat requests per minute
});

// Root endpoint - Success message
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 Mental Health Companion Backend is Successfully Running!',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      debug: '/api/debug',
      auth: '/api/auth/*',
      chat: '/api/chat/*',
      journal: '/api/journal/*',
      emotions: '/api/emotions/*',
      dashboard: '/api/dashboard/*',
      goals: '/api/goals/*'
    }
  });
});

// Simple test endpoint that doesn't require database
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working without database',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb_uri_set: !!process.env.MONGODB_URI,
    vercel_env: !!process.env.VERCEL,
    node_env: process.env.NODE_ENV
  });
});

// Simple ping endpoint
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
    mongodb_uri_set: !!process.env.MONGODB_URI,
    vercel_env: !!process.env.VERCEL,
    node_env: process.env.NODE_ENV
  });
});

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    const connectionInfo = {
      readyState: mongoose.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || 'not connected',
      database: mongoose.connection.name || 'not connected',
      mongodb_uri_set: !!process.env.MONGODB_URI,
      mongodb_uri_length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
      environment: process.env.NODE_ENV || 'development',
      vercel_env: !!process.env.VERCEL
    };
    
    if (mongoose.connection.readyState === 1) {
      return res.json({
        message: 'Database is already connected',
        ...connectionInfo
      });
    }
    
    // Try to connect
    console.log('Attempting to connect to database...');
    await connectDB();
    
        res.json({
      message: 'Database connection successful',
      ...connectionInfo,
      readyState: mongoose.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });
    });
  } catch (error) {
    console.error('Database test failed:', error.message);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message,
      readyState: mongoose.connection.readyState
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: 'OK', 
    message: 'Mental Health Companion API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: readyStates[mongoose.connection.readyState] || 'unknown',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'not connected'
    },
    mongodb_uri_set: !!process.env.MONGODB_URI,
    mongodb_uri_length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    vercel_env: !!process.env.VERCEL
  });
});

// Debug environment variables endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    node_env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    mongodb_uri_set: !!process.env.MONGODB_URI,
    mongodb_uri_length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    jwt_secret_set: !!process.env.JWT_SECRET,
    frontend_url_set: !!process.env.FRONTEND_URL,
    timestamp: new Date().toISOString()
  });
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    readyState: mongoose.connection.readyState,
    status: readyStates[mongoose.connection.readyState],
    host: mongoose.connection.host || 'unknown',
    name: mongoose.connection.name || 'unknown',
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriStart: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not set'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The endpoint '${req.originalUrl}' does not exist on this server.`,
    availableEndpoints: [
      '/ - Server status',
      '/api/health - Health check',
      '/api/auth/* - Authentication routes',
      '/api/chat/* - Chat routes',
      '/api/journal/* - Journal routes',
      '/api/emotions/* - Emotion routes',
      '/api/dashboard/* - Dashboard routes',
      '/api/goals/* - Goal routes'
    ],
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection with better serverless support
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Already connected to MongoDB');
      return;
    }
    
    // Check if connecting
    if (mongoose.connection.readyState === 2) {
      console.log('⏳ Already connecting to MongoDB...');
      return;
    }
    
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
    
    // Validate MongoDB URI format
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // For serverless environments, use minimal connection options
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxPoolSize: 1,
      bufferCommands: false,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      autoIndex: false,
      autoCreate: false
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name || 'No database specified'}`);
    console.log(`🔗 Connection State: ${mongoose.connection.readyState}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    // Re-throw the error so it can be handled by the calling function
    throw error;
  }
};

// For Vercel serverless functions
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    try {
      // Don't force database connection on every request
      // Let individual routes handle their own database connections
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
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  });
}

module.exports = app;
