import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { computeVoiceHash } from '../lib/crypto';
import { analyzeCoercion, type AudioAnalysis } from '../lib/coercion';

interface RecorderProps {
  onRecordingComplete: (audioBytes: Uint8Array, analysis: AudioAnalysis) => void;
  template: string;
}

export default function Recorder({ onRecordingComplete, template }: RecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setIsProcessing(true);
    setIsRecording(false);

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

      // Analyze audio for coercion
      const duration = await getAudioDuration(uri);
      const analysis: AudioAnalysis = {
        duration,
        pauseCount: Math.floor(duration / 3), // Placeholder
        avgPauseLength: 1.5, // Placeholder
        speakingRate: 120, // Placeholder
      };

      onRecordingComplete(audioBytes, analysis);
    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsProcessing(false);
      setRecording(null);
    }
  }

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
        Please read the consent agreement out loud. This recording will be hashed and stored on-chain.
      </Text>

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
        <Text style={styles.processing}>Processing...</Text>
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
  },
});

