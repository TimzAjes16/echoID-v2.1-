import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  expo: {
    name: 'EchoID',
    slug: 'echoid-expogo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'echoid',
    deepLinking: {
      enabled: true,
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.echoid.expogo',
      infoPlist: {
        NSCameraUsageDescription: 'EchoID needs camera access to capture selfies and scan QR codes for consent verification.',
        NSMicrophoneUsageDescription: 'EchoID needs microphone access to record voice verification during consent handshakes.',
        NSLocationWhenInUseUsageDescription: 'EchoID needs location access to record geo-verification data for consent security.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.echoid.expogo',
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'echoid',
              host: 'consent',
              pathPrefix: '/',
            },
            {
              scheme: 'echoid',
              host: 'u',
              pathPrefix: '/',
            },
            {
              scheme: 'echoid',
              host: 'invite',
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-sqlite',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow EchoID to access your camera for verification.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Allow EchoID to access your microphone for voice verification.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow EchoID to access your location for geo-verification.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#ffffff',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'echoid-expogo',
      },
    },
  },
});

