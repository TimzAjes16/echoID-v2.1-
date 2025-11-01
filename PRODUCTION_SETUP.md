# Production Setup Guide

This guide walks you through setting up EchoID for production deployment.

## Prerequisites

1. **Ethereum Wallet** with ETH for contract deployment
2. **Expo Account** at https://expo.dev
3. **WalletConnect Cloud Account** at https://cloud.walletconnect.com
4. **Backend Server** (Node.js/Python/Rust recommended)

## Step 1: Deploy Smart Contracts ⚠️ CRITICAL

### 1.1 Deploy ConsentFactory to Base Sepolia Testnet (Testing)

1. Get testnet ETH from Base Sepolia faucet
2. Compile and deploy `ConsentFactory.sol` to Base Sepolia
3. Verify contract on [Basescan Sepolia](https://sepolia.basescan.org)
4. Update `.env`:
   ```
   EXPO_PUBLIC_FACTORY_ADDRESS=0x... (your deployed contract address)
   EXPO_PUBLIC_DEFAULT_CHAIN_ID=84532 (Base Sepolia)
   ```
5. Test consent creation on testnet

### 1.2 Deploy ConsentFactory to Base Mainnet

1. Once tested on Sepolia, deploy to Base mainnet
2. Verify contract on [Basescan](https://basescan.org)
3. Update `.env`:
   ```
   EXPO_PUBLIC_FACTORY_ADDRESS=0x... (mainnet contract address)
   EXPO_PUBLIC_DEFAULT_CHAIN_ID=8453 (Base)
   ```

### 1.3 Set Treasury Address

1. Create multisig wallet or use existing treasury
2. Update `.env`:
   ```
   EXPO_PUBLIC_TREASURY_ADDRESS=0x... (your treasury address)
   ```
3. Verify contract sends fees to this address

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all required values:
   - `EXPO_PUBLIC_FACTORY_ADDRESS` - From Step 1
   - `EXPO_PUBLIC_TREASURY_ADDRESS` - Your treasury wallet
   - `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID` - From Step 3
   - `EXPO_PUBLIC_EXPO_PROJECT_ID` - From Step 4
   - `EXPO_PUBLIC_API_BASE_URL` - Your backend API URL

## Step 3: WalletConnect Setup

1. Go to https://cloud.walletconnect.com
2. Create a new project
3. Copy your Project ID
4. Add to `.env`:
   ```
   EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

## Step 4: Expo Push Notifications Setup

1. Go to https://expo.dev
2. Create a new project or select existing
3. Copy your Project ID
4. Add to `.env`:
   ```
   EXPO_PUBLIC_EXPO_PROJECT_ID=your_expo_project_id
   ```
5. Configure push notification credentials:
   - iOS: Upload APNs key in Expo dashboard
   - Android: Configure FCM in Expo dashboard

## Step 5: Backend API Setup

### 5.1 Required Endpoints

All backend endpoints are defined in `lib/api.ts`. You need to implement:

1. **Handle Management** (`/handles/*`)
   - `POST /handles/claim`
   - `GET /handles/:handle`
   - `POST /handles/challenge`
   - `POST /handles/verify`

2. **Consent Requests** (`/consent-requests/*`)
   - `POST /consent-requests`
   - `GET /consent-requests?handle=...`
   - `POST /consent-requests/:id/accept`
   - `POST /consent-requests/:id/reject`

3. **Device Registration** (`/users/:handle/*`)
   - `POST /users/:handle/register-device`
   - `DELETE /users/:handle/devices/:deviceId`

4. **Notifications** (`/notifications/*`)
   - `POST /notifications/send` (backend-to-backend, uses Expo Push API)

5. **Remote Config** (`/config`)
   - `GET /config`

### 5.2 Backend Implementation Example (Node.js/Express)

```typescript
// Example endpoint implementation
app.post('/handles/claim', async (req, res) => {
  const { handle, walletAddress, devicePubKey, signature } = req.body;
  
  // Verify signature
  // Store in database
  // Return handle mapping
  res.json({ handle, walletAddress, devicePubKey });
});
```

### 5.3 Push Notification Integration

Your backend must send push notifications using Expo Push API:

```typescript
import * as Notifications from 'expo-server-sdk';

const expo = new Notifications.Expo();

async function sendPushNotification(pushToken: string, title: string, body: string) {
  await expo.sendPushNotificationsAsync([{
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { /* your data */ }
  }]);
}
```

## Step 6: IPFS/Storage (Optional)

1. Migrate from deprecated `web3.storage` to `@web3-storage/w3up-client`
2. Or use alternative: Pinata, NFT.Storage, Arweave
3. Update `lib/ipfs.ts` with new client
4. Add token to `.env`:
   ```
   EXPO_PUBLIC_WEB3_STORAGE_TOKEN=your_token
   ```

## Step 7: Testing Checklist

- [ ] Test handle claiming
- [ ] Test handle resolution
- [ ] Test consent creation on testnet
- [ ] Test unlock request/approval
- [ ] Test push notifications between devices
- [ ] Test device registration
- [ ] Test consent request flow end-to-end
- [ ] Verify protocol fees are collected
- [ ] Test on both iOS and Android

## Step 8: Production Deployment

1. **Build for Production**
   ```bash
   npx expo build:ios
   npx expo build:android
   ```
   Or use EAS Build:
   ```bash
   eas build --platform all
   ```

2. **Update Backend API URL**
   - Set `EXPO_PUBLIC_API_BASE_URL` to production URL
   - Ensure backend is deployed and accessible

3. **Update Contract Addresses**
   - Ensure all environment variables point to mainnet addresses

4. **Submit to App Stores**
   - iOS: App Store Connect
   - Android: Google Play Console

## Step 9: Post-Deployment

1. Monitor transaction success rates
2. Monitor push notification delivery
3. Monitor backend API performance
4. Set up error tracking (Sentry, etc.)
5. Set up analytics (Mixpanel, Amplitude)

## Environment Variables Summary

```env
# REQUIRED
EXPO_PUBLIC_FACTORY_ADDRESS=0x... # Deploy contract first
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=... # Get from WalletConnect Cloud
EXPO_PUBLIC_EXPO_PROJECT_ID=... # Get from Expo.dev
EXPO_PUBLIC_API_BASE_URL=https://api.echoid.xyz # Your backend URL

# OPTIONAL (with defaults)
EXPO_PUBLIC_DEFAULT_CHAIN_ID=8453 # Base
EXPO_PUBLIC_TREASURY_ADDRESS=0x... # For fee collection
EXPO_PUBLIC_PROTOCOL_FEE_WEI=1000000000000000 # 0.001 ETH
```

## Support

For issues, see:
- `API_REQUIREMENTS.md` - Backend API specifications
- `BLOCKCHAIN_TRANSACTIONS.md` - Blockchain implementation details

