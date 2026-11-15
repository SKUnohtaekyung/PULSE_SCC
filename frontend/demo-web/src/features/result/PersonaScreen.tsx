import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { personaImageSource } from '@/api/personaImages';
import type { PerspectiveBlock, PerspectiveKey, PodiumSlot } from '@/api/types';
import { PerspectiveIcon } from '@/components/icons/PerspectiveIcons';
import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { Grow, Reveal, revealStagger } from '@/components/ui/Motion';
import { Notice } from '@/components/ui/Notice';
import { PersonaAvatar, PersonaAvatarNotice } from '@/components/ui/PersonaAvatar';
import { PageEnter } from '@/components/ui/PageEnter';
import { Screen } from '@/components/ui/Screen';
import { ChevronIcon } from '@/demo/icons/DemoIcons';
import { colors, fontFamilies, layout, radii, shadows, spacing, strokes, typography } from '@/design/tokens';
import { PulseInsight, PulseSymbol } from '@/features/result/PulseInsight';
import {
  dedupeEvidence,
  filledSlots,
  formatReviewMonth,
  perspectiveOrder,
  shareOf,
} from '@/features/result/resultFormat';
import { type ResultSource, sourceHome, sourceParams, useAnalysisResult } from '@/features/result/useAnalysisResult';
import { useSession } from '@/session/SessionProvider';

// 손님 유형 상세(TOP3에서 누르면 온다). 2026-11-15 결과를 화면별로 나누면서 생겼다.
// PRD FR-002: 선택한 유형 아래에 4개 관점을 모두 보여 주고, 관점마다 대표 근거 리뷰를 기본으로 보인다.
// 그래서 관점을 따로 떼지 않고 이 화면 한 장에 압축해 담고, 나머지 근거는 "근거 리뷰 N건 전체 보기"로 넘긴다.
// 관점 하나: 리뷰에서 확인한 사실(굵게) → 대표 리뷰 1건 → 펄스의 분석(점선 상자) → 근거 전체 보기.

export function PersonaScreen({ rank, source }: { rank: number; source: ResultSource }) {
  const router = useRouter();
  const { client } = useSession();
  const { state, reload } = useAnalysisResult(source);

  const result = state.phase === 'ready' ? state.result : null;
  const slot = result ? filledSlots(result).find((candidate) => candidate.rank === rank) : undefined;
  const persona = slot?.persona;

  return (
    <Screen header={<BackHeader title={`${rank}위 손님`} fallback={sourceHome(source) as Href} />}>
      <StatusBar style="dark" />

      {state.phase === 'loading' ? <LoadingBlock message="손님 유형을 불러오고 있어요." /> : null}
      {state.phase === 'error' ? (
        <View style={styles.block}>
          <Notice alert title="손님 유형을 불러오지 못했어요" message={state.message} tone="error" />
          <Button label="다시 불러오기" onPress={reload} variant="ghost" />
        </View>
      ) : null}
      {state.phase === 'empty' || (result && !persona) ? (
        <Notice title="이 손님 유형을 찾지 못했어요" message="결과 화면에서 다시 골라 주세요." tone="warning" />
      ) : null}

      {result && slot && persona ? (
        <PageEnter>
        <View style={styles.container}>
          <Reveal style={styles.hero}>
            <PersonaAvatar
              altText={persona.image.altText}
              size="first"
              source={personaImageSource(client, persona.image)}
              variant={rank - 1}
            />
            <View style={styles.heroText}>
              <Text accessibilityRole="header" style={styles.title}>
                {persona.label}
              </Text>
              <Text style={styles.summary}>{persona.summary}</Text>
            </View>
            <ShareBar slot={slot} validReviewCount={result.metadata.validReviewCount} />
            <PersonaAvatarNotice anyRemote={personaImageSource(client, persona.image).kind === 'remote'} />
          </Reveal>

          {persona.caveat ? <Notice title="참고해 주세요" message={persona.caveat} /> : null}

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                이 손님이 남긴 이야기
              </Text>
              <Text style={styles.sectionAside}>먼저 볼 것부터</Text>
            </View>
            {/* 표시는 여기서 한 번만 설명한다. 카드마다 같은 칩을 되풀이하지 않는다. */}
            <View accessible style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={styles.legendFact} />
                <Text style={styles.legendText}>굵은 글씨 · 리뷰에서 확인한 사실</Text>
              </View>
              <View style={styles.legendItem}>
                <PulseSymbol size={spacing[3]} />
                <Text style={styles.legendText}>점선 상자 · 펄스의 분석</Text>
              </View>
            </View>

            {perspectiveOrder.map((item, index) => {
              const block = persona.perspectives[item.key];
              if (!block) return null;
              return (
                <PerspectiveCard
                  block={block}
                  key={item.key}
                  label={item.label}
                  onOpenEvidence={() =>
                    router.push({
                      pathname: '/evidence',
                      params: {
                        analysisId: result.analysisId,
                        personaId: persona.id,
                        personaLabel: persona.label,
                        perspective: item.key.toUpperCase(),
                      },
                    })
                  }
                  order={index}
                  perspective={item.key}
                />
              );
            })}
          </View>

          <Reveal delay={revealStagger * 6}>
            <Pressable
              accessibilityHint="이 손님 유형에서 나온 검토해 볼 행동을 봐요"
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/advice', params: { rank: String(rank), ...sourceParams(source) } })
              }
              style={({ pressed }) => [styles.adviceEntry, pressed && styles.pressed]}
            >
              <Text style={styles.adviceCount}>{persona.advice.length}</Text>
              <View style={styles.adviceEntryText}>
                <Text style={styles.adviceEntryTitle}>사장님이 검토해 볼 행동</Text>
                <Text numberOfLines={1} style={styles.adviceEntryPreview}>
                  {persona.advice[0]?.suggestedAction ?? '리뷰에서 뒷받침되는 제안을 찾지 못했어요.'}
                </Text>
              </View>
              <ChevronIcon color={colors.text.secondary} />
            </Pressable>
          </Reveal>
        </View>
        </PageEnter>
      ) : null}
    </Screen>
  );
}

function ShareBar({ slot, validReviewCount }: { slot: PodiumSlot; validReviewCount: number }) {
  const share = shareOf(slot, validReviewCount);
  if (slot.topicReviewCount === undefined) return null;
  return (
    <View style={styles.share}>
      <View style={styles.shareRow}>
        <Text style={styles.shareCount}>리뷰 {slot.topicReviewCount}건</Text>
        {share !== null ? <Text style={styles.shareText}>분석한 리뷰 {validReviewCount}건 중 {share}%</Text> : null}
      </View>
      {share !== null ? (
        <View style={styles.track}>
          {/* 100%를 넘는 값은 데이터 이상이다. 문장에는 그대로 보이고 막대만 자른다. */}
          <Grow delay={revealStagger * 3} style={styles.bar} width={`${Math.min(100, share)}%`} />
        </View>
      ) : null}
    </View>
  );
}

function PerspectiveCard({
  perspective,
  label,
  block,
  order,
  onOpenEvidence,
}: {
  perspective: PerspectiveKey;
  label: string;
  block: PerspectiveBlock;
  order: number;
  onOpenEvidence: () => void;
}) {
  const tone = colors.perspective[perspective];
  const priority = perspective === 'priority';
  // 발표 시안: '먼저 볼 것'은 남색 칸 위 흰 아이콘. 나머지는 관점 색의 연한 칸.
  const icon = priority
    ? { background: colors.brand.primary, color: colors.brand.onPrimary }
    : { background: tone.tint, color: tone.accent };
  const [firstReview] = dedupeEvidence(block.evidencePreview);

  return (
    <Reveal delay={revealStagger * (order + 2)} style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: icon.background }]}>
          <PerspectiveIcon color={icon.color} perspective={perspective} />
        </View>
        <Text style={styles.cardTitle}>{label}</Text>
        {/* 주황 포인트: 사장님이 가장 먼저 볼 관점. */}
        {priority ? <View accessibilityLabel="가장 먼저 볼 관점" accessibilityRole="image" accessible style={styles.priorityDot} /> : null}
      </View>

      {block.reviewFacts.map((fact, index) => (
        <Text key={fact.id} style={index === 0 ? styles.fact : styles.factMore}>
          {fact.text}
        </Text>
      ))}

      {firstReview ? (
        <View style={styles.quote}>
          <Text style={styles.quoteText}>{firstReview.excerpt}</Text>
          <Text style={styles.quoteMeta}>{formatReviewMonth(firstReview.writtenAt)}</Text>
        </View>
      ) : (
        // INSIGHT-LIMITED — 없는 근거를 채워 넣지 않고 한계를 적는다(SCREEN_STATES §6.2).
        <Text style={styles.factMore}>여기에는 보여드릴 대표 리뷰가 없어요.</Text>
      )}

      <PulseInsight compact texts={block.aiInterpretations.map((item) => item.text)} />

      {firstReview ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenEvidence}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Text style={styles.linkText}>근거 리뷰 {block.evidenceCount}건 전체 보기</Text>
          <ChevronIcon color={colors.text.brand} />
        </Pressable>
      ) : null}
    </Reveal>
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
  hero: {
    ...shadows.soft,
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radii.panel,
    backgroundColor: colors.background.surface,
  },
  heroText: {
    alignItems: 'center',
    gap: spacing[1],
  },
  title: {
    ...typography.head4,
    fontFamily: fontFamilies.bold,
    color: colors.text.strong,
    textAlign: 'center',
  },
  summary: {
    ...typography.body7,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  share: {
    alignSelf: 'stretch',
    gap: spacing[2],
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  shareCount: {
    ...typography.body5,
    color: colors.text.brand,
  },
  shareText: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  track: {
    height: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.background.emphasized,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.brand.primary,
  },
  section: {
    gap: spacing[3],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  sectionTitle: {
    ...typography.body1,
    color: colors.text.strong,
  },
  sectionAside: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    rowGap: spacing[1],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendFact: {
    width: spacing[3],
    height: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: colors.text.strong,
  },
  legendText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  card: {
    ...shadows.soft,
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radii.panel,
    backgroundColor: colors.background.surface,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing[10],
    height: spacing[10],
    borderRadius: radii.control,
  },
  cardTitle: {
    ...typography.body5,
    color: colors.text.strong,
    flex: 1,
  },
  priorityDot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.action.primary,
  },
  fact: {
    ...typography.body4,
    fontFamily: fontFamilies.bold,
    color: colors.text.strong,
  },
  factMore: {
    ...typography.body7,
    color: colors.text.secondary,
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
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    minHeight: layout.touchTargetMin,
  },
  linkText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  adviceEntry: {
    ...shadows.soft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.panel,
    backgroundColor: colors.background.surface,
  },
  // 주황 포인트: 검토해 볼 행동의 개수.
  adviceCount: {
    ...typography.body5,
    width: spacing[8],
    height: spacing[8],
    lineHeight: spacing[8],
    textAlign: 'center',
    borderRadius: radii.pill,
    overflow: 'hidden',
    color: colors.action.onPrimary,
    backgroundColor: colors.action.primary,
  },
  adviceEntryText: {
    flex: 1,
    gap: spacing[1] / 2,
  },
  adviceEntryTitle: {
    ...typography.body5,
    color: colors.text.strong,
  },
  adviceEntryPreview: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.9,
  },
});
