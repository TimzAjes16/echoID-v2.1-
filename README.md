# EchoID — Expo Go MVP

Consent Verification Protocol built for Expo Go (managed workflow).

## Features

- **Username + QR**: Claim unique `@handle`, generate/share QR codes
- **Handshake Flow**: Template selection → Voice recording → Selfie → On-chain mint
- **24h Auto-Lock**: All consents locked for 24 hours, then dual-consent unlock required
- **E2EE Chat**: End-to-end encrypted messaging between consent parties
- **Protocol Fees**: Payable transactions via WalletConnect v2
- **Multi-chain**: Base (primary), Base Nova, Polygon zkEVM support

## Stack

- **Framework**: Expo SDK 54 + expo-router
- **State**: Zustand
- **Crypto**: TweetNaCl (X25519), XChaCha20-Poly1305, Keccak256
- **Storage**: Expo SecureStore (keys), SQLite (messages), Filesystem (blobs)
- **Web3**: Viem + WalletConnect v2 (SignClient)
- **IPFS**: web3.storage (deprecated API - update to @web3-storage/w3up-client for production)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Run in Expo Go**:
   ```bash
   npm start
   # Press 'i' for iOS, 'a' for Android, or scan QR with Expo Go app
   ```

## Environment Variables

- `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect Cloud project ID
- `EXPO_PUBLIC_FACTORY_ADDRESS`: ConsentFactory contract address
- `EXPO_PUBLIC_DEFAULT_CHAIN_ID`: Default chain (8453 = Base)
- `EXPO_PUBLIC_API_BASE_URL`: Backend API URL
- `EXPO_PUBLIC_WEB3_STORAGE_TOKEN`: Web3.Storage API token (deprecated - migrate to w3up)

## Project Structure

```
/app
  /(auth)          # Auth screens
  /(main)          # Main app screens
    /consent       # Consent creation & detail
/lib               # Core libraries (crypto, SDK, templates)
/components        # Reusable UI components
/state             # Zustand store
```

## Limitations (Expo Go Managed Workflow)

- **No Secure Enclave**: Keys stored in SecureStore (not hardware-backed)
- **No custom native modules**: Limited to Expo APIs
- **Web3.Storage deprecation**: Current client is deprecated; migrate to `@web3-storage/w3up-client`

## Production Hardening

For production, consider:
1. Migrate to **EAS Build (dev client)** or **bare RN** for native crypto
2. Enable hardware-backed key storage (Secure Enclave / Hardware Security Module)
3. Update IPFS client to `@web3-storage/w3up-client`
4. Add biometric authentication for device keypair access
5. Implement proper key derivation and rotation

## License

Private / Proprietary

