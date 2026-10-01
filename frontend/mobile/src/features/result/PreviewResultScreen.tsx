import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAnalysisJobResult, getSavedAnalysis, replaceSavedAnalysis } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { SessionExpiredError } from '@/api/errors';
import type { AnalysisResult } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Notice } from '@/components/ui/Notice';
import { Screen, usePagePadding } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';
import { FixtureBanner } from '@/features/dev/FixtureBanner';
import { ResultView } from '@/features/result/ResultView';
import { useSession } from '@/session/SessionProvider';

// RESULT-UNSAVED-PREVIEW + SAVE-CHOICE-REQUIRED (SCREEN_STATES §6.1·§7).
// 저장 선택은 미리보기 첫 화면부터 하단에 고정하고, 교체만 확인 대화상자를 거친다(Step 5 합성).
// 하단 내비게이션은 표시하지 않는다(NAV-HIDDEN §9). 뒤로가기는 조용히 버리지 않고 세 가지를 묻는다.

type Phase = 'loading' | 'ready' | 'error';
type Dialog = 'replace' | 'leave' | null;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

export function PreviewResultScreen({ jobId }: { jobId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const horizontalPadding = usePagePadding();
  const { client, setHasSavedAnalysis } = useSession();

  const [phase, setPhase] = useState<Phase>('loading');
  const [preview, setPreview] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [saving, setSaving] = useState<'replace' | 'keep' | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [next, current] = await Promise.all([
          getAnalysisJobResult(client, jobId),
          getSavedAnalysis(client),
        ]);
        if (cancelled) return;
        setPreview(next);
        setSaved(current);
        setPhase('ready');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) return;
        setErrorMessage(
          resolveErrorMessage(error, {
            fallback: '새 결과를 불러오지 못했어요. 저장된 결과는 그대로 있어요.',
            offline: '인터넷에 연결되지 않아 새 결과를 불러오지 못했어요.',
          }),
        );
        setPhase('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [client, jobId, reloadToken]);

  const keepExisting = useCallback(() => {
    // 기존 저장본을 그대로 둔다. 교체 API를 호출하지 않는다(API.md §3.2).
    setSaving('keep');
    setDialog(null);
    router.replace('/home');
  }, [router]);

  const replaceSaved = useCallback(async () => {
    if (!preview) return;
    setSaving('replace');
    setReplaceError(null);
    try {
      await replaceSavedAnalysis(client, preview.analysisId);
      setHasSavedAnalysis(true);
      setDialog(null);
      router.replace('/home');
    } catch (error) {
      setSaving(null);
      setDialog(null);
      if (error instanceof SessionExpiredError) return;
      // 기존 저장본은 손상되지 않았다(SAVE-REPLACE-ERROR).
      setReplaceError(
        resolveErrorMessage(error, {
          known: { ANALYSIS_NOT_FOUND: '이 결과를 더 이상 저장할 수 없어요. 다시 분석해 주세요.' },
          fallback: '새 결과로 바꾸지 못했어요. 기존 저장 결과는 그대로 있어요.',
          offline: '인터넷에 연결되지 않아 바꾸지 못했어요. 기존 저장 결과는 그대로 있어요.',
        }),
      );
    }
  }, [client, preview, router, setHasSavedAnalysis]);

  useEffect(() => {
    // 뒤로가기로 조용히 나가지 않게 막고 세 가지를 묻는다(§7 SAVE-CHOICE-REQUIRED).
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase !== 'ready' || saving) return false;
      setDialog('leave');
      return true;
    });
    return () => subscription.remove();
  }, [phase, saving]);

  // 결과를 보여 줄 때만 넓힌다. 불러오는 중·오류는 640 그대로 둔다(HomeScreen과 같은 기준).
  const wide = phase === 'ready' && preview !== null;

  return (
    <Screen
      footer={
        phase === 'ready' && preview ? (
          <View
            style={[
              styles.saveBar,
              { paddingBottom: Math.max(insets.bottom, spacing[3]), paddingHorizontal: horizontalPadding },
            ]}
          >
            {/* 띠는 화면 전체 폭, 안쪽 문구·버튼은 읽기 폭 안에 둔다. 태블릿 가로에서 버튼이 1280dp로 늘어나지 않게 한다(TASK-024). */}
            <View style={styles.saveBarInner}>
              {replaceError ? (
                <Notice alert title="바꾸지 못했어요" message={replaceError} tone="error" />
              ) : null}
              <Text style={styles.saveBarNote}>
                기존 결과를 유지하면 이 새 결과는 저장되지 않고, 화면을 닫은 뒤에는 다시 보지 못할 수 있어요.
              </Text>
              <Button
                label="새 결과로 바꾸기"
                loading={saving === 'replace'}
                loadingLabel="바꾸는 중이에요"
                onPress={() => setDialog('replace')}
              />
              <Button
                label="기존 결과 유지"
                loading={saving === 'keep'}
                loadingLabel="기존 결과로 돌아가는 중이에요"
                onPress={keepExisting}
                variant="ghost"
              />
            </View>
          </View>
        ) : null
      }
      header={<ScreenHeader label="새 분석 결과" badge="아직 저장하지 않음" wide={wide} />}
      wide={wide}
    >
      <StatusBar style="dark" />

      <FixtureBanner />

      {phase === 'loading' ? <LoadingBlock message="새 분석 결과를 불러오고 있어요." /> : null}

      {phase === 'error' && errorMessage ? (
        <View style={styles.block}>
          <Notice alert title="새 결과를 불러오지 못했어요" message={errorMessage} tone="error" />
          <Button
            label="다시 불러오기"
            onPress={() => {
              setPhase('loading');
              setErrorMessage(null);
              setReloadToken((token) => token + 1);
            }}
            variant="ghost"
          />
          <Button label="홈으로" onPress={() => router.replace('/home')} variant="ghost" />
        </View>
      ) : null}

      {phase === 'ready' && preview ? (
        <>
          <Notice
            title="아직 저장하지 않은 새 결과예요"
            message={
              saved
                ? `지금 저장된 결과는 ${saved.store.name}(${formatDate(saved.metadata.analyzedAt)})이에요.`
                : undefined
            }
            tone="warning"
          />

          {/* 미리보기에서는 근거 전체 보기로 나가지 않는다. 저장 선택을 먼저 끝낸다(SCREEN_STATES §7). */}
          <ResultView client={client} result={preview} />
        </>
      ) : null}

      <ConfirmDialog
        actions={[
          {
            label: '바꾸기',
            onPress: () => void replaceSaved(),
            variant: 'destructive',
            loading: saving === 'replace',
            loadingLabel: '바꾸는 중이에요',
          },
          { label: '취소', onPress: () => setDialog(null) },
        ]}
        message={
          saved
            ? `지금 저장된 ${saved.store.name}(${formatDate(saved.metadata.analyzedAt)}) 결과가 사라지고 새 결과로 바뀌어요. 되돌릴 수 없어요.`
            : '저장된 결과가 새 결과로 바뀌어요. 되돌릴 수 없어요.'
        }
        onDismiss={() => setDialog(null)}
        title="새 결과로 바꿀까요?"
        visible={dialog === 'replace'}
      />

      <ConfirmDialog
        actions={[
          { label: '새 결과로 바꾸기', onPress: () => setDialog('replace'), variant: 'primary' },
          { label: '기존 결과 유지', onPress: keepExisting },
          { label: '계속 보기', onPress: () => setDialog(null) },
        ]}
        message="이 화면을 닫으면 새 결과를 다시 보지 못할 수 있어요."
        onDismiss={() => setDialog(null)}
        title="새 결과를 어떻게 할까요?"
        visible={dialog === 'leave'}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[3],
  },
  saveBar: {
    backgroundColor: colors.background.surface,
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
    borderTopLeftRadius: radii.panel,
    borderTopRightRadius: radii.panel,
    paddingTop: spacing[4],
  },
  saveBarInner: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
    gap: spacing[2],
  },
  saveBarNote: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
