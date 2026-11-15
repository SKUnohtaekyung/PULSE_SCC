import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Reveal, revealStagger } from '@/components/ui/Motion';
import { Notice } from '@/components/ui/Notice';
import { PageEnter } from '@/components/ui/PageEnter';
import { Screen } from '@/components/ui/Screen';
import { InfoIcon, ReviewIcon, WarningIcon } from '@/demo/icons/DemoIcons';
import { colors, fontFamilies, radii, shadows, spacing, strokes, typography } from '@/design/tokens';
import { filledSlots, formatMonthDay, formatMonthDayTime } from '@/features/result/resultFormat';
import { type ResultSource, sourceHome, useAnalysisResult } from '@/features/result/useAnalysisResult';

// 분석 기준(홈의 기준 한 줄을 누르면 온다). 무엇을 얼마나 분석했는지와 결과를 읽을 때 알아 둘 점을 모은다.
// PRD FR-001(수집 건수·시점 표시), FR-009(2년 넘은 리뷰 경고), PRD §12(한계는 숨기지 않는다).

export function AnalysisInfoScreen({ source }: { source: ResultSource }) {
  const { state, reload } = useAnalysisResult(source);
  const result = state.phase === 'ready' ? state.result : null;

  const notes = result
    ? [
        '리뷰를 남긴 손님이 전체 손님을 대표하지는 않아요.',
        ...result.limitations.map((limitation) => limitation.message),
        ...filledSlots(result).flatMap((slot) =>
          slot.persona?.caveat ? [`${slot.rank}위 ${slot.persona.label} · ${slot.persona.caveat}`] : [],
        ),
      ]
    : [];

  return (
    <Screen header={<BackHeader title="분석 기준" fallback={sourceHome(source) as Href} />}>
      <StatusBar style="dark" />

      {state.phase === 'loading' ? <LoadingBlock message="분석 기준을 불러오고 있어요." /> : null}
      {state.phase === 'error' ? (
        <View style={styles.block}>
          <Notice alert title="분석 기준을 불러오지 못했어요" message={state.message} tone="error" />
          <Button label="다시 불러오기" onPress={reload} variant="ghost" />
        </View>
      ) : null}
      {state.phase === 'empty' ? (
        <Notice title="저장된 결과가 없어요" message="가게를 분석하면 기준을 볼 수 있어요." tone="warning" />
      ) : null}

      {result ? (
        <PageEnter>
        <View style={styles.container}>
          <Reveal style={styles.intro}>
            <Text accessibilityRole="header" style={styles.title}>
              이 결과는 이렇게 만들었어요
            </Text>
            <Text style={styles.lead}>{result.store.name} · {result.store.category}</Text>
          </Reveal>

          <Reveal delay={revealStagger} style={styles.card}>
            <View style={styles.cardHead}>
              <ReviewIcon color={colors.text.secondary} size={spacing[4]} />
              {/* 시연 앱: 실제 서비스는 "네이버 공개 리뷰 기준"이다. 시연 리뷰는 지어낸 예시다. */}
              <Text style={styles.cardHeadText}>시연용 예시 리뷰 기준</Text>
            </View>
            <Row label="모은 리뷰" value={`${result.metadata.collectedReviewCount}건`} />
            <Row
              hint="너무 짧거나 글 없이 사진만 있는 리뷰는 빼고 분석해요."
              label="분석한 리뷰"
              strong
              value={`${result.metadata.validReviewCount}건`}
            />
            <Row label="리뷰를 모은 날" value={formatMonthDay(result.metadata.collectedAt)} />
            <Row label="분석을 마친 때" value={formatMonthDayTime(result.metadata.analyzedAt)} />
          </Reveal>

          {result.metadata.containsReviewsOlderThanTwoYears ? (
            <View style={styles.warning}>
              <WarningIcon color={colors.status.warningText} />
              <Text style={styles.warningText}>2년 넘은 리뷰가 섞여 있어요. 지금 가게 모습과 다를 수 있어요.</Text>
            </View>
          ) : null}

          <Reveal delay={revealStagger * 2} style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              읽을 때 알아 둘 것
            </Text>
            {notes.map((note) => (
              <View key={note} style={styles.note}>
                <View style={styles.bullet} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </Reveal>

          <View style={styles.footnote}>
            <InfoIcon color={colors.text.secondary} size={spacing[4]} />
            <Text style={styles.footnoteText}>
              시연용 예시 데이터예요. 실제 가게의 네이버 리뷰를 모으거나 분석하지 않았어요.
            </Text>
          </View>
        </View>
        </PageEnter>
      ) : null}
    </Screen>
  );
}

function Row({ label, value, hint, strong = false }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
      </View>
      {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[4],
  },
  container: {
    gap: spacing[6],
    width: '100%',
    paddingBottom: spacing[8],
  },
  intro: {
    gap: spacing[1],
  },
  title: {
    ...typography.head4,
    fontFamily: fontFamilies.bold,
    color: colors.text.strong,
  },
  lead: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  card: {
    ...shadows.soft,
    gap: spacing[1],
    padding: spacing[5],
    borderRadius: radii.panel,
    backgroundColor: colors.background.surface,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingBottom: spacing[2],
  },
  cardHeadText: {
    ...typography.body6,
    color: colors.text.secondary,
  },
  row: {
    gap: spacing[1],
    paddingVertical: spacing[3],
    borderTopWidth: strokes.hairline,
    borderTopColor: colors.border.default,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  rowLabel: {
    ...typography.body4,
    color: colors.text.primary,
  },
  rowValue: {
    ...typography.body4,
    fontFamily: fontFamilies.semibold,
    color: colors.text.strong,
  },
  rowValueStrong: {
    fontFamily: fontFamilies.bold,
    color: colors.text.brand,
  },
  rowHint: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radii.control,
    backgroundColor: colors.background.subtle,
  },
  warningText: {
    ...typography.body7,
    color: colors.status.warningText,
    flex: 1,
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    ...typography.body1,
    color: colors.text.strong,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  bullet: {
    width: spacing[1] + spacing[1] / 2,
    height: spacing[1] + spacing[1] / 2,
    marginTop: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.text.secondary,
  },
  noteText: {
    ...typography.body4,
    color: colors.text.primary,
    flex: 1,
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  footnoteText: {
    ...typography.body7,
    color: colors.text.secondary,
    flex: 1,
  },
});
