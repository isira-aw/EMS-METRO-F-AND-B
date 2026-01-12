#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '.next');
const buildIdPath = path.join(nextDir, 'BUILD_ID');

console.log('🚀 Starting EMS Frontend...');

// Check if .next directory exists and has a BUILD_ID file
if (!fs.existsSync(nextDir) || !fs.existsSync(buildIdPath)) {
  console.log('⚠️  No production build found. Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Production build found.');
}

// Start the Next.js production server
const port = process.env.PORT || 3000;
console.log(`🌐 Starting server on port ${port}...`);

try {
  execSync(`npx next start -p ${port}`, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
}
