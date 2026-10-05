import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createAnalysisJob,
  createIdempotencyKey,
  getAnalysisJob,
  getSavedAnalysis,
} from '@/api/endpoints';
import { ApiError, NetworkError, SessionExpiredError } from '@/api/errors';
import type { AnalysisResult, JobStatus } from '@/api/types';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';
import { PageTitle } from '@/components/ui/PageTitle';
import { ProgressList, type ProgressRow } from '@/components/ui/ProgressList';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { TextField } from '@/components/ui/TextField';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';
import {
  progressLabel,
  progressPercent,
  readJobFailure,
  statusUnavailableFailure,
  type JobFailure,
} from '@/features/analysis/jobOutcome';
import {
  clearPendingAnalysis,
  readPendingAnalysis,
  writePendingAnalysis,
} from '@/features/analysis/pendingAnalysisStorage';
import { useSession } from '@/session/SessionProvider';

// SC-001 가게 정보 입력 + SC-003 분석 진행. 한 화면에서 이어 보여준다(Step 5 합성).
// 다루는 상태: STORE-INITIAL/EDITING/FIELD-ERROR/CREATING-JOB/UNSUPPORTED-URL/NOT-FOUND/JOB-ERROR/OFFLINE,
// ANALYSIS-QUEUED/COLLECTING/(그 밖의 progressStep)/INSUFFICIENT/RETRYABLE-ERROR/FATAL-ERROR, SAVE-FIRST-*.
// 상태 조회 자체가 실패한 경우(statusUnavailable)는 SC-003 표에 아직 없는 상태다(#34, 불변식 11 유추).

type Phase = 'input' | 'creating' | 'progress' | 'failed' | 'completing';
type FieldKey = 'name' | 'category' | 'url';
type InputStep = 0 | 1 | 2;

const categories = ['한식', '중식', '일식', '양식', '카페/디저트', '주점', '기타'] as const;

const pollIntervalMs = 1200;

// 입력은 한 화면에서 차례로 펼친다. 지금 어느 단계인지 위에서 알리고, 제목이 지금 할 일을 말한다.
const inputSteps = ['가게 이름', '업종', '네이버 가게 주소'];
const inputTitles = [
  '가게 이름을 알려 주세요',
  '어떤 업종인가요?',
  '네이버 가게 주소를 붙여 넣어 주세요',
];

const failureActionLabel = (failure: JobFailure) => {
  if (failure.kind === 'statusUnavailable') return '진행 상태 다시 확인';
  if (failure.kind === 'retryable' || failure.kind === 'imageGenerationFailed') return '다시 분석하기';
  if (failure.kind === 'insufficient') return '가게 정보 다시 입력';
  return '입력 화면으로';
};

const isNaverPlaceUrl = (value: string) => {
  const host = /^(?:https?:\/\/)?([^/?#:]+)/i.exec(value.trim())?.[1]?.toLowerCase() ?? '';
  return ['naver.me', 'naver.com'].some((domain) => host === domain || host.endsWith('.' + domain));
};

export function AnalyzeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client, user, setHasSavedAnalysis } = useSession();
  const { fontScale } = useWindowDimensions();

  const [phase, setPhase] = useState<Phase>('input');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [activeStep, setActiveStep] = useState<InputStep>(0);
  const [reachedStep, setReachedStep] = useState<InputStep>(0);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formNotice, setFormNotice] = useState<{ title: string; message: string } | null>(null);
  const [offline, setOffline] = useState(false);
  const [returnedNotice, setReturnedNotice] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [resumed, setResumed] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const stepsRef = useRef<string[]>([]);
  const [failure, setFailure] = useState<JobFailure | null>(null);
  const [completionIssue, setCompletionIssue] = useState<{ title: string; message: string } | null>(null);

  // 응답을 받지 못한 같은 제출을 다시 보낼 때만 같은 키를 쓴다(공통 불변식 13).
  const idempotencyKey = useRef<string | null>(null);
  /** 그 키로 보낸 입력. 지금 입력과 다르면 같은 제출이 아니므로 키를 새로 만든다. */
  const submittedInput = useRef<string | null>(null);
  const restoredUserId = useRef<string | null>(null);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!user || restoredUserId.current === user.id) return;
    restoredUserId.current = user.id;
    let cancelled = false;

    const restorePending = async () => {
      const pending = await readPendingAnalysis(user.id);
      if (cancelled || !pending) return;
      setName(pending.storeName);
      setCategory(pending.category);
      setUrl(pending.naverPlaceUrl);
      setActiveStep(2);
      setReachedStep(2);
      setJobId(pending.jobId);
      const restoredSteps = pending.progressSteps.length > 0 ? pending.progressSteps : ['QUEUED'];
      stepsRef.current = restoredSteps;
      setSteps(restoredSteps);
      setResumed(true);
      setPhase('progress');
    };

    void restorePending();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const nextIncomplete = (nextName = name, nextCategory = category): InputStep =>
    !nextName.trim() ? 0 : !nextCategory ? 1 : 2;

  const openStep = (step: InputStep) => {
    setActiveStep(step);
    setReachedStep((reached) => (step > reached ? step : reached));
  };

  const clearError = (key: FieldKey) =>
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));

  const confirmName = () => {
    if (!name.trim()) {
      setErrors((current) => ({ ...current, name: '가게 이름을 입력해 주세요.' }));
      return;
    }
    setErrors((current) => ({ ...current, name: undefined }));
    openStep(nextIncomplete());
  };

  const chooseCategory = (item: string) => {
    setCategory(item);
    setErrors((current) => ({ ...current, category: undefined }));
    openStep(nextIncomplete(name, item));
  };

  const validate = () => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) next.name = '가게 이름을 입력해 주세요.';
    if (!category) next.category = '업종을 하나 골라 주세요.';
    if (!url.trim()) next.url = '네이버 가게 URL을 입력해 주세요.';
    else if (!isNaverPlaceUrl(url))
      next.url = '네이버 가게 주소만 분석할 수 있어요. naver.me 또는 naver.com 주소를 넣어 주세요.';
    setErrors(next);
    if (next.name) setActiveStep(0);
    else if (next.category) setActiveStep(1);
    return Object.keys(next).length === 0;
  };

  const resetToInput = () => {
    setPhase('input');
    setJobId(null);
    stepsRef.current = [];
    setSteps([]);
    setFailure(null);
    setCompletionIssue(null);
  };

  const applyCreateError = useCallback((error: ApiError) => {
    switch (error.code) {
      case 'INVALID_NAVER_PLACE_URL':
        setErrors((current) => ({
          ...current,
          url: '지원하는 네이버 가게 주소를 입력해 주세요. naver.me 또는 naver.com 주소만 분석할 수 있어요.',
        }));
        setActiveStep(2);
        return;
      case 'INVALID_INPUT':
      case 'INVALID_REQUEST':
        // 분석 API는 필드별 정보를 주지 않는다(SCREEN_STATES §4.1).
        setFormNotice({
          title: '입력한 내용을 확인해 주세요',
          message: '가게 이름과 업종을 함께 확인해 주세요.',
        });
        return;
      case 'IDEMPOTENCY_KEY_REUSED':
        setFormNotice({
          title: '분석 요청을 다시 보내야 해요',
          message: '이전 요청과 겹쳐 처리하지 못했어요. 다시 분석하기를 누르면 새 요청으로 보내요.',
        });
        idempotencyKey.current = null;
        return;
      default:
        setFormNotice({
          title: '분석을 시작하지 못했어요',
          message: error.message,
        });
    }
  }, []);

  const submit = useCallback(
    async (options: { reuseKey: boolean }) => {
      setFormNotice(null);
      setOffline(false);
      setCompletionIssue(null);

      const currentInput = [name.trim(), category, url.trim()].join('\u0000');
      // 입력이 바뀌었으면 응답을 받지 못한 '같은 제출'이 아니다(공통 불변식 13).
      const sameSubmission = options.reuseKey && submittedInput.current === currentInput;
      if (!sameSubmission || !idempotencyKey.current) {
        idempotencyKey.current = createIdempotencyKey();
      }
      submittedInput.current = currentInput;

      setPhase('creating');
      try {
        const created = await createAnalysisJob(
          client,
          { storeName: name.trim(), category, naverPlaceUrl: url.trim() },
          idempotencyKey.current,
        );
        if (user) {
          await writePendingAnalysis(user.id, {
            jobId: created.jobId,
            storeName: name.trim(),
            category,
            naverPlaceUrl: url.trim(),
            progressSteps: [created.progressStep],
          });
        }
        setJobId(created.jobId);
        stepsRef.current = [created.progressStep];
        setSteps([created.progressStep]);
        setResumed(false);
        setReturnedNotice(false);
        setFailure(null);
        setPhase('progress');
      } catch (error) {
        setPhase('input');
        if (error instanceof SessionExpiredError) return;
        if (error instanceof NetworkError) {
          // 응답을 받지 못했으므로 같은 키로 다시 보낸다(STORE-OFFLINE).
          setOffline(true);
          return;
        }
        if (!(error instanceof ApiError)) {
          setFormNotice({
            title: '분석을 시작하지 못했어요',
            message: '잠시 뒤에 다시 시도해 주세요. 입력한 내용은 그대로 두었어요.',
          });
          return;
        }
        applyCreateError(error);
      }
    },
    [applyCreateError, client, name, category, url, user],
  );

  /** 작업이 COMPLETED가 된 뒤 첫 저장 여부를 판정한다(SCREEN_STATES §7). */
  const resolveCompletion = useCallback(
    async (job: JobStatus) => {
      setPhase('completing');
      let saved: AnalysisResult | null = null;
      try {
        saved = await getSavedAnalysis(client);
      } catch (error) {
        if (error instanceof SessionExpiredError) return;
        if (error instanceof ApiError && error.code === 'SAVED_ANALYSIS_NOT_FOUND') {
          // 서버 계약상 일어나면 안 되는 불일치다. 완료로 가장하지 않는다(SAVE-FIRST-ERROR).
          setCompletionIssue({
            title: '아직 홈에 저장된 결과가 없어요',
            message: '분석은 끝났는데 저장 결과를 찾지 못했어요. 다시 확인해 볼 수 있어요.',
          });
          return;
        }
        setCompletionIssue({
          title: '저장 상태를 확인하지 못했어요',
          message: '결과가 저장됐는지 확인하지 못했어요. 다시 확인해 주세요.',
        });
        return;
      }

      if (saved.analysisId === job.analysisId) {
        if (user) await clearPendingAnalysis(user.id);
        setHasSavedAnalysis(true);
        const personaCount = saved.podium.filter((slot) => slot.status === 'FILLED').length;
        router.replace({
          pathname: '/first-save',
          params: {
            storeName: saved.store.name,
            validReviewCount: String(saved.metadata.validReviewCount),
            personaCount: String(personaCount),
          },
        });
        return;
      }

      // 저장본이 다르면 이 결과는 저장되지 않았다. 미리보기와 저장 선택으로 보낸다(SCREEN_STATES §7).
      if (user) await clearPendingAnalysis(user.id);
      router.replace({ pathname: '/preview-result', params: { jobId: job.jobId } });
    },
    [client, router, setHasSavedAnalysis, user],
  );

  useEffect(() => {
    if (phase !== 'progress' || !jobId) return;
    let cancelled = false;
    // 앞선 조회가 끝나기 전에 다음 tick이 겹쳐 실행되지 않게 한다.
    // 응답이 주기(1.2초)보다 느리면 요청이 쌓이고 완료 처리가 두 번 일어날 수 있다.
    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const job = await getAnalysisJob(client, jobId);
        if (cancelled) return;
        setOffline(false);

        if (job.status === 'FAILED') {
          if (user) await clearPendingAnalysis(user.id);
          const next = readJobFailure(job);
          if (next.kind === 'storeNotFound') {
            setErrors({
              name: '가게를 찾지 못했어요. 가게 이름을 확인해 주세요.',
              url: '가게를 찾지 못했어요. 네이버 가게 URL을 확인해 주세요.',
            });
            setReturnedNotice(true);
            idempotencyKey.current = null;
            resetToInput();
            return;
          }
          if (next.kind === 'unsupportedUrl') {
            setErrors({
              url: '지원하는 네이버 가게 주소를 입력해 주세요. naver.me 또는 naver.com 주소만 분석할 수 있어요.',
            });
            setActiveStep(2);
            setReturnedNotice(true);
            idempotencyKey.current = null;
            resetToInput();
            return;
          }
          setFailure(next);
          setPhase('failed');
          return;
        }

        const currentSteps = stepsRef.current;
        const nextSteps =
          currentSteps.includes(job.progressStep) || job.progressStep === 'COMPLETED'
            ? currentSteps
            : [...currentSteps, job.progressStep];
        if (nextSteps !== currentSteps) {
          stepsRef.current = nextSteps;
          setSteps(nextSteps);
          if (user) {
            await writePendingAnalysis(user.id, {
              jobId,
              storeName: name,
              category,
              naverPlaceUrl: url,
              progressSteps: nextSteps,
            });
          }
        }

        if (job.status === 'COMPLETED') {
          await resolveCompletion(job);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) return;
        if (error instanceof NetworkError) {
          // 마지막으로 확인한 단계를 유지한 채 연결 상태만 알린다(ANALYSIS-OFFLINE).
          setOffline(true);
          return;
        }
        if (error instanceof ApiError && error.code === 'ANALYSIS_NOT_FOUND') {
          if (user) await clearPendingAnalysis(user.id);
          setFormNotice({
            title: '이전 분석 작업을 찾지 못했어요',
            message: '가게 정보는 그대로 두었어요. 다시 분석하기를 눌러 새 작업을 시작해 주세요.',
          });
          setResumed(false);
          resetToInput();
          return;
        }
        if (error instanceof ApiError && error.code !== null && error.status < 500) {
          // 코드가 있는 조회 오류는 다시 조회해도 같은 답이 온다.
          // 작업을 이어 볼 수 없으므로 입력 화면으로 보낸다. 새 작업은 사용자가 직접 요청한다.
          setFailure({ kind: 'fatal', message: error.message });
        } else {
          setFailure(statusUnavailableFailure);
        }
        setPhase('failed');
      } finally {
        inFlight = false;
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [category, client, jobId, name, phase, resolveCompletion, url, user]);

  const locked = phase !== 'input';
  const statusUnknown = failure?.kind === 'statusUnavailable';
  const rows: ProgressRow[] = steps.map((step, index) => {
    const last = index === steps.length - 1;
    const running = last && (phase === 'progress' || phase === 'creating' || phase === 'completing');
    const paused = last && phase === 'failed';
    return {
      key: step + '-' + index,
      label: progressLabel(step),
      state: running ? 'running' : paused ? 'paused' : 'done',
      note: paused ? (statusUnknown ? '여기까지 확인했어요' : '여기까지 진행했어요') : undefined,
    };
  });

  if (phase === 'failed' && failure) {
    rows.push({
      key: 'failure',
      label: statusUnknown ? '진행 상태를 확인하지 못했어요' : '분석을 마치지 못했어요',
      state: 'failed',
      note: failure.kind === 'insufficient'
        ? '분석에 필요한 리뷰가 50건보다 적어 결과를 만들지 못했어요.'
        : failure.kind === 'storeNotFound' || failure.kind === 'unsupportedUrl'
          ? undefined
          : failure.message,
    });
  }

  const visibleRows: ProgressRow[] =
    phase === 'creating' && rows.length === 0
      ? [{ key: 'creating', label: '분석 요청을 보내는 중', state: 'running' }]
      : rows;
  const highestConfirmedProgress = steps.reduce(
    (highest, step) => Math.max(highest, progressPercent(step)),
    phase === 'creating' ? 4 : 8,
  );
  const displayedProgress = phase === 'completing' ? 98 : highestConfirmedProgress;
  const progressStatus =
    phase === 'failed'
      ? '분석 중단'
      : phase === 'completing'
        ? '결과 저장 중'
        : '분석 진행 중';

  const runFailureAction = (current: JobFailure) => {
    if (current.kind === 'statusUnavailable') {
      // 같은 jobId로 상태 조회를 다시 시작한다. 새 작업을 만들면 수집·분석 비용이 두 번 든다(#34).
      setFailure(null);
      setPhase('progress');
      return;
    }
    if (current.kind === 'retryable' || current.kind === 'imageGenerationFailed') {
      void submit({ reuseKey: false });
      return;
    }
    resetToInput();
  };

  const largeText = fontScale >= 1.5;

  return (
    <Screen
      compact
      footer={
        user?.hasSavedAnalysis ? (
          <BottomNavigation
            active="analysis"
            bottomInset={insets.bottom}
            onHome={() => router.navigate('/home')}
            onMyPage={() => router.navigate('/mypage')}
          />
        ) : null
      }
      header={<ScreenHeader label="분석하기" />}
    >
      <StatusBar style="dark" />

      {phase === 'input' ? (
        <>
          <StepIndicator activeIndex={activeStep} steps={inputSteps} />
          <PageTitle title={inputTitles[activeStep] ?? inputTitles[0]} />
        </>
      ) : (
        <PageTitle
          description={[name, category].filter(Boolean).join(' · ')}
          title={
            phase !== 'failed'
              ? '리뷰를 읽고 있어요'
              : statusUnknown
                ? '진행 상태를 확인하지 못했어요'
                : '분석을 마치지 못했어요'
          }
        />
      )}

      {returnedNotice ? (
        <Notice title="입력한 내용은 그대로 두었어요" message="확인한 뒤 다시 분석할 수 있어요." />
      ) : null}

      {resumed && phase === 'progress' ? (
        <Notice
          title="진행 중이던 분석을 이어서 확인하고 있어요"
          message="서버에서 마지막으로 확인된 단계부터 결과가 나올 때까지 계속 확인해요."
        />
      ) : null}

      {offline ? (
        <Notice
          alert
          title="연결이 끊겼어요"
          message={
            phase === 'progress'
              ? '마지막으로 확인한 단계까지 보여드리고 있어요. 연결되면 이어서 확인해요.'
              : '인터넷에 연결한 뒤 다시 시도해 주세요. 같은 요청으로 다시 보내요.'
          }
          tone="warning"
        />
      ) : null}

      {formNotice ? (
        <Notice alert title={formNotice.title} message={formNotice.message} tone="error" />
      ) : null}

      {completionIssue ? (
        <Notice alert title={completionIssue.title} message={completionIssue.message} tone="warning">
          <View style={styles.noticeActions}>
            <Button
              label="저장 결과 다시 확인"
              onPress={() => {
                if (!jobId) return;
                void getAnalysisJob(client, jobId)
                  .then((job) => resolveCompletion(job))
                  .catch(() =>
                    setCompletionIssue({
                      title: '저장 상태를 확인하지 못했어요',
                      message: '연결을 확인한 뒤 다시 시도해 주세요.',
                    }),
                  );
              }}
              variant="ghost"
            />
            {user?.hasSavedAnalysis ? (
              <Button label="홈으로" onPress={() => router.replace('/home')} variant="ghost" />
            ) : null}
          </View>
        </Notice>
      ) : null}

      {locked ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text numberOfLines={summaryOpen ? undefined : 1} style={styles.summaryText}>
              {name} · {category} · {url}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: summaryOpen }}
              hitSlop={spacing[2]}
              onPress={() => setSummaryOpen((open) => !open)}
              style={({ pressed }) => [styles.summaryToggle, pressed && styles.pressed]}
            >
              <Text style={styles.summaryToggleText}>{summaryOpen ? '접기' : '입력 보기'}</Text>
            </Pressable>
          </View>
          {summaryOpen ? (
            <Text style={styles.summaryHint}>분석이 끝나기 전에는 입력을 고칠 수 없어요.</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.formCard}>
          {activeStep === 0 || errors.name ? (
            <TextField
              error={errors.name}
              label="가게 이름"
              onChangeText={(value) => {
                setName(value);
                clearError('name');
              }}
              onSubmitEditing={confirmName}
              placeholder="예: 운산국밥"
              returnKeyType="next"
              value={name}
            />
          ) : (
            <DoneRow label="가게 이름" onEdit={() => setActiveStep(0)} value={name} />
          )}

          {reachedStep >= 1 ? (
            activeStep === 1 || errors.category ? (
              <Field error={errors.category} label="업종">
                <View accessibilityLabel="업종" accessibilityRole="radiogroup" style={styles.chipRow}>
                  {categories.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      onPress={() => chooseCategory(item)}
                      radio
                      selected={category === item}
                    />
                  ))}
                </View>
              </Field>
            ) : (
              <DoneRow label="업종" onEdit={() => setActiveStep(1)} value={category} />
            )
          ) : null}

          {reachedStep >= 2 ? (
            activeStep === 2 || errors.url ? (
              <TextField
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.url}
                inputMode="url"
                label="네이버 가게 URL"
                onChangeText={(value) => {
                  setUrl(value);
                  clearError('url');
                }}
                placeholder="naver.me 또는 naver.com 주소"
                value={url}
              />
            ) : (
              <DoneRow label="네이버 가게 URL" onEdit={() => setActiveStep(2)} value={url} />
            )
          ) : null}
        </View>
      )}

      {visibleRows.length > 0 ? (
        <ProgressList
          progress={displayedProgress}
          progressStatus={progressStatus}
          reduceMotion={reduceMotion}
          rows={visibleRows}
        />
      ) : null}

      {phase === 'input' && activeStep === 0 ? (
        <Button label="다음" onPress={confirmName} variant="primary" />
      ) : null}

      {phase === 'input' && activeStep === 2 ? (
        <Button
          label={offline || returnedNotice || formNotice ? '다시 분석하기' : '분석하기'}
          onPress={() => {
            if (!validate()) return;
            void submit({ reuseKey: offline });
          }}
        />
      ) : null}

      {phase === 'creating' ? (
        <Button
          label="분석하기"
          loading
          loadingLabel="분석 요청을 보내는 중이에요"
          onPress={() => undefined}
          reduceMotion={reduceMotion}
        />
      ) : null}

      {phase === 'failed' && failure ? (
        <Button label={failureActionLabel(failure)} onPress={() => runFailureAction(failure)} />
      ) : null}

      {phase === 'failed' && failure?.kind === 'statusUnavailable' ? (
        // 조회가 계속 실패해도 화면에 갇히지 않게 한다. 입력은 그대로 두고, 다시 요청하면 새 작업이 된다.
        <Button label="입력 화면으로" onPress={resetToInput} variant="ghost" />
      ) : null}

      <Text style={[styles.footnote, largeText && styles.footnoteLarge]}>
        분석은 공개된 네이버 리뷰만 사용해요.
      </Text>
    </Screen>
  );
}

function DoneRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View style={styles.doneRow}>
      <View style={styles.doneCopy}>
        <Text style={styles.doneLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.doneValue}>
          {value}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`${label} 수정`}
        accessibilityRole="button"
        hitSlop={spacing[2]}
        onPress={onEdit}
        style={({ pressed }) => [styles.doneEdit, pressed && styles.pressed]}
      >
        <Text style={styles.doneEditText}>수정</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[4],
    padding: spacing[4],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  doneRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: layout.touchTargetMin,
  },
  doneCopy: {
    flex: 1,
    gap: spacing[1],
  },
  doneLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  doneValue: {
    ...typography.body4,
    color: colors.text.primary,
  },
  doneEdit: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  doneEditText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  summaryCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[2],
    padding: spacing[3],
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
  },
  summaryText: {
    ...typography.body7,
    color: colors.text.primary,
    flex: 1,
  },
  summaryToggle: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
  },
  summaryToggleText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  summaryHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  noticeActions: {
    gap: spacing[2],
    paddingTop: spacing[2],
  },
  pressed: {
    opacity: 0.9,
  },
  footnote: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footnoteLarge: {
    paddingBottom: spacing[4],
  },
});
