import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useStore } from '../../state/useStore';

export default function MainLayout() {
  const { wallet } = useStore();

  useEffect(() => {
    if (!wallet?.address) {
      router.replace('/(auth)');
    }
  }, [wallet?.address]);

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="index" 
        options={{ title: 'My Badges' }} 
      />
      <Stack.Screen 
        name="consent/new" 
        options={{ title: 'New Consent' }} 
      />
      <Stack.Screen 
        name="consent/[id]" 
        options={{ title: 'Consent Details' }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ title: 'Profile' }} 
      />
      <Stack.Screen 
        name="requests" 
        options={{ title: 'Consent Requests' }} 
      />
    </Stack>
  );
}

