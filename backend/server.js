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

// Trust proxy for Vercel deployment (fixes rate limiting issues)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://mental-health-companion-front.vercel.app',
      'https://mental-health-companion-beige.vercel.app',
      'https://mental-health-companion-e29c.vercel.app'
    ];
    if (!origin || allowedOrigins.includes(origin) || /https:\/\/.*\.vercel\.app/.test(origin)) {
      callback(null, true);
    } else {
      console.error('CORS error: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Explicitly handle OPTIONS requests
app.options('*', cors());

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
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  res.json({ 
    status: 'OK', 
    message: 'Mental Health Companion API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStates[dbState] || 'unknown',
    databaseState: dbState,
    serverless: !!process.env.VERCEL
  });
});

// Environment variables debug endpoint (for troubleshooting)
app.get('/api/debug/env', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
    mongoUriPrefix: process.env.MONGODB_URI?.substring(0, 20) || 'undefined',
    frontendUrl: process.env.FRONTEND_URL || 'undefined',
    vercelEnv: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection test endpoint
app.get('/api/debug/mongo', async (req, res) => {
  try {
    console.log('🔍 Testing MongoDB connection from Vercel...');
    
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        error: 'MONGODB_URI not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Test connection with simple timeout settings
    const testOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
      bufferCommands: false
    };
    
    console.log('Creating MongoDB connection...');
    const testConnection = await mongoose.createConnection(process.env.MONGODB_URI, testOptions);
    
    console.log('Connection created, checking readyState...');
    const readyState = testConnection.readyState;
    
    let dbInfo = { available: false };
    if (readyState === 1 && testConnection.db) {
      console.log('Database is available, getting info...');
      try {
        const admin = testConnection.db.admin();
        const pingResult = await admin.ping();
        dbInfo = { 
          available: true, 
          ping: pingResult,
          name: testConnection.name
        };
      } catch (dbError) {
        console.log('Database ping failed:', dbError.message);
        dbInfo = { available: false, error: dbError.message };
      }
    }
    
    console.log('Closing test connection...');
    await testConnection.close();
    
    res.json({
      success: true,
      message: 'MongoDB connection test completed',
      connectionState: {
        readyState: readyState,
        states: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
      },
      host: testConnection.host,
      database: dbInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MongoDB test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    });
  }
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

// MongoDB connection caching for serverless environments
let cachedDb = null;

const connectDB = async () => {
  // If mongoose is already connected, return the cached connection
  if (mongoose.connection.readyState === 1) {
    console.log('Using existing mongoose connection');
    return mongoose.connection;
  }

  // If connection is being established, wait for it
  if (mongoose.connection.readyState === 2) {
    console.log('Waiting for mongoose connection to establish...');
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection));
      mongoose.connection.once('error', reject);
    });
  }

  try {
    console.log('Creating new MongoDB connection for serverless environment...');
    
    if (!process.env.MONGODB_URI) {
      console.error('CRITICAL: MONGODB_URI is not defined.');
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    // Optimized settings for Vercel serverless functions
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Give a bit more time
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      maxPoolSize: 1, // Limit connections for serverless
      minPoolSize: 0, // Allow pool to scale to zero
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferCommands: false, // Disable buffering
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority',
      authSource: 'admin' // Explicitly set auth source
    };

    // Redact password for security logging
    const redactedUri = process.env.MONGODB_URI.replace(/:([^:]+)@/, ':********@');
    console.log('Connecting to MongoDB with URI:', redactedUri);

    const conn = await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`- Host: ${conn.connection.host}`);
    console.log(`- Database: ${conn.connection.name}`);
    console.log(`- ReadyState: ${conn.connection.readyState}`);
    
    cachedDb = conn;
    return conn;

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    
    // Log specific error types for debugging
    if (error.name === 'MongoNetworkError') {
      console.error('🌐 Network Error - Check IP whitelist in MongoDB Atlas');
    } else if (error.name === 'MongoParseError') {
      console.error('🔗 Connection String Error - Check MONGODB_URI format');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('🏥 Server Selection Error - Database may be offline or unreachable');
    }
    
    console.error('💡 Troubleshooting:');
    console.error('1. Verify IP whitelist (0.0.0.0/0) in MongoDB Atlas');
    console.error('2. Check database cluster status (not paused)');
    console.error('3. Verify MONGODB_URI in Vercel environment variables');
    console.error('4. Ensure database user has proper permissions');
    
    throw error;
  }
};


// For Vercel serverless functions
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error('⏰ Request timeout - sending 503 response');
        res.status(503).json({
          success: false,
          message: 'Service Unavailable: Request timeout',
          error: 'Database connection timeout in serverless environment'
        });
      }
    }, 8000); // 8 second timeout for Vercel

    try {
      console.log(`📝 Processing ${req.method} ${req.url}`);
      
      // Ensure database connection is established before processing requests
      try {
        await connectDB();
        console.log('✅ Database connected successfully');
        
        // Verify connection is actually ready
        if (mongoose.connection.readyState !== 1) {
          throw new Error('Database connection not ready');
        }
        
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError.message);
        
        if (!res.headersSent) {
          clearTimeout(timeout);
          return res.status(503).json({
            success: false,
            message: 'Service Unavailable: Database connection failed',
            error: dbError.message,
            timestamp: new Date().toISOString()
          });
        }
        return;
      }
      
      clearTimeout(timeout);
      
      console.log('🚀 Processing request...');
      return app(req, res);
      
    } catch (error) {
      clearTimeout(timeout);
      
      if (!res.headersSent) {
        console.error('💥 Serverless handler error:', error.message);
        res.status(503).json({
          success: false,
          message: 'Service Unavailable: Server error',
          error: error.message,
          timestamp: new Date().toISOString(),
          environment: 'production'
        });
      }
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
