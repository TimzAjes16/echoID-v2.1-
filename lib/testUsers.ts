/**
 * Mock test users for MVP testing
 * In production, these would be fetched from the backend
 */

export interface TestUser {
  handle: string;
  walletAddress: string;
  devicePubKey: string;
  name?: string;
}

export const TEST_USERS: TestUser[] = [
  {
    handle: 'sarah',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    devicePubKey: 'dGVzdF9kZXZpY2VfcHVia2V5X3NhcmFo',
    name: 'Sarah',
  },
  {
    handle: 'mike',
    walletAddress: '0x8ba1f109551bD432803012645Hac136c22C19',
    devicePubKey: 'dGVzdF9kZXZpY2VfcHVia2V5X21pa2U',
    name: 'Mike',
  },
  {
    handle: 'katie',
    walletAddress: '0x9cA7a3B8F2D4e1F6a5B9C8D7E4F3A2B1C0D9E8F7',
    devicePubKey: 'dGVzdF9kZXZpY2VfcHVia2V5X2thdGll',
    name: 'Katie',
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

