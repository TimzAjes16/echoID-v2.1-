/**
 * Backend API Client
 * Ready to use when backend is deployed
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.echoid.xyz';
const FETCH_TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout(url: string, options: RequestInit, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

// ============================================================================
// Handle Management API
// ============================================================================

export interface HandleMapping {
  handle: string;
  walletAddress: string;
  devicePubKey: string;
}

export interface ClaimHandleRequest {
  handle: string;
  walletAddress: string;
  devicePubKey: string;
  signature: string;
}

export async function apiClaimHandle(request: ClaimHandleRequest): Promise<HandleMapping> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/handles/claim`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to claim handle' }));
    throw new Error(error.message || 'Failed to claim handle');
  }

  return response.json();
}

export async function apiResolveHandle(handle: string): Promise<HandleMapping | null> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/handles/${encodeURIComponent(handle)}`, {
    method: 'GET',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to resolve handle');
  }

  return response.json();
}

export interface SignatureChallengeRequest {
  handle: string;
  walletAddress: string;
}

export interface SignatureChallengeResponse {
  challenge: string;
}

export async function apiGetSignatureChallenge(request: SignatureChallengeRequest): Promise<string> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/handles/challenge`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to get signature challenge');
  }

  const data: SignatureChallengeResponse = await response.json();
  return data.challenge;
}

export interface VerifySignatureRequest {
  handle: string;
  walletAddress: string;
  signature: string;
  challenge: string;
}

export interface VerifySignatureResponse {
  valid: boolean;
}

export async function apiVerifyHandleSignature(request: VerifySignatureRequest): Promise<boolean> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/handles/verify`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return false;
  }

  const data: VerifySignatureResponse = await response.json();
  return data.valid === true;
}

// ============================================================================
// Consent Request API
// ============================================================================

export interface ConsentRequestData {
  fromHandle: string;
  fromAddress: string;
  toHandle: string;
  template: string;
  consentData: any;
}

export interface ConsentRequestResponse {
  requestId: string;
  status: 'pending' | 'sent';
}

export async function apiCreateConsentRequest(data: ConsentRequestData): Promise<ConsentRequestResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/consent-requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create consent request' }));
    throw new Error(error.message || 'Failed to create consent request');
  }

  return response.json();
}

export interface ConsentRequest {
  id: string;
  fromHandle: string;
  fromAddress: string;
  template: string;
  requestedAt: number;
  consentData?: any;
}

export async function apiGetConsentRequests(handle: string): Promise<ConsentRequest[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/consent-requests?handle=${encodeURIComponent(handle)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch consent requests');
  }

  return response.json();
}

export interface AcceptConsentRequestData {
  acceptorData: {
    voiceHash: string;
    faceHash: string;
    deviceHash: string;
    geoHash: string;
    utcHash: string;
    coercionLevel?: number;
  };
}

export interface AcceptConsentRequestResponse {
  consentId: string;
  txHash: string;
}

export async function apiAcceptConsentRequest(
  requestId: string,
  data: AcceptConsentRequestData
): Promise<AcceptConsentRequestResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/consent-requests/${requestId}/accept`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to accept consent request' }));
    throw new Error(error.message || 'Failed to accept consent request');
  }

  return response.json();
}

export async function apiRejectConsentRequest(requestId: string): Promise<{ status: string }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/consent-requests/${requestId}/reject`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to reject consent request');
  }

  return response.json();
}

// ============================================================================
// Remote Config API
// ============================================================================

export interface RemoteConfig {
  protocolFeeWei: string;
  treasuryAddress: string;
  defaultChainId: number;
  supportedChains: number[];
  apiBaseUrl: string;
}

export async function apiGetRemoteConfig(): Promise<RemoteConfig> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/config`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch remote config');
  }

  return response.json();
}

// ============================================================================
// User Notification Management API
// ============================================================================

export interface RegisterDeviceRequest {
  pushToken: string;
  deviceId: string;
}

export interface RegisterDeviceResponse {
  registered: boolean;
}

export async function apiRegisterDevice(handle: string, request: RegisterDeviceRequest): Promise<RegisterDeviceResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/users/${encodeURIComponent(handle)}/register-device`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to register device');
  }

  return response.json();
}

export async function apiUnregisterDevice(handle: string, deviceId: string): Promise<void> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/users/${encodeURIComponent(handle)}/devices/${encodeURIComponent(deviceId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to unregister device');
  }
}

// ============================================================================
// Notification API (for backend to send notifications)
// ============================================================================

export interface SendNotificationRequest {
  pushToken: string;
  title: string;
  body: string;
  data?: any;
}

export interface SendNotificationResponse {
  sent: boolean;
  receiptId?: string;
}

export async function apiSendNotification(request: SendNotificationRequest): Promise<SendNotificationResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/notifications/send`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to send notification');
  }

  return response.json();
}

// ============================================================================
// Transaction Monitoring API
// ============================================================================

export interface MonitorTransactionRequest {
  txHash: string;
  chainId: number;
}

export interface MonitorTransactionResponse {
  status: 'pending' | 'confirmed' | 'failed';
  receipt?: any;
  consentId?: string;
}

export async function apiMonitorTransaction(request: MonitorTransactionRequest): Promise<MonitorTransactionResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/transactions/monitor`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to monitor transaction');
  }

  return response.json();
}

