import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../state/useStore';
import BadgeCard from '../../components/BadgeCard';
import Drawer from '../../components/Drawer';
import { Ionicons } from '@expo/vector-icons';
import { setupNotificationListener, requestNotificationPermissions } from '../../lib/notifications';
import { ConsentRequest } from '../../state/useStore';

export default function HomeScreen() {
  const router = useRouter();
  const { consents, consentRequests, loadConfig, loadProfile, loadDeviceKeypair, addConsentRequest } = useStore();
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadConfig();
    loadProfile();
    loadDeviceKeypair();
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerVisible(true)}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Badges</Text>
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

      {consents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No consents yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first consent verification to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={consents}
          renderItem={({ item }) => <BadgeCard consent={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <Drawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestsButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

