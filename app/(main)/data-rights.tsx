import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '../../state/useStore';
import { Ionicons } from '@expo/vector-icons';

export default function DataRightsScreen() {
  const { profile, wallet } = useStore();

  const handleRequestData = async () => {
    Alert.alert(
      'Request Your Data',
      'We will prepare a copy of your personal data and send it to your registered email within 30 days, as required by UK GDPR.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            // In production, this would call backend API
            Alert.alert('Request Submitted', 'You will receive your data export within 30 days at your registered email address.');
          },
        },
      ]
    );
  };

  const handleRectifyData = async () => {
    Alert.alert(
      'Correct Your Data',
      'If any of your information is incorrect, please contact us at privacy@echoid.xyz to request corrections.',
      [{ text: 'OK' }]
    );
  };

  const handleErasure = async () => {
    Alert.alert(
      'Request Data Deletion',
      'You can request deletion of your account and personal data. Note: Consent records on the blockchain cannot be deleted as they are immutable.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to delete account screen
            Alert.alert('Info', 'Please go to Settings → Delete Account to proceed.');
          },
        },
      ]
    );
  };

  const handleRestrictProcessing = async () => {
    Alert.alert(
      'Restrict Data Processing',
      'You can request that we limit how we process your data. Contact us at privacy@echoid.xyz to make this request.',
      [{ text: 'OK' }]
    );
  };

  const handlePortability = async () => {
    Alert.alert(
      'Data Portability',
      'You can request your data in a machine-readable format. This will include your account information and consent records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: handleRequestData,
        },
      ]
    );
  };

  const handleObjectToProcessing = async () => {
    Alert.alert(
      'Object to Processing',
      'You can object to processing based on legitimate interests. Contact us at privacy@echoid.xyz to discuss your concerns.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Data Protection Rights</Text>
      <Text style={styles.subtitle}>
        Under UK GDPR and the Data Protection Act 2018, you have the following rights regarding your personal data:
      </Text>

      <View style={styles.section}>
        <View style={styles.rightCard}>
          <Ionicons name="document-text" size={32} color="#007AFF" />
          <Text style={styles.rightTitle}>Right of Access</Text>
          <Text style={styles.rightDescription}>
            You have the right to obtain confirmation as to whether we process your personal data and to access that data.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleRequestData}>
            <Text style={styles.actionButtonText}>Request My Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rightCard}>
          <Ionicons name="create-outline" size={32} color="#4CAF50" />
          <Text style={styles.rightTitle}>Right to Rectification</Text>
          <Text style={styles.rightDescription}>
            You can request correction of inaccurate or incomplete personal data.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleRectifyData}>
            <Text style={styles.actionButtonText}>Correct My Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rightCard}>
          <Ionicons name="trash" size={32} color="#F44336" />
          <Text style={styles.rightTitle}>Right to Erasure</Text>
          <Text style={styles.rightDescription}>
            You can request deletion of your personal data, subject to legal obligations. Note: Blockchain records are immutable.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleErasure}>
            <Text style={styles.actionButtonText}>Request Deletion</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rightCard}>
          <Ionicons name="pause-circle" size={32} color="#FF9800" />
          <Text style={styles.rightTitle}>Right to Restrict Processing</Text>
          <Text style={styles.rightDescription}>
            You can request that we limit how we process your data in certain circumstances.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleRestrictProcessing}>
            <Text style={styles.actionButtonText}>Restrict Processing</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rightCard}>
          <Ionicons name="download" size={32} color="#9C27B0" />
          <Text style={styles.rightTitle}>Right to Data Portability</Text>
          <Text style={styles.rightDescription}>
            You can receive your data in a structured, commonly used, and machine-readable format.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handlePortability}>
            <Text style={styles.actionButtonText}>Export My Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rightCard}>
          <Ionicons name="ban" size={32} color="#E91E63" />
          <Text style={styles.rightTitle}>Right to Object</Text>
          <Text style={styles.rightDescription}>
            You can object to processing based on legitimate interests or for direct marketing purposes.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleObjectToProcessing}>
            <Text style={styles.actionButtonText}>Object to Processing</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>How to Exercise Your Rights</Text>
        <Text style={styles.text}>
          To exercise any of these rights, contact us at:{'\n\n'}
          <Text style={styles.bold}>Email:</Text> privacy@echoid.xyz{'\n'}
          <Text style={styles.bold}>Data Protection Officer:</Text> dpo@echoid.xyz{'\n\n'}
          We will respond to your request within one month, as required by UK GDPR.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Complaints</Text>
        <Text style={styles.text}>
          If you are not satisfied with our response, you can lodge a complaint with:{'\n\n'}
          Information Commissioner's Office (ICO){'\n'}
          Wycliffe House, Water Lane, Wilmslow{'\n'}
          Cheshire SK9 5AF, United Kingdom{'\n\n'}
          Website: ico.org.uk{'\n'}
          Phone: 0303 123 1113
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Current Data Summary</Text>
        <View style={styles.dataSummary}>
          <Text style={styles.dataItem}>
            <Text style={styles.bold}>Handle:</Text> @{profile.handle || 'Not set'}
          </Text>
          <Text style={styles.dataItem}>
            <Text style={styles.bold}>Wallet Address:</Text> {wallet.address || 'Not connected'}
          </Text>
          <Text style={styles.dataItem}>
            <Text style={styles.bold}>Data Location:</Text> Local device (SecureStore) + Blockchain (hashes only)
          </Text>
        </View>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  rightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  rightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  dataSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  dataItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

