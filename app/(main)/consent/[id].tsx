import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../../state/useStore';
import UnlockBar from '../../../components/UnlockBar';
import ChatScreen from '../../../components/ChatScreen';
import { getUnreadCount } from '../../../lib/chatNotifications';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../../../lib/theme';
import { useColorScheme } from 'react-native';
import dayjs from 'dayjs';

export default function ConsentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getConsent, themeMode, wallet } = useStore();
  const systemColorScheme = useColorScheme();
  const colors = getThemeColors(themeMode, systemColorScheme);
  const [consent, setConsent] = useState(getConsent(id));
  const [chatVisible, setChatVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setConsent(getConsent(id));
  }, [id]);

  useEffect(() => {
    async function loadUnreadCount() {
      if (!wallet.address || !consent) return;
      const count = await getUnreadCount(consent.id, wallet.address);
      setUnreadCount(count);
    }
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [wallet.address, consent?.id]);

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

  const counterpartyName = consent.counterpartyHandle 
    ? `@${consent.counterpartyHandle}`
    : `${consent.counterparty.slice(0, 6)}...${consent.counterparty.slice(-4)}`;

  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.content}
      >
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

      {/* Chat Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Communication</Text>
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: colors.primary }]}
          onPress={() => setChatVisible(true)}
        >
          <View style={styles.chatButtonContent}>
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.chatButtonText}>Open Chat</Text>
            {unreadCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.chatButtonSubtext}>
            End-to-end encrypted messaging with {counterpartyName}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    <ChatScreen
      consent={consent}
      visible={chatVisible}
      onClose={() => setChatVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  chatButton: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  chatBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chatButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
});

