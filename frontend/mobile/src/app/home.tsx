import { Redirect } from 'expo-router';

import { HomeScreen } from '@/features/result/HomeScreen';
import { useSession } from '@/session/SessionProvider';

export default function HomeRoute() {
  const { phase } = useSession();
  if (phase !== 'signedIn') return <Redirect href="/" />;
  return <HomeScreen />;
}
