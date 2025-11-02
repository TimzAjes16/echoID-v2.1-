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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  lockedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  hint: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  unlockableText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  waitingText: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
    fontWeight: '500',
  },
  unlockingText: {
    fontSize: 14,
    color: '#2081E2',
    textAlign: 'center',
    fontWeight: '500',
  },
  unlocked: {
    backgroundColor: '#F0FFF0',
    borderColor: '#E0FFE0',
  },
  unlockedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  button: {
    backgroundColor: '#2081E2',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: '#2081E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

