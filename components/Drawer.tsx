import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../lib/theme';

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function Drawer({ visible, onClose }: DrawerProps) {
  const { wallet, profile, disconnectWallet, themeMode } = useStore();
  const systemColorScheme = useColorScheme();
  const colors = getThemeColors(themeMode, systemColorScheme);
  const router = useRouter();
  const styles = createStyles(colors);

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
                <Ionicons name="person-circle" size={56} color={colors.primary} />
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
              <Ionicons name="person-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
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
              <Ionicons name="help-circle-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                router.push('/(main)/terms');
                onClose();
              }}
            >
              <Ionicons name="document-text-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Terms of Service</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                router.push('/(main)/privacy');
                onClose();
              }}
            >
              <Ionicons name="lock-closed-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Privacy Policy</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Logout */}
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
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

function createStyles(colors: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
      width: '80%',
      maxWidth: 320,
      height: '100%',
      backgroundColor: colors.surface,
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
      padding: 20,
      paddingTop: 50,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    avatarContainer: {
      marginBottom: 10,
    },
    handleName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    walletAddress: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 6,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    menuText: {
      fontSize: 15,
      color: colors.text,
      marginLeft: 14,
      fontWeight: '500',
    },
    logoutItem: {
      marginTop: 4,
    },
    logoutText: {
      color: colors.error,
      fontWeight: '600',
    },
    walletInfo: {
      padding: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
      marginTop: 'auto',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    walletInfoLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 6,
      marginBottom: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    walletInfoValue: {
      fontSize: 12,
      color: colors.text,
      fontFamily: 'monospace',
    },
  });
}

