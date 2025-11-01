import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Consent } from '../state/useStore';
import { getUnreadCount } from '../lib/chatNotifications';
import { useStore } from '../state/useStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';

dayjs.extend(relativeTime);

interface BadgeCardProps {
  consent: Consent;
}

export default function BadgeCard({ consent }: BadgeCardProps) {
  const router = useRouter();
  const { wallet } = useStore();
  const isLocked = Date.now() < consent.lockedUntil;
  const timeRemaining = consent.lockedUntil - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      if (!wallet.address) return;
      // Use consent.id (string) not consent.consentId (bigint) since chat DB stores consent.id
      const count = await getUnreadCount(consent.id, wallet.address);
      setUnreadCount(count);
    }
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [wallet.address, consent.id]);

  const counterpartyName = consent.counterpartyHandle 
    ? `@${consent.counterpartyHandle}`
    : `${consent.counterparty.slice(0, 6)}...${consent.counterparty.slice(-4)}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(main)/consent/${consent.id}`)}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{consent.template}</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, isLocked ? styles.locked : styles.unlocked]}>
          <Text style={styles.statusText}>
            {isLocked ? `🔒 ${hoursRemaining}h` : '✅ Unlocked'}
          </Text>
        </View>
      </View>

      <Text style={styles.counterparty}>
        Counterparty: {counterpartyName}
      </Text>

      <Text style={styles.date}>
        Created {dayjs(consent.createdAt).fromNow()}
      </Text>

      {(consent.unlockRequested || consent.unlockApproved) && (
        <View style={styles.unlockStatus}>
          {consent.unlockRequested && (
            <Text style={styles.unlockText}>⏳ Unlock requested</Text>
          )}
          {consent.unlockApproved && (
            <Text style={styles.unlockText}>✅ Unlock approved</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
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
  counterparty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  unlockStatus: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  unlockText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
});

