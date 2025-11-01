/**
 * Test wallet balances for development/testing
 * These are mock balances for test users - in production, balances come from blockchain
 */

export interface TestWalletBalance {
  address: string;
  balanceETH: string;
  chainId: number;
}

/**
 * Test wallet balances (for development only)
 * In production, balances are fetched from blockchain
 */
export const TEST_WALLET_BALANCES: Record<string, TestWalletBalance> = {
  '0x9cA7a3B8F2D4e1F6a5B9C8D7E4F3A2B1C0D9E8F7': {
    address: '0x9cA7a3B8F2D4e1F6a5B9C8D7E4F3A2B1C0D9E8F7',
    balanceETH: '0.1',
    chainId: 8453, // Base mainnet
  },
};

/**
 * Test wallet by handle (for automatic wallet assignment)
 * When a test user logs in, they get their specific test wallet
 */
export const TEST_WALLET_BY_HANDLE: Record<string, string> = {
  'katie': '0x9cA7a3B8F2D4e1F6a5B9C8D7E4F3A2B1C0D9E8F7',
};

/**
 * Get test wallet address for a handle
 */
export function getTestWalletAddress(handle: string): string | null {
  return TEST_WALLET_BY_HANDLE[handle.toLowerCase()] || null;
}

/**
 * Get test wallet balance if available
 * Also checks by handle - if user is logged in as a test user (like katie),
 * return their test balance regardless of actual wallet address
 * Returns null if not a test wallet or in production
 */
export function getTestWalletBalance(address: string, chainId: number = 8453, handle?: string): string | null {
  console.log(`[getTestWalletBalance] Checking:`, { address, chainId, handle });
  
  // First check by handle - if user is test user, return their test balance
  if (handle) {
    const handleLower = handle.toLowerCase().trim();
    console.log(`[getTestWalletBalance] Checking by handle: ${handleLower}`);
    const testWalletAddress = getTestWalletAddress(handleLower);
    console.log(`[getTestWalletBalance] Test wallet address for handle:`, testWalletAddress);
    
    if (testWalletAddress) {
      const handleBalance = TEST_WALLET_BALANCES[testWalletAddress.toLowerCase()];
      console.log(`[getTestWalletBalance] Handle balance found:`, handleBalance);
      if (handleBalance && handleBalance.chainId === chainId) {
        console.log(`[getTestWalletBalance] Returning handle balance: ${handleBalance.balanceETH} ETH`);
        return handleBalance.balanceETH;
      }
    }
  }

  // Check by address (fallback)
  const addressLower = address.toLowerCase();
  console.log(`[getTestWalletBalance] Checking by address: ${addressLower}`);
  const testBalance = TEST_WALLET_BALANCES[addressLower];
  console.log(`[getTestWalletBalance] Address balance found:`, testBalance);
  if (testBalance && testBalance.chainId === chainId) {
    console.log(`[getTestWalletBalance] Returning address balance: ${testBalance.balanceETH} ETH`);
    return testBalance.balanceETH;
  }

  console.log(`[getTestWalletBalance] No test balance found`);
  return null;
}

/**
 * Check if address is a test wallet with known balance
 */
export function isTestWallet(address: string): boolean {
  return address.toLowerCase() in TEST_WALLET_BALANCES;
}
