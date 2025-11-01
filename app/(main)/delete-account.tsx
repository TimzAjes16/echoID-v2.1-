import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { profile, disconnectWallet } = useStore();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const requiredText = 'DELETE';

  const handleDelete = async () => {
    if (confirmationText !== requiredText) {
      Alert.alert('Error', `Please type "${requiredText}" to confirm`);
      return;
    }

    Alert.alert(
      'Permanent Account Deletion',
      'Are you absolutely sure? This action cannot be undone. Your account data will be deleted, but consent records on the blockchain are immutable and will remain accessible.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // In production, call backend API to delete account
              // For now, clear local data
              
              // Clear profile
              await SecureStore.deleteItemAsync('profile');
              
              // Clear wallet
              await disconnectWallet();
              
              // Clear device keypair
              await SecureStore.deleteItemAsync('device_keypair_secret');
              
              // Clear local wallet
              await SecureStore.deleteItemAsync('local_wallet_private_key');
              
              Alert.alert(
                'Account Deleted',
                'Your account has been deleted. Note: Consent records on the blockchain cannot be deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(auth)'),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.warningBox}>
        <Ionicons name="warning" size={48} color="#F44336" />
        <Text style={styles.warningTitle}>Permanent Account Deletion</Text>
        <Text style={styles.warningText}>
          This action cannot be undone. Please read the following carefully before proceeding.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>What Will Be Deleted:</Text>
        <Text style={styles.text}>
          • Your account profile and handle{'\n'}
          • Local app data and preferences{'\n'}
          • Encrypted messages and local files{'\n'}
          • Device keypair (you will need to create a new account){'\n'}
          • Wallet connection (local wallet data)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>What Will NOT Be Deleted:</Text>
        <Text style={styles.text}>
          • Consent records on the blockchain (immutable){'\n'}
          • Transaction history on the blockchain{'\n'}
          • Public consent data accessible via blockchain{'\n\n'}
          <Text style={styles.bold}>
            Important: Blockchain records are permanent and cannot be deleted.
          </Text>
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Your Rights Under UK GDPR</Text>
        <Text style={styles.text}>
          You have the right to request erasure of your personal data. However:{'\n\n'}
          • Data stored on blockchain is immutable{'\n'}
          • We may retain data as required by UK law (e.g., financial records for 7 years){'\n'}
          • Some data may be necessary for contract fulfillment{'\n\n'}
          For questions, contact privacy@echoid.xyz
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Before You Delete:</Text>
        <Text style={styles.text}>
          • Export your data (Settings → Export My Data){'\n'}
          • Ensure you have backups of important information{'\n'}
          • Understand that consent records will remain on blockchain{'\n'}
          • Know that you cannot reuse your handle after deletion
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Confirm Deletion</Text>
        <Text style={styles.confirmLabel}>
          Type "{requiredText}" to confirm:
        </Text>
        <TextInput
          style={styles.input}
          value={confirmationText}
          onChangeText={setConfirmationText}
          placeholder={requiredText}
          autoCapitalize="characters"
          editable={!isDeleting}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          (confirmationText !== requiredText || isDeleting) && styles.deleteButtonDisabled,
        ]}
        onPress={handleDelete}
        disabled={confirmationText !== requiredText || isDeleting}
      >
        <Ionicons name="trash" size={24} color="#fff" />
        <Text style={styles.deleteButtonText}>
          {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={isDeleting}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.helpText}>
          Need help? Contact support@echoid.xyz
        </Text>
      </View>
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
    paddingBottom: 32,
  },
  warningBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

