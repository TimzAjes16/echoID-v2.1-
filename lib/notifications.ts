import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface ConsentRequest {
  id: string;
  fromHandle: string;
  fromAddress: string;
  template: string;
  requestedAt: number;
  consentData: any; // Full consent creation data
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('consent-requests', {
        name: 'Consent Requests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Send consent request notification
 */
export async function sendConsentRequestNotification(request: ConsentRequest): Promise<void> {
  await requestNotificationPermissions();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Consent Request',
      body: `@${request.fromHandle} wants to create a consent with you`,
      data: { requestId: request.id, type: 'consent_request' },
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Get notification token for push notifications (when backend is ready)
 */
export async function getNotificationToken(): Promise<string | null> {
  try {
    await requestNotificationPermissions();
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'echoid-expogo',
    });
    return token.data;
  } catch (error) {
    console.error('Failed to get notification token:', error);
    return null;
  }
}

/**
 * Setup notification listener for handling incoming notifications
 */
export function setupNotificationListener(
  onConsentRequest: (request: ConsentRequest) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(async (notification) => {
    const data = notification.request.content.data;
    if (data?.type === 'consent_request' && data.requestId) {
      // The notification data only contains requestId, we need to fetch the full request
      // In production, this would fetch from backend API
      // For MVP/mock mode, we need to retrieve from a local store/cache
      
      try {
        // Try to get the full request from the Zustand store
        // This works because requests are stored locally when created
        const { useStore } = await import('../state/useStore');
        const fullRequest = useStore.getState().getConsentRequest(data.requestId);
        
        if (fullRequest) {
          // Full request already in store, trigger callback
          onConsentRequest(fullRequest);
        } else {
          // Request not in store yet, might need to fetch from backend
          // For now, log and wait for it to be added directly
          console.warn(`[Notification] Received notification for request ${data.requestId}, but request not yet in store`);
          // Don't add incomplete data to store
        }
      } catch (error) {
        console.error('[Notification] Failed to handle consent request notification:', error);
      }
    }
  });
}

