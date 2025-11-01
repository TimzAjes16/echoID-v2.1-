import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useStore } from '../../state/useStore';
import QRCodeView from '../../components/QRCodeView';
import QRScanner from '../../components/QRScanner';
import { claimHandle, resolveHandle, getSignatureChallenge, verifyHandleSignature } from '../../lib/handles';
import { signMessage } from '../../lib/walletconnect';
import { getDeviceKeypair } from '../../lib/crypto';

export default function ProfileScreen() {
  const { wallet, profile, setProfile, loadProfile } = useStore();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

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
        <Text style={styles.sectionTitle}>Wallet</Text>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Address:</Text>
          <Text style={styles.walletValue}>{wallet.address}</Text>
        </View>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Chain ID:</Text>
          <Text style={styles.walletValue}>{wallet.chainId || 'Unknown'}</Text>
        </View>
      </View>

      {showQRScanner && (
        <QRScanner
          onScanComplete={handleScanQR}
          onCancel={() => setShowQRScanner(false)}
        />
      )}
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
  walletInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  walletValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'monospace',
  },
});

