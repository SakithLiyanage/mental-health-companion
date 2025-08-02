require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== DATABASE CONNECTION TEST ===');
console.log('MONGODB_URI set:', !!process.env.MONGODB_URI);
console.log('URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

// Test connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  bufferCommands: false
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  console.log('Database:', mongoose.connection.db.databaseName);
  console.log('Host:', mongoose.connection.host);
  
  // Test a simple operation
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    console.log('✅ Database operations working');
  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
  }
  
  await mongoose.disconnect();
  console.log('✅ Test completed successfully');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed:', err.message);
  console.error('Error code:', err.code);
  process.exit(1);
});

// Timeout after 20 seconds
setTimeout(() => {
  console.error('❌ Test timeout after 20 seconds');
  process.exit(1);
}, 20000); 