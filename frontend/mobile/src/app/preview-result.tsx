import { Redirect, useLocalSearchParams } from 'expo-router';

import { PreviewResultScreen } from '@/features/result/PreviewResultScreen';
import { useSession } from '@/session/SessionProvider';

export default function PreviewResultRoute() {
  const { phase } = useSession();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  if (phase !== 'signedIn') return <Redirect href="/" />;
  if (!jobId) return <Redirect href="/home" />;

  return <PreviewResultScreen jobId={jobId} />;
}
