import express from 'express';
import { z } from 'zod';
import { sendPushNotification } from '../services/notifications.js';

const router = express.Router();

// Validation schema
const sendNotificationSchema = z.object({
  pushToken: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.any().optional(),
});

/**
 * POST /notifications/send
 * Send notification via Expo Push API
 */
router.post('/send', async (req, res, next) => {
  try {
    const data = sendNotificationSchema.parse(req.body);
    const { pushToken, title, body, data: notificationData } = data;

    const receipt = await sendPushNotification(null, {
      title,
      body,
      data: notificationData,
    }, pushToken);

    res.json({ sent: true, receiptId: receipt?.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

export default router;

