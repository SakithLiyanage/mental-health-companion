require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

async function testConnection() {
  console.log('=== MongoDB Connection Test ===');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI Set:', !!process.env.MONGODB_URI);
  console.log('MongoDB URI Length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    return;
  }
  
  try {
    console.log('\nAttempting to connect to MongoDB...');
    
    const connectionOptions = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
      minPoolSize: 0,
      bufferCommands: false,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
      autoIndex: false,
      autoCreate: false,
      heartbeatFrequencyMS: 10000,
      retryReads: true,
      writeConcern: {
        w: 'majority',
        j: true
      }
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    console.log('Ready State:', conn.connection.readyState);
    
    // Test a simple query
    console.log('\nTesting database query...');
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('\n✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Name:', error.name);
    
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
    
    process.exit(1);
  }
}

testConnection(); 