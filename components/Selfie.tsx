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
      
      // Take picture with quality settings
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (!photo?.uri) {
        throw new Error('No photo URI returned from camera');
      }

      // Set preview image immediately
      setImageUri(photo.uri);
      
      // Read image as bytes
      try {
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        if (!fileInfo.exists) {
          throw new Error('Photo file does not exist');
        }

        // Read as base64
        const base64 = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!base64) {
          throw new Error('Failed to read image data');
        }
        
        // Convert base64 to Uint8Array (React Native compatible)
        // Helper function for base64 to Uint8Array conversion
        const base64ToUint8Array = (base64Str: string): Uint8Array => {
          // Remove data URL prefix if present
          const cleanBase64 = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
          
          // For React Native, we can use a polyfill or manual conversion
          // Using manual conversion which works in React Native
          if (typeof atob !== 'undefined') {
            try {
              // atob is available (polyfilled)
              const binaryString = atob(cleanBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              return bytes;
            } catch (e) {
              // Fall through to manual decoding
            }
          }
          
          // Manual base64 decoding (fallback)
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          const lookup = new Uint8Array(256);
          for (let i = 0; i < chars.length; i++) {
            lookup[chars.charCodeAt(i)] = i;
          }
          
          const bufferLength = Math.floor(cleanBase64.length * 0.75);
          const bytes = new Uint8Array(bufferLength);
          
          let p = 0;
          for (let i = 0; i < cleanBase64.length; i += 4) {
            const encoded1 = lookup[cleanBase64.charCodeAt(i)] || 0;
            const encoded2 = lookup[cleanBase64.charCodeAt(i + 1)] || 0;
            const encoded3 = lookup[cleanBase64.charCodeAt(i + 2)] || 0;
            const encoded4 = lookup[cleanBase64.charCodeAt(i + 3)] || 0;
            
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            if (i + 2 < cleanBase64.length) {
              bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            }
            if (i + 3 < cleanBase64.length) {
              bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
            }
          }
          
          return bytes.slice(0, p);
        };
        
        const imageBytes = base64ToUint8Array(base64);
        if (imageBytes.length === 0) {
          throw new Error('Image data is empty');
        }
        onCaptureComplete(imageBytes);
      } catch (readError: any) {
        console.error('Failed to read image:', readError);
        throw new Error(`Failed to process captured image: ${readError.message || readError}`);
      }
    } catch (error: any) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', error.message || 'Failed to capture photo');
      setImageUri(null); // Reset preview on error
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

