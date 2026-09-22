import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSavedAnalysis } from '@/api/endpoints';
import { ApiError, NetworkError, SessionExpiredError } from '@/api/errors';
import type { AnalysisResult } from '@/api/types';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, layout, spacing, typography } from '@/design/tokens';
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
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= layout.breakpoint.medium ? spacing[6] : spacing[4];

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
          error instanceof NetworkError
            ? '인터넷에 연결되지 않아 저장된 결과를 불러오지 못했어요.'
            : '저장된 결과를 불러오지 못했어요. 저장본은 그대로 있어요.',
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

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader badge="저장된 결과" />

          <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
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
                <Text style={styles.context}>지금 저장된 결과예요.</Text>
                <ResultView client={client} result={result} />
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
      {phase === 'empty' ? null : (
        // 저장 결과가 없으면 홈과 하단 내비게이션을 표시하지 않는다(SCREEN_STATES 공통 불변식 4).
        <BottomNavigation
          active="home"
          bottomInset={insets.bottom}
          onAnalyze={() => router.push('/analyze')}
        />
      )}
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
    backgroundColor: colors.brand.primary,
  },
  content: {
    flexGrow: 1,
    backgroundColor: colors.background.canvas,
    paddingBottom: spacing[10],
  },
  body: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
    gap: spacing[5],
    paddingTop: spacing[6],
  },
  emptyBlock: {
    gap: spacing[4],
  },
  context: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
