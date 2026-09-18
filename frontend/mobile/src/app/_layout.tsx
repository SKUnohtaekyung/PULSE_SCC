import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { pretendardFontAssets } from '@/design/fonts';
import { colors } from '@/design/tokens';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(pretendardFontAssets);

  if (fontError) {
    throw fontError;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background.canvas },
          headerShown: false,
        }}
      />
      <StatusBar style="dark" />
    </>
  );
}
