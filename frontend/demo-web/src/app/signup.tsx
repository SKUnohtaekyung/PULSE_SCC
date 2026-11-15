import { Redirect } from 'expo-router';

import { SignupScreen } from '@/features/auth/SignupScreen';
import { useSession } from '@/session/SessionProvider';

export default function SignupRoute() {
  const { phase, user } = useSession();
  if (phase === 'signedIn') {
    return <Redirect href={user?.hasSavedAnalysis ? '/home' : '/analyze'} />;
  }
  return <SignupScreen />;
}
