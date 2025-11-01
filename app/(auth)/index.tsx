import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../state/useStore';
import { getSignatureChallenge, verifyHandleSignature, claimHandle } from '../../lib/handles';
import { signMessageLocal } from '../../lib/wallet';
import { getDeviceKeypair } from '../../lib/crypto';

export default function AuthScreen() {
  const { wallet, connectLocalWallet, loadWallet, loadProfile, profile, setProfile } = useStore();
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Try to load existing wallet and profile
    loadWallet();
    loadProfile();
  }, []);

  useEffect(() => {
    if (wallet?.address && profile?.handle) {
      router.replace('/(main)');
    }
  }, [wallet?.address, profile?.handle]);

  async function handleLogin() {
    if (!handle.trim()) {
      Alert.alert('Error', 'Please enter your handle');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure we have a wallet
      if (!wallet.address) {
        await connectLocalWallet();
      }

      const currentWallet = useStore.getState().wallet;
      if (!currentWallet.address) {
        throw new Error('Failed to create wallet');
      }

      // Check if handle exists and verify ownership
      // For MVP: if handle doesn't exist, claim it automatically
      // In production, you'd want to check first and prompt user
      
      // Get device keypair
      const keypair = await getDeviceKeypair();
      const devicePubKeyStr = Array.from(keypair.publicKey, (byte) => String.fromCharCode(byte)).join('');
      const devicePubKey = btoa(devicePubKeyStr);

      // Get signature challenge
      let challenge: string;
      try {
        challenge = await getSignatureChallenge(handle, currentWallet.address);
      } catch (error) {
        // Handle doesn't exist, claim it
        setIsCreating(true);
        
        // Create challenge for new handle
        const timestamp = Date.now().toString();
        challenge = `Claim handle @${handle} for ${currentWallet.address} at ${timestamp}`;
        
        // Sign challenge
        const signature = await signMessageLocal(challenge);
        
        // Claim handle
        await claimHandle(handle, currentWallet.address, devicePubKey, signature);
        
        setIsCreating(false);
      }

      // Verify signature (for existing handles)
      if (!isCreating) {
        const signature = await signMessageLocal(challenge);
        const isValid = await verifyHandleSignature(handle, currentWallet.address, signature, challenge);
        
        if (!isValid) {
          throw new Error('Handle verification failed');
        }
      }

      // Save profile
      await setProfile({ handle, devicePubKey });

      // Navigate to main app
      router.replace('/(main)');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
      setIsCreating(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EchoID</Text>
      <Text style={styles.subtitle}>Consent Verification Protocol</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>@handle</Text>
        <TextInput
          style={styles.input}
          value={handle}
          onChangeText={(text) => setHandle(text.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
          placeholder="username"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <Text style={styles.hint}>
          Enter your @handle to login. If it doesn't exist, we'll create it for you.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isCreating ? 'Creating Account...' : 'Login'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        A wallet will be automatically created and secured on your device
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
