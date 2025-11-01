import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../../state/useStore';
import { getAllTemplates, ConsentTemplate } from '../../../lib/templates';
import Recorder from '../../../components/Recorder';
import Selfie from '../../../components/Selfie';
import { computeVoiceHash, computeFaceHash, computeDeviceHash, getDeviceKeypair } from '../../../lib/crypto';
import { computeGeoHash, getCurrentUTCHash } from '../../../lib/geo';
import { analyzeCoercion, type AudioAnalysis } from '../../../lib/coercion';
import { createConsent, UnlockMode, formatFee } from '../../../lib/sdk';
import { Address } from 'viem';
import { resolveHandle } from '../../../lib/handles';

type Step = 'template' | 'counterparty' | 'voice' | 'selfie' | 'review' | 'processing';

export default function NewConsentScreen() {
  const router = useRouter();
  const { wallet, config, addConsent } = useStore();
  
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);
  const [counterpartyHandle, setCounterpartyHandle] = useState('');
  const [counterpartyAddress, setCounterpartyAddress] = useState<string | null>(null);
  const [isResolvingHandle, setIsResolvingHandle] = useState(false);
  const [audioBytes, setAudioBytes] = useState<Uint8Array | null>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [unlockMode, setUnlockMode] = useState<UnlockMode>(UnlockMode.WINDOWED);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!wallet.address) {
    return (
      <View style={styles.container}>
        <Text>Please login first</Text>
      </View>
    );
  }

  const templates = getAllTemplates();

  async function handleResolveHandle() {
    if (!counterpartyHandle.trim()) {
      Alert.alert('Error', 'Please enter a handle');
      return;
    }

    setIsResolvingHandle(true);
    try {
      const mapping = await resolveHandle(counterpartyHandle);
      if (!mapping) {
        Alert.alert('Error', 'Handle not found. Please verify the handle is correct.');
        setIsResolvingHandle(false);
        return;
      }
      setCounterpartyAddress(mapping.walletAddress);
      setIsResolvingHandle(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resolve handle');
      setIsResolvingHandle(false);
    }
  }

  async function handleCreate() {
    if (!selectedTemplate || !counterpartyAddress || !audioBytes || !imageBytes || !config) {
      Alert.alert('Error', 'Please complete all steps and resolve counterparty handle');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // Compute hashes
      const voiceHash = computeVoiceHash(audioBytes);
      const faceHash = computeFaceHash(imageBytes);
      const keypair = await getDeviceKeypair();
      const deviceHash = computeDeviceHash(keypair.publicKey);
      
      // Get location (simplified - in production, request permission)
      const geoHash = computeGeoHash(37.7749, -122.4194); // Placeholder
      const utcHash = getCurrentUTCHash();
      
      const coercionLevel = audioAnalysis ? analyzeCoercion(audioAnalysis) : 0;

      // Create consent on-chain
      const consentId = await createConsent(
        wallet,
        {
          voiceHash,
          faceHash,
          deviceHash,
          geoHash,
          utcHash,
          coercionLevel,
          counterparty: counterpartyAddress as Address,
          unlockMode,
          unlockWindow: unlockMode === UnlockMode.WINDOWED ? 3600 : undefined,
        },
        config.protocolFeeWei
      );

      // Add to local store
      const consent = {
        id: `${Date.now()}-${Math.random()}`,
        consentId,
        counterparty: counterpartyAddress,
        template: selectedTemplate,
        createdAt: Date.now(),
        lockedUntil: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        unlockRequested: false,
        unlockApproved: false,
        isUnlocked: false,
        voiceHash,
        faceHash,
        deviceHash,
        geoHash,
        utcHash,
        coercionLevel,
      };

      addConsent(consent);
      router.replace('/(main)');
    } catch (error) {
      console.error('Failed to create consent:', error);
      Alert.alert('Error', 'Failed to create consent');
      setIsProcessing(false);
      setStep('review');
    }
  }

  function renderStep() {
    switch (step) {
      case 'template':
        return (
          <View>
            <Text style={styles.stepTitle}>Select Template</Text>
            {templates.map(({ id, content }) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.templateCard,
                  selectedTemplate === id && styles.templateCardSelected,
                ]}
                onPress={() => setSelectedTemplate(id)}
              >
                <Text style={styles.templateTitle}>{content.title}</Text>
                <Text style={styles.templatePreview} numberOfLines={2}>
                  {content.text.substring(0, 100)}...
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                if (selectedTemplate) setStep('counterparty');
                else Alert.alert('Please select a template');
              }}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );

      case 'counterparty':
        return (
          <View>
            <Text style={styles.stepTitle}>Enter Counterparty @handle</Text>
            <Text style={styles.hintText}>
              Enter the @handle of the person you want to create a consent with
            </Text>
            <TextInput
              style={styles.input}
              value={counterpartyHandle}
              onChangeText={(text) => {
                setCounterpartyHandle(text.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase());
                setCounterpartyAddress(null);
              }}
              placeholder="@username"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {counterpartyAddress && (
              <View style={styles.resolvedContainer}>
                <Text style={styles.resolvedText}>✓ Resolved:</Text>
                <Text style={styles.resolvedAddress}>{counterpartyAddress}</Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep('template')}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              {!counterpartyAddress ? (
                <TouchableOpacity
                  style={[styles.resolveButton, isResolvingHandle && styles.buttonDisabled]}
                  onPress={handleResolveHandle}
                  disabled={isResolvingHandle || !counterpartyHandle.trim()}
                >
                  <Text style={styles.resolveButtonText}>
                    {isResolvingHandle ? 'Resolving...' : 'Resolve Handle'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => setStep('voice')}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'voice':
        return (
          <View>
            <Recorder
              template={selectedTemplate!}
              onRecordingComplete={(bytes, analysis) => {
                setAudioBytes(bytes);
                setAudioAnalysis(analysis);
                setStep('selfie');
              }}
            />
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('counterparty')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        );

      case 'selfie':
        return (
          <View>
            <Selfie
              onCaptureComplete={(bytes) => {
                setImageBytes(bytes);
                setStep('review');
              }}
            />
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('voice')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        );

      case 'review':
        return (
          <View>
            <Text style={styles.stepTitle}>Review & Confirm</Text>
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Template:</Text>
              <Text style={styles.reviewValue}>
                {templates.find((t) => t.id === selectedTemplate)?.content.title}
              </Text>
            </View>
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Counterparty:</Text>
              <Text style={styles.reviewValue}>@{counterpartyHandle}</Text>
              <Text style={styles.reviewValue}>{counterpartyAddress}</Text>
            </View>
            {config && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Protocol Fee:</Text>
                <Text style={styles.reviewValue}>{formatFee(config.protocolFeeWei)}</Text>
              </View>
            )}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Lock Duration:</Text>
              <Text style={styles.reviewValue}>24 hours</Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreate}
            >
              <Text style={styles.createButtonText}>Create & Pay Fee</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('selfie')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        );

      case 'processing':
        return (
          <View style={styles.processing}>
            <ActivityIndicator size="large" />
            <Text style={styles.processingText}>Creating consent...</Text>
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {renderStep()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  templateCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginBottom: 12,
  },
  templateCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  templatePreview: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginTop: 20,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resolvedContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  resolvedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 4,
    fontWeight: '600',
  },
  resolvedAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  processing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

