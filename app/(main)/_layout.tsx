import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useStore } from '../../state/useStore';
import { useColorScheme } from 'react-native';
import { getThemeColors } from '../../lib/theme';

export default function MainLayout() {
  const { wallet, themeMode } = useStore();
  const systemColorScheme = useColorScheme();
  const colors = getThemeColors(themeMode, systemColorScheme);

  useEffect(() => {
    if (!wallet?.address) {
      router.replace('/(auth)');
    }
  }, [wallet?.address]);

  return (
    <Stack 
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false, // Hide header since index has its own custom header
        }} 
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
      <Stack.Screen 
        name="settings" 
        options={{ title: 'Settings' }} 
      />
      <Stack.Screen 
        name="help" 
        options={{ title: 'Help & Support' }} 
      />
      <Stack.Screen 
        name="terms" 
        options={{ title: 'Terms of Service' }} 
      />
      <Stack.Screen 
        name="privacy" 
        options={{ title: 'Privacy Policy' }} 
      />
      <Stack.Screen 
        name="cookies" 
        options={{ title: 'Cookie Policy' }} 
      />
      <Stack.Screen 
        name="data-rights" 
        options={{ title: 'Your Data Rights' }} 
      />
      <Stack.Screen 
        name="export-data" 
        options={{ title: 'Export Data' }} 
      />
      <Stack.Screen 
        name="delete-account" 
        options={{ title: 'Delete Account' }} 
      />
    </Stack>
  );
}

