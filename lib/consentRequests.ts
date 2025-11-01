import { Consent, ConsentRequest } from '../state/useStore';
import { sendConsentRequestNotification } from './notifications';
import { useStore } from '../state/useStore';

/**
 * Create and send a consent request to a counterparty
 */
export async function createConsentRequest(
  counterpartyHandle: string,
  counterpartyAddress: string,
  template: string,
  consentData: any
): Promise<void> {
  const currentUser = useStore.getState();
  const request: ConsentRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fromHandle: currentUser.profile.handle || 'unknown',
    fromAddress: currentUser.wallet.address || '',
    template,
    requestedAt: Date.now(),
    consentData: {
      ...consentData,
      counterpartyHandle,
      counterpartyAddress,
    },
  };

  // Send via backend API (handles both test users and regular users from database)
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.echoid.xyz';
  
  if (API_BASE_URL && API_BASE_URL !== 'https://api.echoid.xyz') {
    try {
      // Call backend API directly
      const response = await fetch(`${API_BASE_URL}/consent-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromHandle: request.fromHandle,
          fromAddress: request.fromAddress,
          toHandle: counterpartyHandle,
          template: request.template,
          consentData: request.consentData,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      console.log(`[API] Consent request sent to @${counterpartyHandle} via backend`);
    } catch (error: any) {
      console.error('[API] Failed to send consent request:', error.message);
      
      // Fallback: Only send notification and add request if counterparty is currently logged in
      const counterpartyProfile = useStore.getState().profile;
      if (counterpartyProfile.handle?.toLowerCase() === counterpartyHandle.toLowerCase()) {
        // Only send notification to the actual recipient
        await sendConsentRequestNotification(request);
        useStore.getState().addConsentRequest(request);
        console.log(`[FALLBACK] Consent request added for logged-in user @${counterpartyHandle}`);
      } else {
        console.log(`[FALLBACK] Backend unavailable, counterparty @${counterpartyHandle} not logged in`);
      }
    }
  } else {
    // Mock mode - backend not configured
    // Check if counterparty is a test user or the currently logged in user
    const { isTestUser } = await import('./testUsers');
    const currentProfile = useStore.getState().profile;
    const currentHandle = currentProfile.handle?.toLowerCase();
    const targetHandle = counterpartyHandle.toLowerCase();
    
    // Send notification to the correct user
    await sendConsentRequestNotification(request);
    
    // If the target handle matches current user's handle, add the request
    if (currentHandle === targetHandle) {
      useStore.getState().addConsentRequest(request);
      console.log(`[MOCK] Consent request added for logged-in user @${targetHandle}`);
    } else if (isTestUser(counterpartyHandle)) {
      // For test users in mock mode, we still store locally but they won't see it
      // unless they're logged in with that handle
      console.log(`[MOCK] Consent request created for test user @${targetHandle} (user must be logged in to see it)`);
    } else {
      console.log(`[MOCK] Backend not configured, request stored locally for @${targetHandle}`);
    }
  }
}

/**
 * Accept a consent request and create the consent on-chain
 */
export async function acceptConsentRequest(request: ConsentRequest): Promise<Consent> {
  const { wallet, config } = useStore.getState();
  
  if (!wallet.address || !config) {
    throw new Error('Wallet or config not available');
  }

  // Extract consent data from request
  const consentData = request.consentData;
  
  if (!consentData) {
    console.error('Consent request data:', JSON.stringify(request, null, 2));
    throw new Error('Consent data is missing from request');
  }

  // Validate required fields with better error messages
  if (!consentData.voiceHash) {
    console.error('Missing voiceHash in consentData:', Object.keys(consentData));
    throw new Error('Invalid consent data: missing voiceHash');
  }
  if (!consentData.faceHash) {
    console.error('Missing faceHash in consentData:', Object.keys(consentData));
    throw new Error('Invalid consent data: missing faceHash');
  }
  if (!consentData.deviceHash) {
    console.error('Missing deviceHash in consentData:', Object.keys(consentData));
    throw new Error('Invalid consent data: missing deviceHash');
  }

  // For MVP: The requester has already done their verification
  // The acceptor needs to do their own verification in a real flow
  // For now, we'll create the consent on-chain with the requester's data

  // Create consent on-chain
  const { createConsent, UnlockMode } = await import('./sdk');
  const consentId = await createConsent(
    wallet,
    {
      voiceHash: consentData.voiceHash,
      faceHash: consentData.faceHash,
      deviceHash: consentData.deviceHash,
      geoHash: consentData.geoHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      utcHash: consentData.utcHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      coercionLevel: consentData.coercionLevel || 0,
      counterparty: request.fromAddress as any,
      unlockMode: consentData.unlockMode || UnlockMode.WINDOWED,
      unlockWindow: consentData.unlockWindow || 3600,
    },
    config.protocolFeeWei
  );

  // Create consent object (now with on-chain consentId)
  const consent: Consent = {
    id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    consentId,
    counterparty: request.fromAddress,
    counterpartyHandle: request.fromHandle,
    template: request.template,
    createdAt: Date.now(),
    lockedUntil: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    unlockRequested: false,
    unlockApproved: false,
    isUnlocked: false,
    voiceHash: consentData.voiceHash,
    faceHash: consentData.faceHash,
    deviceHash: consentData.deviceHash,
    geoHash: consentData.geoHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
    utcHash: consentData.utcHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
    coercionLevel: consentData.coercionLevel || 0,
    status: 'active',
  };

  // In a real app with full flow:
  // 1. Acceptor would do their own voice/selfie verification
  // 2. Both verifications would be combined
  // 3. Consent would be created on-chain with both parties' data
  // 4. Two SBTs would be minted (one for each party)

  return consent;
}

/**
 * Reject a consent request
 */
export async function rejectConsentRequest(request: ConsentRequest): Promise<void> {
  // In a real app, notify the requester that their request was rejected
  console.log(`[MOCK] Consent request ${request.id} rejected`);
}

