import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import { AppColumn } from '@/demo/AppColumn';
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
      <AppColumn>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background.canvas },
            headerShown: false,
          }}
        />
      </AppColumn>
    </SessionProvider>
  );
}
