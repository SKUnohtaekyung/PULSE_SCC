import { Redirect, useLocalSearchParams } from 'expo-router';

import { EvidenceScreen } from '@/features/result/EvidenceScreen';
import { useSession } from '@/session/SessionProvider';

export default function EvidenceRoute() {
  const { phase } = useSession();
  const params = useLocalSearchParams<{
    analysisId?: string;
    personaId?: string;
    perspective?: string;
    personaLabel?: string;
  }>();

  // 시연 사이트는 링크로 화면에 바로 들어올 수 있다. 로그인 상태를 확인하는 동안에는 기다린다.
  if (phase === 'booting' || phase === 'restoring') return null;
  if (phase !== 'signedIn') return <Redirect href="/" />;
  if (!params.analysisId || !params.personaId || !params.perspective) return <Redirect href="/home" />;

  return (
    <EvidenceScreen
      analysisId={params.analysisId}
      perspective={params.perspective}
      personaId={params.personaId}
      personaLabel={params.personaLabel}
    />
  );
}
