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
    process.env.FRONTEND_URL || 'https://mental-health-companion-4o1j.vercel.app',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://mental-health-companion-beige.vercel.app',
    'https://mental-health-companion-e29c.vercel.app', // Your frontend URL
    'https://mental-health-companion-4o1j.vercel.app', // Current frontend URL
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
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📁 Database: ${conn.connection.name}`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('\n🔥 SOLUTION: Add your IP to MongoDB Atlas whitelist:');
      console.error('1. Go to https://cloud.mongodb.com');
      console.error('2. Navigate to "Network Access"');
      console.error('3. Click "Add IP Address"');
      console.error('4. Add your current IP or use 0.0.0.0/0 for development');
    }
    
    console.error('\n💡 Other potential fixes:');
    console.error('- Check your MongoDB credentials');
    console.error('- Verify your connection string');
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
