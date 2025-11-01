import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../state/useStore';
import QRCodeView from '../../components/QRCodeView';
import QRScanner from '../../components/QRScanner';
import { claimHandle, resolveHandle, getSignatureChallenge, verifyHandleSignature } from '../../lib/handles';
import { signMessage } from '../../lib/walletconnect';
import { getDeviceKeypair } from '../../lib/crypto';
import { getWalletBalance } from '../../lib/sdk';
import { getETHPrice, convertETHToUSD } from '../../lib/payment';
import AddFundsModal from '../../components/AddFundsModal';
import type { Address } from 'viem';

export default function ProfileScreen() {
  const { wallet, profile, setProfile, loadProfile } = useStore();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceUSD, setBalanceUSD] = useState<number | null>(null);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [balanceDisplayMode, setBalanceDisplayMode] = useState<'ETH' | 'USD'>('ETH');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (wallet.address) {
      loadWalletBalance();
    } else {
      setBalance(null);
    }
  }, [wallet.address, wallet.chainId, profile.handle]);

  async function loadWalletBalance() {
    if (!wallet.address) return;
    
    setIsLoadingBalance(true);
    try {
      const balanceWei = await getWalletBalance(
        wallet.address as Address,
        wallet.chainId || 8453,
        profile.handle || undefined
      );
      setBalance(balanceWei);
      
      // Also fetch USD conversion
      try {
        const ethPrice = await getETHPrice();
        const balanceNum = parseFloat(balanceWei);
        setBalanceUSD(balanceNum * ethPrice);
      } catch (error) {
        console.error('Failed to fetch USD conversion:', error);
      }
    } catch (error: any) {
      console.error('Failed to load wallet balance:', error);
      setBalance(null);
      setBalanceUSD(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }

  async function handleClaimHandle() {
    if (!newHandle.trim() || !wallet.session || !wallet.address) {
      Alert.alert('Error', 'Please enter a handle and connect wallet');
      return;
    }

    setIsClaiming(true);

    try {
      const keypair = await getDeviceKeypair();
      const devicePubKey = btoa(String.fromCharCode(...keypair.publicKey));
      
      // Get signature challenge
      const challenge = await getSignatureChallenge(newHandle, wallet.address);
      
      // Sign challenge
      const signature = await signMessage(wallet.session, challenge);
      
      // Verify signature
      const isValid = await verifyHandleSignature(newHandle, wallet.address, signature, challenge);
      
      if (!isValid) {
        throw new Error('Signature verification failed');
      }

      // Claim handle
      await claimHandle(newHandle, wallet.address, devicePubKey, signature);
      
      await setProfile({ handle: newHandle, devicePubKey });
      setNewHandle('');
      Alert.alert('Success', 'Handle claimed successfully!');
    } catch (error: any) {
      console.error('Failed to claim handle:', error);
      Alert.alert('Error', error.message || 'Failed to claim handle');
    } finally {
      setIsClaiming(false);
    }
  }

  function handleScanQR(payload: { h: string; w: string; dp: string }) {
    setShowQRScanner(false);
    // Resolve handle and verify
    resolveHandle(payload.h).then((mapping) => {
      if (mapping) {
        Alert.alert('Handle Found', `@${payload.h} → ${mapping.walletAddress}`);
      }
    });
  }

  if (!wallet.address) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Please connect wallet first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Profile</Text>
        
        {profile.handle ? (
          <QRCodeView />
        ) : (
          <View style={styles.claimSection}>
            <Text style={styles.label}>Claim Your Handle</Text>
            <TextInput
              style={styles.input}
              value={newHandle}
              onChangeText={(text) => setNewHandle(text.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="@username"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.button, isClaiming && styles.buttonDisabled]}
              onPress={handleClaimHandle}
              disabled={isClaiming}
            >
              <Text style={styles.buttonText}>
                {isClaiming ? 'Claiming...' : 'Claim Handle'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scan QR Code</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowQRScanner(true)}
        >
          <Text style={styles.buttonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Wallet</Text>
        <View style={styles.walletCard}>
          <View style={styles.balanceSection}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <TouchableOpacity
                style={styles.balanceToggle}
                onPress={() => setBalanceDisplayMode(balanceDisplayMode === 'ETH' ? 'USD' : 'ETH')}
              >
                <Text style={styles.balanceToggleText}>
                  {balanceDisplayMode === 'ETH' ? 'USD' : 'ETH'}
                </Text>
              </TouchableOpacity>
            </View>
            {isLoadingBalance ? (
              <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 8 }} />
            ) : balance !== null ? (
              <>
                <Text style={styles.balanceValue}>
                  {balanceDisplayMode === 'ETH'
                    ? `${parseFloat(balance).toFixed(4)} ETH`
                    : balanceUSD !== null
                    ? `$${balanceUSD.toFixed(2)}`
                    : 'Calculating...'}
                </Text>
                {balanceDisplayMode === 'USD' && balanceUSD !== null && (
                  <Text style={styles.balanceSubtext}>
                    ≈ {parseFloat(balance).toFixed(6)} ETH
                  </Text>
                )}
                {balanceDisplayMode === 'ETH' && balanceUSD !== null && (
                  <Text style={styles.balanceSubtext}>
                    ≈ ${balanceUSD.toFixed(2)} USD
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.balanceError}>Unable to load</Text>
            )}
            <View style={styles.balanceActions}>
              <TouchableOpacity 
                style={styles.addFundsButton}
                onPress={() => setShowAddFunds(true)}
              >
                <Ionicons name="add-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.addFundsButtonText}>Add Funds</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadWalletBalance}
                disabled={isLoadingBalance}
              >
                <Text style={styles.refreshButtonText}>
                  {isLoadingBalance ? 'Loading...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Wallet Address</Text>
            <Text style={styles.walletValue} selectable>{wallet.address}</Text>
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Network</Text>
            <Text style={styles.walletValue}>
              {wallet.chainId === 8453 ? 'Base Mainnet' : 
               wallet.chainId === 84532 ? 'Base Sepolia' : 
               wallet.chainId || 'Unknown'}
            </Text>
          </View>
          {wallet.address && (
            <View style={styles.qrSection}>
              <Text style={styles.qrLabel}>Receive Funds</Text>
              <View style={styles.qrContainer}>
                <QRCodeView value={wallet.address} size={180} />
              </View>
            </View>
          )}
        </View>
      </View>

      {showQRScanner && (
        <QRScanner
          onScanComplete={handleScanQR}
          onCancel={() => setShowQRScanner(false)}
        />
      )}

      <AddFundsModal
        visible={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        walletAddress={wallet.address || ''}
        network={wallet.chainId === 8453 ? 'base' : wallet.chainId === 84532 ? 'base-sepolia' : 'base'}
        onPaymentComplete={() => {
          // Reload balance after payment
          setTimeout(() => {
            loadWalletBalance();
          }, 3000); // Wait a bit for transaction to propagate
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  error: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  claimSection: {
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  walletCard: {
    marginTop: 8,
  },
  balanceSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  balanceToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  balanceError: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 12,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  addFundsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFundsButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  walletInfo: {
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 22,
  },
  qrSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontWeight: '500',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

