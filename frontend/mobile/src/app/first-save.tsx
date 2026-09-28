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

  if (phase !== 'signedIn') return <Redirect href="/" />;

  return (
    <FirstSaveScreen
      personaCount={toCount(params.personaCount)}
      storeName={params.storeName ?? '분석한 가게'}
      validReviewCount={toCount(params.validReviewCount)}
    />
  );
}
