import { Redirect } from 'expo-router';

import { AnalyzeScreen } from '@/features/analysis/AnalyzeScreen';
import { useSession } from '@/session/SessionProvider';

export default function AnalyzeRoute() {
  const { phase } = useSession();
  if (phase !== 'signedIn') return <Redirect href="/" />;
  return <AnalyzeScreen />;
}
