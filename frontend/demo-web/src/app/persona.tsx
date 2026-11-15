import { Redirect, useLocalSearchParams } from 'expo-router';

import { PersonaScreen } from '@/features/result/PersonaScreen';
import { sourceFromParams } from '@/features/result/useAnalysisResult';
import { useSession } from '@/session/SessionProvider';

// 손님 유형 상세. ?rank=1 (저장 전 미리보기에서 왔으면 &jobId=…)
export default function PersonaRoute() {
  const { phase } = useSession();
  const params = useLocalSearchParams<{ rank?: string; jobId?: string }>();
  const rank = Number(params.rank);

  // 시연 앱은 링크로 화면에 바로 들어올 수 있다. 로그인 상태를 확인하는 동안에는 기다린다.
  if (phase === 'booting' || phase === 'restoring') return null;
  if (phase !== 'signedIn') return <Redirect href="/" />;
  if (!Number.isInteger(rank) || rank < 1) {
    return <Redirect href={params.jobId ? { pathname: '/preview-result', params: { jobId: params.jobId } } : '/home'} />;
  }
  return <PersonaScreen rank={rank} source={sourceFromParams(params.jobId)} />;
}
