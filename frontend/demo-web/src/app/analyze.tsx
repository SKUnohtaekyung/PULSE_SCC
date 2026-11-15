import { Redirect } from 'expo-router';

import { AnalyzeScreen } from '@/features/analysis/AnalyzeScreen';
import { useSession } from '@/session/SessionProvider';

export default function AnalyzeRoute() {
  const { phase } = useSession();
  // 시연 사이트는 링크로 화면에 바로 들어올 수 있다. 로그인 상태를 확인하는 동안에는 기다린다.
  if (phase === 'booting' || phase === 'restoring') return null;
  if (phase !== 'signedIn') return <Redirect href="/" />;
  return <AnalyzeScreen />;
}
