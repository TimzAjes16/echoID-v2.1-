import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../state/useStore';
import BadgeCard from '../../components/BadgeCard';
import Drawer from '../../components/Drawer';
import { Ionicons } from '@expo/vector-icons';
import { setupNotificationListener, requestNotificationPermissions } from '../../lib/notifications';
import { ConsentRequest } from '../../state/useStore';
import { getThemeColors } from '../../lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { consents, consentRequests, loadConfig, loadProfile, loadDeviceKeypair, addConsentRequest, loadConsentRequests, loadConsents, loadBlockedUsers, wallet, profile, themeMode } = useStore();
  const systemColorScheme = useColorScheme();
  const colors = getThemeColors(themeMode, systemColorScheme);
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const styles = createStyles(colors, insets);

  useEffect(() => {
    loadConfig();
    loadProfile();
    loadDeviceKeypair();
    loadConsentRequests(); // Load persisted consent requests
    loadConsents(); // Load persisted consents
    loadBlockedUsers(); // Load blocked users
    requestNotificationPermissions();

    // Setup notification listener for consent requests
    const subscription = setupNotificationListener((request: ConsentRequest) => {
      addConsentRequest(request);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Show badge for pending requests
    if (consentRequests.length > 0) {
      // In a real app, show notification badge
      console.log(`You have ${consentRequests.length} pending consent request(s)`);
    }
  }, [consentRequests.length]);

  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, { backgroundColor: colors.surface, paddingTop: Math.max(insets.top - 8, 0) }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
          >
            <Ionicons name="menu" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>My Contracts</Text>
        <View style={styles.headerActions}>
          {consentRequests.length > 0 && (
            <TouchableOpacity
              style={styles.requestsButton}
              onPress={() => router.push('/(main)/requests')}
            >
              <Ionicons name="mail-unread" size={20} color="#fff" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{consentRequests.length}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => router.push('/(main)/consent/new')}
          >
            <Text style={styles.newButtonText}>+ New Consent</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>

      {(() => {
        // Filter consents to show only those involving the current user
        // A consent represents the current user's perspective:
        // - The counterparty field shows who the OTHER party is
        // - So if counterparty is set, this consent belongs to current user
        // - For test users, we also check by handle match
        const currentAddress = wallet?.address?.toLowerCase();
        const currentHandle = profile?.handle?.toLowerCase();
        
        const filteredConsents = consents.filter((consent) => {
          if (!currentAddress && !currentHandle) return false;
          
          // A consent is visible to current user if:
          // 1. The counterparty is NOT the current user's address (meaning user is the other party)
          // 2. OR we check by handle for test users
          const counterpartyAddress = consent.counterparty?.toLowerCase();
          const counterpartyHandle = consent.counterpartyHandle?.toLowerCase();
          
          // If counterparty is current user, this consent doesn't belong to current user
          // (it belongs to the counterparty)
          const isCounterparty = counterpartyAddress === currentAddress || 
                                 counterpartyHandle === currentHandle;
          
          // Show consent if current user is NOT the counterparty (meaning user owns this consent)
          // OR if counterpartyHandle doesn't match (for backwards compatibility)
          return !isCounterparty || (!counterpartyAddress && !counterpartyHandle);
        });
        
        console.log('[HomeScreen] Consent filtering:', {
          totalConsents: consents.length,
          currentAddress,
          currentHandle,
          filteredCount: filteredConsents.length,
          consents: consents.map(c => ({
            id: c.id,
            counterparty: c.counterparty,
            counterpartyHandle: c.counterpartyHandle,
          })),
        });
        
        return filteredConsents.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No consents yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first consent verification to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConsents}
            renderItem={({ item }) => <BadgeCard consent={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        );
      })()}

      <Drawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof getThemeColors>, insets: { top: number }) {
  return StyleSheet.create({
  safeArea: {
    paddingBottom: 0,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || 'rgba(0,0,0,0.06)',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.5,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestsButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  newButton: {
    backgroundColor: colors.primary || '#2081E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: colors.primary || '#2081E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  list: {
    padding: 20,
    paddingTop: 24,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
  },
  });
}

