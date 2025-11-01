# EchoID Testing Guide

This guide provides resources and instructions for testing EchoID functionality.

## WalletConnect Testing

### React Wallet (Demo Wallet)

WalletConnect provides a demo wallet perfect for testing WalletConnect integration without needing a physical wallet app.

**Demo Wallet:**
- **URL:** https://react-wallet.walletconnect.com
- **Address:** `0x2C9c86080A07E5bDc0D01eC4f2e7aef322242f78`
- **Purpose:** Test WalletConnect connection and transaction flows

**How to Test:**

1. **Open React Wallet:**
   - Navigate to https://react-wallet.walletconnect.com
   - Wait for wallet to initialize

2. **Connect from EchoID App:**
   - Open EchoID app
   - Go to Profile or initiate wallet connection
   - Scan QR code with React Wallet
   - Or copy connection URI if available

3. **Test Connection Flow:**
   - Verify connection is established
   - Check wallet address matches: `0x2C9c86080A07E5bDc0D01eC4f2e7aef322242f78`
   - Verify chain ID is correct (Base: 8453, Base Sepolia: 84532)

4. **Test Transaction Signing:**
   - Create a consent request
   - Initiate on-chain transaction
   - Verify transaction signing in React Wallet
   - Check transaction completes successfully

5. **Test Session Management:**
   - Disconnect and reconnect
   - Verify session persistence
   - Test session expiration handling

**Benefits:**
- ✅ No need for physical wallet apps
- ✅ Easy to reset and test again
- ✅ Perfect for development/testing
- ✅ Works with any WalletConnect v2 Project ID

**Limitations:**
- ⚠️ This is a test wallet, not a real wallet
- ⚠️ Don't use for real funds or production
- ⚠️ Only works with WalletConnect, not direct wallet apps

## Test Users

EchoID includes test users for testing consent requests and handle resolution.

### Available Test Users (in `lib/testUsers.ts`)

1. **Sarah**
   - Handle: `sarah`
   - Wallet: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - Balance: **0.1 ETH**
   - Use: Test consent requests, handle resolution, accepting requests

2. **Katie**
   - Handle: `katie`
   - Wallet: `0x9cA7a3B8F2D4e1F6a5B9C8D7E4F3A2B1C0D9E8F7`
   - Balance: **0.1 ETH**
   - Use: Test consent requests, handle resolution, accepting requests

3. **Mike**
   - Handle: `mike`
   - Wallet: `0x8ba1f109551bD432803012645Hac136c22C19`
   - Balance: **0 ETH**
   - Use: Test consent requests, handle resolution (insufficient balance for acceptance)

### Using Test Users

**For Consent Requests:**
1. Create a new consent
2. Enter test user handle (`sarah`, `katie`, or `mike`) as counterparty
3. Complete consent creation flow
4. Test user should receive notification (if backend deployed)
5. Log in as recipient to see request and accept (if they have balance)

**For Handle Resolution:**
1. Enter test user handle in search/resolution
2. Should resolve to test user's wallet address
3. Works in both mock mode and with backend

## Expo Token Testing

See `EXPO_TOKEN_TESTING.md` for complete guide on testing Expo push notifications.

**Quick Test:**
1. Open Settings in app
2. Navigate to Notifications section
3. Tap "Test Expo Token"
4. Review test results

## Blockchain Testing

### Testnet Recommendations

**Base Sepolia Testnet:**
- Chain ID: `84532`
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Explorer: https://sepolia.basescan.org

**Testnet Setup:**
1. Deploy ConsentFactory to Base Sepolia
2. Get testnet ETH from faucet
3. Update `EXPO_PUBLIC_FACTORY_ADDRESS` to testnet address
4. Set `EXPO_PUBLIC_DEFAULT_CHAIN_ID` to `84532`
5. Test all on-chain operations

### Transaction Testing Checklist

- [ ] Wallet connection works
- [ ] Balance checking works
- [ ] Consent creation transaction succeeds
- [ ] Protocol fee is collected correctly
- [ ] ConsentId is extracted from events
- [ ] Unlock request transaction works
- [ ] Unlock approval transaction works
- [ ] Error handling for insufficient funds
- [ ] Gas estimation is accurate

## End-to-End Testing

### Complete Consent Flow Test

1. **Setup:**
   - Connect wallet (React Wallet or real wallet)
   - Ensure sufficient balance
   - Have test user handle ready

2. **Create Consent:**
   - Navigate to "New Consent"
   - Select template (e.g., "Sex NDA")
   - Enter counterparty handle (`sarah`, `katie`, or `mike`)
   - Record voice with required phrase
   - Capture selfie
   - Review consent details
   - Confirm and pay protocol fee

3. **Accept Consent (as counterparty):**
   - Log in as test user (Sarah/Katie have 0.1 ETH)
   - Receive consent request notification (or see in Requests screen)
   - Review request details
   - Accept and pay protocol fee (balance check passes)
   - Verify consent badge is minted
   - Note: In mock mode, mock consent ID is generated
   - Note: With deployed contract, real on-chain transaction occurs

4. **Unlock Flow:**
   - Request unlock
   - Approve unlock
   - Verify consent is unlocked

## Testing Environment Variables

**For Testing (Development/Mock Mode):**
```env
# WalletConnect (configured)
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=412ada4215e831396a0e19005bbd9823

# Factory Address (optional for development)
# If not set, app uses mock mode (works without deployed contract)
# EXPO_PUBLIC_FACTORY_ADDRESS=<testnet_contract_address>

# Chain ID
EXPO_PUBLIC_DEFAULT_CHAIN_ID=8453  # Base mainnet (or 84532 for testnet)

# Backend (optional for testing)
# If not set, app uses mock mode with local test users
# EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

**Note:** App works in mock mode without factory address:
- Mock consent IDs generated for testing
- Mock transaction hashes for unlock operations
- Full workflow testable without deployed contract
- Set `EXPO_PUBLIC_FACTORY_ADDRESS` only when contract is deployed

## Troubleshooting

### WalletConnect Issues

**Connection Fails:**
- Verify Project ID is set correctly
- Check network connectivity
- Ensure React Wallet is loaded and initialized
- Try clearing app cache/storage

**Transaction Signing Issues:**
- Verify wallet has sufficient balance
- Check chain ID matches (Base: 8453, Sepolia: 84532)
- Verify contract address is correct
- Check transaction parameters are valid

### Test User Issues

**Handle Not Found:**
- Verify test users are seeded in database
- Check handle is spelled correctly (lowercase)
- Try mock mode if backend unavailable
- Check `lib/testUsers.ts` for available users

**Test User Balances:**
- Test users have predefined balances in `lib/testUsers.ts`:
  - `sarah`: 0.1 ETH
  - `katie`: 0.1 ETH
  - `mike`: 0 ETH
- Balances are automatically assigned when logged in as test user
- Balance shows on Profile screen when logged in as test user
- Check console logs for balance lookup details

**Consent Requests Not Showing:**
- Requests persist across app restarts (stored in SecureStore)
- If requests not visible, check:
  1. Console logs: `[RequestsScreen] Request state:` - shows filtering details
  2. Ensure you're logged in as the recipient (not sender)
  3. Check `[Store] Loaded X consent requests from storage` on startup
  4. Verify request was created with correct `counterpartyHandle`

**Mock Mode:**
- App automatically uses mock mode if factory address not set
- Mock mode allows full workflow testing without deployed contract
- Console shows `[MOCK]` warnings when in mock mode
- Mock consent IDs and transaction hashes are generated
- For production, deploy contract and set `EXPO_PUBLIC_FACTORY_ADDRESS`

## Additional Resources

- **WalletConnect Docs:** https://docs.walletconnect.com/
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Base Explorer:** https://basescan.org
- **Expo Push Testing:** See `EXPO_TOKEN_TESTING.md`

