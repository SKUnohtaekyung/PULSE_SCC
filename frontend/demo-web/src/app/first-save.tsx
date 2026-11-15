import { Redirect, useLocalSearchParams } from 'expo-router';

import { FirstSaveScreen } from '@/features/analysis/FirstSaveScreen';
import { useSession } from '@/session/SessionProvider';

const toCount = (value: string | undefined) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function FirstSaveRoute() {
  const { phase } = useSession();
  const params = useLocalSearchParams<{
    storeName?: string;
    validReviewCount?: string;
    personaCount?: string;
  }>();

  // 시연 사이트는 링크로 화면에 바로 들어올 수 있다. 로그인 상태를 확인하는 동안에는 기다린다.
  if (phase === 'booting' || phase === 'restoring') return null;
  if (phase !== 'signedIn') return <Redirect href="/" />;

  return (
    <FirstSaveScreen
      personaCount={toCount(params.personaCount)}
      storeName={params.storeName ?? '분석한 가게'}
      validReviewCount={toCount(params.validReviewCount)}
    />
  );
}
