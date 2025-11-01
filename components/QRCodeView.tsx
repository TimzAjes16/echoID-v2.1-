import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useEffect, useState } from 'react';
import { useStore } from '../state/useStore';
import { getDeviceKeypair } from '../lib/crypto';

export default function QRCodeView() {
  const { wallet, profile } = useStore();
  const [qrData, setQrData] = useState<string | null>(null);
  const [devicePubKey, setDevicePubKey] = useState<string | null>(null);

  useEffect(() => {
    loadQRCode();
  }, [wallet.address, profile.handle]);

  async function loadQRCode() {
    if (!wallet.address || !profile.handle) return;

    try {
      const keypair = await getDeviceKeypair();
      const pubKeyStr = Array.from(keypair.publicKey, (byte) => String.fromCharCode(byte)).join('');
      const pubKeyBase64 = btoa(pubKeyStr);

      const payload = {
        h: profile.handle,
        w: wallet.address,
        dp: pubKeyBase64,
      };

      setQrData(JSON.stringify(payload));
      setDevicePubKey(pubKeyBase64);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  }

  async function shareQR() {
    if (!profile.handle) return;

    try {
      await Share.share({
        message: `echoid://u/${profile.handle}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }

  if (!qrData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading QR code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your QR Code</Text>
      <Text style={styles.handle}>@{profile.handle}</Text>
      
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={300}
          color="#000000"
          backgroundColor="#FFFFFF"
          logo={undefined}
        />
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={shareQR}>
        <Text style={styles.shareButtonText}>Share Handle</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>Handle: @{profile.handle}</Text>
        <Text style={styles.infoText}>
          Wallet: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  loading: {
    fontSize: 16,
    color: '#666',
  },
  label: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  handle: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 32,
  },
  qrContainer: {
    width: 300,
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

