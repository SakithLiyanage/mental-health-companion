require('dotenv').config();

console.log('Current working directory:', process.cwd());
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT);

console.log('\nAll environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('MONGO') || key.includes('JWT') || key.includes('HUGGING') || key.includes('PORT'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });
