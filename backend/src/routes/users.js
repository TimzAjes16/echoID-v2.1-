import express from 'express';
import { z } from 'zod';
import { getPool } from '../db/index.js';

const router = express.Router();
const pool = getPool();

// Validation schemas
const registerDeviceSchema = z.object({
  pushToken: z.string().min(1),
  deviceId: z.string().min(1),
});

/**
 * POST /users/:handle/register-device
 * Register device for push notifications
 */
router.post('/:handle/register-device', async (req, res, next) => {
  try {
    const handle = req.params.handle.toLowerCase();
    const data = registerDeviceSchema.parse(req.body);
    const { pushToken, deviceId } = data;

    // Verify handle exists
    const handleCheck = await pool.query(
      'SELECT handle FROM handles WHERE handle = $1',
      [handle]
    );

    if (handleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Handle not found' });
    }

    // Insert or update device registration
    await pool.query(
      `INSERT INTO device_registrations (handle, device_id, push_token, platform)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (handle, device_id) 
       DO UPDATE SET push_token = $3, updated_at = CURRENT_TIMESTAMP`,
      [handle, deviceId, pushToken, req.headers['user-agent']?.includes('iOS') ? 'ios' : 'android']
    );

    res.json({ registered: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /users/:handle/devices/:deviceId
 * Unregister device
 */
router.delete('/:handle/devices/:deviceId', async (req, res, next) => {
  try {
    const handle = req.params.handle.toLowerCase();
    const deviceId = req.params.deviceId;

    const result = await pool.query(
      'DELETE FROM device_registrations WHERE handle = $1 AND device_id = $2 RETURNING id',
      [handle, deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device registration not found' });
    }

    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;

