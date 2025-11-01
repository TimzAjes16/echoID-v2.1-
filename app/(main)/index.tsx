import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../state/useStore';
import BadgeCard from '../../components/BadgeCard';

export default function HomeScreen() {
  const router = useRouter();
  const { consents, loadConfig, loadProfile, loadDeviceKeypair } = useStore();

  useEffect(() => {
    loadConfig();
    loadProfile();
    loadDeviceKeypair();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Badges</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(main)/consent/new')}
        >
          <Text style={styles.newButtonText}>+ New Consent</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
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

