# API Requirements for Live EchoID Production

This document outlines all APIs and services required to make EchoID production-ready with full functionality including push notifications, payments, and blockchain transactions.

## 1. Backend API Services

### 1.1 Handle Management API
**Endpoint Base:** `https://api.echoid.xyz` (or your production domain)

#### Required Endpoints:
- `POST /handles/claim` - Claim a new handle
  - Body: `{ handle, walletAddress, devicePubKey, signature }`
  - Returns: `{ handle, walletAddress, devicePubKey }`
  
- `GET /handles/:handle` - Resolve handle to wallet address
  - Returns: `{ handle, walletAddress, devicePubKey }` or `404`
  
- `POST /handles/challenge` - Get signature challenge for verification
  - Body: `{ handle, walletAddress }`
  - Returns: `{ challenge: string }`
  
- `POST /handles/verify` - Verify handle signature
  - Body: `{ handle, walletAddress, signature, challenge }`
  - Returns: `{ valid: boolean }`

### 1.2 Consent Request API
**Required Endpoints:**
- `POST /consent-requests` - Create and send consent request
  - Body: `{ fromHandle, fromAddress, toHandle, template, consentData }`
  - Returns: `{ requestId, status }`
  - **Must trigger push notification to recipient**
  
- `GET /consent-requests` - Get pending requests for user
  - Query: `?handle=username`
  - Returns: `Array<ConsentRequest>`
  
- `POST /consent-requests/:id/accept` - Accept consent request
  - Body: `{ acceptorData }` (voice hash, face hash, etc.)
  - Returns: `{ consentId, txHash }`
  - **Creates consent on-chain, mints SBTs**
  
- `POST /consent-requests/:id/reject` - Reject consent request
  - Returns: `{ status: 'rejected' }`

### 1.3 Remote Config API
**Required Endpoint:**
- `GET /config` - Get protocol configuration
  - Returns: `{ protocolFeeWei, treasuryAddress, defaultChainId, supportedChains, apiBaseUrl }`

### 1.4 User Notification Management
**Required Endpoints:**
- `POST /users/:handle/register-device` - Register device for push notifications
  - Body: `{ pushToken, deviceId }`
  - Returns: `{ registered: true }`
  
- `DELETE /users/:handle/devices/:deviceId` - Unregister device

## 2. Push Notification Services

### 2.1 Expo Push Notification Service
**Required:**
- Expo Push Token registration per device
- Server-side notification sending via Expo Push API
- Notification payload format:
  ```json
  {
    "to": "ExponentPushToken[...]",
    "sound": "default",
    "title": "New Consent Request",
    "body": "@username wants to create a consent with you",
    "data": {
      "type": "consent_request",
      "requestId": "...",
      "fromHandle": "..."
    }
  }
  ```

### 2.2 Backend Notification Service
**Required Implementation:**
- When consent request is created → Send push notification to recipient
- When consent is accepted/rejected → Notify requester
- When unlock is requested/approved → Notify counterparty
- When consent is unlocked → Notify both parties

**API Endpoint:**
- `POST /notifications/send` - Send notification via Expo Push API
  - Body: `{ pushToken, title, body, data }`
  - Returns: `{ sent: true, receiptId }`

## 3. Payment Processing

### 3.1 Apple Pay Integration (iOS)
**Required:**
- Apple Pay SDK integration
- Merchant ID registration
- Payment Processing Certificate
- Payment Processing API endpoint

**Flow:**
1. User initiates consent creation
2. App shows protocol fee amount
3. User selects "Pay with Apple Pay"
4. Apple Pay sheet appears
5. User authenticates (Face ID/Touch ID)
6. Payment processed via Payment Processor API
7. Receive payment confirmation
8. Proceed with on-chain transaction

**Required Package:**
```bash
npx expo install expo-apple-authentication
# Note: Apple Pay requires native implementation
# Consider: react-native-apple-pay or expo-payments (if available)
```

**Alternative for Expo Go:** 
- Use WalletConnect for payment (user pays from their crypto wallet)
- Or collect payment off-chain first, then submit on-chain

### 3.2 Payment Processor API
**Required Endpoints:**
- `POST /payments/create` - Create payment intent
  - Body: `{ amount, currency, userId }`
  - Returns: `{ paymentIntentId, clientSecret }`
  
- `POST /payments/confirm` - Confirm payment
  - Body: `{ paymentIntentId, paymentMethod }`
  - Returns: `{ confirmed: true, txHash }`

### 3.3 Crypto Payment (Recommended for Web3 App)
**Alternative:** Accept protocol fee directly in ETH/tokens via WalletConnect
- User approves transaction in their wallet
- Payment happens on-chain automatically
- No additional payment processor needed

## 4. Blockchain Infrastructure

### 4.1 Smart Contracts (Already Referenced)
**Required Contracts:**
- `ConsentFactory.sol` - Factory contract for creating consents
  - `createConsent()` - Payable function that mints SBTs
  - `requestUnlock()` - Request consent unlock
  - `approveUnlock()` - Approve unlock request
  
**Required on Multiple Chains:**
- Base (8453) - Primary
- Base Nova (420) - Optional
- Polygon zkEVM (1101) - Optional

### 4.2 Transaction Monitoring
**Required Service:**
- WebSocket connection to blockchain nodes
- Event listener for consent creation events
- Extract `consentId` from transaction receipts

**Or use:**
- Alchemy API for Base
- Infura API
- QuickNode

**API Endpoint (Your Backend):**
- `POST /transactions/monitor` - Monitor transaction status
  - Body: `{ txHash, chainId }`
  - Returns: `{ status, receipt, consentId }`

## 5. IPFS / Decentralized Storage

### 5.1 Web3.Storage (Current - Deprecated)
**Current Implementation:** Uses deprecated `web3.storage` client

**Required Migration:**
- Migrate to `@web3-storage/w3up-client`
- Or use alternative: Pinata, NFT.Storage, Arweave

**Required Functionality:**
- Upload encrypted attachments
- Store encrypted chat messages (optional)
- Store consent metadata (off-chain)

**API:**
```typescript
import { create } from '@web3-storage/w3up-client'
// Initialize with account
// Upload files with encryption
```

## 6. Environment Variables Required

```env
# Backend API
EXPO_PUBLIC_API_BASE_URL=https://api.echoid.xyz

# WalletConnect
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Smart Contracts
EXPO_PUBLIC_FACTORY_ADDRESS=0x...
EXPO_PUBLIC_DEFAULT_CHAIN_ID=8453

# Payment Processing (if using)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_... (if using Stripe)
EXPO_PUBLIC_APPLE_MERCHANT_ID=merchant.com.echoid (for Apple Pay)

# IPFS
EXPO_PUBLIC_WEB3_STORAGE_TOKEN=your_token (migrate to w3up)

# Push Notifications
EXPO_PUBLIC_EXPO_PROJECT_ID=your_expo_project_id

# Blockchain RPC
EXPO_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key (optional, for better performance)
EXPO_PUBLIC_INFURA_PROJECT_ID=your_infura_id (optional)
```

## 7. Implementation Checklist

### Phase 1: Backend API (Critical)
- [ ] Set up backend server (Node.js/Express, Python/FastAPI, or Rust)
- [ ] Implement handle management endpoints
  - [x] Client code ready (`lib/api.ts` - `apiClaimHandle`, `apiResolveHandle`, `apiGetSignatureChallenge`, `apiVerifyHandleSignature`)
  - [ ] Backend implementation needed
- [ ] Implement consent request endpoints
  - [x] Client code ready (`lib/api.ts` - `apiCreateConsentRequest`, `apiGetConsentRequests`, `apiAcceptConsentRequest`, `apiRejectConsentRequest`)
  - [ ] Backend implementation needed
- [ ] Database for handles and consent requests
- [ ] User authentication/authorization

### Phase 2: Push Notifications (Critical)
- [x] Set up Expo Push Notification Service (local notifications working)
- [x] Client-side device registration (`lib/deviceRegistration.ts`)
- [x] Device token retrieval (`lib/notifications.ts` - `getNotificationToken`)
- [x] Device registration on login (`app/(auth)/index.tsx`)
- [x] Device unregistration on logout (`components/Drawer.tsx`)
- [ ] Backend service to send push notifications
- [ ] Device token registration endpoint (client ready, backend needed)
- [ ] Notification delivery confirmation

### Phase 3: Payment Processing (High Priority)
- [ ] Integrate Apple Pay (requires native build)
- [ ] Payment processor API (Stripe, Square, etc.)
- [x] Crypto payments via WalletConnect (IMPLEMENTED - protocol fee collected on-chain)
- [ ] Payment confirmation webhooks

### Phase 4: Blockchain Integration (Critical)
- [ ] Deploy ConsentFactory contract to Base mainnet (REQUIRED - see setup guide below)
- [x] Client-side transaction signing (local wallet + WalletConnect)
- [x] Event decoding for consentId extraction (`lib/sdk.ts`)
- [x] Transaction monitoring utilities (`lib/transactionMonitor.ts`)
- [x] Multi-chain support (Base, Base Nova, Polygon zkEVM ready)
- [ ] Gas price optimization

### Phase 5: Storage Migration
- [ ] Migrate from deprecated web3.storage to w3up
- [x] Encrypted file uploads (`lib/ipfs.ts`)
- [ ] Implement CID storage in backend

## 8. Recommended Tech Stack

### Backend:
- **Node.js + Express** or **Python + FastAPI**
- **PostgreSQL** or **MongoDB** for data storage
- **Redis** for caching and notification queues
- **WebSocket** for real-time updates

### Infrastructure:
- **AWS / Google Cloud / Vercel** for hosting
- **Supabase** or **Firebase** for quick backend setup
- **The Graph** for blockchain indexing (optional)

### Payment:
- **Stripe** (traditional payments)
- **WalletConnect** (crypto payments - recommended)
- **Apple Pay** (iOS native - requires custom dev client)

### Push Notifications:
- **Expo Push Notification Service** (free, included)
- **OneSignal** or **Firebase Cloud Messaging** (alternatives)

## 9. Blockchain Transaction Requirements

### 9.1 All Transactions Must Be On-Chain

**Current Implementation:**
- ✅ `createConsent()` - Creates consent on-chain via `ConsentFactory.createConsent()` payable function
- ✅ `requestUnlock()` - Requests unlock on-chain
- ✅ `approveUnlock()` - Approves unlock on-chain
- ✅ Protocol fee collected as `value` parameter in `createConsent` transaction

**Transaction Flow:**
1. User initiates consent creation
2. App calls `ConsentFactory.createConsent()` with:
   - All verification hashes (voice, face, device, geo, UTC)
   - Coercion level
   - Counterparty address
   - Unlock mode and window
   - **Protocol fee as `value` parameter**
3. Transaction sent to blockchain
4. Event `ConsentCreated(uint256 consentId, address party1, address party2)` emitted
5. Two SBTs minted (one for each party)
6. Consent ID extracted from event logs
7. Stored locally with on-chain `consentId`

**Verification:**
- All consents have a `consentId` from blockchain event logs
- Transaction hash stored (implicitly via consentId extraction)
- All unlock requests/approvals are on-chain transactions
- Protocol fees are collected on-chain via payable function

## 10. Current MVP Limitations

The current implementation works in **mock/offline mode** for testing:
- ✅ Handles created locally
- ✅ Test users (`sarah`, `mike`) available
- ✅ Consent requests stored locally
- ✅ Local notifications (not push to other devices)
- ✅ **Blockchain transactions are real** (when connected to mainnet/testnet)
- ❌ No real push notifications to other phones (local only)
- ❌ No payment processing (fees collected on-chain via crypto)
- ❌ No backend API (handles mocked)
- ⚠️ Event decoding may need contract ABI for production

## 11. Next Steps for Production

### Phase 1: Blockchain (Critical - Client Code Ready)
1. **Deploy ConsentFactory contract** to Base mainnet ⚠️ **REQUIRED**
   - [ ] Deploy contract to Base Sepolia testnet first
   - [ ] Verify contract code on Basescan
   - [ ] Set `EXPO_PUBLIC_FACTORY_ADDRESS` in `.env`
   - [ ] Deploy to Base mainnet
   - [ ] Update `EXPO_PUBLIC_FACTORY_ADDRESS` to mainnet address
2. **Verify event decoding** works with deployed contract
   - [x] Client code ready (`lib/sdk.ts` - event decoding implemented)
   - [ ] Test with deployed contract
   - [ ] Ensure ABI matches deployed contract
3. **Set treasury address** for fee collection
   - [ ] Deploy or use existing multisig wallet
   - [ ] Set `EXPO_PUBLIC_TREASURY_ADDRESS` in `.env`
   - [ ] Update contract to use treasury address

### Phase 2: Backend API (Critical - Client Code Ready)
1. **Set up backend server** (Node.js/Python/Rust) ⚠️ **REQUIRED**
2. **Implement handle management** endpoints
   - [x] Client code ready (`lib/api.ts`)
   - [ ] Backend implementation needed
3. **Implement consent request** endpoints
   - [x] Client code ready (`lib/api.ts`)
   - [ ] Backend implementation needed
4. **Database setup** (PostgreSQL/MongoDB)
   - [ ] Handles table
   - [ ] Consent requests table
   - [ ] Device registrations table
5. **Remote config endpoint**
   - [x] Client code ready (`lib/api.ts` - `apiGetRemoteConfig`)
   - [ ] Backend implementation needed

### Phase 3: Push Notifications (High Priority - Client Code Ready)
1. **Expo Push Notification setup**
   - [x] Client code ready (`lib/notifications.ts`)
   - [ ] Get Expo project ID from https://expo.dev
   - [ ] Set `EXPO_PUBLIC_EXPO_PROJECT_ID` in `.env`
2. **Backend notification service** ⚠️ **REQUIRED**
   - [x] Client code ready (`lib/api.ts` - `apiSendNotification`)
   - [ ] Backend implementation needed
   - [ ] Integrate Expo Push API
3. **Device token registration**
   - [x] Client code ready (`lib/deviceRegistration.ts`)
   - [ ] Backend endpoint ready (client calls it automatically)
4. **Test notifications** to other devices

### Phase 4: Payment (Medium Priority - Crypto Payments Implemented)
- **Option A (Recommended):** Use crypto payments ✅ **IMPLEMENTED**
  - [x] Protocol fee collected on-chain via `createConsent` payable function
  - [x] Local wallet support
  - [x] WalletConnect support
  - [ ] No additional payment processor needed
- **Option B:** Add Apple Pay (requires native dev client)
  - [ ] Integrate Apple Pay SDK (requires custom dev client build)
  - [ ] Payment processor API
  - [ ] Convert fiat → crypto for on-chain payment

### Phase 5: Monitoring & Analytics
1. **Transaction monitoring** service
   - [x] Client utilities ready (`lib/transactionMonitor.ts`)
   - [ ] Backend monitoring endpoint (optional)
2. **Error tracking** (Sentry, etc.)
   - [ ] Integrate error tracking
3. **Analytics** (Mixpanel, Amplitude)
   - [ ] Integrate analytics

### Phase 6: Production Hardening
1. **Migrate to custom dev client** for native features (if using Apple Pay)
2. **Security audit** of smart contracts ⚠️ **CRITICAL**
3. **Load testing** of backend APIs
4. **Beta testing** with real users

---

## 12. Important Notes

### Blockchain Transactions
✅ **All consent operations ARE on-chain:**
- Consent creation → On-chain transaction with protocol fee
- Unlock requests → On-chain transactions
- Unlock approvals → On-chain transactions
- All transactions are **legible and verifiable** on blockchain explorers

### Current Implementation Status
- ✅ **On-chain transactions:** Fully implemented
- ✅ **Event decoding:** Implemented (may need contract ABI verification)
- ✅ **Protocol fee collection:** On-chain via payable function
- ✅ **Multi-chain support:** Base, Nova, zkEVM ready
- ⚠️ **Contract deployment:** Needs to be done for production
- ⚠️ **Backend API:** Mock mode (needs implementation)
- ⚠️ **Push notifications:** Local only (needs backend)
- ⚠️ **Apple Pay:** Not implemented (use crypto payments instead)

### Recommended Approach
1. **Use crypto payments** (already implemented) - simpler, no additional APIs needed
2. **Implement backend API** for handles and notifications
3. **Deploy contracts** to Base mainnet
4. **Test end-to-end** with real transactions

---

**Note:** The current codebase is designed to work with or without backend APIs. Mock mode allows full testing of the UI/UX flow. Blockchain transactions are **real and on-chain** once you deploy the contract and set the factory address.

