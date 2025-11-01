# Blockchain Transaction Implementation

## Overview

EchoID ensures **all consent operations are recorded on-chain** as verifiable blockchain transactions. This document describes the transaction flow and how each operation is executed on the blockchain.

## Smart Contract: ConsentFactory

**Contract Address:** Set via `EXPO_PUBLIC_FACTORY_ADDRESS` environment variable

### Main Functions

#### 1. `createConsent()` - Payable Function

**Purpose:** Create a new consent and mint two SBTs (one for each party)

**Transaction Details:**
```solidity
function createConsent(
    bytes32 voiceHash,
    bytes32 faceHash,
    bytes32 deviceHash,
    bytes32 geoHash,
    bytes32 utcHash,
    uint8 coercionLevel,
    address counterparty,
    uint8 unlockMode,
    uint256 unlockWindow
) external payable returns (uint256 consentId);
```

**Transaction Parameters:**
- `to`: Factory contract address
- `value`: Protocol fee in wei (payable)
- `data`: Encoded function call with all parameters
- `from`: User's wallet address
- `gas`: Estimated gas for transaction
- `gasPrice`: Current network gas price

**On-Chain Events Emitted:**
```solidity
event ConsentCreated(
    uint256 indexed consentId,
    address indexed party1,
    address indexed party2,
    bytes32 voiceHash,
    bytes32 faceHash,
    uint256 lockedUntil
);
```

**Transaction Flow:**
1. User signs transaction with wallet (local wallet or WalletConnect)
2. Transaction sent to Base network (chainId: 8453)
3. Factory contract executes:
   - Validates parameters
   - Collects protocol fee (from `msg.value`)
   - Generates unique `consentId`
   - Creates consent record
   - Mints SBT for party1 (requester)
   - Mints SBT for party2 (counterparty)
   - Sets 24-hour lock period
   - Emits `ConsentCreated` event
4. Transaction included in block
5. Receipt contains event logs
6. App extracts `consentId` from event logs
7. Consent stored locally with blockchain `consentId`

**Verification:**
- Transaction hash: `0x...` (on-chain record)
- Block number: Confirmed in block
- Gas used: Transaction cost recorded
- Protocol fee: Transferred to treasury address
- Consent ID: Extracted from event logs

#### 2. `requestUnlock()` - Non-Payable Function

**Purpose:** Request to unlock a consent (after 24h lock period)

**Transaction Details:**
```solidity
function requestUnlock(uint256 consentId) external;
```

**Transaction Flow:**
1. User signs transaction
2. Transaction sent to blockchain
3. Factory contract:
   - Verifies 24h lock has elapsed
   - Verifies caller is a party to the consent
   - Records unlock request
   - Emits `UnlockRequested(uint256 consentId, address requester)` event
4. Transaction confirmed on-chain

**On-Chain State:**
- Consent status updated to "unlock requested"
- Requester's address recorded
- Timestamp of request stored

#### 3. `approveUnlock()` - Non-Payable Function

**Purpose:** Approve unlock request (requires both parties)

**Transaction Details:**
```solidity
function approveUnlock(uint256 consentId) external;
```

**Transaction Flow:**
1. Counterparty signs transaction
2. Transaction sent to blockchain
3. Factory contract:
   - Verifies unlock request exists
   - Verifies caller is the other party
   - Checks both approvals received
   - Unlocks consent (if both approved)
   - Emits `ConsentUnlocked(uint256 consentId)` event
4. Transaction confirmed on-chain

**On-Chain State:**
- Both unlock approvals recorded
- Consent unlocked on-chain
- Unlock timestamp stored

## Transaction Receipt Structure

Every consent transaction produces an on-chain receipt:

```typescript
{
  transactionHash: "0x...", // On-chain transaction ID
  blockNumber: 12345678,     // Block where included
  blockHash: "0x...",        // Block hash
  gasUsed: 250000,           // Gas consumed
  status: "success",         // Transaction status
  logs: [                    // Event logs
    {
      address: FACTORY_ADDRESS,
      topics: ["ConsentCreated", consentId, party1, party2],
      data: "0x..." // Encoded event data
    }
  ]
}
```

## Protocol Fee Collection

**Fee Payment Method:**
- Fee is paid **on-chain** via the `value` parameter in `createConsent()` transaction
- Fee amount: Set by `EXPO_PUBLIC_PROTOCOL_FEE_WEI` or remote config
- Treasury address: Set by `EXPO_PUBLIC_TREASURY_ADDRESS`
- Fee transferred to treasury in same transaction

**Example Transaction:**
```typescript
await walletClient.sendTransaction({
  to: FACTORY_ADDRESS,
  value: parseEther('0.001'), // 0.001 ETH protocol fee
  data: encodedFunctionCall,   // createConsent(...)
});
```

## Multi-Chain Support

**Supported Chains:**
- Base (8453) - Primary
- Base Nova (420) - Optional
- Polygon zkEVM (1101) - Optional

**Chain Selection:**
- User can select chain before creating consent
- Factory contract must be deployed on selected chain
- Transaction sent to selected chain
- Consent ID unique per chain

## Transaction Monitoring

**Current Implementation:**
- Uses `waitForTransactionReceipt()` to wait for confirmation
- Extracts `consentId` from event logs
- Stores transaction hash with consent

**For Production:**
- Monitor transaction status
- Retry failed transactions
- Track gas prices for optimization
- Index consent events for fast queries

## Verification & Auditability

**All consents are verifiable on-chain:**
- Transaction hash: Public record
- Consent ID: From blockchain event
- Parties: Recorded in event
- Hashes: Stored on-chain
- Timestamps: From block timestamps
- Fees: Transferred on-chain

**Audit Trail:**
1. Consent creation → Transaction hash
2. Unlock request → Transaction hash
3. Unlock approval → Transaction hash
4. All events queryable via blockchain explorer

## Current Status

✅ **Implemented:**
- [x] On-chain consent creation with payable fee (`lib/sdk.ts` - `createConsent`)
- [x] Event log decoding for consentId extraction (`lib/sdk.ts` - event decoding)
- [x] Multi-chain transaction support (Base, Nova, zkEVM)
- [x] Local wallet transaction signing (`lib/sdk.ts` - local wallet support)
- [x] WalletConnect transaction signing (`lib/sdk.ts` - WalletConnect support)
- [x] Transaction monitoring utilities (`lib/transactionMonitor.ts`)
- [x] Request unlock on-chain (`lib/sdk.ts` - `requestUnlock`)
- [x] Approve unlock on-chain (`lib/sdk.ts` - `approveUnlock`)

⚠️ **Production Requirements:**
- [ ] **Deploy ConsentFactory contract to Base mainnet** ⚠️ **CRITICAL**
  - Test on Base Sepolia testnet first
  - Verify contract code on Basescan
- [ ] Set `EXPO_PUBLIC_FACTORY_ADDRESS` to deployed contract address
- [ ] Ensure contract ABI matches implementation (verify `CONSENT_FACTORY_ABI` in `lib/sdk.ts`)
- [ ] Verify event signatures match contract
- [ ] Test with real transactions on testnet
- [ ] Set `EXPO_PUBLIC_TREASURY_ADDRESS` for fee collection
- [ ] Set `EXPO_PUBLIC_PROTOCOL_FEE_WEI` for protocol fee amount

## Example Transaction on Base

**View on BaseScan:**
```
https://basescan.org/tx/<transaction_hash>
```

**Transaction includes:**
- From: User wallet address
- To: ConsentFactory contract address
- Value: Protocol fee (e.g., 0.001 ETH)
- Input Data: Encoded createConsent call
- Gas Used: ~250,000 gas
- Status: Success
- Events: ConsentCreated event with consentId

