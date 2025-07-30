require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

async function testConnection() {
    console.log('🔍 MongoDB Connection Debug Test');
    console.log('================================');
    
    // Check environment variables
    console.log('Environment Variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- MONGODB_URI defined:', !!process.env.MONGODB_URI);
    console.log('- URI length:', process.env.MONGODB_URI?.length);
    
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found!');
        return;
    }
    
    // Redact sensitive info
    const redactedUri = process.env.MONGODB_URI.replace(/:([^:]+)@/, ':****@');
    console.log('- Redacted URI:', redactedUri);
    
    console.log('\n🔌 Attempting Connection...');
    
    try {
        // Connection options optimized for debugging
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
            maxPoolSize: 1,
            bufferCommands: false,
            family: 4
        };
        
        console.log('Connection options:', JSON.stringify(options, null, 2));
        
        const connection = await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log('✅ CONNECTION SUCCESS!');
        console.log('- Host:', connection.connection.host);
        console.log('- Database:', connection.connection.name);
        console.log('- Ready State:', connection.connection.readyState);
        console.log('- Connection ID:', connection.connection.id);
        
        // Test a simple operation
        console.log('\n🧪 Testing Database Operation...');
        const collections = await connection.connection.db.listCollections().toArray();
        console.log('- Collections found:', collections.length);
        console.log('- Collection names:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('✅ Disconnected successfully');
        
    } catch (error) {
        console.error('❌ CONNECTION FAILED!');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        
        if (error.name === 'MongoNetworkError') {
            console.error('\n🌐 Network Error Troubleshooting:');
            console.error('1. Check MongoDB Atlas IP whitelist');
            console.error('2. Verify cluster is not paused');
            console.error('3. Check network connectivity');
        }
        
        if (error.name === 'MongoServerSelectionError') {
            console.error('\n🏥 Server Selection Error Troubleshooting:');
            console.error('1. Database cluster may be offline');
            console.error('2. Wrong connection string');
            console.error('3. Network timeout');
        }
        
        console.error('\nFull error:', error);
    }
}

testConnection();
