import { Redirect } from 'expo-router';

import { LoginScreen } from '@/features/auth/LoginScreen';
import { useSession } from '@/session/SessionProvider';

export default function LoginRoute() {
  const { phase, user } = useSession();
  if (phase === 'signedIn') {
    return <Redirect href={user?.hasSavedAnalysis ? '/home' : '/analyze'} />;
  }
  return <LoginScreen />;
}
