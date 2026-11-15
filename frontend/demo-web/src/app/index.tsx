import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { PulsePlayer } from '@/demo/motion/PulsePlayer';
import { colors, spacing, typography } from '@/design/tokens';
import { useSession } from '@/session/SessionProvider';

// APP-BOOTING · AUTH-RESTORING · 진입 분기(SCREEN_STATES §3.1).
// 저장 결과가 없으면 홈이 아니라 가게 입력으로 보낸다(APP-FIRST-ANALYSIS-REQUIRED).
// 시연 사이트: 앱을 켤 때 맥박 스플래시를 잠깐 보여 준다(발표 시안). 한 번 켠 뒤에는 다시 기다리지 않는다.
const splashMinimumMs = 2400;
let splashShownThisLaunch = false;

export default function BootScreen() {
  const { phase, user, retryRestore } = useSession();
  const [splashDone, setSplashDone] = useState(splashShownThisLaunch);

  useEffect(() => {
    if (splashDone) return;
    const timer = setTimeout(() => {
      splashShownThisLaunch = true;
      setSplashDone(true);
    }, splashMinimumMs);
    return () => clearTimeout(timer);
  }, [splashDone]);

  const ready = splashDone || phase === 'bootError';
  if (ready && phase === 'signedOut') return <Redirect href="/login" />;
  if (ready && phase === 'signedIn') {
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
        // 발표 시안의 스플래시: 로고 → 맥박 → 상태 → "외식업의 맥박을 읽다".
        <View style={styles.splash}>
          <Image
            accessibilityLabel="PULSE"
            resizeMode="contain"
            source={require('@/assets/images/brand/pulse-wordmark.png')}
            style={styles.wordmark}
          />
          <View style={styles.monitor}>
            <PulsePlayer loop />
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {phase === 'restoring' ? '로그인 상태를 확인하고 있어요' : '앱을 시작하고 있어요'}
          </Text>
          <Text style={styles.tagline}>외식업의 맥박을 읽다</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    gap: spacing[6],
    width: '100%',
  },
  wordmark: {
    width: spacing[32],
    height: spacing[32] * (673 / 1740),
  },
  monitor: {
    width: '100%',
  },
  status: {
    ...typography.body6,
    color: colors.text.secondary,
  },
  tagline: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
});
