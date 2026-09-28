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
