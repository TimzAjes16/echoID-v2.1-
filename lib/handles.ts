/**
 * Handle (username) resolution and verification
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.echoid.xyz';

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
  const response = await fetch(`${API_BASE_URL}/handles/claim`, {
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
}

/**
 * Resolve handle to wallet address and device pubkey
 */
export async function resolveHandle(handle: string): Promise<HandleMapping | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/handles/${encodeURIComponent(handle)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to resolve handle');
    }

    return response.json();
  } catch (error) {
    console.error('Error resolving handle:', error);
    return null;
  }
}

/**
 * Generate signature challenge for handle verification
 */
export async function getSignatureChallenge(
  handle: string,
  walletAddress: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/handles/challenge`, {
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
  const response = await fetch(`${API_BASE_URL}/handles/verify`, {
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
}

