/**
 * Handle (username) resolution and verification
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.echoid.xyz';
const USE_MOCK_MODE = !process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL === 'https://api.echoid.xyz';
const FETCH_TIMEOUT = 5000; // 5 seconds

// Helper to add timeout to fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - backend may be unavailable');
    }
    throw error;
  }
}

export interface HandleMapping {
  handle: string;
  walletAddress: string;
  devicePubKey: string; // base64 encoded
}

/**
 * Claim a unique handle
 */
export async function claimHandle(
  handle: string,
  walletAddress: string,
  devicePubKey: string,
  signature: string
): Promise<HandleMapping> {
  // Mock mode for MVP - allow offline handle creation
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Claiming handle:', handle);
    return {
      handle,
      walletAddress,
      devicePubKey,
    };
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/handles/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle,
        walletAddress,
        devicePubKey,
        signature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to claim handle');
    }

    return response.json();
  } catch (error: any) {
    // If backend is unavailable, allow mock mode
    if (USE_MOCK_MODE || error.message?.includes('timeout') || error.message?.includes('fetch')) {
      console.warn('[MOCK] Backend unavailable, using mock mode:', error.message);
      return {
        handle,
        walletAddress,
        devicePubKey,
      };
    }
    throw error;
  }
}

/**
 * Resolve handle to wallet address and device pubkey
 */
export async function resolveHandle(handle: string): Promise<HandleMapping | null> {
  // Try API first (includes test users from database)
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.echoid.xyz';
  
  if (API_BASE_URL && API_BASE_URL !== 'https://api.echoid.xyz') {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/handles/${encodeURIComponent(handle)}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        return response.json();
      }
      
      if (response.status === 404) {
        return null;
      }
    } catch (error) {
      console.warn('API resolve failed, falling back to local test users:', error);
    }
  }

  // Fallback: Check local test users (for offline development)
  const { getTestUser } = await import('./testUsers');
  const testUser = getTestUser(handle);
  if (testUser) {
    return {
      handle: testUser.handle,
      walletAddress: testUser.walletAddress,
      devicePubKey: testUser.devicePubKey,
    };
  }

  // Mock mode or no match
  return null;
}

/**
 * Generate signature challenge for handle verification
 */
export async function getSignatureChallenge(
  handle: string,
  walletAddress: string
): Promise<string> {
  // Mock mode for MVP
  if (USE_MOCK_MODE) {
    throw new Error('Handle not found (mock mode)');
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/handles/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ handle, walletAddress }),
    });

    if (!response.ok) {
      throw new Error('Failed to get signature challenge');
    }

    const data = await response.json();
    return data.challenge;
  } catch (error: any) {
    // If backend is unavailable, throw error to trigger handle creation
    if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
      throw new Error('Backend unavailable - will create handle in mock mode');
    }
    throw error;
  }
}

/**
 * Verify handle signature
 */
export async function verifyHandleSignature(
  handle: string,
  walletAddress: string,
  signature: string,
  challenge: string
): Promise<boolean> {
  // Mock mode for MVP - skip verification
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Skipping signature verification');
    return true;
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/handles/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle,
        walletAddress,
        signature,
        challenge,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.warn('Verification failed, allowing in mock mode:', error);
    // In mock mode, allow verification to pass
    return USE_MOCK_MODE;
  }
}

