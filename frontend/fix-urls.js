// Script to fix double slashes in URLs
// Run this to find and replace all instances of double slashes in API URLs

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src/components');
const contextsDir = path.join(__dirname, 'src/contexts');

function fixUrlsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace double slashes in URLs
    content = content.replace(
      /https:\/\/mental-health-companion-backend-eight\.vercel\.app\/\/api/g,
      'https://mental-health-companion-backend-eight.vercel.app/api'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed URLs in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fixUrlsInFile(filePath);
    }
  });
}

console.log('🔧 Fixing double slashes in URLs...');
processDirectory(componentsDir);
processDirectory(contextsDir);
console.log('✅ URL fixing complete!'); 