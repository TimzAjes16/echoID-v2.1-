import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { computeFaceHash } from '../lib/crypto';
import * as FileSystem from 'expo-file-system';

interface SelfieProps {
  onCaptureComplete: (imageBytes: Uint8Array) => void;
}

export default function Selfie({ onCaptureComplete }: SelfieProps) {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync();
      
      if (photo?.uri) {
        setImageUri(photo.uri);
        
        // Read image as bytes
        try {
          // Read as base64
          const base64 = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Convert base64 to Uint8Array (React Native compatible)
          // Helper function for base64 to Uint8Array conversion
          const base64ToUint8Array = (base64Str: string): Uint8Array => {
            // Remove data URL prefix if present
            const cleanBase64 = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
            
            // For React Native, we can use a polyfill or manual conversion
            // Using manual conversion which works in React Native
            if (typeof atob !== 'undefined') {
              // atob is available (polyfilled)
              const binaryString = atob(cleanBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              return bytes;
            } else {
              // Manual base64 decoding (fallback)
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
              const lookup = new Uint8Array(256);
              for (let i = 0; i < chars.length; i++) {
                lookup[chars.charCodeAt(i)] = i;
              }
              
              const bufferLength = cleanBase64.length * 0.75;
              const bytes = new Uint8Array(bufferLength);
              
              let p = 0;
              for (let i = 0; i < cleanBase64.length; i += 4) {
                const encoded1 = lookup[cleanBase64.charCodeAt(i)];
                const encoded2 = lookup[cleanBase64.charCodeAt(i + 1)];
                const encoded3 = lookup[cleanBase64.charCodeAt(i + 2)];
                const encoded4 = lookup[cleanBase64.charCodeAt(i + 3)];
                
                bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
                bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
                bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
              }
              
              return bytes;
            }
          };
          
          const imageBytes = base64ToUint8Array(base64);
          onCaptureComplete(imageBytes);
        } catch (readError) {
          console.error('Failed to read image:', readError);
          throw new Error('Failed to process captured image');
        }
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsProcessing(false);
    }
  }

  function retake() {
    setImageUri(null);
  }

  if (imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.preview} />
        <TouchableOpacity style={styles.button} onPress={retake}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Capture Selfie</Text>
      <Text style={styles.instruction}>
        Please take a selfie for biometric verification. This will be hashed and stored on-chain.
      </Text>
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          >
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      <TouchableOpacity
        style={[styles.button, styles.captureButton]}
        onPress={takePicture}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? 'Processing...' : 'Capture'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
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
  camera: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  controls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  flipButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 150,
  },
  captureButton: {
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
});

