import express from 'express';

const router = express.Router();

/**
 * GET /config
 * Get protocol configuration
 */
router.get('/', (req, res) => {
  res.json({
    protocolFeeWei: process.env.PROTOCOL_FEE_WEI || '1000000000000000', // 0.001 ETH
    treasuryAddress: process.env.TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000',
    defaultChainId: parseInt(process.env.DEFAULT_CHAIN_ID || '8453'),
    supportedChains: [8453, 420, 1101], // Base, Base Nova, Polygon zkEVM
    apiBaseUrl: req.protocol + '://' + req.get('host') + '/api',
  });
});

export default router;

