/**
 * Script to generate Google OAuth2 tokens for Google Drive API
 * Run this once to get your refresh token
 */

import { google } from 'googleapis';
import readline from 'readline';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback' // Your redirect URI
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.file'],
  prompt: 'consent' // Force to get refresh token
});

console.log('\n🔐 Google Drive OAuth Setup\n');
console.log('📋 Step 1: Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n📋 Step 2: Authorize the application');
console.log('📋 Step 3: Copy the authorization code from the URL\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the code from the URL: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Success! Add these to your .env file:\n');
    console.log(`GOOGLE_CLIENT_ID="${process.env.GOOGLE_CLIENT_ID}"`);
    console.log(`GOOGLE_CLIENT_SECRET="${process.env.GOOGLE_CLIENT_SECRET}"`);
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log('\n⚠️  Keep these credentials secure and never commit them to Git!\n');
    
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
  }
  
  rl.close();
});
