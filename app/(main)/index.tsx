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
  const { consents, consentRequests, loadConfig, loadProfile, loadDeviceKeypair, addConsentRequest, loadConsentRequests, loadConsents, wallet, profile, themeMode } = useStore();
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 6,
    marginRight: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestsButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  newButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    padding: 12,
    paddingTop: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    color: colors.text,
    letterSpacing: -0.2,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  });
}

