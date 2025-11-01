import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore, ConsentRequest } from '../../state/useStore';
import { acceptConsentRequest, rejectConsentRequest } from '../../lib/consentRequests';
import { Ionicons } from '@expo/vector-icons';

export default function ConsentRequestsScreen() {
  const router = useRouter();
  const { consentRequests, removeConsentRequest, addConsent } = useStore();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAccept(requestId: string) {
    setProcessing(requestId);
    try {
      console.log('Attempting to accept request:', requestId);
      const request = useStore.getState().getConsentRequest(requestId);
      
      if (!request) {
        console.error('Request not found in store. Available requests:', 
          useStore.getState().consentRequests.map(r => r.id));
        throw new Error('Request not found');
      }

      console.log('Request found:', {
        id: request.id,
        fromHandle: request.fromHandle,
        fromAddress: request.fromAddress,
        hasConsentData: !!request.consentData,
      });

      // Accept the consent request - this creates consent on-chain and mints NFT/Badge
      console.log('Calling acceptConsentRequest...');
      const consent = await acceptConsentRequest(request);
      console.log('Consent created:', {
        id: consent.id,
        consentId: consent.consentId.toString(),
        counterparty: consent.counterparty,
      });
      
      addConsent(consent);
      removeConsentRequest(requestId);

      // Show success with blockchain info
      Alert.alert(
        'Consent Accepted & Badge Minted',
        `Your consent badge has been minted on the blockchain.\n\nConsent ID: ${consent.consentId.toString()}\nYou can view it on Base blockchain explorer.`,
        [
          {
            text: 'View on Explorer',
            onPress: async () => {
              // Open blockchain explorer in browser
              const explorerUrl = `https://basescan.org`;
              try {
                await Linking.openURL(explorerUrl);
              } catch (error) {
                console.log('Could not open explorer:', explorerUrl);
              }
            },
          },
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home screen
              router.replace('/(main)');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error accepting request:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to accept request',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(requestId: string) {
    try {
      const request = useStore.getState().getConsentRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      await rejectConsentRequest(request);
      removeConsentRequest(requestId);
      Alert.alert('Success', 'Consent request rejected');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  }

  function renderRequest({ item }: { item: ConsentRequest }) {
    const isProcessing = processing === item.id;
    
    // Debug: Log the item to see what data we have
    console.log('Rendering request:', {
      id: item.id,
      fromHandle: item.fromHandle,
      requestedAt: item.requestedAt,
      template: item.template,
    });
    
    // Format date safely - handle both timestamp (number) and Date objects
    let formattedDate = 'Recently';
    if (item.requestedAt) {
      try {
        const date = typeof item.requestedAt === 'number' 
          ? new Date(item.requestedAt) 
          : new Date(item.requestedAt);
        
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch (error) {
        console.error('Date formatting error:', error);
        formattedDate = 'Recently';
      }
    }
    
    // Ensure handle is displayed properly - check for null, undefined, empty, or 'unknown'
    const handle = item.fromHandle?.trim() || '';
    const displayHandle = handle && handle !== 'unknown' && handle !== 'null' && handle !== 'undefined'
      ? `@${handle}` 
      : item.fromAddress 
        ? `${item.fromAddress.slice(0, 6)}...${item.fromAddress.slice(-4)}`
        : 'Unknown User';

    return (
      <View style={styles.requestCard} key={item.id}>
        <View style={styles.requestHeader}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <View style={styles.requestInfo}>
            <Text style={styles.fromHandle}>{displayHandle}</Text>
            <Text style={styles.template}>{item.template || 'Consent Request'}</Text>
            <Text style={styles.time}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            <Text style={styles.acceptButtonText}>
              {isProcessing ? 'Processing...' : 'Accept'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Consent Requests</Text>
      </View>

      {consentRequests.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No pending requests</Text>
          <Text style={styles.emptySubtext}>
            You'll receive notifications when someone wants to create a consent with you
          </Text>
        </View>
      ) : (
        <FlatList
          data={consentRequests}
          renderItem={renderRequest}
          keyExtractor={(item, index) => item.id || `request-${index}`}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          extraData={consentRequests.length}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  requestInfo: {
    marginLeft: 12,
    flex: 1,
  },
  fromHandle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  template: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

