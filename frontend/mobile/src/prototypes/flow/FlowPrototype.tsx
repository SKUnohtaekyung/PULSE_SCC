import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';
import { BottomNavigation } from '@/prototypes/result/ResultPrototype';

// Step 5 합성안(docs/design/synthesis/TASK-020)을 Android에서 확인하는 디자인 프로토타입이다.
// 서버 대신 고정 시나리오로 상태를 바꾸며, 실제 API·저장·인증은 연결하지 않는다.

type Scenario = 'first' | 'saved' | 'insufficient' | 'retryable' | 'fatal' | 'notFound';
type Phase = 'input' | 'progress' | 'failed' | 'firstSaved';
type FieldKey = 'name' | 'category' | 'url';
type InputStep = 0 | 1 | 2;
type StepRow = { key: string; label: string; done: boolean };

const scenarios: { key: Scenario; label: string }[] = [
  { key: 'first', label: '첫 분석 성공' },
  { key: 'saved', label: '저장본 있음' },
  { key: 'insufficient', label: '리뷰 부족' },
  { key: 'retryable', label: '재시도 가능 실패' },
  { key: 'fatal', label: '서비스 문제' },
  { key: 'notFound', label: '가게 못 찾음' },
];

const categories = ['한식', '중식', '일식', '양식', '카페/디저트', '주점', '기타'] as const;

const failureCopy: Record<'insufficient' | 'retryable' | 'fatal', { message: string; action: string }> = {
  insufficient: {
    message: '분석에 필요한 리뷰가 50건보다 적어 결과를 만들지 못했어요.',
    action: '가게 정보 다시 입력',
  },
  retryable: {
    message: '일시적인 문제로 분석을 마치지 못했어요. 다시 시도할 수 있어요.',
    action: '다시 분석하기',
  },
  fatal: {
    message: '서비스 쪽 문제로 지금은 분석을 마칠 수 없어요. 잠시 뒤에 다시 시도해 주세요.',
    action: '입력 화면으로',
  },
};

const isNaverPlaceUrl = (value: string) => {
  const host = /^(?:https?:\/\/)?([^/?#:]+)/i.exec(value.trim())?.[1]?.toLowerCase() ?? '';
  return ['naver.me', 'naver.com'].some((domain) => host === domain || host.endsWith(`.${domain}`));
};

export function FlowPrototype({ initialScenario = 'first' }: { initialScenario?: Scenario }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fontScale, width } = useWindowDimensions();
  const horizontalPadding = width >= layout.breakpoint.medium ? spacing[6] : spacing[4];
  const largeText = fontScale >= 1.5;

  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('input');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [activeStep, setActiveStep] = useState<InputStep>(0);
  const [reachedStep, setReachedStep] = useState<InputStep>(0);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [returnedNotice, setReturnedNotice] = useState(false);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const hasSavedResult = scenario === 'saved';
  const firstAnalysis = !hasSavedResult;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const schedule = (delay: number, run: () => void) => {
    timers.current.push(setTimeout(run, delay));
  };

  const resetFlow = (next: Scenario) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setScenario(next);
    setPhase('input');
    setErrors({});
    setReturnedNotice(false);
    setSteps([]);
  };

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
    else if (!isNaverPlaceUrl(url)) next.url = '네이버 가게 주소만 분석할 수 있어요. naver.me 또는 naver.com 주소를 넣어 주세요.';
    setErrors(next);
    if (next.name) setActiveStep(0);
    else if (next.category) setActiveStep(1);
    return Object.keys(next).length === 0;
  };

  const startAnalysis = () => {
    if (!validate()) return;
    setReturnedNotice(false);
    setSummaryOpen(false);
    setPhase('progress');
    // 가상 progressStep. 원격 백엔드가 현재 기록하는 QUEUED → COLLECTING_REVIEWS만 흉내 낸다.
    setSteps([{ key: 'QUEUED', label: '분석 준비 중', done: false }]);
    schedule(1600, () =>
      setSteps([
        { key: 'QUEUED', label: '분석 준비 완료', done: true },
        { key: 'COLLECTING_REVIEWS', label: '네이버 리뷰 수집 중', done: false },
      ]),
    );
    schedule(4200, () => {
      if (scenario === 'first') {
        setPhase('firstSaved');
      } else if (scenario === 'saved') {
        router.push('/preview');
        setPhase('input');
        setSteps([]);
      } else if (scenario === 'notFound') {
        setPhase('input');
        setSteps([]);
        setReturnedNotice(true);
        setErrors({
          name: '가게를 찾지 못했어요. 가게 이름을 확인해 주세요.',
          url: '가게를 찾지 못했어요. 네이버 가게 URL을 확인해 주세요.',
        });
      } else {
        // 실패 단계는 알 수 없으므로 마지막 행은 멈추기만 하고 목록 끝에 실패 결과 행을 붙인다.
        setPhase('failed');
      }
    });
  };

  const onFailureAction = () => {
    if (scenario === 'retryable') {
      startAnalysis();
      return;
    }
    setPhase('input');
    setSteps([]);
  };

  const failure =
    scenario === 'insufficient' || scenario === 'retryable' || scenario === 'fatal' ? failureCopy[scenario] : null;
  const locked = phase === 'progress' || phase === 'failed';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: spacing[10] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.headerInner, { paddingHorizontal: horizontalPadding }]}>
              <View style={[styles.headerRow, largeText && styles.headerRowLargeText]}>
                <Text accessibilityRole="header" style={styles.wordmark}>
                  PULSE
                </Text>
                {firstAnalysis && phase !== 'firstSaved' ? (
                  <View style={styles.firstBadge}>
                    <Text style={styles.firstBadgeText}>첫 분석</Text>
                  </View>
                ) : null}
                <Pressable
                  accessibilityLabel={`프로토타입 설정 ${toolsOpen ? '닫기' : '열기'}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: toolsOpen }}
                  onPress={() => setToolsOpen((open) => !open)}
                  style={({ pressed }) => [styles.toolsButton, pressed && styles.pressed]}
                >
                  <Text style={styles.toolsButtonText}>프로토타입 · 가상 데이터</Text>
                </Pressable>
              </View>
              {phase !== 'firstSaved' ? (
                <Text style={styles.pageTitle}>우리 가게 리뷰를 분석해요</Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
            {toolsOpen ? (
              <View style={styles.tools}>
                <Text style={styles.toolsLabel}>시나리오 — 서버 응답 대신 고정 결과로 흐름을 확인해요</Text>
                <View style={styles.chipRow}>
                  {scenarios.map((item) => (
                    <Chip
                      key={item.key}
                      label={item.label}
                      onPress={() => resetFlow(item.key)}
                      selected={scenario === item.key}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {phase === 'firstSaved' ? (
              <FirstSaved onOpenResult={() => router.dismissTo('/')} />
            ) : (
              <>
                {returnedNotice ? (
                  <View accessibilityRole="alert" style={styles.returnNotice}>
                    <Text style={styles.returnNoticeText}>입력한 내용은 그대로 두었어요.</Text>
                  </View>
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
                      <Field error={errors.name} label="가게 이름">
                        <TextInput
                          accessibilityLabel={errors.name ? `가게 이름, 오류: ${errors.name}` : '가게 이름'}
                          autoFocus={activeStep === 0 && !name}
                          onBlur={() => setFocused(null)}
                          onChangeText={(value) => {
                            setName(value);
                            clearError('name');
                          }}
                          onFocus={() => setFocused('name')}
                          onSubmitEditing={confirmName}
                          placeholder="예: 영등원조쌈밥"
                          placeholderTextColor={colors.text.secondary}
                          returnKeyType="next"
                          style={[styles.input, focused === 'name' && styles.inputFocused, errors.name && styles.inputError]}
                          value={name}
                        />
                      </Field>
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
                        <Field error={errors.url} label="네이버 가게 URL">
                          <TextInput
                            accessibilityLabel={errors.url ? `네이버 가게 URL, 오류: ${errors.url}` : '네이버 가게 URL'}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus={activeStep === 2 && !url}
                            inputMode="url"
                            onBlur={() => setFocused(null)}
                            onChangeText={(value) => {
                              setUrl(value);
                              clearError('url');
                            }}
                            onFocus={() => setFocused('url')}
                            placeholder="naver.me 또는 naver.com 주소"
                            placeholderTextColor={colors.text.secondary}
                            style={[styles.input, focused === 'url' && styles.inputFocused, errors.url && styles.inputError]}
                            value={url}
                          />
                        </Field>
                      ) : (
                        <DoneRow label="네이버 가게 URL" onEdit={() => setActiveStep(2)} value={url} />
                      )
                    ) : null}
                  </View>
                )}

                {locked ? (
                  <View accessibilityLiveRegion="polite" style={styles.progressCard}>
                    {steps.map((row, index) => {
                      const running = phase === 'progress' && !row.done && index === steps.length - 1;
                      return (
                        <View key={row.key} style={styles.stepRow}>
                          <View style={styles.stepMarker}>
                            {row.done ? (
                              <View style={styles.stepDone}>
                                <Text style={styles.stepDoneMark}>✓</Text>
                              </View>
                            ) : running && !reduceMotion ? (
                              <ActivityIndicator color={colors.brand.primary} size="small" />
                            ) : (
                              <View style={styles.stepIdle} />
                            )}
                          </View>
                          <Text style={[styles.stepLabel, running && styles.stepLabelRunning]}>{row.label}</Text>
                        </View>
                      );
                    })}

                    {phase === 'failed' && failure ? (
                      <View style={styles.failureBlock}>
                        <View accessibilityRole="alert" style={styles.stepRow}>
                          <View style={styles.stepMarker}>
                            <View style={styles.stepFailed}>
                              <Text style={styles.stepFailedMark}>!</Text>
                            </View>
                          </View>
                          <Text style={styles.failureTitle}>분석을 마치지 못했어요</Text>
                        </View>
                        <Text style={styles.failureMessage}>{failure.message}</Text>
                      </View>
                    ) : (
                      <Text style={styles.progressHint}>단계가 바뀌면 아래에 이어서 보여드려요.</Text>
                    )}
                  </View>
                ) : null}

                {phase === 'input' && activeStep === 0 ? <PrimaryButton label="다음" onPress={confirmName} /> : null}
                {phase === 'input' && activeStep === 2 ? (
                  <PrimaryButton label={returnedNotice ? '다시 분석하기' : '분석하기'} onPress={startAnalysis} />
                ) : null}
                {phase === 'failed' && failure ? <PrimaryButton label={failure.action} onPress={onFailureAction} /> : null}
              </>
            )}

            <Text style={styles.footnote}>이 화면의 상호명·URL·수치는 디자인 검증을 위한 가상 데이터입니다.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      {hasSavedResult ? (
        <BottomNavigation
          active="analysis"
          bottomInset={insets.bottom}
          onAnalyze={() => undefined}
          onHome={() => router.dismissTo('/')}
        />
      ) : null}
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          ! {error}
        </Text>
      ) : null}
    </View>
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

function Chip({
  label,
  selected,
  onPress,
  radio = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  radio?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={radio ? 'radio' : 'button'}
      accessibilityState={radio ? { checked: selected } : { selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function FirstSaved({ onOpenResult }: { onOpenResult: () => void }) {
  return (
    <View style={styles.savedWrap}>
      <View aria-hidden style={styles.savedIcon}>
        <Text style={styles.savedIconMark}>✓</Text>
      </View>
      <Text accessibilityRole="header" style={styles.savedTitle}>
        첫 분석 결과를 저장했어요
      </Text>
      <Text style={styles.savedBody}>홈에서 언제든 다시 볼 수 있어요.</Text>
      <View style={styles.savedSummary}>
        <Text style={styles.savedSummaryName}>영등원조쌈밥</Text>
        <Text style={styles.savedSummaryMeta}>분석에 쓴 리뷰 59건 · 손님 유형 3개</Text>
      </View>
      <PrimaryButton label="결과 보기" onPress={onOpenResult} />
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
  },
  header: {
    backgroundColor: colors.brand.primary,
  },
  headerInner: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    gap: spacing[3],
  },
  headerRow: {
    minHeight: spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerRowLargeText: {
    flexWrap: 'wrap',
  },
  wordmark: {
    ...typography.head4,
    color: colors.text.inverse,
  },
  firstBadge: {
    borderColor: colors.text.inverse,
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  firstBadgeText: {
    ...typography.body6,
    color: colors.text.inverse,
  },
  toolsButton: {
    minHeight: layout.touchTargetMin,
    marginLeft: 'auto',
    justifyContent: 'center',
    borderColor: colors.text.inverse,
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[3],
  },
  toolsButtonText: {
    ...typography.caption,
    color: colors.text.inverse,
  },
  pageTitle: {
    ...typography.head4,
    color: colors.text.inverse,
  },
  body: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
    paddingTop: spacing[4],
    gap: spacing[4],
  },
  tools: {
    backgroundColor: colors.brand.stripe,
    borderColor: colors.border.brand,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[3],
  },
  toolsLabel: {
    ...typography.body6,
    color: colors.text.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderColor: colors.border.control,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[4],
  },
  chipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  chipText: {
    ...typography.body6,
    color: colors.text.primary,
  },
  chipTextSelected: {
    color: colors.brand.onPrimary,
  },
  returnNotice: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[4],
  },
  returnNoticeText: {
    ...typography.body6,
    color: colors.text.primary,
  },
  formCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[5],
    gap: spacing[5],
  },
  doneRow: {
    minHeight: layout.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: colors.border.default,
    borderBottomWidth: strokes.hairline,
    paddingBottom: spacing[3],
    gap: spacing[3],
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
    ...typography.body5,
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
  field: {
    gap: spacing[2],
  },
  fieldLabel: {
    ...typography.body6,
    color: colors.text.primary,
  },
  input: {
    ...typography.body4,
    minHeight: layout.touchTargetMin + spacing[1],
    color: colors.text.primary,
    backgroundColor: colors.background.surface,
    borderColor: colors.border.control,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  inputFocused: {
    borderColor: colors.focus.ring,
    borderWidth: strokes.focus,
  },
  inputError: {
    borderColor: colors.border.error,
    borderWidth: strokes.focus,
  },
  fieldError: {
    ...typography.errorText,
    color: colors.status.errorText,
  },
  summaryCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[1],
  },
  summaryRow: {
    minHeight: layout.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  summaryText: {
    ...typography.body7,
    flex: 1,
    color: colors.text.primary,
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
    paddingBottom: spacing[2],
  },
  progressCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[5],
    gap: spacing[4],
  },
  stepRow: {
    minHeight: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  stepMarker: {
    width: spacing[8],
    height: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    width: spacing[6],
    height: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.success,
    borderRadius: radii.pill,
  },
  stepDoneMark: {
    ...typography.body5,
    color: colors.text.inverse,
  },
  stepIdle: {
    width: spacing[3],
    height: spacing[3],
    borderColor: colors.border.control,
    borderRadius: radii.pill,
    borderWidth: strokes.focus,
  },
  stepFailed: {
    width: spacing[6],
    height: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.errorText,
    borderRadius: radii.pill,
  },
  stepFailedMark: {
    ...typography.body5,
    color: colors.text.inverse,
  },
  stepLabel: {
    ...typography.body4,
    flex: 1,
    color: colors.text.secondary,
  },
  stepLabelRunning: {
    ...typography.body1,
    color: colors.text.primary,
  },
  progressHint: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  failureBlock: {
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
    paddingTop: spacing[4],
    gap: spacing[2],
  },
  failureTitle: {
    ...typography.body1,
    flex: 1,
    color: colors.status.errorText,
  },
  failureMessage: {
    ...typography.body4,
    color: colors.text.primary,
  },
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: layout.touchTargetMin + spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  primaryButtonText: {
    ...typography.buttonMain,
    color: colors.action.onPrimary,
    textAlign: 'center',
  },
  savedWrap: {
    alignItems: 'center',
    paddingTop: spacing[10],
    gap: spacing[4],
  },
  savedIcon: {
    width: spacing[20],
    height: spacing[20],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.success,
    borderRadius: radii.pill,
  },
  savedIconMark: {
    ...typography.head2,
    color: colors.text.inverse,
  },
  savedTitle: {
    ...typography.head4,
    color: colors.text.strong,
    textAlign: 'center',
  },
  savedBody: {
    ...typography.body4,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  savedSummary: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[1],
  },
  savedSummaryName: {
    ...typography.body5,
    color: colors.text.primary,
  },
  savedSummaryMeta: {
    ...typography.body7,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footnote: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
