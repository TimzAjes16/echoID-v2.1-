import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function Drawer({ visible, onClose }: DrawerProps) {
  const { wallet, profile, disconnectWallet } = useStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Close drawer first
      onClose();
      
      // Disconnect wallet (clears WalletConnect, local wallet, and profile)
      await disconnectWallet();
      
      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to auth screen
      router.replace('/(auth)');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to auth even if logout has errors
      router.replace('/(auth)');
    }
  };

  const handleProfile = () => {
    router.push('/(main)/profile');
    onClose();
  };

  const handleSettings = () => {
    router.push('/(main)/settings');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.drawer} onStartShouldSetResponder={() => true}>
          <ScrollView style={styles.content}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={64} color="#007AFF" />
              </View>
              <Text style={styles.handleName}>@{profile.handle || 'Anonymous'}</Text>
              <Text style={styles.walletAddress}>
                {wallet.address 
                  ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                  : 'No wallet'}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Menu Items */}
            <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
              <Ionicons name="person-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <Ionicons name="settings-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                router.push('/(main)/help');
                onClose();
              }}
            >
              <Ionicons name="help-circle-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                router.push('/(main)/terms');
                onClose();
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Terms of Service</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                router.push('/(main)/privacy');
                onClose();
              }}
            >
              <Ionicons name="lock-closed-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Privacy Policy</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Logout */}
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#F44336" />
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>

            {/* Wallet Info */}
            <View style={styles.walletInfo}>
              <Text style={styles.walletInfoLabel}>Wallet Address:</Text>
              <Text style={styles.walletInfoValue} selectable>
                {wallet.address || 'Not connected'}
              </Text>
              <Text style={styles.walletInfoLabel}>Chain ID:</Text>
              <Text style={styles.walletInfoValue}>{wallet.chainId || 'N/A'}</Text>
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingTop: 60,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  handleName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: '#F44336',
    fontWeight: '600',
  },
  walletInfo: {
    padding: 16,
    paddingLeft: 24,
    backgroundColor: '#F9F9F9',
    marginTop: 'auto',
  },
  walletInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginBottom: 4,
  },
  walletInfoValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
});

