import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore, ConsentRequest } from '../../state/useStore';
import { acceptConsentRequest, rejectConsentRequest } from '../../lib/consentRequests';
import { getAllUnreadCounts } from '../../lib/chatNotifications';
import { Ionicons } from '@expo/vector-icons';

export default function ConsentRequestsScreen() {
  const router = useRouter();
  const { consentRequests, removeConsentRequest, addConsent, wallet, profile, consents } = useStore();
  const [processing, setProcessing] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Map<bigint, number>>(new Map());

  // Load unread counts for consents
  useEffect(() => {
    async function loadUnreadCounts() {
      if (!wallet.address) return;
      
      const counts = await getAllUnreadCounts(wallet.address);
      setUnreadCounts(counts);
    }

    loadUnreadCounts();
    
    // Refresh every 5 seconds when screen is visible
    const interval = setInterval(loadUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [wallet.address]);

  // Filter requests to only show those meant for the current user (recipient)
  // Check if current user's handle matches the counterpartyHandle in the request
  const currentHandle = profile?.handle?.trim().toLowerCase();
  
  if (!currentHandle) {
    console.warn('[RequestsScreen] No current handle, cannot filter requests');
  }
  
  const filteredRequests = consentRequests.filter((req) => {
    if (!currentHandle) return false;
    
    // The recipient is stored in consentData.counterpartyHandle
    const recipientHandle = req.consentData?.counterpartyHandle?.toLowerCase();
    const fromHandle = req.fromHandle?.toLowerCase();
    
    // Request is for current user if recipientHandle matches current handle
    if (recipientHandle) {
      const isForCurrentUser = recipientHandle === currentHandle;
      console.log(`[RequestsScreen] Request ${req.id}: recipient=${recipientHandle}, current=${currentHandle}, match=${isForCurrentUser}`);
      return isForCurrentUser;
    }
    
    // Legacy fallback: if no counterpartyHandle, check if fromHandle is different
    // (if you didn't send it, you received it)
    const isNotFromCurrentUser = fromHandle !== currentHandle;
    console.log(`[RequestsScreen] Request ${req.id}: no recipientHandle, fromHandle=${fromHandle}, current=${currentHandle}, showing=${isNotFromCurrentUser}`);
    return isNotFromCurrentUser;
  });

  // Deduplicate filtered consent requests by ID to prevent duplicate key errors
  const uniqueConsentRequests = filteredRequests.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.id === current.id);
    if (existingIndex === -1) {
      acc.push(current);
    } else {
      // If duplicate found, keep the most recent one
      acc[existingIndex] = current;
    }
    return acc;
  }, [] as ConsentRequest[]);
  
  // Debug logging - always log to help diagnose issues
  console.log('[RequestsScreen] Request state:', {
    totalRequests: consentRequests.length,
    currentHandle: currentHandle || 'NOT SET',
    profileHandle: profile?.handle,
    filteredCount: filteredRequests.length,
    uniqueCount: uniqueConsentRequests.length,
    allRequests: consentRequests.map(r => ({
      id: r.id,
      fromHandle: r.fromHandle,
      recipientHandle: r.consentData?.counterpartyHandle,
      hasConsentData: !!r.consentData,
    })),
    filteredRequests: filteredRequests.map(r => ({
      id: r.id,
      fromHandle: r.fromHandle,
      recipientHandle: r.consentData?.counterpartyHandle,
    })),
  });

  async function handleAccept(requestId: string) {
    setProcessing(requestId);
    try {
      console.log('Attempting to accept request:', requestId);
      const { getConsentRequest, config } = useStore.getState();
      const request = getConsentRequest(requestId);
      
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

      // Check wallet balance before proceeding
      const { formatFee, getWalletBalance } = await import('../../lib/sdk');
      const feeAmount = config?.protocolFeeWei 
        ? formatFee(config.protocolFeeWei, config.defaultChainId || 8453)
        : '0.001 ETH';
      
      // Get current balance (pass handle for test balance lookup)
      const { profile } = useStore.getState();
      let currentBalance: string | null = null;
      try {
        currentBalance = await getWalletBalance(
          wallet.address as any,
          wallet.chainId || 8453,
          profile?.handle || undefined
        );
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }

      // Estimate total cost (protocol fee + gas)
      // Gas estimate: ~200k gas * ~0.00001 ETH per gas = ~0.002 ETH
      // Plus protocol fee of 0.001 ETH = ~0.003 ETH total
      const protocolFeeEth = parseFloat(config?.protocolFeeWei ? formatFee(config.protocolFeeWei, config.defaultChainId || 8453).split(' ')[0] : '0.001');
      const estimatedGasEth = 0.002; // Conservative estimate
      const totalRequiredEth = protocolFeeEth + estimatedGasEth;
      const currentBalanceEth = currentBalance ? parseFloat(currentBalance) : 0;

      // Check if balance is sufficient
      if (currentBalanceEth < totalRequiredEth) {
        Alert.alert(
          'Insufficient Balance',
          `You need at least ${totalRequiredEth.toFixed(4)} ETH to complete this transaction:\n\n• Protocol fee: ${protocolFeeEth.toFixed(4)} ETH\n• Estimated gas: ${estimatedGasEth.toFixed(4)} ETH\n\nYour current balance: ${currentBalanceEth.toFixed(4)} ETH\n\nPlease add funds to your wallet.`,
          [{ text: 'OK' }]
        );
        setProcessing(null);
        return;
      }

      // Show payment confirmation before proceeding
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Accept Consent Request',
          `Accepting this consent request will:\n\n• Create consent on-chain\n• Mint your consent badge (NFT)\n• Pay protocol fee: ${feeAmount}\n• Estimated gas: ~${estimatedGasEth.toFixed(4)} ETH\n\nTotal cost: ~${totalRequiredEth.toFixed(4)} ETH\nYour balance: ${currentBalanceEth.toFixed(4)} ETH\n\nContinue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Accept & Pay',
              onPress: () => resolve(true),
            },
          ]
        );
      });

      if (!confirmed) {
        setProcessing(null);
        return;
      }

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

    // Find corresponding consent to get unread count
    const consent = consents.find(c => 
      c.counterpartyHandle?.toLowerCase() === item.fromHandle?.toLowerCase() ||
      c.counterparty === item.fromAddress
    );
    const unreadCount = consent ? unreadCounts.get(consent.consentId) || 0 : 0;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <View style={styles.requestInfo}>
            <View style={styles.handleRow}>
              <Text style={styles.fromHandle}>{displayHandle}</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
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

      {uniqueConsentRequests.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No pending requests</Text>
          <Text style={styles.emptySubtext}>
            You'll receive notifications when someone wants to create a consent with you
          </Text>
        </View>
      ) : (
        <FlatList
          data={uniqueConsentRequests}
          renderItem={renderRequest}
          keyExtractor={(item, index) => {
            // Ensure unique keys: combine ID with index to guarantee uniqueness
            if (item.id) {
              return `req_${item.id}_${index}`;
            }
            return `request-${index}`;
          }}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          extraData={uniqueConsentRequests.length}
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
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fromHandle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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

