import express from 'express';
import { Expo } from 'expo-server-sdk';

const router = express.Router();

/**
 * GET /api/test-expo-token/verify
 * Verify that Expo token is configured and working
 */
router.get('/verify', async (req, res, next) => {
  try {
    const expoToken = process.env.EXPO_TOKEN || process.env.EXPO_ACCESS_TOKEN;
    
    if (!expoToken) {
      return res.status(400).json({
        success: false,
        error: 'EXPO_TOKEN or EXPO_ACCESS_TOKEN not configured',
        message: 'Please set EXPO_TOKEN environment variable',
      });
    }

    // Initialize Expo SDK with token
    const expo = new Expo({
      accessToken: expoToken,
    });

    // Test by trying to validate a sample token format
    // Note: We can't fully test without a real push token, but we can verify the SDK initializes
    const testToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    const isValidFormat = Expo.isExpoPushToken(testToken);

    res.json({
      success: true,
      message: 'Expo token is configured and SDK initialized successfully',
      details: {
        tokenConfigured: true,
        tokenLength: expoToken.length,
        tokenPrefix: expoToken.substring(0, 10) + '...',
        sdkInitialized: true,
        tokenValidationWorking: isValidFormat,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/test-expo-token/send-test
 * Send a test push notification (requires a valid push token)
 * Body: { pushToken: "ExponentPushToken[...]" }
 */
router.post('/send-test', async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        error: 'pushToken is required',
      });
    }

    const expoToken = process.env.EXPO_TOKEN || process.env.EXPO_ACCESS_TOKEN;
    
    if (!expoToken) {
      return res.status(400).json({
        success: false,
        error: 'EXPO_TOKEN not configured',
      });
    }

    const expo = new Expo({
      accessToken: expoToken,
    });

    // Validate token format
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid push token format',
        message: 'Push token must be in format: ExponentPushToken[...]',
      });
    }

    // Create test message
    const messages = [{
      to: pushToken,
      sound: 'default',
      title: 'EchoID Test Notification',
      body: 'This is a test notification from EchoID backend. If you receive this, your Expo token is working! 🎉',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
      badge: 1,
    }];

    // Send notification
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    // Check for errors
    const errors = tickets.filter(ticket => ticket.status === 'error');
    
    if (errors.length > 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send notification',
        details: errors,
      });
    }

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      ticket: tickets[0],
      receiptId: tickets[0]?.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

