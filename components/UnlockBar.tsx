import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Consent } from '../state/useStore';
import { useStore } from '../state/useStore';
import { requestUnlock, approveUnlock } from '../lib/sdk';

interface UnlockBarProps {
  consent: Consent;
}

export default function UnlockBar({ consent }: UnlockBarProps) {
  const { wallet, updateConsent } = useStore();
  const isLocked = Date.now() < consent.lockedUntil;
  const timeRemaining = consent.lockedUntil - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

  if (!wallet.address) {
    return null;
  }

  const handleRequestUnlock = async () => {
    try {
      await requestUnlock(wallet, consent.consentId);
      updateConsent(consent.id, { unlockRequested: true });
    } catch (error) {
      console.error('Failed to request unlock:', error);
    }
  };

  const handleApproveUnlock = async () => {
    try {
      await approveUnlock(wallet, consent.consentId);
      updateConsent(consent.id, { unlockApproved: true });
    } catch (error) {
      console.error('Failed to approve unlock:', error);
    }
  };

  if (isLocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.lockedText}>
          🔒 Locked for {hoursRemaining} more hours
        </Text>
        <Text style={styles.hint}>
          Unlock will be available after 24 hours. Both parties must approve.
        </Text>
      </View>
    );
  }

  if (consent.isUnlocked) {
    return (
      <View style={[styles.container, styles.unlocked]}>
        <Text style={styles.unlockedText}>✅ Unlocked</Text>
      </View>
    );
  }

  const isMyRequest = consent.unlockRequested && !consent.unlockApproved;
  const isTheirRequest = !consent.unlockRequested && consent.unlockApproved;

  return (
    <View style={styles.container}>
      {!consent.unlockRequested && !consent.unlockApproved && (
        <>
          <Text style={styles.unlockableText}>Unlock available</Text>
          <TouchableOpacity style={styles.button} onPress={handleRequestUnlock}>
            <Text style={styles.buttonText}>Request Unlock</Text>
          </TouchableOpacity>
        </>
      )}

      {isMyRequest && (
        <Text style={styles.waitingText}>
          ⏳ Waiting for counterparty approval...
        </Text>
      )}

      {isTheirRequest && (
        <TouchableOpacity style={styles.button} onPress={handleApproveUnlock}>
          <Text style={styles.buttonText}>Approve Unlock</Text>
        </TouchableOpacity>
      )}

      {consent.unlockRequested && consent.unlockApproved && (
        <Text style={styles.unlockingText}>
          🔓 Unlocking... (transaction pending)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  unlockableText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
  },
  unlockingText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  unlocked: {
    backgroundColor: '#E8F5E9',
  },
  unlockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

