import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { useSession } from '@/session/SessionProvider';

// APP-BOOTING · AUTH-RESTORING · 진입 분기(SCREEN_STATES §3.1).
// 저장 결과가 없으면 홈이 아니라 가게 입력으로 보낸다(APP-FIRST-ANALYSIS-REQUIRED).
export default function BootScreen() {
  const { phase, user, retryRestore } = useSession();

  if (phase === 'signedOut') return <Redirect href="/login" />;
  if (phase === 'signedIn') {
    return <Redirect href={user?.hasSavedAnalysis ? '/home' : '/analyze'} />;
  }

  return (
    <Screen centered verticalEdges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {phase === 'bootError' ? (
        <>
          <Notice
            alert
            title="시작하지 못했어요"
            message="로그인 상태를 확인하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요."
            tone="error"
          />
          <Button label="다시 시도" onPress={retryRestore} />
        </>
      ) : (
        <LoadingBlock
          message={phase === 'restoring' ? '로그인 상태를 확인하고 있어요.' : '앱을 시작하고 있어요.'}
        />
      )}
    </Screen>
  );
}
