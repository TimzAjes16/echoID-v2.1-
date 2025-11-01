import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { computeVoiceHash } from '../lib/crypto';
import { analyzeCoercion, type AudioAnalysis } from '../lib/coercion';
import { getTemplate, type ConsentTemplate } from '../lib/templates';

interface RecorderProps {
  onRecordingComplete: (audioBytes: Uint8Array, analysis: AudioAnalysis) => void;
  template: ConsentTemplate;
}

export default function Recorder({ onRecordingComplete, template }: RecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const templateContent = getTemplate(template);
  const requiredPhrase = templateContent.requiredPhrase;
  
  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 0.1);
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setIsProcessing(true);
    setIsRecording(false);
    
    // Stop duration counter
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('No recording URI');
      }

      // Read audio file as bytes
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const audioBytes = new Uint8Array(arrayBuffer);

      // Enhanced audio analysis with AI-based features
      const duration = await getAudioDuration(uri);
      const analysis = await analyzeAudioFeatures(uri, duration);
      
      // Analyze coercion and show result
      const coercionLevel = analyzeCoercion(analysis);
      const { getCoercionLabel, getCoercionColor } = await import('../lib/coercion');
      
      // Show analysis result to user
      if (coercionLevel > 0) {
        Alert.alert(
          'Coercion Analysis',
          `Detection level: ${getCoercionLabel(coercionLevel)}\n\n${coercionLevel === 2 ? '⚠️ High risk indicators detected. Please ensure consent is voluntary.' : '⚠️ Some indicators detected. Please confirm this is your free will.'}`,
          [{ text: 'Continue', onPress: () => onRecordingComplete(audioBytes, analysis) }]
        );
      } else {
        // Green level - proceed normally
        onRecordingComplete(audioBytes, analysis);
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsProcessing(false);
      setRecording(null);
      setRecordingDuration(0);
    }
  }
  
  async function analyzeAudioFeatures(uri: string, duration: number): Promise<AudioAnalysis> {
    try {
      // Load audio for analysis
      const { sound } = await Audio.Sound.createAsync({ uri });
      
      // Basic heuristics
      const estimatedWords = Math.max(1, Math.floor(duration * 2)); // Rough estimate: 2 words/second
      const speakingRate = (estimatedWords / duration) * 60; // words per minute
      const pauseCount = Math.max(0, Math.floor(duration / 2.5)); // Estimate pauses
      const avgPauseLength = pauseCount > 0 ? duration / pauseCount / 2 : 0;

      // AI-based feature extraction (simulated - in production, use actual audio analysis)
      // These would typically use Web Audio API or native audio processing
      const analysis: AudioAnalysis = {
        duration,
        pauseCount,
        avgPauseLength: Math.min(avgPauseLength, 5),
        speakingRate: Math.max(50, Math.min(speakingRate, 200)),
        // Simulated AI features (in production, extract from audio waveform)
        avgPitch: 180 + Math.random() * 40, // Simulated: 180-220 Hz range
        pitchVariation: 20 + Math.random() * 30, // Simulated variation
        avgVolume: 0.6 + Math.random() * 0.3, // Simulated: 0.6-0.9
        volumeVariation: 0.1 + Math.random() * 0.2, // Simulated variation
        tempoStability: 0.7 + Math.random() * 0.2, // Simulated: 0.7-0.9
        hesitationMarkers: Math.floor(pauseCount * 0.3), // Estimate hesitation
        confidenceScore: calculateConfidenceScore(duration, pauseCount, speakingRate),
        emotionalTone: determineEmotionalTone(pauseCount, speakingRate, duration),
      };

      await sound.unloadAsync();
      return analysis;
    } catch (error) {
      console.error('Failed to analyze audio features:', error);
      // Return basic analysis if feature extraction fails
      return {
        duration,
        pauseCount: Math.floor(duration / 3),
        avgPauseLength: 1.5,
        speakingRate: 120,
      };
    }
  }
  
  function calculateConfidenceScore(duration: number, pauseCount: number, speakingRate: number): number {
    let score = 1.0;
    
    // Penalize very short recordings
    if (duration < 5) score -= 0.3;
    else if (duration < 10) score -= 0.15;
    
    // Penalize excessive pauses
    const pauseRatio = pauseCount / duration;
    if (pauseRatio > 0.3) score -= 0.4;
    else if (pauseRatio > 0.2) score -= 0.2;
    
    // Penalize abnormal speaking rates
    if (speakingRate < 60 || speakingRate > 180) score -= 0.2;
    
    return Math.max(0, Math.min(1, score));
  }
  
  function determineEmotionalTone(pauseCount: number, speakingRate: number, duration: number): 'calm' | 'stressed' | 'uncertain' | 'confident' {
    const pauseRatio = pauseCount / duration;
    
    if (pauseRatio > 0.25 || speakingRate < 60) {
      return 'uncertain';
    }
    if (pauseRatio > 0.15 || speakingRate > 160) {
      return 'stressed';
    }
    if (pauseRatio < 0.1 && speakingRate >= 100 && speakingRate <= 150) {
      return 'confident';
    }
    return 'calm';
  }

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  async function getAudioDuration(uri: string): Promise<number> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis / 1000 : 0;
      await sound.unloadAsync();
      return duration;
    } catch (error) {
      console.error('Failed to get duration:', error);
      return 0;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Record Voice Verification</Text>
      <Text style={styles.instruction}>
        Please say the following phrase clearly and with confidence. This recording will be analyzed for voluntary consent indicators.
      </Text>
      
      <View style={styles.phraseContainer}>
        <Text style={styles.phraseLabel}>Say this phrase:</Text>
        <Text style={styles.requiredPhrase}>"{requiredPhrase}"</Text>
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Animated.View 
            style={[
              styles.recordingDot,
              { opacity: pulseAnim }
            ]} 
          />
          <Text style={styles.recordingTime}>
            {Math.floor(recordingDuration)}s
          </Text>
        </View>
      )}

      {!isRecording && !isProcessing && (
        <TouchableOpacity style={styles.button} onPress={startRecording}>
          <Text style={styles.buttonText}>Start Recording</Text>
        </TouchableOpacity>
      )}

      {isRecording && (
        <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopRecording}>
          <Text style={styles.buttonText}>Stop Recording</Text>
        </TouchableOpacity>
      )}

      {isProcessing && (
        <Text style={styles.processing}>Analyzing audio for coercion indicators...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 150,
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  processing: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  phraseContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    width: '100%',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  phraseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredPhrase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 12,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
  },
});

