import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString('en-GB')}</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>1. Introduction</Text>
        <Text style={styles.text}>
          These Terms of Service ("Terms") govern your use of the EchoID mobile application and related services ("Service") operated by EchoID Limited ("we", "us", "our"), a company registered in England and Wales.
        </Text>
        <Text style={styles.text}>
          By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. Definitions</Text>
        <Text style={styles.text}>
          • "Service" means the EchoID mobile application and all related services.{'\n'}
          • "User", "you" means any person who accesses or uses the Service.{'\n'}
          • "Consent" means a consent verification record created through the Service and stored on the blockchain.{'\n'}
          • "Handle" means a unique username identifier assigned to a User.{'\n'}
          • "Blockchain" means the distributed ledger technology used to record consents.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. Eligibility and Account</Text>
        <Text style={styles.text}>
          3.1. You must be at least 18 years old to use this Service.{'\n\n'}
          3.2. You are responsible for maintaining the confidentiality of your account credentials.{'\n\n'}
          3.3. You agree to provide accurate, current, and complete information during registration.{'\n\n'}
          3.4. Handles are unique and permanent once claimed. They cannot be transferred or changed.{'\n\n'}
          3.5. We reserve the right to suspend or terminate accounts that violate these Terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Service Description</Text>
        <Text style={styles.text}>
          4.1. EchoID provides a platform for creating cryptographically verified consent records stored on the blockchain.{'\n\n'}
          4.2. The Service allows Users to:{'\n'}
          • Create and manage consent records{'\n'}
          • Verify consents through biometric and voice verification{'\n'}
          • Store consent data with 24-hour automatic lock periods{'\n'}
          • Request and approve consent unlocks{'\n\n'}
          4.3. Consents are immutable once created on the blockchain.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. Protocol Fees</Text>
        <Text style={styles.text}>
          5.1. Creating a consent requires payment of a protocol fee, payable in cryptocurrency (ETH or equivalent).{'\n\n'}
          5.2. Fees are displayed before consent creation and are non-refundable once the transaction is confirmed on the blockchain.{'\n\n'}
          5.3. You are responsible for all transaction fees (gas fees) associated with blockchain transactions.{'\n\n'}
          5.4. We reserve the right to modify protocol fees with 30 days' notice.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>6. User Obligations</Text>
        <Text style={styles.text}>
          6.1. You agree to use the Service only for lawful purposes.{'\n\n'}
          6.2. You must not:{'\n'}
          • Use the Service to create fraudulent or coerced consents{'\n'}
          • Impersonate another person or entity{'\n'}
          • Interfere with or disrupt the Service{'\n'}
          • Attempt to reverse engineer or hack the Service{'\n'}
          • Use automated systems to access the Service{'\n\n'}
          6.3. You are solely responsible for the consents you create and the consequences thereof.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>7. Intellectual Property</Text>
        <Text style={styles.text}>
          7.1. The Service, including its design, functionality, and content, is owned by EchoID Limited and protected by UK and international copyright laws.{'\n\n'}
          7.2. You retain ownership of any content you create through the Service, including consent records.{'\n\n'}
          7.3. You grant us a limited license to use your data as necessary to provide the Service.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>8. Blockchain and Immutability</Text>
        <Text style={styles.text}>
          8.1. Consents are recorded on public blockchains and cannot be deleted or modified once confirmed.{'\n\n'}
          8.2. You acknowledge that blockchain transactions are irreversible.{'\n\n'}
          8.3. You are responsible for verifying all information before creating a consent.{'\n\n'}
          8.4. We are not responsible for any errors or losses resulting from incorrect information entered by Users.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>9. Limitation of Liability</Text>
        <Text style={styles.text}>
          9.1. To the maximum extent permitted by UK law, EchoID Limited excludes all warranties, express or implied.{'\n\n'}
          9.2. We are not liable for:{'\n'}
          • Loss or corruption of data{'\n'}
          • Blockchain network failures or delays{'\n'}
          • Errors in smart contracts{'\n'}
          • Losses resulting from User error{'\n\n'}
          9.3. Our total liability shall not exceed the amount of fees paid by you in the 12 months preceding the claim.{'\n\n'}
          9.4. Nothing in these Terms excludes or limits our liability for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation, or any other liability that cannot be excluded under UK law.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>10. Data Protection</Text>
        <Text style={styles.text}>
          10.1. Your use of the Service is also governed by our Privacy Policy, which complies with UK GDPR and the Data Protection Act 2018.{'\n\n'}
          10.2. We process your personal data in accordance with applicable UK data protection laws.{'\n\n'}
          10.3. You have the right to access, rectify, and erase your personal data as set out in our Privacy Policy.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>11. Termination</Text>
        <Text style={styles.text}>
          11.1. We may terminate or suspend your account immediately, without prior notice, for breach of these Terms.{'\n\n'}
          11.2. You may terminate your account at any time through the app settings.{'\n\n'}
          11.3. Upon termination, your right to use the Service will cease immediately.{'\n\n'}
          11.4. Consents created on the blockchain will remain immutable and accessible on the blockchain.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>12. Dispute Resolution</Text>
        <Text style={styles.text}>
          12.1. These Terms are governed by English law.{'\n\n'}
          12.2. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the English courts.{'\n\n'}
          12.3. Before initiating legal proceedings, we encourage you to contact us to attempt to resolve the dispute amicably.{'\n\n'}
          12.4. You may also refer disputes to alternative dispute resolution services if both parties agree.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>13. Consumer Rights (UK)</Text>
        <Text style={styles.text}>
          13.1. If you are a consumer (as defined by the Consumer Rights Act 2015), you have certain statutory rights.{'\n\n'}
          13.2. These Terms do not affect your statutory rights as a consumer.{'\n\n'}
          13.3. For digital content, you have the right to receive goods that are of satisfactory quality, fit for purpose, and as described.{'\n\n'}
          13.4. If the Service does not conform to these standards, you may be entitled to a repair, replacement, or refund.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>14. Changes to Terms</Text>
        <Text style={styles.text}>
          14.1. We reserve the right to modify these Terms at any time.{'\n\n'}
          14.2. Material changes will be notified to you via email or in-app notification at least 30 days before they take effect.{'\n\n'}
          14.3. Continued use of the Service after changes constitutes acceptance of the new Terms.{'\n\n'}
          14.4. If you do not agree to the changes, you must stop using the Service.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>15. Contact Information</Text>
        <Text style={styles.text}>
          EchoID Limited{'\n'}
          [Registered Address]{'\n'}
          United Kingdom{'\n\n'}
          Email: legal@echoid.xyz{'\n'}
          Company Registration Number: [Number]
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
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
});

