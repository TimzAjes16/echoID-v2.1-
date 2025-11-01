import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString('en-GB')}</Text>
      <Text style={styles.intro}>
        This Privacy Policy explains how EchoID Limited ("we", "us", "our") collects, uses, and protects your personal data in compliance with UK GDPR and the Data Protection Act 2018.
      </Text>

      <View style={styles.section}>
        <Text style={styles.heading}>1. Data Controller</Text>
        <Text style={styles.text}>
          EchoID Limited is the data controller for your personal data.{'\n\n'}
          Registered Address: [Your Address]{'\n'}
          Company Number: [Number]{'\n'}
          Email: privacy@echoid.xyz
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. Legal Basis for Processing</Text>
        <Text style={styles.text}>
          We process your personal data under the following legal bases:{'\n\n'}
          • <Text style={styles.bold}>Contract:</Text> To provide the Service you have requested{'\n'}
          • <Text style={styles.bold}>Legitimate Interest:</Text> To improve and maintain the Service{'\n'}
          • <Text style={styles.bold}>Consent:</Text> Where you have given explicit consent{'\n'}
          • <Text style={styles.bold}>Legal Obligation:</Text> To comply with UK laws and regulations
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. Data We Collect</Text>
        
        <Text style={styles.subheading}>3.1. Account Data</Text>
        <Text style={styles.text}>
          • Handle (username){'\n'}
          • Wallet address{'\n'}
          • Device public key
        </Text>

        <Text style={styles.subheading}>3.2. Verification Data (Hashed Only)</Text>
        <Text style={styles.text}>
          • Voice verification hash (not raw audio){'\n'}
          • Biometric hash (not raw images){'\n'}
          • Device identifier hash{'\n'}
          • Geolocation hash (rounded coordinates){'\n'}
          • UTC timestamp hash
        </Text>

        <Text style={styles.subheading}>3.3. Usage Data</Text>
        <Text style={styles.text}>
          • App usage statistics{'\n'}
          • Device information{'\n'}
          • Error logs{'\n'}
          • IP address (for security)
        </Text>

        <Text style={styles.subheading}>3.4. Blockchain Data</Text>
        <Text style={styles.text}>
          • Consent records (stored on public blockchain){'\n'}
          • Transaction hashes{'\n'}
          • Consent IDs
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. How We Use Your Data</Text>
        <Text style={styles.text}>
          4.1. To provide and maintain the Service{'\n'}
          4.2. To process consent creation and verification{'\n'}
          4.3. To send notifications about consent requests{'\n'}
          4.4. To comply with legal obligations{'\n'}
          4.5. To improve the Service and user experience{'\n'}
          4.6. To prevent fraud and ensure security
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. Data Storage and Security</Text>
        <Text style={styles.text}>
          5.1. <Text style={styles.bold}>Local Storage:</Text> Sensitive data (private keys, encrypted messages) stored in Expo SecureStore on your device.{'\n\n'}
          5.2. <Text style={styles.bold}>Blockchain:</Text> Only cryptographic hashes are stored on-chain. Raw biometric data is never uploaded.{'\n\n'}
          5.3. <Text style={styles.bold}>Encryption:</Text> All sensitive data is encrypted at rest and in transit using industry-standard encryption.{'\n\n'}
          5.4. <Text style={styles.bold}>Access Control:</Text> Access to personal data is restricted to authorized personnel only.{'\n\n'}
          5.5. We implement appropriate technical and organisational measures to protect your data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>6. Data Sharing and Disclosure</Text>
        <Text style={styles.text}>
          6.1. We do not sell your personal data.{'\n\n'}
          6.2. We may share data with:{'\n'}
          • Service providers (hosting, analytics) under strict confidentiality agreements{'\n'}
          • Law enforcement when required by UK law{'\n'}
          • Blockchain networks (public data only - hashes){'\n\n'}
          6.3. Consent records on blockchain are publicly accessible, but only contain hashed verification data, not raw personal information.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>7. Your Data Protection Rights (UK GDPR)</Text>
        <Text style={styles.text}>
          Under UK GDPR and the Data Protection Act 2018, you have the right to:{'\n\n'}
          <Text style={styles.bold}>7.1. Right of Access:</Text> Request copies of your personal data{'\n\n'}
          <Text style={styles.bold}>7.2. Right to Rectification:</Text> Request correction of inaccurate data{'\n\n'}
          <Text style={styles.bold}>7.3. Right to Erasure:</Text> Request deletion of your data (subject to legal obligations){'\n\n'}
          <Text style={styles.bold}>7.4. Right to Restrict Processing:</Text> Request limitation of data processing{'\n\n'}
          <Text style={styles.bold}>7.5. Right to Data Portability:</Text> Receive your data in a structured, machine-readable format{'\n\n'}
          <Text style={styles.bold}>7.6. Right to Object:</Text> Object to processing based on legitimate interests{'\n\n'}
          <Text style={styles.bold}>7.7. Rights Related to Automated Decision-Making:</Text> Not to be subject to automated decision-making{'\n\n'}
          To exercise these rights, contact us at privacy@echoid.xyz. We will respond within one month.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>8. Data Retention</Text>
        <Text style={styles.text}>
          8.1. Account data is retained while your account is active.{'\n\n'}
          8.2. After account deletion, we retain data only as required by UK law (e.g., financial records for 7 years).{'\n\n'}
          8.3. Consent records on blockchain are immutable and permanent (as per blockchain technology).{'\n\n'}
          8.4. Local encrypted data on your device is deleted when you delete the app.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>9. International Data Transfers</Text>
        <Text style={styles.text}>
          9.1. Some of our service providers may be located outside the UK/EEA.{'\n\n'}
          9.2. We ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the UK Information Commissioner's Office.{'\n\n'}
          9.3. Data transfers comply with UK GDPR requirements.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>10. Children's Privacy</Text>
        <Text style={styles.text}>
          10.1. Our Service is not intended for users under 18 years of age.{'\n\n'}
          10.2. We do not knowingly collect personal data from children.{'\n\n'}
          10.3. If we become aware that we have collected data from a child, we will delete it immediately.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>11. Cookies and Tracking</Text>
        <Text style={styles.text}>
          11.1. We use cookies and similar technologies to improve the Service.{'\n\n'}
          11.2. See our Cookie Policy for detailed information.{'\n\n'}
          11.3. You can control cookies through your device settings.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>12. Data Breach Notification</Text>
        <Text style={styles.text}>
          12.1. In the event of a data breach that poses a high risk to your rights, we will notify you and the Information Commissioner's Office (ICO) within 72 hours, as required by UK GDPR.{'\n\n'}
          12.2. We will provide clear information about the nature of the breach and steps taken to address it.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>13. Changes to This Policy</Text>
        <Text style={styles.text}>
          13.1. We may update this Privacy Policy from time to time.{'\n\n'}
          13.2. Material changes will be notified via email or in-app notification.{'\n\n'}
          13.3. The "Last Updated" date at the top indicates when changes were made.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>14. Supervisory Authority</Text>
        <Text style={styles.text}>
          If you have concerns about how we handle your personal data, you have the right to lodge a complaint with:{'\n\n'}
          Information Commissioner's Office (ICO){'\n'}
          Wycliffe House, Water Lane, Wilmslow{'\n'}
          Cheshire SK9 5AF{'\n'}
          United Kingdom{'\n\n'}
          Website: ico.org.uk{'\n'}
          Phone: 0303 123 1113
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>15. Contact Us</Text>
        <Text style={styles.text}>
          For privacy-related inquiries:{'\n\n'}
          Email: privacy@echoid.xyz{'\n'}
          Data Protection Officer: dpo@echoid.xyz{'\n\n'}
          EchoID Limited{'\n'}
          [Registered Address]{'\n'}
          United Kingdom
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
    marginBottom: 12,
  },
  intro: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
    fontStyle: 'italic',
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
  bold: {
    fontWeight: '600',
    color: '#333',
  },
});

