/**
 * Transaction Monitoring Utilities
 * Monitors blockchain transactions and extracts consent IDs
 */

import { createPublicClient, http, Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { decodeEventLog } from 'viem';

const FACTORY_ADDRESS = (process.env.EXPO_PUBLIC_FACTORY_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as Address;

const DEFAULT_CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_DEFAULT_CHAIN_ID || '8453');

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: bigint;
  consentId?: bigint;
  error?: string;
}

/**
 * Get public client for the chain
 */
function getPublicClient(chainId: number = DEFAULT_CHAIN_ID) {
  const chain = chainId === 8453 ? base : baseSepolia;
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Monitor transaction and extract consent ID from events
 */
export async function monitorTransaction(
  txHash: `0x${string}`,
  chainId: number = DEFAULT_CHAIN_ID,
  maxAttempts: number = 20
): Promise<TransactionStatus> {
  const publicClient = getPublicClient(chainId);

  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Check transaction receipt
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      
      if (receipt.status === 'reverted') {
        return {
          status: 'failed',
          error: 'Transaction reverted',
          blockNumber: Number(receipt.blockNumber),
          gasUsed: receipt.gasUsed,
        };
      }

      // Extract consent ID from event logs
      const consentId = extractConsentIdFromReceipt(receipt.logs, FACTORY_ADDRESS);

      return {
        status: 'confirmed',
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed,
        consentId,
      };
    } catch (error: any) {
      // Transaction not yet mined
      if (error.message?.includes('Transaction receipt not found')) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        continue;
      }
      
      // Other error
      return {
        status: 'failed',
        error: error.message || 'Unknown error',
      };
    }
  }

  // Timeout
  return {
    status: 'pending',
    error: 'Transaction monitoring timeout',
  };
}

/**
 * Extract consent ID from transaction receipt logs
 */
export function extractConsentIdFromReceipt(logs: any[], factoryAddress: Address): bigint | undefined {
  const eventAbi = {
    name: 'ConsentCreated',
    type: 'event',
    inputs: [
      { indexed: true, name: 'consentId', type: 'uint256' },
      { indexed: true, name: 'party1', type: 'address' },
      { indexed: true, name: 'party2', type: 'address' },
    ],
  } as const;

  for (const log of logs) {
    if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
      try {
        const decoded = decodeEventLog({
          abi: [eventAbi],
          data: log.data,
          topics: log.topics,
        });
        
        if (decoded.eventName === 'ConsentCreated') {
          return decoded.args.consentId as bigint;
        }
      } catch {
        // Event doesn't match, try next log
        continue;
      }
    }
  }

  return undefined;
}

/**
 * Get transaction status (simple check)
 */
export async function getTransactionStatus(
  txHash: `0x${string}`,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<'pending' | 'confirmed' | 'failed'> {
  const publicClient = getPublicClient(chainId);

  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    return receipt.status === 'success' ? 'confirmed' : 'failed';
  } catch {
    return 'pending';
  }
}

/**
 * Wait for transaction confirmation with callback
 */
export async function waitForTransaction(
  txHash: `0x${string}`,
  chainId: number = DEFAULT_CHAIN_ID,
  onStatusUpdate?: (status: TransactionStatus) => void
): Promise<TransactionStatus> {
  const status = await monitorTransaction(txHash, chainId);
  
  if (onStatusUpdate) {
    onStatusUpdate(status);
  }

  return status;
}

