import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import { pretendardFontAssets } from '@/design/fonts';
import { colors } from '@/design/tokens';
import { SessionProvider } from '@/session/SessionProvider';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(pretendardFontAssets);

  if (fontError) {
    throw fontError;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background.canvas },
          headerShown: false,
        }}
      />
    </SessionProvider>
  );
}
