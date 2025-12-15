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
  }
};

export default config;
