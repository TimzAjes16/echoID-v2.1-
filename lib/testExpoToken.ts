/**
 * Test Expo Token Functionality
 * 
 * This utility helps test and verify that the Expo PAT (Personal Access Token)
 * is configured correctly and push notifications can be sent.
 */

import { getNotificationToken } from './notifications';

/**
 * Test getting an Expo push token from the device
 * This requires the app to be running and notification permissions granted
 */
export async function testGetPushToken(): Promise<{
  success: boolean;
  token: string | null;
  error?: string;
}> {
  try {
    console.log('🔍 Testing Expo push token retrieval...');
    
    const token = await getNotificationToken();
    
    if (!token) {
      return {
        success: false,
        token: null,
        error: 'Failed to get push token. Make sure notification permissions are granted.',
      };
    }

    console.log('✅ Push token retrieved successfully:', token);
    
    return {
      success: true,
      token,
    };
  } catch (error: any) {
    console.error('❌ Error getting push token:', error);
    return {
      success: false,
      token: null,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test sending a notification via the backend API
 * Requires:
 * 1. Backend server running
 * 2. Backend has EXPO_TOKEN configured
 * 3. Valid push token
 */
export async function testSendNotification(
  pushToken: string,
  apiBaseUrl: string = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    console.log('📤 Testing push notification send via backend...');
    console.log('API Base URL:', apiBaseUrl);
    console.log('Push Token:', pushToken);

    const response = await fetch(`${apiBaseUrl}/api/test-expo-token/send-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pushToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log('✅ Test notification sent successfully!');
    console.log('Ticket:', data.ticket);

    return {
      success: true,
      message: data.message || 'Notification sent successfully',
    };
  } catch (error: any) {
    console.error('❌ Error sending test notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Verify backend Expo token configuration
 */
export async function testBackendTokenConfig(
  apiBaseUrl: string = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'
): Promise<{
  success: boolean;
  details?: any;
  error?: string;
}> {
  try {
    console.log('🔍 Testing backend Expo token configuration...');
    console.log('API Base URL:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/api/test-expo-token/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log('✅ Backend token configuration verified!');
    console.log('Details:', data.details);

    return {
      success: true,
      details: data.details,
    };
  } catch (error: any) {
    console.error('❌ Error verifying backend token:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to backend',
    };
  }
}

/**
 * Complete end-to-end test
 * 1. Get push token from device
 * 2. Verify backend token config
 * 3. Send test notification
 */
export async function runCompleteExpoTokenTest(
  apiBaseUrl?: string
): Promise<{
  pushTokenTest: { success: boolean; token: string | null; error?: string };
  backendConfigTest: { success: boolean; details?: any; error?: string };
  sendNotificationTest: { success: boolean; message?: string; error?: string };
}> {
  console.log('🧪 Running complete Expo token functionality test...\n');

  // Step 1: Get push token
  console.log('Step 1: Getting push token from device...');
  const pushTokenResult = await testGetPushToken();
  console.log('');

  // Step 2: Verify backend config
  console.log('Step 2: Verifying backend token configuration...');
  const backendConfigResult = await testBackendTokenConfig(apiBaseUrl);
  console.log('');

  // Step 3: Send test notification (only if we have a token)
  let sendNotificationResult = {
    success: false,
    error: 'Skipped - no push token available',
  };

  if (pushTokenResult.success && pushTokenResult.token) {
    console.log('Step 3: Sending test notification...');
    sendNotificationResult = await testSendNotification(pushTokenResult.token, apiBaseUrl);
    console.log('');
  } else {
    console.log('Step 3: Skipped - no push token available');
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`  Push Token: ${pushTokenResult.success ? '✅' : '❌'}`);
  console.log(`  Backend Config: ${backendConfigResult.success ? '✅' : '❌'}`);
  console.log(`  Send Notification: ${sendNotificationResult.success ? '✅' : '❌'}`);
  console.log('');

  return {
    pushTokenTest: pushTokenResult,
    backendConfigTest: backendConfigResult,
    sendNotificationTest: sendNotificationResult,
  };
}

