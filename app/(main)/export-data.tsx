import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useStore } from '../../state/useStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ExportDataScreen() {
  const { profile, wallet, consents, consentRequests } = useStore();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        account: {
          handle: profile.handle,
          walletAddress: wallet.address,
          chainId: wallet.chainId,
          devicePubKey: profile.devicePubKey,
        },
        consents: consents.map(c => ({
          id: c.id,
          consentId: c.consentId.toString(),
          counterparty: c.counterparty,
          counterpartyHandle: c.counterpartyHandle,
          template: c.template,
          createdAt: new Date(c.createdAt).toISOString(),
          lockedUntil: new Date(c.lockedUntil).toISOString(),
          status: c.status,
          // Note: Hashes are included but not raw data
          hashes: {
            voiceHash: c.voiceHash,
            faceHash: c.faceHash,
            deviceHash: c.deviceHash,
            geoHash: c.geoHash,
            utcHash: c.utcHash,
          },
        })),
        consentRequests: consentRequests.map(r => ({
          id: r.id,
          fromHandle: r.fromHandle,
          fromAddress: r.fromAddress,
          template: r.template,
          requestedAt: new Date(r.requestedAt).toISOString(),
        })),
        metadata: {
          format: 'JSON',
          version: '1.0',
          note: 'This export contains your account data and consent records. Raw biometric data is not included for security reasons.',
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = `echoid_export_${Date.now()}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export EchoID Data',
        });
        Alert.alert('Success', 'Your data has been exported and is ready to share.');
      } else {
        Alert.alert('Export Ready', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Export Your Data</Text>
      <Text style={styles.description}>
        Under UK GDPR, you have the right to receive your personal data in a structured, machine-readable format.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What Will Be Exported:</Text>
        <Text style={styles.infoText}>
          • Your account information (handle, wallet address){'\n'}
          • Consent records (IDs, timestamps, status){'\n'}
          • Consent request history{'\n'}
          • Verification hashes (not raw biometric data){'\n\n'}
          <Text style={styles.warning}>
            Note: Raw voice recordings and images are stored locally on your device and are not included in this export for security reasons.
          </Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
        onPress={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.exportButtonText}>Export My Data</Text>
            <Text style={styles.exportButtonSubtext}>JSON Format</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.heading}>Data Summary</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Account:</Text>
          <Text style={styles.summaryValue}>@{profile.handle || 'Not set'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Consents:</Text>
          <Text style={styles.summaryValue}>{consents.length} record(s)</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending Requests:</Text>
          <Text style={styles.summaryValue}>{consentRequests.length} request(s)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Important Notes</Text>
        <Text style={styles.text}>
          • Exports are provided in JSON format as required by UK GDPR{'\n'}
          • You will receive the export file within 30 days{'\n'}
          • This export does not include data stored on blockchain (which is publicly accessible){'\n'}
          • For additional data requests, contact privacy@echoid.xyz
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  warning: {
    fontWeight: '600',
    color: '#F57C00',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

