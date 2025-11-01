import { createWalletClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as SecureStore from 'expo-secure-store';
import { generatePrivateKey } from 'viem/accounts';

const WALLET_STORAGE_KEY = 'local_wallet_private_key';

/**
 * Generate a new wallet and store private key securely
 */
export async function createLocalWallet(): Promise<{
  address: Address;
  privateKey: `0x${string}`;
}> {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  // Store private key in SecureStore
  await SecureStore.setItemAsync(WALLET_STORAGE_KEY, privateKey);
  
  return {
    address: account.address,
    privateKey,
  };
}

/**
 * Get or create local wallet
 */
export async function getLocalWallet(): Promise<{
  address: Address;
  privateKey: `0x${string}`;
} | null> {
  try {
    const storedKey = await SecureStore.getItemAsync(WALLET_STORAGE_KEY);
    if (storedKey) {
      const account = privateKeyToAccount(storedKey as `0x${string}`);
      return {
        address: account.address,
        privateKey: storedKey as `0x${string}`,
      };
    }
  } catch (error) {
    console.warn('Failed to retrieve wallet, creating new one:', error);
  }
  
  // If no wallet exists, create one
  return createLocalWallet();
}

/**
 * Get wallet client for signing transactions
 */
export async function getWalletClient() {
  const wallet = await getLocalWallet();
  if (!wallet) return null;
  
  return createWalletClient({
    account: privateKeyToAccount(wallet.privateKey),
    chain: base,
    transport: http(),
  });
}

/**
 * Sign message with local wallet (personal_sign format)
 */
export async function signMessageLocal(message: string): Promise<`0x${string}`> {
  const wallet = await getLocalWallet();
  if (!wallet) {
    throw new Error('No local wallet found');
  }
  
  const account = privateKeyToAccount(wallet.privateKey);
  
  // Create wallet client for signing
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });
  
  // Sign message using personal_sign format
  return walletClient.signMessage({
    message,
  });
}

/**
 * Get local wallet address
 */
export async function getLocalWalletAddress(): Promise<Address | null> {
  const wallet = await getLocalWallet();
  return wallet?.address || null;
}

/**
 * Check if local wallet exists
 */
export async function hasLocalWallet(): Promise<boolean> {
  try {
    const storedKey = await SecureStore.getItemAsync(WALLET_STORAGE_KEY);
    return !!storedKey;
  } catch {
    return false;
  }
}

