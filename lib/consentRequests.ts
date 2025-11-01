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
  
  // Ensure we have valid handle and address
  const fromHandle = currentUser.profile?.handle?.trim() || 'unknown';
  const fromAddress = currentUser.wallet?.address || '';
  
  if (!fromAddress) {
    throw new Error('Wallet address not available');
  }
  
  // Generate unique ID: timestamp + random string + first 4 chars of fromHandle for extra uniqueness
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  const handlePrefix = fromHandle !== 'unknown' ? fromHandle.substring(0, 4).toLowerCase() : 'unk';
  const request: ConsentRequest = {
    id: `req_${timestamp}_${handlePrefix}_${randomStr}`,
    fromHandle,
    fromAddress,
    template,
    requestedAt: timestamp, // Ensure timestamp is set
    consentData: {
      ...consentData,
      counterpartyHandle,
      counterpartyAddress,
    },
  };
  
  console.log('[createConsentRequest] Created request:', {
    id: request.id,
    fromHandle: request.fromHandle,
    fromAddress: request.fromAddress,
    template: request.template,
    requestedAt: request.requestedAt,
  });

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
      
      // Backend will send push notification and store request
      // When notification is received, fetch request from backend using requestId
    } catch (error: any) {
      console.error('[API] Failed to send consent request:', error.message);
      
      // Fallback: Only send notification and add request if counterparty is currently logged in
      const counterpartyProfile = useStore.getState().profile;
      if (counterpartyProfile.handle?.toLowerCase() === counterpartyHandle.toLowerCase()) {
        // Store the full request FIRST, then send notification
        // This ensures the full request is available when notification is received
        useStore.getState().addConsentRequest(request);
        await sendConsentRequestNotification(request);
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
    
    // IMPORTANT: Store the full request FIRST before sending notification
    // This ensures when notification listener receives the notification,
    // it can find the full request data in the store
    if (currentHandle === targetHandle) {
      // User is logged in with target handle - add request to their store
      useStore.getState().addConsentRequest(request);
      console.log(`[MOCK] Full consent request stored for @${targetHandle}`);
      
      // Then send notification
      await sendConsentRequestNotification(request);
      console.log(`[MOCK] Consent request notification sent to @${targetHandle}`);
    } else if (isTestUser(counterpartyHandle)) {
      // For test users in mock mode, store request but only notify if they're logged in
      // Store it anyway so if they log in later, we can sync
      useStore.getState().addConsentRequest(request);
      await sendConsentRequestNotification(request);
      console.log(`[MOCK] Consent request stored for test user @${targetHandle} (may need to log in to see it)`);
    } else {
      // Store request locally even if user not logged in (for future sync)
      useStore.getState().addConsentRequest(request);
      await sendConsentRequestNotification(request);
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

  // Check balance before attempting transaction
  try {
    const { getWalletBalance } = await import('./sdk');
    const balance = await getWalletBalance(
      wallet.address as any,
      wallet.chainId || 8453
    );
    const balanceEth = parseFloat(balance);
    const feeEth = parseFloat(config.protocolFeeWei) / 1e18;
    const estimatedGasEth = 0.002; // Conservative estimate
    const totalRequired = feeEth + estimatedGasEth;

    if (balanceEth < totalRequired) {
      throw new Error(
        `Insufficient balance. Required: ${totalRequired.toFixed(4)} ETH (fee: ${feeEth.toFixed(4)} ETH + gas: ~${estimatedGasEth.toFixed(4)} ETH), Available: ${balanceEth.toFixed(4)} ETH`
      );
    }
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error.message && error.message.includes('Insufficient balance')) {
      throw error;
    }
    // Otherwise, log warning but continue (balance check might fail on testnets)
    console.warn('Balance check failed, proceeding anyway:', error);
  }

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

