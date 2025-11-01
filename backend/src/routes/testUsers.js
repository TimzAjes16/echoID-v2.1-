import express from 'express';
import { z } from 'zod';
import { getPool } from '../db/index.js';

const router = express.Router();

// Only enable test users routes in development
if (process.env.NODE_ENV !== 'production') {
  const pool = getPool();

// Validation schema
const createTestUserSchema = z.object({
  handle: z.string().min(1).max(255),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  devicePubKey: z.string().min(1),
});

/**
 * GET /test-users
 * Get all test users (for development/admin)
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT handle, wallet_address, device_pub_key, is_active FROM test_users ORDER BY handle'
    );

    res.json(result.rows.map(row => ({
      handle: row.handle,
      walletAddress: row.wallet_address,
      devicePubKey: row.device_pub_key,
      isActive: row.is_active,
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /test-users
 * Create a test user (for development)
 */
router.post('/', async (req, res, next) => {
  try {
    const data = createTestUserSchema.parse(req.body);
    const { handle, walletAddress, devicePubKey } = data;

    // Insert into handles table first
    await pool.query(
      `INSERT INTO handles (handle, wallet_address, device_pub_key) 
       VALUES ($1, $2, $3)
       ON CONFLICT (handle) DO UPDATE SET wallet_address = $2, device_pub_key = $3`,
      [handle.toLowerCase(), walletAddress, devicePubKey]
    );

    // Insert into test_users table
    await pool.query(
      `INSERT INTO test_users (handle, wallet_address, device_pub_key) 
       VALUES ($1, $2, $3)
       ON CONFLICT (handle) DO UPDATE SET wallet_address = $2, device_pub_key = $3, is_active = true`,
      [handle.toLowerCase(), walletAddress, devicePubKey]
    );

    res.json({
      handle: handle.toLowerCase(),
      walletAddress,
      devicePubKey,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

/**
 * DELETE /test-users/:handle
 * Deactivate a test user
 */
router.delete('/:handle', async (req, res, next) => {
  try {
    const handle = req.params.handle.toLowerCase();

    const result = await pool.query(
      'UPDATE test_users SET is_active = false WHERE handle = $1 RETURNING handle',
      [handle]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test user not found' });
    }

    res.json({ message: 'Test user deactivated' });
  } catch (error) {
    next(error);
  }
});

} else {
  // In production, return 403 for all test user routes
  router.use((req, res) => {
    res.status(403).json({ error: 'Test users API disabled in production' });
  });
}

export default router;

