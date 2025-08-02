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
      auth: '/api/auth/*',
      chat: '/api/chat/*',
      journal: '/api/journal/*',
      emotions: '/api/emotions/*',
      dashboard: '/api/dashboard/*',
      goals: '/api/goals/*'
    }
  });
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
  res.json({ 
    status: 'OK', 
    message: 'Mental Health Companion API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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

// MongoDB connection
const connectDB = async () => {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      console.log('Attempting to connect to MongoDB Atlas...');
      console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
      
      // Validate MongoDB URI format
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      // Check if URI includes database name
      const uri = process.env.MONGODB_URI;
      const hasDbName = uri.includes('.mongodb.net/') && 
                       uri.split('.mongodb.net/')[1] && 
                       uri.split('.mongodb.net/')[1].split('?')[0].length > 0;
      
      if (!hasDbName) {
        console.warn('⚠️  WARNING: MongoDB URI might be missing database name');
        console.warn('Expected format: mongodb+srv://user:pass@cluster.mongodb.net/DATABASE_NAME?options');
      }
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // Increased timeout for Vercel
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        maxPoolSize: 10, // Maintain up to 10 socket connections
        bufferCommands: false // Disable mongoose buffering
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📁 Database: ${conn.connection.name || 'No database specified'}`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('\n🔥 SOLUTION: Add your IP to MongoDB Atlas whitelist:');
      console.error('1. Go to https://cloud.mongodb.com');
      console.error('2. Navigate to "Network Access"');
      console.error('3. Click "Add IP Address"');
      console.error('4. Add 0.0.0.0/0 for Vercel deployments');
    }
    
    if (error.message.includes('authentication') || error.message.includes('credentials')) {
      console.error('\n🔐 SOLUTION: Check your MongoDB credentials:');
      console.error('1. Verify username and password in connection string');
      console.error('2. Ensure user has proper database permissions');
    }
    
    console.error('\n💡 Other potential fixes:');
    console.error('- Check your MongoDB credentials');
    console.error('- Verify your connection string includes database name');
    console.error('- Ensure cluster is running\n');
    
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// For Vercel serverless functions
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    await connectDB();
    return app(req, res);
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
