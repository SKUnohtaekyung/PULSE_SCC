import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { colors, layout, spacing } from '@/design/tokens';
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
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.body}>
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
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[4],
  },
});
