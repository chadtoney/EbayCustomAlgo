#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🛒 Setting up Personal eBay Shopping Agent...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('\n📝 Please create a .env.local file with your eBay API credentials:');
  console.log(`
# eBay API Configuration
EBAY_CLIENT_ID=your_ebay_client_id_here
EBAY_CLIENT_SECRET=your_ebay_client_secret_here
EBAY_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Optional: OpenAI API for semantic search
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
`);
  console.log('\n🔗 Get eBay API credentials at: https://developer.ebay.com/');
  process.exit(1);
}

console.log('✅ .env.local file found');

// Check if required environment variables are set
const envContent = fs.readFileSync(envPath, 'utf8');
const hasClientId = envContent.includes('EBAY_CLIENT_ID=') && !envContent.includes('EBAY_CLIENT_ID=your_ebay_client_id_here');
const hasClientSecret = envContent.includes('EBAY_CLIENT_SECRET=') && !envContent.includes('EBAY_CLIENT_SECRET=your_ebay_client_secret_here');

if (!hasClientId || !hasClientSecret) {
  console.log('⚠️  Please update your .env.local file with actual eBay API credentials');
  console.log('🔗 Get them at: https://developer.ebay.com/');
  console.log('\n✅ Setup script completed - remember to add your API credentials!');
  process.exit(0);
}

console.log('✅ eBay API credentials configured');
console.log('🚀 Setup complete! You can now run:');
console.log('   npm run dev');
console.log('\n🌐 Open http://localhost:3000 to start searching eBay!');
