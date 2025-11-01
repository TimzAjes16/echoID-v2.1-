import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../../state/useStore';
import UnlockBar from '../../../components/UnlockBar';
import Chat from '../../../components/Chat';
import dayjs from 'dayjs';

export default function ConsentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getConsent } = useStore();
  const [consent, setConsent] = useState(getConsent(id));

  useEffect(() => {
    setConsent(getConsent(id));
  }, [id]);

  if (!consent) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Consent not found</Text>
      </View>
    );
  }

  const isLocked = Date.now() < consent.lockedUntil;
  const timeRemaining = consent.lockedUntil - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{consent.template}</Text>
        <View style={[styles.statusBadge, isLocked ? styles.locked : styles.unlocked]}>
          <Text style={styles.statusText}>
            {isLocked ? `🔒 ${hoursRemaining}h` : '✅ Unlocked'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Counterparty:</Text>
          <Text style={styles.detailValue}>{consent.counterparty}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>
            {dayjs(consent.createdAt).format('MMMM D, YYYY [at] h:mm A')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Locked Until:</Text>
          <Text style={styles.detailValue}>
            {dayjs(consent.lockedUntil).format('MMMM D, YYYY [at] h:mm A')}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Hashes</Text>
        <View style={styles.hashContainer}>
          <Text style={styles.hashLabel}>Voice Hash:</Text>
          <Text style={styles.hashValue} numberOfLines={1}>{consent.voiceHash}</Text>
        </View>
        <View style={styles.hashContainer}>
          <Text style={styles.hashLabel}>Face Hash:</Text>
          <Text style={styles.hashValue} numberOfLines={1}>{consent.faceHash}</Text>
        </View>
        <View style={styles.hashContainer}>
          <Text style={styles.hashLabel}>Device Hash:</Text>
          <Text style={styles.hashValue} numberOfLines={1}>{consent.deviceHash}</Text>
        </View>
      </View>

      <UnlockBar consent={consent} />

      {!isLocked && <Chat consent={consent} />}
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
  },
  error: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  locked: {
    backgroundColor: '#FFE0E0',
  },
  unlocked: {
    backgroundColor: '#E0FFE0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  hashContainer: {
    marginBottom: 12,
  },
  hashLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  hashValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});

