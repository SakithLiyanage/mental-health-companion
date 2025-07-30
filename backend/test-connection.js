require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI configured:', !!process.env.MONGODB_URI);
console.log('Connection string length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connection successful');
  console.log('Database name:', mongoose.connection.db.databaseName);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.error('Error code:', err.code);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout after 10 seconds');
  process.exit(1);
}, 10000);
