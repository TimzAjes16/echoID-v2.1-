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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.4,
    color: '#000',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
  counterparty: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 6,
    fontWeight: '400',
  },
  date: {
    fontSize: 13,
    color: '#C7C7CC',
    fontWeight: '400',
  },
  unlockStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  unlockText: {
    fontSize: 13,
    color: '#2081E2',
    marginTop: 4,
    fontWeight: '500',
  },
});

