import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSavedAnalysis } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { ApiError, SessionExpiredError } from '@/api/errors';
import type { AnalysisResult } from '@/api/types';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { spacing } from '@/design/tokens';
import { FixtureBanner } from '@/features/dev/FixtureBanner';
import { ResultView } from '@/features/result/ResultView';
import { useSession } from '@/session/SessionProvider';

// SC-011 홈. HOME-LOADING → RESULT-SAVED-CONTEXT + (RESULT-NORMAL | PARTIAL | NO-PERSONA),
// 저장본이 없으면 HOME-NO-SAVED-RESULT, 조회 실패는 RESULT-ERROR다(SCREEN_STATES §6.1).

type Phase = 'loading' | 'ready' | 'empty' | 'error';

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client, setHasSavedAnalysis } = useSession();
  const [phase, setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSaved = async () => {
      try {
        const saved = await getSavedAnalysis(client);
        if (cancelled) return;
        setResult(saved);
        setHasSavedAnalysis(true);
        setPhase('ready');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) return;
        if (error instanceof ApiError && error.code === 'SAVED_ANALYSIS_NOT_FOUND') {
          setHasSavedAnalysis(false);
          setPhase('empty');
          return;
        }
        setErrorMessage(
          resolveErrorMessage(error, {
            fallback: '저장된 결과를 불러오지 못했어요. 저장본은 그대로 있어요.',
            offline: '인터넷에 연결되지 않아 저장된 결과를 불러오지 못했어요.',
          }),
        );
        setPhase('error');
      }
    };

    void fetchSaved();
    return () => {
      cancelled = true;
    };
  }, [client, reloadToken, setHasSavedAnalysis]);

  const reload = () => {
    setPhase('loading');
    setErrorMessage(null);
    setReloadToken((token) => token + 1);
  };

  // 넓은 화면에서 960으로 넓히는 것은 결과를 보여 줄 때뿐이다. 불러오는 중·빈 상태·오류는 버튼과 안내 한 덩이라
  // 640 그대로 둔다(DESIGN_SYSTEM §7.1 — 넓히지 않는 화면과 같은 기준, TASK-024 리뷰).
  const wide = phase === 'ready' && result !== null;

  return (
    <Screen
      footer={
        phase === 'empty' ? null : (
          // 저장 결과가 없으면 홈과 하단 내비게이션을 표시하지 않는다(SCREEN_STATES 공통 불변식 4).
          <BottomNavigation
            active="home"
            bottomInset={insets.bottom}
            onAnalyze={() => router.navigate('/analyze')}
            onMyPage={() => router.navigate('/mypage')}
          />
        )
      }
      header={<ScreenHeader brand badge="저장된 결과" wide={wide} />}
      wide={wide}
    >
      <StatusBar style="dark" />

      <FixtureBanner />

      {phase === 'loading' ? (
        <LoadingBlock message="저장된 분석 결과를 불러오고 있어요." reduceMotion={reduceMotion} />
      ) : null}

      {phase === 'empty' ? (
        <View style={styles.emptyBlock}>
          <Notice
            title="아직 저장된 결과가 없어요"
            message="가게 정보를 넣고 첫 분석을 시작하면 결과가 여기에 저장돼요."
          />
          <Button label="첫 분석 시작하기" onPress={() => router.replace('/analyze')} />
        </View>
      ) : null}

      {phase === 'error' && errorMessage ? (
        <View style={styles.emptyBlock}>
          <Notice alert title="결과를 불러오지 못했어요" message={errorMessage} tone="error" />
          <Button label="다시 불러오기" onPress={reload} variant="ghost" />
        </View>
      ) : null}

      {phase === 'ready' && result ? (
        <>
          <ResultView
            client={client}
            onOpenEvidence={(args) =>
              router.push({
                pathname: '/evidence',
                params: {
                  analysisId: args.analysisId,
                  personaId: args.personaId,
                  personaLabel: args.personaLabel,
                  perspective: args.perspective,
                },
              })
            }
            result={result}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyBlock: {
    gap: spacing[4],
  },
});
