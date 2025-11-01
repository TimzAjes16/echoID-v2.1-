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
  
  // Ensure we have valid handle and address - IMPORTANT: Get fresh state to avoid stale data
  const currentProfile = currentUser.profile;
  const currentWallet = currentUser.wallet;
  
  const fromHandle = (currentProfile?.handle?.trim() || '').toLowerCase();
  const fromAddress = currentWallet?.address || '';
  
  // Debug logging to verify correct user
  console.log('[createConsentRequest] Current user state:', {
    profileHandle: currentProfile?.handle,
    walletAddress: fromAddress,
    fromHandle,
    counterpartyHandle: counterpartyHandle.toLowerCase(),
  });
  
  if (!fromAddress) {
    throw new Error('Wallet address not available');
  }
  
  if (!fromHandle || fromHandle === 'unknown') {
    console.error('[createConsentRequest] ERROR: Invalid fromHandle:', fromHandle);
    throw new Error(`Invalid user handle: ${fromHandle}. Please ensure you are logged in with a valid handle.`);
  }
  
  // Ensure counterparty is different from sender
  if (fromHandle === counterpartyHandle.toLowerCase()) {
    throw new Error('Cannot create consent request to yourself');
  }
  
  // Generate unique ID: timestamp + random string + first 4 chars of fromHandle for extra uniqueness
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  const handlePrefix = fromHandle.substring(0, 4);
  const request: ConsentRequest = {
    id: `req_${timestamp}_${handlePrefix}_${randomStr}`,
    fromHandle, // This should be the sender (e.g., "sarah")
    fromAddress,
    template,
    requestedAt: timestamp, // Ensure timestamp is set
    consentData: {
      ...consentData,
      counterpartyHandle, // This is the recipient (e.g., "katie")
      counterpartyAddress,
    },
  };
  
  console.log('[createConsentRequest] Created request:', {
    id: request.id,
    fromHandle: request.fromHandle,
    fromAddress: request.fromAddress,
    toHandle: counterpartyHandle,
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
    const storeState = useStore.getState();
    const currentLoggedInHandle = storeState.profile?.handle?.trim().toLowerCase();
    const targetHandle = counterpartyHandle.toLowerCase();
    
    console.log(`[MOCK] Request routing check:`, {
      fromHandle: request.fromHandle,
      toHandle: targetHandle,
      currentLoggedInHandle,
      isTestUser: isTestUser(counterpartyHandle),
    });
    
    // CRITICAL: For test users, ALWAYS store the request (they can switch users in mock mode)
    // The request should only appear in the recipient's requests list, not the sender's
    if (isTestUser(counterpartyHandle)) {
      // For test users, ALWAYS store the request so it appears when they log in
      storeState.addConsentRequest(request);
      console.log(`[MOCK] Request stored for test user @${targetHandle} (from @${request.fromHandle})`);
      
      if (currentLoggedInHandle === targetHandle) {
        // Recipient is logged in - send notification
        await sendConsentRequestNotification(request);
        console.log(`[MOCK] Test user @${targetHandle} is logged in - notification sent`);
      } else {
        console.log(`[MOCK] Test user @${targetHandle} not logged in - request will appear when they log in`);
      }
    } else if (currentLoggedInHandle === targetHandle) {
      // Non-test user is logged in - add request to THEIR store only
      storeState.addConsentRequest(request);
      console.log(`[MOCK] Request stored for logged-in recipient @${targetHandle} (from @${request.fromHandle})`);
      
      // Send notification to recipient
      await sendConsentRequestNotification(request);
      console.log(`[MOCK] Notification sent to @${targetHandle}`);
    } else {
      // Non-test user not logged in, backend not configured
      console.log(`[MOCK] User @${targetHandle} not logged in and not a test user - backend required`);
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
    const { useStore } = await import('../state/useStore');
    const { profile } = useStore.getState();
    const balance = await getWalletBalance(
      wallet.address as any,
      wallet.chainId || 8453,
      profile?.handle || undefined
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

  // Get current user info (the acceptor - Katie in this example)
  const { profile: acceptorProfile } = useStore.getState();
  const acceptorHandle = acceptorProfile?.handle;
  const acceptorAddress = wallet.address;

  // Create consent object for acceptor (Katie)
  // This consent shows Katie's perspective: counterparty is Sarah
  console.log('[acceptConsentRequest] Creating consent for acceptor:', {
    acceptorHandle,
    acceptorAddress,
    requestFromHandle: request.fromHandle,
    requestFromAddress: request.fromAddress,
  });
  
  const consentForAcceptor: Consent = {
    id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    consentId,
    counterparty: request.fromAddress, // Sarah's address (the requester)
    counterpartyHandle: request.fromHandle, // Sarah's handle
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
  
  console.log('[acceptConsentRequest] Created consentForAcceptor:', {
    id: consentForAcceptor.id,
    counterparty: consentForAcceptor.counterparty,
    counterpartyHandle: consentForAcceptor.counterpartyHandle,
  });

  // Also create a consent for the requester (Sarah) so she can see it too
  // This consent shows Sarah's perspective: counterparty is Katie
  const consentForRequester: Consent = {
    ...consentForAcceptor,
    id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_requester`,
    counterparty: acceptorAddress!, // Katie's address (the acceptor)
    counterpartyHandle: acceptorHandle || undefined, // Katie's handle
  };

  // Store both consents so both parties can see them
  // In a real app, this would be handled by backend/blockchain querying
  // For now, we'll store the requester's consent in a shared location
  // that will be loaded when they log in
  const storeState = useStore.getState();
  
  // Add acceptor's consent (already done by caller, but ensure it's there)
  // The requester's consent will be added when they next log in (via loadConsents)
  // OR we can add it now if we're in mock mode and both are test users
  
  // Check if requester is a test user - if so, add their consent too
  const { isTestUser } = await import('./testUsers');
  if (isTestUser(request.fromHandle)) {
    // In mock mode with test users, add requester's consent immediately
    await storeState.addConsent(consentForRequester);
    console.log(`[acceptConsentRequest] Added consent for requester @${request.fromHandle}`);
  } else {
    // For non-test users, consent will be loaded from backend/blockchain when they log in
    console.log(`[acceptConsentRequest] Requester @${request.fromHandle} will see consent when they query blockchain/backend`);
  }

  // In a real app with full flow:
  // 1. Acceptor would do their own voice/selfie verification
  // 2. Both verifications would be combined
  // 3. Consent would be created on-chain with both parties' data
  // 4. Two SBTs would be minted (one for each party)
  // 5. Both parties query blockchain for consents involving their address

  return consentForAcceptor; // Return acceptor's perspective
}

/**
 * Reject a consent request
 */
export async function rejectConsentRequest(request: ConsentRequest): Promise<void> {
  // In a real app, notify the requester that their request was rejected
  console.log(`[MOCK] Consent request ${request.id} rejected`);
}

