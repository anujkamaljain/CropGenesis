#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🌱 CropGenesis Setup Script');
console.log('============================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Create .env files if they don't exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');

if (!fs.existsSync(backendEnvPath)) {
  console.log('📝 Creating backend .env file...');
  fs.copyFileSync(
    path.join(__dirname, 'backend', 'env.example'),
    backendEnvPath
  );
  console.log('✅ Backend .env file created');
} else {
  console.log('✅ Backend .env file already exists');
}

if (!fs.existsSync(frontendEnvPath)) {
  console.log('📝 Creating frontend .env file...');
  fs.copyFileSync(
    path.join(__dirname, 'frontend', 'env.example'),
    frontendEnvPath
  );
  console.log('✅ Frontend .env file created');
} else {
  console.log('✅ Frontend .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('   Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('   Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  console.log('   Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update the .env files with your actual values:');
console.log('   - backend/.env: Add your MongoDB URI, JWT secret, and Gemini API key');
console.log('   - frontend/.env: Update API URL if needed');
console.log('\n2. Start the development servers:');
console.log('   npm run dev');
console.log('\n3. Open your browser and navigate to:');
console.log('   http://localhost:5173');
console.log('\n📚 For more information, check the README.md file');
