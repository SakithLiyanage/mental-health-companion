const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Test endpoint to check if API is working
router.post('/test', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: req.headers
  });
});

// Register
router.post('/register', async (req, res) => {
  try {
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. ReadyState:', mongoose.connection.readyState);
      
      // Try to connect if not already connected
      try {
        console.log('Attempting to connect to database for registration...');
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 30000,
          maxPoolSize: 1,
          bufferCommands: false,
          connectTimeoutMS: 10000,
          retryWrites: true,
          w: 'majority',
          autoIndex: false,
          autoCreate: false
        });
        console.log('Database connected successfully for registration');
      } catch (connectError) {
        console.error('Failed to connect to database for registration:', connectError);
        return res.status(503).json({ 
          message: 'Database connection unavailable. Please try again later.',
          dbStatus: 'disconnected',
          readyState: mongoose.connection.readyState,
          mongodb_uri_set: !!process.env.MONGODB_URI,
          error: connectError.message
        });
      }
    }

    const { email, password, username, firstName, lastName } = req.body;

    // Enhanced validation with specific error messages
    const errors = [];

    // Check required fields
    if (!firstName?.trim()) errors.push('First name is required');
    if (!lastName?.trim()) errors.push('Last name is required');
    if (!username?.trim()) errors.push('Username is required');
    if (!email?.trim()) errors.push('Email is required');
    if (!password) errors.push('Password is required');

    // If basic required fields are missing, return early
    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: errors 
      });
    }

    // Detailed field validation
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // First name validation
    if (trimmedFirstName.length < 2) {
      errors.push('First name must be at least 2 characters long');
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedFirstName)) {
      errors.push('First name can only contain letters and spaces');
    }

    // Last name validation
    if (trimmedLastName.length < 2) {
      errors.push('Last name must be at least 2 characters long');
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedLastName)) {
      errors.push('Last name can only contain letters and spaces');
    }

    // Username validation
    if (trimmedUsername.length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (trimmedUsername.length > 20) {
      errors.push('Username must not exceed 20 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    } else if (/^\d/.test(trimmedUsername)) {
      errors.push('Username cannot start with a number');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    } else if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    } else {
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
    }

    // If validation errors exist, return them
    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: trimmedEmail }, { username: trimmedUsername }] 
    });

    if (existingUser) {
      const errorMessage = existingUser.email === trimmedEmail 
        ? 'An account with this email address already exists' 
        : 'This username is already taken';
      
      return res.status(400).json({ 
        message: errorMessage,
        field: existingUser.email === trimmedEmail ? 'email' : 'username'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email: trimmedEmail,
      password: hashedPassword,
      username: trimmedUsername,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully! Welcome to your mental health journey.',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Provide more specific error information
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.',
        dbStatus: 'error',
        error: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. ReadyState:', mongoose.connection.readyState);
      
      // Try to connect if not already connected
      try {
        console.log('Attempting to connect to database for login...');
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 30000,
          maxPoolSize: 1,
          bufferCommands: false,
          connectTimeoutMS: 10000,
          retryWrites: true,
          w: 'majority',
          autoIndex: false,
          autoCreate: false
        });
        console.log('Database connected successfully for login');
      } catch (connectError) {
        console.error('Failed to connect to database for login:', connectError);
        return res.status(503).json({ 
          message: 'Database connection unavailable. Please try again later.',
          dbStatus: 'disconnected',
          readyState: mongoose.connection.readyState,
          mongodb_uri_set: !!process.env.MONGODB_URI,
          error: connectError.message
        });
      }
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Provide more specific error information
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.',
        dbStatus: 'error'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user data' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { bio, timezone, preferences } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (bio !== undefined) user.bio = bio;
    if (timezone !== undefined) user.timezone = timezone;
    if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        timezone: user.timezone,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
