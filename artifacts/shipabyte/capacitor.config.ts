import type { CapacitorConfig } from '@capacitor/cli';

// appId: reverse-domain identifier that uniquely IDs the app in Play Console.
// Once you publish with an appId you CANNOT change it later, so pick it
// deliberately now (e.g. com.yourname.Plasticbyte or com.yourteam.Plasticbyte).
const config: CapacitorConfig = {
  appId: 'com.oxibyte.app',
  appName: 'Oxibyte',
  webDir: 'dist/public',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
