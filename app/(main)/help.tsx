import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../state/useStore';
import { getThemeColors } from '../../lib/theme';

export default function HelpScreen() {
  const { themeMode } = useStore();
  const systemColorScheme = useColorScheme();
  const colors = getThemeColors(themeMode, systemColorScheme);
  const styles = createStyles(colors);
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@echoid.xyz?subject=EchoID Support Request');
  };

  const handleWebsite = () => {
    Linking.openURL('https://echoid.xyz/support');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get Help</Text>
        
        <TouchableOpacity style={styles.helpItem} onPress={handleEmailSupport}>
          <Ionicons name="mail-outline" size={24} color={colors.primary} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Email Support</Text>
            <Text style={styles.helpDescription}>
              Contact our support team via email
            </Text>
            <Text style={styles.helpValue}>support@echoid.xyz</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpItem} onPress={handleWebsite}>
          <Ionicons name="globe-outline" size={24} color={colors.primary} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Help Center</Text>
            <Text style={styles.helpDescription}>
              Visit our online help center for guides and FAQs
            </Text>
            <Text style={styles.helpValue}>echoid.xyz/support</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I create a consent?</Text>
          <Text style={styles.faqAnswer}>
            1. Tap "+ New Consent" on the home screen{'\n'}
            2. Select a template (e.g., Sex-NDA, Standard NDA){'\n'}
            3. Enter the counterparty's @handle{'\n'}
            4. Record your voice verification{'\n'}
            5. Capture your selfie{'\n'}
            6. Review and confirm{'\n'}
            7. Pay the protocol fee and submit
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How does the 24-hour lock work?</Text>
          <Text style={styles.faqAnswer}>
            All consents are automatically locked for 24 hours after creation. During this period, the consent data cannot be unlocked. After 24 hours, both parties must approve the unlock for it to proceed. This provides a cooling-off period and ensures mutual consent for data access.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Can I cancel a consent?</Text>
          <Text style={styles.faqAnswer}>
            Once a consent is created and minted on the blockchain, it cannot be cancelled. However, the data remains locked until both parties agree to unlock it. For assistance with specific situations, contact support.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>What happens to my data?</Text>
          <Text style={styles.faqAnswer}>
            Your voice and biometric data are never stored in raw form. Only cryptographic hashes are stored on-chain. Raw data is encrypted and stored locally on your device. You can export or delete your data at any time from Settings.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I change my handle?</Text>
          <Text style={styles.faqAnswer}>
            Handles are unique and permanent. Once claimed, they cannot be changed. If you need a different handle, you would need to create a new account. Contact support if you have a special circumstance.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Email:</Text>
          <Text style={styles.contactValue}>support@echoid.xyz</Text>
        </View>

        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Website:</Text>
          <Text style={styles.contactValue}>echoid.xyz</Text>
        </View>

        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Registered Address (UK):</Text>
          <Text style={styles.contactValue}>
            EchoID Limited{'\n'}
            [Your Registered Address]{'\n'}
            United Kingdom
          </Text>
        </View>

        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Company Number:</Text>
          <Text style={styles.contactValue}>[Your Company Registration Number]</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: 12,
      paddingVertical: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      paddingHorizontal: 16,
      paddingVertical: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    helpItem: {
      flexDirection: 'row',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    helpContent: {
      flex: 1,
      marginLeft: 12,
    },
    helpTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    helpDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 3,
    },
    helpValue: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    faqItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    faqQuestion: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    faqAnswer: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    contactItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    contactLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 3,
    },
    contactValue: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 19,
    },
  });
}

