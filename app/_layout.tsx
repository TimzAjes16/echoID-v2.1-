import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useStore } from '../state/useStore';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getThemeColors } from '../lib/theme';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  const { themeMode, loadThemeMode } = useStore();
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadThemeMode();
  }, []);

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  const colors = getThemeColors(themeMode, systemColorScheme);

  return (
    <SafeAreaProvider>
      <SafeAreaView 
        style={[styles.safeArea, { backgroundColor: colors.surface }]} 
        edges={['top']}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

