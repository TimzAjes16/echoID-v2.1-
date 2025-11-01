import { createPublicClient, createWalletClient, http, formatEther, parseEther, encodeFunctionData, decodeEventLog, Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import type { SessionTypes } from '@walletconnect/types';
import { sendTransaction } from './walletconnect';
import { getWalletClient, getLocalWallet } from './wallet';
import { privateKeyToAccount } from 'viem/accounts';

// Placeholder ABI for ConsentFactory
const CONSENT_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'voiceHash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'faceHash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'deviceHash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'geoHash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'utcHash',
        type: 'bytes32',
      },
      {
        internalType: 'uint8',
        name: 'coercionLevel',
        type: 'uint8',
      },
      {
        internalType: 'address',
        name: 'counterparty',
        type: 'address',
      },
      {
        internalType: 'uint8',
        name: 'unlockMode',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'unlockWindow',
        type: 'uint256',
      },
    ],
    name: 'createConsent',
    outputs: [
      {
        internalType: 'uint256',
        name: 'consentId',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'consentId',
        type: 'uint256',
      },
    ],
    name: 'requestUnlock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'consentId',
        type: 'uint256',
      },
    ],
    name: 'approveUnlock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const FACTORY_ADDRESS = (process.env.EXPO_PUBLIC_FACTORY_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as Address;

const DEFAULT_CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_DEFAULT_CHAIN_ID || '8453'); // Base

export enum UnlockMode {
  ONE_SHOT = 0,
  WINDOWED = 1,
  SCHEDULED = 2,
}

export interface ConsentParams {
  voiceHash: string;
  faceHash: string;
  deviceHash: string;
  geoHash: string;
  utcHash: string;
  coercionLevel: number;
  counterparty: Address;
  unlockMode: UnlockMode;
  unlockWindow?: number; // seconds for windowed unlock
}

export interface RemoteConfig {
  protocolFeeWei: string;
  treasuryAddress: string;
  defaultChainId: number;
  supportedChains: number[];
  apiBaseUrl: string;
}

/**
 * Fetch remote configuration
 */
export async function fetchRemoteConfig(): Promise<RemoteConfig> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.echoid.xyz';
  
  try {
    const response = await fetch(`${apiBaseUrl}/config`);
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch remote config, using defaults:', error);
  }

  // Default config - use environment variables if available, otherwise defaults
  const protocolFeeWei = process.env.EXPO_PUBLIC_PROTOCOL_FEE_WEI 
    ? process.env.EXPO_PUBLIC_PROTOCOL_FEE_WEI 
    : parseEther('0.001').toString(); // Default: 0.001 ETH

  const treasuryAddress = (process.env.EXPO_PUBLIC_TREASURY_ADDRESS ||
    '0x0000000000000000000000000000000000000000') as Address;

  return {
    protocolFeeWei,
    treasuryAddress,
    defaultChainId: DEFAULT_CHAIN_ID,
    supportedChains: [8453, 420, 1101], // Base, Base Nova, Polygon zkEVM
    apiBaseUrl,
  };
}

/**
 * Get public client for the chain
 */
export function getPublicClient(chainId: number = DEFAULT_CHAIN_ID) {
  const chain = chainId === 8453 ? base : baseSepolia;
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Convert hash string to bytes32
 */
function hashToBytes32(hash: string): `0x${string}` {
  // Remove 0x prefix if present, pad to 64 chars, add 0x
  const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash;
  return `0x${cleanHash.padStart(64, '0').slice(0, 64)}` as `0x${string}`;
}

/**
 * Create consent on-chain
 */
export async function createConsent(
  wallet: { session: SessionTypes.Structured | null; address: string | null; chainId: number | null; isLocal: boolean },
  params: ConsentParams,
  feeWei: string
): Promise<bigint> {
  const chainId = wallet.chainId || DEFAULT_CHAIN_ID;
  const from = wallet.address as Address;
  
  if (!from) {
    throw new Error('No wallet address');
  }

  const data = encodeFunctionData({
    abi: CONSENT_FACTORY_ABI,
    functionName: 'createConsent',
    args: [
      hashToBytes32(params.voiceHash),
      hashToBytes32(params.faceHash),
      hashToBytes32(params.deviceHash),
      hashToBytes32(params.geoHash),
      hashToBytes32(params.utcHash),
      params.coercionLevel,
      params.counterparty,
      params.unlockMode,
      params.unlockWindow || BigInt(0),
    ],
  });

  let txHash: string;

  if (wallet.isLocal) {
    // Use local wallet to sign and send transaction
    const localWallet = await getLocalWallet();
    if (!localWallet) {
      throw new Error('Local wallet not found');
    }

    const account = privateKeyToAccount(localWallet.privateKey);
    const walletClient = createWalletClient({
      account,
      chain: chainId === 8453 ? base : baseSepolia,
      transport: http(),
    });

    txHash = await walletClient.sendTransaction({
      to: FACTORY_ADDRESS,
      value: BigInt(feeWei),
      data,
    });
  } else if (wallet.session) {
    // Use WalletConnect
    txHash = await sendTransaction(wallet.session, {
      from,
      to: FACTORY_ADDRESS,
      value: feeWei,
      data,
    });
  } else {
    throw new Error('No wallet available');
  }

  // Wait for transaction and extract consentId from events
  const publicClient = getPublicClient(chainId);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

  // Extract consentId from receipt logs
  // In production, decode the ConsentCreated event from the factory contract
  // Event signature: ConsentCreated(uint256 indexed consentId, address indexed party1, address indexed party2)
  try {
    // Decode event logs
    const eventAbi = {
      name: 'ConsentCreated',
      type: 'event',
      inputs: [
        { indexed: true, name: 'consentId', type: 'uint256' },
        { indexed: true, name: 'party1', type: 'address' },
        { indexed: true, name: 'party2', type: 'address' },
      ],
    } as const;

    const logs = receipt.logs;
    for (const log of logs) {
      if (log.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase()) {
        // Try to decode the event
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
  } catch (error) {
    console.warn('Failed to decode ConsentCreated event, using fallback:', error);
  }

  // Fallback: Extract from transaction hash (less reliable)
  // In production, this should never be used - the event should always be decoded
  const consentId = BigInt('0x' + txHash.slice(2, 18).padStart(16, '0'));
  console.warn('[FALLBACK] Using transaction hash to derive consentId. This should not happen in production.');
  
  return consentId;
}

/**
 * Request unlock
 */
export async function requestUnlock(
  wallet: { session: SessionTypes.Structured | null; address: string | null; chainId: number | null; isLocal: boolean },
  consentId: bigint
): Promise<string> {
  const chainId = wallet.chainId || DEFAULT_CHAIN_ID;
  const from = wallet.address as Address;
  
  if (!from) {
    throw new Error('No wallet address');
  }

  const data = encodeFunctionData({
    abi: CONSENT_FACTORY_ABI,
    functionName: 'requestUnlock',
    args: [consentId],
  });

  if (wallet.isLocal) {
    const localWallet = await getLocalWallet();
    if (!localWallet) {
      throw new Error('Local wallet not found');
    }

    const account = privateKeyToAccount(localWallet.privateKey);
    const walletClient = createWalletClient({
      account,
      chain: chainId === 8453 ? base : baseSepolia,
      transport: http(),
    });

    return walletClient.sendTransaction({
      to: FACTORY_ADDRESS,
      value: BigInt(0),
      data,
    });
  } else if (wallet.session) {
    return sendTransaction(wallet.session, {
      from,
      to: FACTORY_ADDRESS,
      value: '0x0',
      data,
    });
  } else {
    throw new Error('No wallet available');
  }
}

/**
 * Approve unlock
 */
export async function approveUnlock(
  wallet: { session: SessionTypes.Structured | null; address: string | null; chainId: number | null; isLocal: boolean },
  consentId: bigint
): Promise<string> {
  const chainId = wallet.chainId || DEFAULT_CHAIN_ID;
  const from = wallet.address as Address;
  
  if (!from) {
    throw new Error('No wallet address');
  }

  const data = encodeFunctionData({
    abi: CONSENT_FACTORY_ABI,
    functionName: 'approveUnlock',
    args: [consentId],
  });

  if (wallet.isLocal) {
    const localWallet = await getLocalWallet();
    if (!localWallet) {
      throw new Error('Local wallet not found');
    }

    const account = privateKeyToAccount(localWallet.privateKey);
    const walletClient = createWalletClient({
      account,
      chain: chainId === 8453 ? base : baseSepolia,
      transport: http(),
    });

    return walletClient.sendTransaction({
      to: FACTORY_ADDRESS,
      value: BigInt(0),
      data,
    });
  } else if (wallet.session) {
    return sendTransaction(wallet.session, {
      from,
      to: FACTORY_ADDRESS,
      value: '0x0',
      data,
    });
  } else {
    throw new Error('No wallet available');
  }
}

/**
 * Format fee for display
 */
export function formatFee(feeWei: string, chainId: number = DEFAULT_CHAIN_ID): string {
  const eth = formatEther(feeWei);
  const symbol = chainId === 8453 ? 'ETH' : 'ETH';
  return `${eth} ${symbol}`;
}

