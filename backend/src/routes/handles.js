import express from 'express';
import { z } from 'zod';
import { getPool } from '../db/index.js';
import { verifySignature } from '../utils/crypto.js';

const router = express.Router();
const pool = getPool();

// Validation schemas
const claimHandleSchema = z.object({
  handle: z.string().min(1).max(255).regex(/^[a-z0-9_]+$/i, 'Handle can only contain letters, numbers, and underscores'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  devicePubKey: z.string().min(1),
  signature: z.string().min(1),
});

const challengeSchema = z.object({
  handle: z.string().min(1),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

const verifySchema = z.object({
  handle: z.string().min(1),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(1),
  challenge: z.string().min(1),
});

/**
 * POST /handles/claim
 * Claim a new handle
 */
router.post('/claim', async (req, res, next) => {
  try {
    const data = claimHandleSchema.parse(req.body);
    const { handle, walletAddress, devicePubKey, signature } = data;

    // Check if handle already exists
    const existing = await pool.query(
      'SELECT handle FROM handles WHERE handle = $1',
      [handle.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Handle already exists' });
    }

    // Check if wallet address already has a handle
    const existingWallet = await pool.query(
      'SELECT handle FROM handles WHERE wallet_address = $1',
      [walletAddress]
    );

    if (existingWallet.rows.length > 0) {
      return res.status(409).json({ error: 'Wallet address already has a handle' });
    }

    // Insert new handle
    await pool.query(
      'INSERT INTO handles (handle, wallet_address, device_pub_key, signature) VALUES ($1, $2, $3, $4)',
      [handle.toLowerCase(), walletAddress, devicePubKey, signature]
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
 * GET /handles/:handle
 * Resolve handle to wallet address
 */
router.get('/:handle', async (req, res, next) => {
  try {
    const handle = req.params.handle.toLowerCase();

    const result = await pool.query(
      'SELECT handle, wallet_address, device_pub_key FROM handles WHERE handle = $1',
      [handle]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Handle not found' });
    }

    const row = result.rows[0];
    res.json({
      handle: row.handle,
      walletAddress: row.wallet_address,
      devicePubKey: row.device_pub_key,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /handles/challenge
 * Get signature challenge for handle verification
 */
router.post('/challenge', async (req, res, next) => {
  try {
    const data = challengeSchema.parse(req.body);
    const { handle, walletAddress } = data;

    // Check if handle exists
    const result = await pool.query(
      'SELECT wallet_address FROM handles WHERE handle = $1',
      [handle.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Handle not found' });
    }

    // Verify wallet address matches
    if (result.rows[0].wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Wallet address does not match handle' });
    }

    // Generate challenge
    const timestamp = Date.now();
    const challenge = `Verify ownership of @${handle} for ${walletAddress} at ${timestamp}`;

    res.json({ challenge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

/**
 * POST /handles/verify
 * Verify handle signature
 */
router.post('/verify', async (req, res, next) => {
  try {
    const data = verifySchema.parse(req.body);
    const { handle, walletAddress, signature, challenge } = data;

    // Check if handle exists
    const result = await pool.query(
      'SELECT wallet_address FROM handles WHERE handle = $1',
      [handle.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Handle not found' });
    }

    // Verify wallet address matches
    if (result.rows[0].wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.json({ valid: false });
    }

    // Verify signature (you'll need to implement verifySignature with ethers)
    const isValid = await verifySignature(walletAddress, challenge, signature);

    res.json({ valid: isValid });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

export default router;

