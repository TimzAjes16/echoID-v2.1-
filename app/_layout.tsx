import { Stack } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useStore } from '../state/useStore';
import { useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getThemeColors } from '../lib/theme';
import { StyleSheet } from 'react-native';

function RootLayoutContent() {
  const { themeMode } = useStore();
  const systemColorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  const colors = getThemeColors(themeMode, systemColorScheme);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: Math.max(insets.top - 8, 0) }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  const { loadThemeMode } = useStore();

  useEffect(() => {
    loadThemeMode();
  }, []);

  return (
    <SafeAreaProvider>
      <RootLayoutContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

