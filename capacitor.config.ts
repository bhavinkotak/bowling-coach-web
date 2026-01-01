import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bowlingcoach.webapp',
  appName: 'Bowling Coach Web',
  webDir: 'dist',
  server: {
    // Allow HTTP requests in development
    cleartext: true,
    // For Android, allow mixed content
    androidScheme: 'http',
    // Allow external video/media loading from backend
    allowNavigation: ['*'],
  },
  // Configure Android to handle external media
  android: {
    allowMixedContent: true,
  },
  // Plugins configuration
  plugins: {
    Browser: {
      // Enable in-app browser (uses system Chrome Custom Tabs on Android, SFSafariViewController on iOS)
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '720154297734-0kf9b1ngo6v35qs86rhnaf2ojncr0c9m.apps.googleusercontent.com', // Web Client ID
      iosClientId: '720154297734-scito8tjgo8h352hn0kjnn64mfr73s74.apps.googleusercontent.com', // iOS Client ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
