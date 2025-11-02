/**
 * Mock test users for MVP testing
 * In production, these would be fetched from the backend
 */

export interface TestUser {
  handle: string;
  walletAddress: string;
  walletPrivateKey: string; // Private key for test users (for signing transactions) - required for test users
  devicePubKey: string;
  name?: string;
  balanceETH?: string; // Test balance for development (defaults to '0' if not specified)
}

export const TEST_USERS: TestUser[] = [
  {
    handle: 'sarah',
    walletAddress: '0x408D2F87baF586bC3099Fe56F0C19e6A23F7275b',
    walletPrivateKey: '0x8bed4837be28f7951a9ab137f870c3649490f137134da465eba5fb076a9a9c0b',
    devicePubKey: 'N8Ayuv1NP2FtDchQnr/wszNXPd9tJlbpE3r4ye6l/kU=',
    name: 'Sarah',
    balanceETH: '0.1', // Sarah has 0.1 ETH for testing
  },
  {
    handle: 'mike',
    walletAddress: '0x8Bd195b826f8079eb5A18d3D6161466c0B5D75a8',
    walletPrivateKey: '0x272ce6e6265d0988661c0173e3cd11f878144124f922a729bcfc16ec0f90b4ce',
    devicePubKey: 'WukkTos1tmQTwHO2LDYc/KILh/0M7N1wzxX1wycxzzE=',
    name: 'Mike',
    balanceETH: '0', // Mike has no balance
  },
  {
    handle: 'katie',
    walletAddress: '0x0EF2351b8D27E30E192928F6e80F7319e14BA136',
    walletPrivateKey: '0xb6cde1a69ad68a85af6ebb1c6733a092fce2b703a61ce117d7366f337abc91e9',
    devicePubKey: '4NNBWBq43Th23FCXuZgbN2Snjk7C+vRbnL5rWYqkREo=',
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

/**
 * Get test user by wallet address
 * Returns the test user if the address belongs to one, otherwise null
 */
export function getTestUserByAddress(address: string): TestUser | null {
  const addressLower = address.toLowerCase();
  const testUser = TEST_USERS.find(
    (u) => u.walletAddress.toLowerCase() === addressLower
  );
  
  return testUser || null;
}

