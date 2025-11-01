import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function CookiesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cookie Policy</Text>
      <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString('en-GB')}</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>1. What Are Cookies?</Text>
        <Text style={styles.text}>
          Cookies are small text files stored on your device when you visit websites or use mobile applications. They help provide functionality and improve user experience.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. How We Use Cookies</Text>
        <Text style={styles.text}>
          EchoID Limited uses cookies and similar technologies to:{'\n\n'}
          • Maintain your session and authentication state{'\n'}
          • Remember your preferences{'\n'}
          • Analyze app usage and performance{'\n'}
          • Improve security{'\n'}
          • Provide personalized features
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. Types of Cookies We Use</Text>
        
        <Text style={styles.subheading}>3.1. Essential Cookies</Text>
        <Text style={styles.text}>
          These are necessary for the app to function. They cannot be disabled.{'\n'}
          Examples: Authentication tokens, session identifiers
        </Text>

        <Text style={styles.subheading}>3.2. Analytics Cookies</Text>
        <Text style={styles.text}>
          These help us understand how users interact with the app.{'\n'}
          Examples: Usage statistics, error tracking{'\n\n'}
          You can disable these in Settings.
        </Text>

        <Text style={styles.subheading}>3.3. Functional Cookies</Text>
        <Text style={styles.text}>
          These remember your preferences.{'\n'}
          Examples: Language settings, display preferences
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Third-Party Cookies</Text>
        <Text style={styles.text}>
          We may use services from third parties that set their own cookies:{'\n\n'}
          • Analytics providers (with your consent){'\n'}
          • Error tracking services{'\n\n'}
          These are subject to the third parties' own privacy policies.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. Managing Cookies</Text>
        <Text style={styles.text}>
          You can control cookies through:{'\n\n'}
          • App Settings → Analytics & Tracking toggle{'\n'}
          • Your device settings{'\n'}
          • Clearing app data{'\n\n'}
          Note: Disabling essential cookies may affect app functionality.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>6. Your Consent</Text>
        <Text style={styles.text}>
          By using EchoID, you consent to our use of cookies as described in this policy, except where you have disabled them in Settings.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>7. Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this Cookie Policy. Material changes will be notified via the app.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>8. Contact</Text>
        <Text style={styles.text}>
          Questions about cookies? Contact us at privacy@echoid.xyz
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
});

