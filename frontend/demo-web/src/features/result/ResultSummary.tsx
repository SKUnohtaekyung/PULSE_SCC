import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ApiClient } from '@/api/client';
import { personaImageSource } from '@/api/personaImages';
import type { AnalysisResult } from '@/api/types';
import { Reveal, revealStagger } from '@/components/ui/Motion';
import { Notice } from '@/components/ui/Notice';
import { PersonaAvatarNotice } from '@/components/ui/PersonaAvatar';
import { PodiumTop3 } from '@/components/ui/PodiumTop3';
import { ChevronIcon, InfoIcon } from '@/demo/icons/DemoIcons';
import { colors, fontFamilies, layout, radii, shadows, spacing, strokes, typography } from '@/design/tokens';
import { filledSlots, formatMonthDay } from '@/features/result/resultFormat';

// 결과 첫 화면(홈·저장 전 미리보기 공통). 2026-11-15 사용자 결정으로 한 화면에 모두 담던 결과를 나눴다.
// 여기는 "우리 가게 손님이 누구이고, 먼저 무엇을 보면 되는가"만 보여 주고,
// 손님 유형 상세·검토해 볼 행동·분석 기준은 눌러서 넘어가는 화면이 맡는다.
//
// 읽는 순서: 업종·저장 상태 → 가게 이름 → 한 줄 결론 → 분석 기준 한 줄(누르면 분석 기준)
// → 손님 TOP3(누르면 손님 유형 상세) → 먼저 살펴볼 것(누르면 검토해 볼 행동).

export function ResultSummary({
  result,
  client,
  savedState,
  onOpenPersona,
  onOpenAdvice,
  onOpenInfo,
}: {
  result: AnalysisResult;
  client: ApiClient;
  /** 머리의 저장 상태. 저장 전 미리보기에서는 "저장 전 새 결과"(RESULT-UNSAVED-PREVIEW). */
  savedState: string;
  onOpenPersona: (rank: number) => void;
  onOpenAdvice: (rank: number) => void;
  onOpenInfo: () => void;
}) {
  const podium = [...result.podium].sort((left, right) => left.rank - right.rank);
  const filled = filledSlots(result);
  const top = filled[0];
  const firstAction = top?.persona?.advice[0]?.suggestedAction;
  const { collectedReviewCount, validReviewCount, collectedAt } = result.metadata;
  const anyRemoteImage = filled.some((slot) =>
    slot.persona ? personaImageSource(client, slot.persona.image).kind === 'remote' : false,
  );

  return (
    <View style={styles.container}>
      <Reveal style={styles.intro}>
        <View style={styles.introMeta}>
          <Text style={styles.categoryChip}>{result.store.category}</Text>
          <Text style={styles.introMetaText}>{savedState}</Text>
        </View>
        <Text style={styles.storeName}>{result.store.name}</Text>
        <Text accessibilityRole="header" style={styles.headline}>
          우리 가게 손님은{'\n'}이런 분들이에요
        </Text>
      </Reveal>

      {/* 분석 기준 한 줄. 결과를 믿어도 되는지 확인하는 보조 정보라 눌러서 자세히 본다(PRD FR-001 수집 건수·시점). */}
      <Reveal delay={revealStagger}>
        <Pressable
          accessibilityHint="모은 리뷰·분석한 리뷰·날짜와 읽을 때 알아 둘 점을 봐요"
          accessibilityRole="button"
          onPress={onOpenInfo}
          style={({ pressed }) => [styles.basis, pressed && styles.pressed]}
        >
          <View style={styles.statusDot} />
          <Text style={styles.basisText}>
            예시 리뷰 {collectedReviewCount}건 중 <Text style={styles.basisStrong}>{validReviewCount}건</Text> 분석 ·{' '}
            {formatMonthDay(collectedAt)} 수집
          </Text>
          <Text style={styles.basisLink}>분석 기준</Text>
          <ChevronIcon color={colors.text.secondary} />
        </Pressable>
      </Reveal>

      {result.metadata.containsReviewsOlderThanTwoYears ? (
        // PRD FR-009: 2년 넘은 리뷰가 섞였으면 결과 화면 자체에 알린다(자세한 것은 분석 기준 화면).
        <Notice
          title="2년 넘은 리뷰가 섞여 있어요"
          message="지금 가게 모습과 다를 수 있어요."
          tone="warning"
        />
      ) : null}

      <Reveal delay={revealStagger * 2} style={styles.section}>
        <View style={styles.sectionHead}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            리뷰에 많이 나온 손님 TOP3
          </Text>
          <Text style={styles.sectionAside}>리뷰 수 순서</Text>
        </View>
        <View style={styles.podiumCard}>
          <PodiumTop3
            imageSource={(slot) =>
              slot.persona ? personaImageSource(client, slot.persona.image) : { kind: 'unavailable' }
            }
            onSelect={onOpenPersona}
            podium={podium}
            selectedRank={top?.rank ?? null}
          />
          {filled.length > 0 ? <Text style={styles.podiumHint}>손님을 누르면 자세히 볼 수 있어요</Text> : null}
          <PersonaAvatarNotice anyRemote={anyRemoteImage} />
        </View>
      </Reveal>

      {filled.length === 0 ? (
        <Notice
          title="채울 수 있는 손님 유형이 없었어요"
          message="리뷰가 더 쌓인 뒤 다시 분석해 볼 수 있어요."
          tone="warning"
        />
      ) : null}

      {top && firstAction ? (
        <Reveal delay={revealStagger * 3} style={styles.section}>
          <Pressable
            accessibilityHint={`${top.rank}위 손님에게서 나온 검토해 볼 행동과 그 근거를 봐요`}
            accessibilityRole="button"
            onPress={() => onOpenAdvice(top.rank)}
            style={({ pressed }) => [styles.highlight, pressed && styles.pressed]}
          >
            {/* 주황 포인트: 이번 결과에서 가장 먼저 볼 한 가지(2026-11-15 서브 컬러 결정). */}
            <Text style={styles.highlightChip}>먼저 살펴볼 것</Text>
            <Text style={styles.highlightTitle}>{firstAction}</Text>
            <View style={styles.highlightFoot}>
              <Text style={styles.highlightFootText}>
                {top.rank}위 {top.persona?.label} · 근거 보기
              </Text>
              <ChevronIcon color={colors.brand.onPrimary} />
            </View>
          </Pressable>
          <Text style={styles.caption}>펄스의 분석을 참고해 사장님이 최종 판단해 주세요.</Text>
        </Reveal>
      ) : null}

      <View style={styles.footnote}>
        <InfoIcon color={colors.text.secondary} size={spacing[4]} />
        <Text style={styles.footnoteText}>시연용 예시 데이터예요. 리뷰·분석·제안 모두 미리 써 둔 예시 문장이에요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[6],
    width: '100%',
  },
  intro: {
    gap: spacing[2],
  },
  introMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  categoryChip: {
    ...typography.caption,
    fontFamily: fontFamilies.semibold,
    color: colors.text.strong,
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.small,
    overflow: 'hidden',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
  },
  introMetaText: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  storeName: {
    ...typography.body1,
    color: colors.text.strong,
  },
  headline: {
    ...typography.head3,
    fontFamily: fontFamilies.bold,
    color: colors.text.strong,
  },
  basis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    minHeight: layout.touchTargetMin + spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  statusDot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.status.success,
  },
  basisText: {
    ...typography.body7,
    color: colors.text.secondary,
    flex: 1,
  },
  basisStrong: {
    fontFamily: fontFamilies.bold,
    color: colors.text.brand,
  },
  basisLink: {
    ...typography.body6,
    color: colors.text.secondary,
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
  podiumCard: {
    ...shadows.soft,
    backgroundColor: colors.background.surface,
    borderRadius: radii.panel,
    gap: spacing[3],
    padding: spacing[4],
  },
  podiumHint: {
    ...typography.body6,
    color: colors.text.brand,
    textAlign: 'center',
  },
  highlight: {
    ...shadows.soft,
    backgroundColor: colors.brand.primary,
    borderRadius: radii.panel,
    gap: spacing[2],
    padding: spacing[5],
  },
  highlightChip: {
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
  highlightTitle: {
    ...typography.head5,
    fontFamily: fontFamilies.bold,
    color: colors.brand.onPrimary,
  },
  highlightFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  highlightFootText: {
    ...typography.body6,
    color: colors.brand.onPrimary,
  },
  caption: {
    ...typography.body7,
    color: colors.text.secondary,
    paddingHorizontal: spacing[1],
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingBottom: spacing[4],
  },
  footnoteText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
