import { Redirect, useLocalSearchParams } from 'expo-router';

import { AnalysisInfoScreen } from '@/features/result/AnalysisInfoScreen';
import { sourceFromParams } from '@/features/result/useAnalysisResult';
import { useSession } from '@/session/SessionProvider';

// 분석 기준. 저장 전 미리보기에서 왔으면 ?jobId=…
export default function AnalysisInfoRoute() {
  const { phase } = useSession();
  const params = useLocalSearchParams<{ jobId?: string }>();

  // 시연 앱은 링크로 화면에 바로 들어올 수 있다. 로그인 상태를 확인하는 동안에는 기다린다.
  if (phase === 'booting' || phase === 'restoring') return null;
  if (phase !== 'signedIn') return <Redirect href="/" />;
  return <AnalysisInfoScreen source={sourceFromParams(params.jobId)} />;
}
