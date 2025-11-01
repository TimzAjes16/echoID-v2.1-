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

  // Default config
  return {
    protocolFeeWei: parseEther('0.001').toString(), // 0.001 ETH
    treasuryAddress: '0x0000000000000000000000000000000000000000',
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

  // Check if factory address is configured
  const isMockMode = FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000';
  
  if (isMockMode) {
    // Mock mode: Generate a mock consent ID for development/testing
    // In production, this will never be reached as factory address must be set
    console.warn('[MOCK] Factory contract address not configured. Using mock consent creation.');
    console.warn('[MOCK] For production, set EXPO_PUBLIC_FACTORY_ADDRESS environment variable.');
    
    // Generate a mock consent ID based on transaction parameters
    // This allows the app to work in development without a deployed contract
    const mockConsentId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    console.log(`[MOCK] Created mock consent with ID: ${mockConsentId.toString()}`);
    
    return mockConsentId;
  }

  // Check balance before sending transaction
  const publicClientForValidation = getPublicClient(chainId);
  try {
    const balance = await publicClientForValidation.getBalance({ address: from });
    const feeWeiBigInt = BigInt(feeWei);
    // Estimate gas (conservative: 300k gas * 20 gwei = 0.006 ETH)
    const estimatedGas = BigInt(300000);
    const gasPrice = await publicClientForValidation.getGasPrice();
    const estimatedGasCost = estimatedGas * gasPrice;
    const totalRequired = feeWeiBigInt + estimatedGasCost;

    if (balance < totalRequired) {
      const balanceEth = formatEther(balance);
      const requiredEth = formatEther(totalRequired);
      const feeEth = formatEther(feeWeiBigInt);
      const gasEth = formatEther(estimatedGasCost);
      throw new Error(
        `Insufficient balance. Required: ${parseFloat(requiredEth).toFixed(4)} ETH (fee: ${parseFloat(feeEth).toFixed(4)} ETH + gas: ~${parseFloat(gasEth).toFixed(4)} ETH), Available: ${parseFloat(balanceEth).toFixed(4)} ETH`
      );
    }
  } catch (error: any) {
    // If it's our custom balance error, re-throw it
    if (error.message && error.message.includes('Insufficient balance')) {
      throw error;
    }
    // Otherwise, log but continue (gas estimation might fail)
    console.warn('Balance/gas check failed, proceeding anyway:', error);
  }

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

    try {
      txHash = await walletClient.sendTransaction({
        to: FACTORY_ADDRESS,
        value: BigInt(feeWei),
        data,
      });
    } catch (error: any) {
      // Improve error messages for common issues
      if (error.message?.includes('balance') || error.message?.includes('funds')) {
        throw new Error(`Insufficient balance to complete transaction. Please ensure you have enough ETH to cover the protocol fee (${formatFee(feeWei, chainId)}) and gas costs.`);
      }
      throw error;
    }
  } else if (wallet.session) {
    // Use WalletConnect
    try {
      txHash = await sendTransaction(wallet.session, {
        from,
        to: FACTORY_ADDRESS,
        value: feeWei,
        data,
      });
    } catch (error: any) {
      // Improve error messages for common issues
      if (error.message?.includes('balance') || error.message?.includes('funds')) {
        throw new Error(`Insufficient balance to complete transaction. Please ensure you have enough ETH to cover the protocol fee (${formatFee(feeWei, chainId)}) and gas costs.`);
      }
      throw error;
    }
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

  // Check if factory address is configured
  const isMockMode = FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000';
  
  if (isMockMode) {
    console.warn('[MOCK] Factory contract address not configured. Using mock unlock request.');
    // Return mock transaction hash
    const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    console.log(`[MOCK] Mock unlock request transaction: ${mockTxHash}`);
    return mockTxHash;
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

  // Check if factory address is configured
  const isMockMode = FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000';
  
  if (isMockMode) {
    console.warn('[MOCK] Factory contract address not configured. Using mock unlock approval.');
    // Return mock transaction hash
    const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    console.log(`[MOCK] Mock unlock approval transaction: ${mockTxHash}`);
    return mockTxHash;
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

/**
 * Get wallet balance
 * For test wallets (like katie with 0.1 ETH), returns test balance in development mode
 */
export async function getWalletBalance(
  address: Address,
  chainId: number = DEFAULT_CHAIN_ID,
  handle?: string
): Promise<string> {
  console.log(`[getWalletBalance] Called with:`, { address, chainId, handle });
  
  // Check for test user balance first (development only)
  // Priority: handle lookup (most reliable) > address lookup
  try {
    const { getTestUserBalance, getTestUserBalanceByAddress } = await import('./testUsers');
    
    // Try handle-based lookup first (most reliable)
    if (handle) {
      const handleBalance = getTestUserBalance(handle, chainId);
      if (handleBalance !== null) {
        console.log(`[TEST] Using test balance for handle @${handle}: ${handleBalance} ETH`);
        return handleBalance;
      }
    }
    
    // Fallback to address-based lookup
    const addressBalance = getTestUserBalanceByAddress(address, chainId);
    if (addressBalance !== null) {
      console.log(`[TEST] Using test balance for address ${address}: ${addressBalance} ETH`);
      return addressBalance;
    }
    
    console.log(`[TEST] No test balance found for ${address}${handle ? ` (@${handle})` : ''}`);
  } catch (error) {
    console.error('[getWalletBalance] Error checking test balance:', error);
    // Continue to blockchain check
  }

  // Fetch real balance from blockchain
  const publicClient = getPublicClient(chainId);
  
  try {
    console.log(`[getWalletBalance] Fetching from blockchain for ${address}`);
    const balance = await publicClient.getBalance({ address });
    const balanceEth = formatEther(balance);
    console.log(`[getWalletBalance] Blockchain balance: ${balanceEth} ETH`);
    return balanceEth;
  } catch (error) {
    console.error('[getWalletBalance] Failed to get wallet balance:', error);
    throw new Error('Failed to fetch wallet balance');
  }
}

