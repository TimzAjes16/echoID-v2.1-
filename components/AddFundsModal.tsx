import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvailableProviders, getPaymentQuote, initiateApplePayPayment, convertUSDToETH } from '../lib/payment';
import type { PaymentProvider, PaymentQuote } from '../lib/payment';

interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
  network: string;
  onPaymentComplete?: () => void;
}

export default function AddFundsModal({
  visible,
  onClose,
  walletAddress,
  network,
  onPaymentComplete,
}: AddFundsModalProps) {
  const [amount, setAmount] = useState('');
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProviders();
    }
  }, [visible]);

  useEffect(() => {
    if (amount && selectedProvider) {
      loadQuote();
    }
  }, [amount, selectedProvider]);

  async function loadProviders() {
    setIsLoading(true);
    try {
      const availableProviders = await getAvailableProviders();
      setProviders(availableProviders);
      // Auto-select provider with lowest fees
      if (availableProviders.length > 0) {
        const bestProvider = availableProviders.reduce((best, current) => {
          const bestFee = parseFloat(best.fees.split('%')[0]);
          const currentFee = parseFloat(current.fees.split('%')[0]);
          return currentFee < bestFee ? current : best;
        });
        setSelectedProvider(bestProvider);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadQuote() {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 10) return;

    setIsLoading(true);
    try {
      if (selectedProvider) {
        const paymentQuote = await getPaymentQuote(selectedProvider.name, amountNum, network);
        setQuote(paymentQuote);
      }
    } catch (error) {
      console.error('Failed to load quote:', error);
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApplePay() {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || amountNum < 10) {
      Alert.alert('Invalid Amount', 'Minimum purchase amount is $10');
      return;
    }

    if (!selectedProvider) {
      Alert.alert('Error', 'Please select a payment provider');
      return;
    }

    if (!quote) {
      Alert.alert('Error', 'Please wait for quote to load');
      return;
    }

    // Confirm payment
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Payment',
        `Purchase ${quote.amountETH.toFixed(6)} ETH\n\nAmount: $${quote.amountUSD.toFixed(2)}\nFees: $${quote.fees.toFixed(2)}\nTotal: $${quote.totalUSD.toFixed(2)}\n\nProvider: ${selectedProvider.name}\n\nThis will open the payment provider in your browser to complete the purchase via Apple Pay.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continue', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const result = await initiateApplePayPayment(amountNum, walletAddress, network);
      
      if (result.success) {
        Alert.alert(
          'Payment Initiated',
          'Your payment has been initiated. You will be redirected to complete the purchase via Apple Pay. Your wallet balance will update automatically once the transaction is confirmed on the blockchain.',
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentComplete?.();
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Failed to initiate payment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleClose() {
    setAmount('');
    setQuote(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Funds</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Amount (USD)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9.]/g, '');
                  setAmount(numericValue);
                }}
                placeholder="10.00"
                keyboardType="decimal-pad"
                editable={!isProcessing}
              />
              <Text style={styles.hint}>Minimum: $10.00</Text>
            </View>

            {providers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>Payment Provider</Text>
                <Text style={styles.subLabel}>Automatically selected provider with lowest fees</Text>
                {providers.map((provider) => (
                  <TouchableOpacity
                    key={provider.name}
                    style={[
                      styles.providerCard,
                      selectedProvider?.name === provider.name && styles.providerCardSelected,
                    ]}
                    onPress={() => setSelectedProvider(provider)}
                    disabled={isProcessing}
                  >
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>{provider.name}</Text>
                      <Text style={styles.providerFees}>{provider.fees}</Text>
                      <Text style={styles.providerLimits}>
                        ${provider.minAmount} - ${provider.maxAmount.toLocaleString()}
                      </Text>
                    </View>
                    {selectedProvider?.name === provider.name && (
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {quote && (
              <View style={styles.section}>
                <Text style={styles.label}>Payment Summary</Text>
                <View style={styles.quoteCard}>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>You'll Receive:</Text>
                    <Text style={styles.quoteValue}>{quote.amountETH.toFixed(6)} ETH</Text>
                  </View>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Amount:</Text>
                    <Text style={styles.quoteValue}>${quote.amountUSD.toFixed(2)}</Text>
                  </View>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Fees:</Text>
                    <Text style={styles.quoteValue}>${quote.fees.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.quoteRow, styles.quoteTotal]}>
                    <Text style={styles.quoteLabel}>Total:</Text>
                    <Text style={styles.quoteValueTotal}>${quote.totalUSD.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.applePayButton, (!quote || isProcessing) && styles.buttonDisabled]}
              onPress={handleApplePay}
              disabled={!quote || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                  <Text style={styles.applePayText}>Pay with Apple Pay</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Note: For Expo Go, Apple Pay payments will open in your browser. 
              Full native Apple Pay support requires a custom development build.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  providerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  providerCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0F9FF',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  providerFees: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  providerLimits: {
    fontSize: 12,
    color: '#999',
  },
  quoteCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 4,
  },
  quoteLabel: {
    fontSize: 14,
    color: '#666',
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  quoteValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  applePayButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  applePayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

