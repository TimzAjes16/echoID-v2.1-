/**
 * Theme management for light/dark mode
 */

import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  error: string;
  warning: string;
  success: string;
}

export const lightColors: ThemeColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E5E5EA',
  primary: '#007AFF',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
};

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#98989D',
  border: '#38383A',
  primary: '#0A84FF',
  error: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
};

const THEME_STORAGE_KEY = 'theme_mode';

/**
 * Get stored theme mode
 */
export async function getStoredThemeMode(): Promise<ThemeMode> {
  try {
    const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    return (stored as ThemeMode) || 'auto';
  } catch {
    return 'auto';
  }
}

/**
 * Store theme mode
 */
export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.error('Failed to store theme mode:', error);
  }
}

/**
 * Get effective theme (resolves 'auto' to actual system preference)
 */
export function getEffectiveTheme(mode: ThemeMode, systemColorScheme: string | null | undefined): 'light' | 'dark' {
  if (mode === 'auto') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Get colors for current theme
 */
export function getThemeColors(mode: ThemeMode, systemColorScheme: string | null | undefined): ThemeColors {
  const effective = getEffectiveTheme(mode, systemColorScheme);
  return effective === 'dark' ? darkColors : lightColors;
}

