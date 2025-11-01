import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BarCodeScanner, BarCodeScanResult } from 'expo-barcode-scanner';
import { resolveHandle } from '../lib/handles';

interface QRPayload {
  h: string; // handle
  w: string; // wallet
  dp: string; // device pubkey (base64)
}

interface QRScannerProps {
  onScanComplete: (payload: QRPayload) => void;
  onCancel: () => void;
}

export default function QRScanner({ onScanComplete, onCancel }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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

  function handleBarCodeScanned({ type, data }: BarCodeScanResult) {
    if (scanned) return;
    setScanned(true);

    try {
      const payload: QRPayload = JSON.parse(data);
      
      if (!payload.h || !payload.w || !payload.dp) {
        throw new Error('Invalid QR payload');
      }

      onScanComplete(payload);
    } catch (error) {
      console.error('Failed to parse QR code:', error);
      Alert.alert('Error', 'Invalid QR code');
      setScanned(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.instruction}>
            Position the QR code within the frame
          </Text>
        </View>
      </CameraView>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  instruction: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

