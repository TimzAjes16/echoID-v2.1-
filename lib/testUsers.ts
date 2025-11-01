/**
 * Mock test users for MVP testing
 * In production, these would be fetched from the backend
 */

export interface TestUser {
  handle: string;
  walletAddress: string;
  devicePubKey: string;
  name?: string;
  balanceETH?: string; // Test balance for development (defaults to '0' if not specified)
}

export const TEST_USERS: TestUser[] = [
  {
    handle: 'sarah',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    devicePubKey: 'dGVzdF9kZXZpY2VfcHVia2V5X3NhcmFo',
    name: 'Sarah',
    balanceETH: '0.1', // Sarah has no balance
  },
  {
    handle: 'mike',
    walletAddress: '0x8ba1f109551bD432803012645Hac136c22C19',
    devicePubKey: 'dGVzdF9kZXZpY2VfcHVia2V5X21pa2U',
    name: 'Mike',
    balanceETH: '0', // Mike has no balance
  },
  {
    handle: 'katie',
    walletAddress: '0x9cA7a3B8F2D4e1F6a5B9C8D7E4F3A2B1C0D9E8F7',
    devicePubKey: 'dGVzdF9kZXZpY2VfcHVia2V5X2thdGll',
    name: 'Katie',
    balanceETH: '0.1', // Katie has 0.1 ETH for testing
  },
];

/**
 * Get test user by handle
 */
export function getTestUser(handle: string): TestUser | undefined {
  return TEST_USERS.find((u) => u.handle.toLowerCase() === handle.toLowerCase());
}

/**
 * Check if handle is a test user
 */
export function isTestUser(handle: string): boolean {
  return TEST_USERS.some((u) => u.handle.toLowerCase() === handle.toLowerCase());
}

/**
 * Get all test user handles
 */
export function getTestUserHandles(): string[] {
  return TEST_USERS.map((u) => u.handle);
}

/**
 * Get test user balance by handle
 * Returns the balanceETH if the handle is a test user, otherwise null
 */
export function getTestUserBalance(handle: string, chainId: number = 8453): string | null {
  const testUser = getTestUser(handle);
  if (!testUser) {
    return null;
  }
  
  // Return balance if specified, otherwise return '0'
  return testUser.balanceETH || '0';
}

/**
 * Get test user balance by wallet address
 * Returns the balanceETH if the address belongs to a test user, otherwise null
 */
export function getTestUserBalanceByAddress(address: string, chainId: number = 8453): string | null {
  const addressLower = address.toLowerCase();
  const testUser = TEST_USERS.find(
    (u) => u.walletAddress.toLowerCase() === addressLower
  );
  
  if (!testUser) {
    return null;
  }
  
  // Return balance if specified, otherwise return '0'
  return testUser.balanceETH || '0';
}

