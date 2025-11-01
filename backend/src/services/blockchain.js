import { ethers } from 'ethers';

/**
 * Get transaction status from blockchain
 */
export async function getTransactionStatus(txHash, chainId) {
  const rpcUrl = chainId === 8453 
    ? (process.env.BASE_RPC_URL || 'https://mainnet.base.org')
    : (process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org');

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return { status: 'pending' };
    }

    if (receipt.status === 1) {
      return {
        status: 'confirmed',
        blockNumber: Number(receipt.blockNumber),
        receipt,
      };
    } else {
      return {
        status: 'failed',
        blockNumber: Number(receipt.blockNumber),
        receipt,
      };
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return { status: 'pending', error: error.message };
  }
}

