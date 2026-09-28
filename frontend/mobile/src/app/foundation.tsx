import { StatusBar } from 'expo-status-bar';

import { TokenShowcase } from '@/design/TokenShowcase';

export default function FoundationScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <TokenShowcase />
    </>
  );
}
