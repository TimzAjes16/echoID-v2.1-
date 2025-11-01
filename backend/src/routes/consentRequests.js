import express from 'express';
import { z } from 'zod';
import { getPool } from '../db/index.js';
import { sendPushNotification } from '../services/notifications.js';

const router = express.Router();
const pool = getPool();

// Validation schemas
const createRequestSchema = z.object({
  fromHandle: z.string().min(1),
  fromAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  toHandle: z.string().min(1),
  template: z.string().min(1),
  consentData: z.any(),
});

const acceptRequestSchema = z.object({
  acceptorData: z.object({
    voiceHash: z.string(),
    faceHash: z.string(),
    deviceHash: z.string(),
    geoHash: z.string(),
    utcHash: z.string(),
    coercionLevel: z.number().optional(),
  }),
});

/**
 * POST /consent-requests
 * Create and send consent request
 */
router.post('/', async (req, res, next) => {
  try {
    const data = createRequestSchema.parse(req.body);
    const { fromHandle, fromAddress, toHandle, template, consentData } = data;

    // Verify handles exist
    const [fromHandleCheck, toHandleCheck] = await Promise.all([
      pool.query('SELECT handle FROM handles WHERE handle = $1', [fromHandle.toLowerCase()]),
      pool.query('SELECT handle FROM handles WHERE handle = $1', [toHandle.toLowerCase()]),
    ]);

    if (fromHandleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'From handle not found' });
    }
    if (toHandleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'To handle not found' });
    }

    // Create consent request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      `INSERT INTO consent_requests (id, from_handle, from_address, to_handle, template, consent_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [requestId, fromHandle.toLowerCase(), fromAddress, toHandle.toLowerCase(), template, JSON.stringify(consentData)]
    );

    // Send push notification to recipient
    try {
      await sendPushNotification(toHandle.toLowerCase(), {
        title: 'New Consent Request',
        body: `@${fromHandle} wants to create a consent with you`,
        data: {
          type: 'consent_request',
          requestId,
          fromHandle,
        },
      });
    } catch (notificationError) {
      console.warn('Failed to send push notification:', notificationError);
      // Continue even if notification fails
    }

    res.json({ requestId, status: 'pending' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

/**
 * GET /consent-requests
 * Get pending requests for user
 */
router.get('/', async (req, res, next) => {
  try {
    const handle = req.query.handle?.toLowerCase();

    if (!handle) {
      return res.status(400).json({ error: 'Handle parameter required' });
    }

    const result = await pool.query(
      `SELECT id, from_handle as "fromHandle", from_address as "fromAddress", 
              template, consent_data as "consentData", 
              EXTRACT(EPOCH FROM created_at) * 1000 as "requestedAt"
       FROM consent_requests 
       WHERE to_handle = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [handle]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /consent-requests/:id/accept
 * Accept consent request
 */
router.post('/:id/accept', async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const data = acceptRequestSchema.parse(req.body);

    // Get request
    const requestResult = await pool.query(
      'SELECT * FROM consent_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consent request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update request status
    await pool.query(
      'UPDATE consent_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['accepted', requestId]
    );

    // Note: The actual on-chain consent creation happens on the client side
    // The client will call the blockchain contract and then can optionally
    // notify the backend with the consentId and txHash

    res.json({
      message: 'Request accepted',
      // The client should create the consent on-chain and return consentId and txHash
      // This endpoint just marks the request as accepted in the database
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

/**
 * POST /consent-requests/:id/reject
 * Reject consent request
 */
router.post('/:id/reject', async (req, res, next) => {
  try {
    const requestId = req.params.id;

    const result = await pool.query(
      'UPDATE consent_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      ['rejected', requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consent request not found' });
    }

    res.json({ status: 'rejected' });
  } catch (error) {
    next(error);
  }
});

export default router;

