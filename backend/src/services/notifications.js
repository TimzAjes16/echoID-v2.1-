import { Expo } from 'expo-server-sdk';
import { getPool } from '../db/index.js';

// Support both EXPO_TOKEN and EXPO_ACCESS_TOKEN for compatibility
const expoToken = process.env.EXPO_TOKEN || process.env.EXPO_ACCESS_TOKEN;

const expo = new Expo({
  accessToken: expoToken, // Expo PAT for authenticated API access
});

const pool = getPool();

/**
 * Send push notification to a user by handle or directly by push token
 */
export async function sendPushNotification(handle, notification, directPushToken = null) {
  let pushTokens = [];

  if (directPushToken) {
    // Use provided push token directly
    pushTokens = [directPushToken];
  } else if (handle) {
    // Get all push tokens for the handle
    const result = await pool.query(
      'SELECT push_token FROM device_registrations WHERE handle = $1',
      [handle]
    );
    pushTokens = result.rows.map(row => row.push_token).filter(Boolean);
  }

  if (pushTokens.length === 0) {
    throw new Error('No push tokens found');
  }

  // Validate push tokens
  const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    throw new Error('No valid push tokens found');
  }

  // Create messages
  const messages = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    badge: 1,
  }));

  // Send in chunks
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }

  // Check for errors
  const errors = tickets.filter(ticket => ticket.status === 'error');
  if (errors.length > 0) {
    console.warn('Some push notifications failed:', errors);
  }

  return tickets[0]; // Return first ticket for receipt ID
}

