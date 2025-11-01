/**
 * Device Registration for Push Notifications
 * Registers device with backend when user logs in
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNotificationToken } from './notifications';
import { apiRegisterDevice, apiUnregisterDevice } from './api';
import { useStore } from '../state/useStore';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'device_id';
const DEVICE_REGISTERED_KEY = 'device_registered';

/**
 * Generate or retrieve device ID
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate a unique device ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    deviceId = `${Platform.OS}_${timestamp}_${random}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Register device with backend for push notifications
 */
export async function registerDeviceWithBackend(): Promise<boolean> {
  const { profile, wallet } = useStore.getState();
  
  if (!profile.handle || !wallet.address) {
    console.log('[Device] User not logged in, skipping device registration');
    return false;
  }

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL || API_BASE_URL === 'https://api.echoid.xyz') {
    // Mock mode - backend not available
    console.log('[Device] Mock mode - skipping backend device registration');
    return false;
  }

  try {
    // Request notification permissions
    const hasPermission = await Notifications.requestPermissionsAsync();
    if (hasPermission.status !== 'granted') {
      console.warn('[Device] Notification permissions not granted');
      return false;
    }

    // Get push token
    const pushToken = await getNotificationToken();
    if (!pushToken) {
      console.warn('[Device] Failed to get push token');
      return false;
    }

    // Get device ID
    const deviceId = await getDeviceId();

    // Register with backend
    await apiRegisterDevice(profile.handle, {
      pushToken,
      deviceId,
    });

    // Mark as registered
    await SecureStore.setItemAsync(DEVICE_REGISTERED_KEY, 'true');
    
    console.log('[Device] Successfully registered device with backend');
    return true;
  } catch (error: any) {
    console.error('[Device] Failed to register device:', error.message);
    
    // Don't throw - allow app to continue in offline mode
    return false;
  }
}

/**
 * Unregister device when user logs out
 */
export async function unregisterDeviceFromBackend(): Promise<void> {
  const { profile } = useStore.getState();
  
  if (!profile.handle) {
    return;
  }

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL || API_BASE_URL === 'https://api.echoid.xyz') {
    // Mock mode - skip
    return;
  }

  try {
    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (deviceId) {
      await apiUnregisterDevice(profile.handle, deviceId);
      await SecureStore.deleteItemAsync(DEVICE_REGISTERED_KEY);
      console.log('[Device] Successfully unregistered device');
    }
  } catch (error: any) {
    console.error('[Device] Failed to unregister device:', error.message);
    // Don't throw - allow logout to continue
  }
}

/**
 * Check if device is registered and re-register if needed
 */
export async function ensureDeviceRegistered(): Promise<void> {
  const isRegistered = await SecureStore.getItemAsync(DEVICE_REGISTERED_KEY);
  
  if (isRegistered === 'true') {
    // Already registered, but verify it's still valid
    return;
  }

  // Try to register
  await registerDeviceWithBackend();
}

