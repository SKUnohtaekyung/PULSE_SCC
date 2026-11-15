import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Advice } from '@/api/types';
import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Reveal, revealStagger } from '@/components/ui/Motion';
import { Notice } from '@/components/ui/Notice';
import { PageEnter } from '@/components/ui/PageEnter';
import { Screen } from '@/components/ui/Screen';
import { ArrowDownIcon, ChevronIcon } from '@/demo/icons/DemoIcons';
import { colors, fontFamilies, layout, radii, shadows, spacing, strokes, typography } from '@/design/tokens';
import { PulseInsight, PulseSymbol } from '@/features/result/PulseInsight';
import { filledSlots, formatReviewMonth } from '@/features/result/resultFormat';
import { type ResultSource, sourceHome, sourceParams, useAnalysisResult } from '@/features/result/useAnalysisResult';

// 검토해 볼 행동(홈의 "먼저 살펴볼 것", 손님 유형 화면에서 온다). 2026-11-15 결과를 화면별로 나누면서 생겼다.
// PRD FR-005: 제안마다 리뷰 사실과 검토할 행동은 기본으로 보이고, 펄스의 분석·참고 지식은 펼쳐서 본다.
// 위 칩으로 다른 순위 손님의 행동으로 바꿔 볼 수 있다.

export function AdviceScreen({ rank, source }: { rank: number; source: ResultSource }) {
  const router = useRouter();
  const { state, reload } = useAnalysisResult(source);
  const result = state.phase === 'ready' ? state.result : null;
  const slots = result ? filledSlots(result) : [];
  const slot = slots.find((candidate) => candidate.rank === rank);
  const persona = slot?.persona;

  return (
    <Screen header={<BackHeader title="검토해 볼 행동" fallback={sourceHome(source) as Href} />}>
      <StatusBar style="dark" />

      {state.phase === 'loading' ? <LoadingBlock message="검토해 볼 행동을 불러오고 있어요." /> : null}
      {state.phase === 'error' ? (
        <View style={styles.block}>
          <Notice alert title="검토해 볼 행동을 불러오지 못했어요" message={state.message} tone="error" />
          <Button label="다시 불러오기" onPress={reload} variant="ghost" />
        </View>
      ) : null}
      {state.phase === 'empty' || (result && !persona) ? (
        <Notice title="이 손님 유형을 찾지 못했어요" message="결과 화면에서 다시 골라 주세요." tone="warning" />
      ) : null}

      {result && persona ? (
        <PageEnter>
        <View style={styles.container}>
          {slots.length > 1 ? (
            <ScrollView
              accessibilityLabel="손님 유형 고르기"
              accessibilityRole="tablist"
              contentContainerStyle={styles.tabs}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {slots.map((candidate) => {
                const selected = candidate.rank === rank;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={candidate.rank}
                    onPress={() =>
                      selected
                        ? undefined
                        : router.setParams({ rank: String(candidate.rank), ...sourceParams(source) })
                    }
                    style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressed]}
                  >
                    <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                      {candidate.rank}위 {candidate.persona?.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Reveal key={`intro-${rank}`} style={styles.intro}>
            <Text accessibilityRole="header" style={styles.title}>
              {persona.label}에게서 나온 제안
            </Text>
            <Text style={styles.lead}>리뷰에서 확인한 사실을 바탕으로 한 참고 의견이에요. 결과를 보장하지 않아요.</Text>
          </Reveal>

          {persona.advice.length === 0 ? (
            // ADVICE-EMPTY — 근거 없는 제안을 지어내지 않았다는 사실을 적는다(SCREEN_STATES §6.5).
            <Notice
              title="검토해 볼 행동을 만들지 못했어요"
              message="리뷰에서 뒷받침되는 제안을 찾지 못했어요."
              tone="warning"
            />
          ) : (
            persona.advice.map((advice, index) => (
              <AdviceCard advice={advice} key={`${rank}-${advice.id}`} order={index + 1} />
            ))
          )}
        </View>
        </PageEnter>
      ) : null}
    </Screen>
  );
}

function AdviceCard({ advice, order }: { advice: Advice; order: number }) {
  const [open, setOpen] = useState(false);
  const quote = advice.evidencePreview?.[0];
  const references = advice.details.knowledgeReferences;

  return (
    <Reveal delay={revealStagger * order} style={styles.group}>
      <View style={styles.fact}>
        <Text style={styles.factLabel}>리뷰에서 확인</Text>
        <Text style={styles.factText}>{advice.reviewFact}</Text>
        {quote ? (
          <View style={styles.quote}>
            <Text style={styles.quoteText}>{quote.excerpt}</Text>
            <Text style={styles.quoteMeta}>{formatReviewMonth(quote.writtenAt)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.arrow}>
        <ArrowDownIcon color={colors.text.disabled} />
      </View>

      <View style={styles.action}>
        {/* 주황 포인트: 행동 번호. */}
        <Text style={styles.actionChip}>검토해 볼 행동 {order}</Text>
        <Text style={styles.actionText}>{advice.suggestedAction}</Text>
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
        >
          <View style={styles.disclosureMark}>
            <PulseSymbol size={spacing[3]} />
          </View>
          <Text style={styles.disclosureText}>{open ? '펄스의 분석 접기' : '펄스의 분석 펼쳐보기'}</Text>
          <ChevronIcon color={colors.brand.onPrimary} direction={open ? 'up' : 'down'} />
        </Pressable>
      </View>

      {open ? (
        <View style={styles.details}>
          <PulseInsight texts={[advice.details.aiInterpretation]} />
          <View style={styles.reference}>
            <Text style={styles.referenceTitle}>참고한 전문 지식</Text>
            {references.length > 0 ? (
              references.map((reference) => (
                <Text key={reference.title + reference.locator} style={styles.referenceText}>
                  {reference.title} · {reference.locator}
                </Text>
              ))
            ) : (
              // ADVICE-NO-KNOWLEDGE — 없는 출처를 지어내지 않고 없다는 사실을 적는다(SCREEN_STATES §6.5).
              <Text style={styles.referenceText}>이 제안에는 참고한 전문 지식이 없어요.</Text>
            )}
          </View>
        </View>
      ) : null}
    </Reveal>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[4],
  },
  container: {
    gap: spacing[5],
    width: '100%',
    paddingBottom: spacing[8],
  },
  tabs: {
    gap: spacing[2],
  },
  tab: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  tabSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
  tabText: {
    ...typography.body6,
    color: colors.text.secondary,
  },
  tabTextSelected: {
    fontFamily: fontFamilies.bold,
    color: colors.brand.onPrimary,
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
  group: {
    gap: 0,
  },
  fact: {
    ...shadows.soft,
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radii.panel,
    backgroundColor: colors.background.surface,
  },
  factLabel: {
    ...typography.caption,
    fontFamily: fontFamilies.semibold,
    color: colors.text.brand,
  },
  factText: {
    ...typography.body4,
    fontFamily: fontFamilies.bold,
    color: colors.text.strong,
  },
  quote: {
    gap: spacing[1],
    paddingLeft: spacing[3],
    borderLeftWidth: strokes.focus,
    borderLeftColor: colors.border.strong,
  },
  quoteText: {
    ...typography.body7,
    color: colors.text.primary,
  },
  quoteMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  arrow: {
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  action: {
    ...shadows.soft,
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radii.panel,
    backgroundColor: colors.brand.primary,
  },
  actionChip: {
    ...typography.caption,
    fontFamily: fontFamilies.bold,
    alignSelf: 'flex-start',
    color: colors.action.onPrimary,
    backgroundColor: colors.action.primary,
    borderRadius: radii.small,
    overflow: 'hidden',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
  },
  actionText: {
    ...typography.head5,
    fontFamily: fontFamilies.bold,
    color: colors.brand.onPrimary,
  },
  divider: {
    height: strokes.hairline,
    backgroundColor: colors.brand.onPrimaryDivider,
  },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    minHeight: layout.touchTargetMin,
  },
  // 남색 위에서 P 심볼(남색)이 보이도록 흰 바탕 칩에 올린다.
  disclosureMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing[6],
    height: spacing[6],
    borderRadius: radii.small,
    backgroundColor: colors.brand.onPrimary,
  },
  disclosureText: {
    ...typography.body6,
    color: colors.brand.onPrimary,
    flex: 1,
  },
  details: {
    gap: spacing[3],
    marginTop: spacing[3],
  },
  reference: {
    gap: spacing[1],
    paddingHorizontal: spacing[1],
  },
  referenceTitle: {
    ...typography.body6,
    color: colors.text.strong,
  },
  referenceText: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.9,
  },
});
