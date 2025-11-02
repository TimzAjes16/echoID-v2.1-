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
          <Text style={styles.detailValue}>{counterpartyName}</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  error: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 40,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.5,
    color: '#000',
    paddingRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  locked: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  unlocked: {
    backgroundColor: '#F0FFF0',
    borderWidth: 1,
    borderColor: '#E0FFE0',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    color: '#000',
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    width: 130,
    fontWeight: '500',
    paddingTop: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    color: '#000',
    lineHeight: 20,
  },
  hashContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  hashLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hashValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#000',
    lineHeight: 18,
  },
  chatButton: {
    borderRadius: 12,
    padding: 18,
    marginTop: 12,
    shadowColor: '#2081E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  chatBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  chatButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '400',
  },
});

