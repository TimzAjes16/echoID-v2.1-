#!/usr/bin/env node

/**
 * Test Expo Token Functionality Script
 * 
 * This script tests the Expo PAT (Personal Access Token) configuration
 * by verifying backend configuration and optionally sending a test notification.
 * 
 * Usage:
 *   node scripts/test-expo-token.js [pushToken]
 * 
 * If pushToken is provided, it will send a test notification.
 * Otherwise, it only verifies the backend configuration.
 */

import dotenv from 'dotenv';
import { Expo } from 'expo-server-sdk';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const pushToken = process.argv[2]; // Optional push token from command line

async function testBackendToken() {
  console.log('🧪 Testing Expo Token Configuration\n');
  console.log(`Backend URL: ${API_BASE_URL}\n`);

  // Check if token is configured
  const expoToken = process.env.EXPO_TOKEN || process.env.EXPO_ACCESS_TOKEN;
  
  if (!expoToken) {
    console.error('❌ ERROR: EXPO_TOKEN or EXPO_ACCESS_TOKEN not found in environment variables');
    console.error('\nPlease set EXPO_TOKEN in backend/.env file');
    process.exit(1);
  }

  console.log(`✅ Expo token found (length: ${expoToken.length})`);
  console.log(`   Prefix: ${expoToken.substring(0, 10)}...\n`);

  // Test Expo SDK initialization
  try {
    const expo = new Expo({
      accessToken: expoToken,
    });
    console.log('✅ Expo SDK initialized successfully\n');

    // Test backend API endpoint
    console.log('📡 Testing backend API endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/test-expo-token/verify`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Backend endpoint verified successfully');
      console.log('   Details:', JSON.stringify(data.details, null, 2));
    } else {
      console.error('❌ Backend endpoint returned error:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing backend:', error.message);
    process.exit(1);
  }

  // If push token provided, send test notification
  if (pushToken) {
    console.log(`\n📤 Sending test notification to: ${pushToken}`);
    
    try {
      const expo = new Expo({
        accessToken: expoToken,
      });

      if (!Expo.isExpoPushToken(pushToken)) {
        console.error('❌ Invalid push token format');
        console.error('   Expected format: ExponentPushToken[...]');
        process.exit(1);
      }

      const messages = [{
        to: pushToken,
        sound: 'default',
        title: 'EchoID Test Notification',
        body: 'This is a test notification from the EchoID backend script. If you receive this, your Expo token is working! 🎉',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
        badge: 1,
      }];

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      const errors = tickets.filter(ticket => ticket.status === 'error');
      
      if (errors.length > 0) {
        console.error('❌ Failed to send notification');
        console.error('   Errors:', errors);
        process.exit(1);
      }

      console.log('✅ Test notification sent successfully!');
      console.log('   Ticket ID:', tickets[0]?.id);
      console.log('   Check your device for the notification\n');
    } catch (error) {
      console.error('❌ Error sending notification:', error.message);
      process.exit(1);
    }
  } else {
    console.log('\n💡 Tip: To send a test notification, provide a push token:');
    console.log('   node scripts/test-expo-token.js ExponentPushToken[...]');
    console.log('\n   Get a push token from the app using: getNotificationToken()\n');
  }

  console.log('✅ All tests passed!\n');
}

testBackendToken().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

