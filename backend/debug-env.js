require('dotenv').config();

console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('MONGODB_URI set:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('FRONTEND_URL set:', !!process.env.FRONTEND_URL);

if (process.env.MONGODB_URI) {
  // Show first and last 20 characters of the URI for debugging
  const uri = process.env.MONGODB_URI;
  console.log('MONGODB_URI preview:', uri.substring(0, 20) + '...' + uri.substring(uri.length - 20));
  
  // Check if it has the right format
  if (uri.includes('mongodb+srv://') && uri.includes('@') && uri.includes('.mongodb.net/')) {
    console.log('✅ MONGODB_URI format looks correct');
  } else {
    console.log('❌ MONGODB_URI format might be incorrect');
  }
} else {
  console.log('❌ MONGODB_URI is not set');
}

console.log('==============================='); 