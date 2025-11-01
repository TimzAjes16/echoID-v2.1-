import express from 'express';
import { z } from 'zod';
import { getPool } from '../db/index.js';
import { getTransactionStatus } from '../services/blockchain.js';

const router = express.Router();
const pool = getPool();

// Validation schema
const monitorTransactionSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  chainId: z.number().int(),
});

/**
 * POST /transactions/monitor
 * Monitor transaction status
 */
router.post('/monitor', async (req, res, next) => {
  try {
    const data = monitorTransactionSchema.parse(req.body);
    const { txHash, chainId } = data;

    // Check if we have this transaction in database
    const dbResult = await pool.query(
      'SELECT * FROM transactions WHERE tx_hash = $1',
      [txHash]
    );

    let transaction = dbResult.rows[0];

    // If not in database, check blockchain
    if (!transaction) {
      const status = await getTransactionStatus(txHash, chainId);
      
      // Store in database
      await pool.query(
        `INSERT INTO transactions (tx_hash, chain_id, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (tx_hash) DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP`,
        [txHash, chainId, status.status]
      );

      return res.json(status);
    }

    // If in database, check if we need to update status
    if (transaction.status === 'pending') {
      const status = await getTransactionStatus(txHash, chainId);
      
      await pool.query(
        'UPDATE transactions SET status = $1, block_number = $2, updated_at = CURRENT_TIMESTAMP WHERE tx_hash = $3',
        [status.status, status.blockNumber, txHash]
      );

      return res.json(status);
    }

    // Return stored transaction
    res.json({
      status: transaction.status,
      blockNumber: transaction.block_number ? Number(transaction.block_number) : undefined,
      consentId: transaction.consent_id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

export default router;

