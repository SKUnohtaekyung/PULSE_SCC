import { type ReactElement, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { ApiClient } from '@/api/client';
import { personaImageSource, type PersonaImageSource } from '@/api/personaImages';
import type {
  Advice,
  AnalysisResult,
  EvidencePreview,
  PerspectiveBlock,
  PerspectiveKey,
  PodiumSlot,
} from '@/api/types';
import { PerspectiveIcon } from '@/components/icons/PerspectiveIcons';
import { Notice } from '@/components/ui/Notice';
import {
  PersonaAvatar,
  PersonaAvatarNotice,
  PersonaImageError,
  usePersonaImageRetry,
} from '@/components/ui/PersonaAvatar';
import { PodiumTop3 } from '@/components/ui/PodiumTop3';
import { useBodyMaxWidth, useExpandedLayout } from '@/components/ui/Screen';
import { colors, fontFamilies, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 결과 표시. 읽는 순서는 DESIGN_SYSTEM §4.1을 따른다.
// 1) 손님 TOP3 → 2) 선택한 유형의 관점마다 AI 해석 → 리뷰에서 확인한 사실 → 대표 리뷰
// → 3) 검토해 볼 행동 → 4) 무엇을 얼마나 분석했는가
// 해석을 관점의 첫머리로 옮긴 것은 2026-10-05 결정이다. 화면에서 읽는 순서만 바뀌었고,
// 사실과 해석은 표시(`AI 해석`·`리뷰에서 확인`)와 자리로 계속 구분한다(PRD FR-006).
// 상태 판정은 SCREEN_STATES §6.1: FILLED 개수 3 / 1~2 / 0 = RESULT-NORMAL / PARTIAL / NO-PERSONA.

const perspectiveOrder: { key: PerspectiveKey; label: string; why: string }[] = [
  { key: 'priority', label: '먼저 볼 것', why: '리뷰에 가장 자주 나온 이야기예요.' },
  { key: 'positive', label: '잘하고 있는 점', why: '손님이 좋게 본 경험이에요.' },
  { key: 'negative', label: '손님이 불편해한 점', why: '아쉬움으로 남은 경험이에요.' },
  { key: 'perception', label: '손님이 기억하는 모습', why: '가게를 어떤 곳으로 여기는지 보여줘요.' },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

/** 같은 리뷰의 같은 구절이 대표 리뷰에 두 번 오면 한 번만 보여 준다. */
const dedupeEvidence = (reviews: EvidencePreview[]) =>
  reviews.filter(
    (review, index) =>
      reviews.findIndex(
        (candidate) => candidate.reviewId === review.reviewId && candidate.excerpt === review.excerpt,
      ) === index,
  );

const filledSlots = (result: AnalysisResult | null) =>
  result
    ? [...result.podium]
        .sort((left, right) => left.rank - right.rank)
        .filter((slot) => slot.status === 'FILLED' && slot.persona)
    : [];

export type OpenEvidence = (args: {
  analysisId: string;
  personaId: string;
  personaLabel: string;
  perspective: string;
}) => void;

// ── 순위 바로가기 ─────────────────────────────────────────────────────────────
// 결과가 길어 아래로 내려간 뒤에는 다른 순위를 보려고 맨 위까지 올라가야 했다(2026-10-05 팀 디자인 피드백 #15).
// 선택 상태와 스크롤 위치를 화면(Screen의 footer)과 본문(ResultView)이 함께 쓰도록 훅으로 뺐다.

export type ResultNavigation = ReturnType<typeof useResultNavigation>;

export function useResultNavigation(result: AnalysisResult | null) {
  const scrollRef = useRef<ScrollView | null>(null);
  // 모두 스크롤 내용 안에서의 높이다. body는 헤더 높이, root는 본문 안에서 결과가 시작하는 높이.
  const offsets = useRef({ body: 0, root: 0, detail: 0, advice: 0 });
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [pastPodium, setPastPodium] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const ranks = useMemo(() => filledSlots(result).map((slot) => slot.rank), [result]);
  const detailTop = () => offsets.current.body + offsets.current.root + offsets.current.detail;
  const scrollTo = (y: number) =>
    scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing[4]), animated: !reduceMotion });

  return {
    scrollRef: scrollRef as RefObject<ScrollView | null>,
    ranks,
    /** 사용자가 고르기 전에는 null이다. 그때는 가장 높은 순위를 보여 준다(SCREEN_STATES §6.1). */
    selectedRank: selectedRank ?? ranks[0] ?? null,
    pastPodium,
    selectRank: (rank: number) => setSelectedRank(rank),
    /** 바로가기에서 고른 순위. 내용이 바뀐 뒤 그 유형의 첫머리로 옮긴다. */
    jumpToRank: (rank: number) => {
      setSelectedRank(rank);
      requestAnimationFrame(() => scrollTo(detailTop()));
    },
    jumpToAdvice: () => scrollTo(detailTop() + offsets.current.advice),
    jumpToTop: () => scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion }),
    onBodyLayout: (y: number) => {
      offsets.current.body = y;
    },
    onRootLayout: (y: number) => {
      offsets.current.root = y;
    },
    onDetailLayout: (y: number) => {
      offsets.current.detail = y;
    },
    onAdviceLayout: (y: number) => {
      offsets.current.advice = y;
    },
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // 시상대가 화면 위로 사라진 뒤에만 바로가기를 보여 준다. 시상대가 보이는 동안에는 같은 선택지가 두 번 나온다.
      const next = offsets.current.detail > 0 && event.nativeEvent.contentOffset.y > detailTop();
      setPastPodium((current) => (current === next ? current : next));
    },
  };
}

/** 화면 아래에 고정하는 순위 바로가기. Screen의 footer에 하단 내비게이션보다 위에 둔다. */
export function ResultJumpBar({ navigation }: { navigation: ResultNavigation }) {
  if (!navigation.pastPodium || navigation.ranks.length === 0) return null;
  return (
    <View accessibilityLabel="결과 바로가기" style={styles.jumpBar}>
      <ScrollView
        contentContainerStyle={styles.jumpItems}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        {navigation.ranks.map((rank) => {
          const selected = navigation.selectedRank === rank;
          return (
            <Pressable
              accessibilityLabel={selected ? `${rank}위 손님, 지금 보는 중` : `${rank}위 손님 보기`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={rank}
              onPress={() => navigation.jumpToRank(rank)}
              style={({ pressed }) => [
                styles.jumpChip,
                selected && styles.jumpChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.jumpChipText, selected && styles.jumpChipTextSelected]}>{rank}위</Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={navigation.jumpToAdvice}
          style={({ pressed }) => [styles.jumpChip, pressed && styles.pressed]}
        >
          <Text style={styles.jumpChipText}>검토할 행동</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={navigation.jumpToTop}
          style={({ pressed }) => [styles.jumpChip, styles.jumpChipPlain, pressed && styles.pressed]}
        >
          <Text style={styles.jumpChipTextPlain}>맨 위로</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ── 결과 본문 ─────────────────────────────────────────────────────────────────

export function ResultView({
  result,
  client,
  onOpenEvidence,
  navigation,
}: {
  result: AnalysisResult;
  client: ApiClient;
  onOpenEvidence?: OpenEvidence;
  /** 화면이 순위 바로가기를 함께 쓰면 준다. 없으면 이 컴포넌트가 선택 상태만 직접 가진다. */
  navigation?: ResultNavigation;
}) {
  const ownNavigation = useResultNavigation(result);
  const nav = navigation ?? ownNavigation;
  // 응답이 rank 순이라는 보장이 계약에 없다. 최초 선택은 가장 낮은 rank다(SCREEN_STATES §6.1).
  const podium = useMemo(
    () => [...result.podium].sort((left, right) => left.rank - right.rank),
    [result.podium],
  );
  const filled = useMemo(() => filledSlots(result), [result]);
  const selected = filled.find((slot) => slot.rank === nav.selectedRank) ?? filled[0] ?? null;
  // 넓은 화면에서 관점 카드를 2열로 놓는 화면이라 Screen·ScreenHeader와 같은 wide 폭을 쓴다.
  const bodyMaxWidth = useBodyMaxWidth(true);
  // 고지 문구가 달라진다. 실제 이미지가 한 장이라도 있으면 "AI가 만든 가상 이미지"라고 알린다.
  const anyRemoteImage = useMemo(
    () =>
      filled.some((slot) =>
        slot.persona ? personaImageSource(client, slot.persona.image).kind === 'remote' : false,
      ),
    [client, filled],
  );

  return (
    <View
      onLayout={(event) => nav.onRootLayout(event.nativeEvent.layout.y)}
      style={[styles.container, { maxWidth: bodyMaxWidth }]}
    >
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.storeName}>
          {result.store.name}
        </Text>
        <Text style={styles.introLine}>
          리뷰 <Text style={styles.introStrong}>{result.metadata.validReviewCount}건</Text>에서 손님 유형{' '}
          <Text style={styles.introStrong}>{filled.length}개</Text>를 찾았어요.
        </Text>
        {/* AI가 만든 결과라는 사실은 결과를 읽기 전에 한 번 알린다(2026-10-05 팀 디자인 피드백 #12). */}
        <Notice
          title="AI가 리뷰를 읽고 정리한 결과예요"
          message="해석과 제안은 추론이라 사실과 다를 수 있어요. 실제 리뷰와 함께 봐 주세요."
        />
      </View>

      <View style={styles.section}>
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
            onSelect={nav.selectRank}
            podium={podium}
            selectedRank={selected?.rank ?? null}
          />
          <PersonaAvatarNotice anyRemote={anyRemoteImage} />
        </View>
      </View>

      {filled.length === 0 ? (
        <Notice
          title="채울 수 있는 손님 유형이 없었어요"
          message="리뷰에서 되풀이되는 이야기를 충분히 찾지 못했어요. 리뷰가 더 쌓인 뒤 다시 분석해 볼 수 있어요."
          tone="warning"
        />
      ) : null}

      {selected?.persona ? (
        <View onLayout={(event) => nav.onDetailLayout(event.nativeEvent.layout.y)}>
          <PersonaDetail
            analysisId={result.analysisId}
            client={client}
            key={selected.rank}
            onAdviceLayout={nav.onAdviceLayout}
            onOpenEvidence={onOpenEvidence}
            slot={selected}
            validReviewCount={result.metadata.validReviewCount}
          />
        </View>
      ) : null}

      <AnalysisInfoBlock result={result} />
    </View>
  );
}

// 무엇을 얼마나 분석했는지. 결과를 다 읽은 뒤 신뢰도를 판단하는 자리라 맨 아래에 둔다(2026-09-27 리뷰 #3).
function AnalysisInfoBlock({ result }: { result: AnalysisResult }) {
  const { fontScale } = useWindowDimensions();
  // 글자를 키우면 3열 안에서 날짜가 '2026.0 / 9.22'처럼 쪼개진다. 그때는 세로로 쌓는다.
  const stacked = fontScale >= 1.5;
  const platform = result.metadata.platform === 'NAVER' ? '네이버' : result.metadata.platform;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        이 결과는 이렇게 만들었어요
      </Text>
      <View style={styles.metaCard}>
        <Text style={styles.metaSource}>{platform} 공개 리뷰 기준</Text>
        <View style={stacked ? styles.metaColumn : styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>분석한 리뷰</Text>
            <Text style={styles.metaValue}>{result.metadata.validReviewCount}건</Text>
          </View>
          <View style={stacked ? styles.metaDividerStacked : styles.metaDivider} />
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>리뷰를 모은 날</Text>
            <Text style={styles.metaValue}>{formatDate(result.metadata.collectedAt)}</Text>
          </View>
          <View style={stacked ? styles.metaDividerStacked : styles.metaDivider} />
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>분석한 날</Text>
            <Text style={styles.metaValue}>{formatDate(result.metadata.analyzedAt)}</Text>
          </View>
        </View>
        <Text style={styles.metaLine}>
          모은 리뷰 {result.metadata.collectedReviewCount}건 가운데 겹치거나 내용이 없는 리뷰를 빼고{' '}
          {result.metadata.validReviewCount}건을 썼어요.
        </Text>
      </View>
      <LimitationsBlock result={result} />
    </View>
  );
}

// 선택한 유형의 요약 카드(2026-09-28 사용자 선택 F안). 큰 이미지 칸을 대신한다.
// 왼쪽 그림은 시상대와 같은 PersonaAvatar다. 생성 사실 고지는 시상대 아래 PersonaAvatarNotice가 한 번 한다.
// 비율은 앱이 계산한 값이다(topicReviewCount ÷ validReviewCount). 한 리뷰가 여러 유형에 함께 세어질 수 있어
// 세 유형의 비율을 더하면 100%를 넘을 수 있다 — 그래서 유형끼리 합치지 않고 유형마다 따로 보여 준다.
function PersonaStatsCard({
  source,
  altText,
  rank,
  topicReviewCount,
  validReviewCount,
}: {
  source: PersonaImageSource;
  altText: string;
  rank: number;
  topicReviewCount?: number;
  validReviewCount: number;
}) {
  const share =
    topicReviewCount !== undefined && validReviewCount > 0
      ? Math.round((topicReviewCount / validReviewCount) * 100)
      : null;
  // IMAGE-LOAD-ERROR(SCREEN_STATES §6.4) — 그림은 자리표시로 바꾸고 유형 정보는 그대로 둔 채 다시 불러오기를 준다.
  const image = usePersonaImageRetry(source);

  return (
    <View style={styles.statsCard}>
      <View
        accessible
        // 그림과 숫자를 한 번에 읽게 묶는다. 묶으면 PersonaAvatar의 라벨이 가려지므로 서버 대체 텍스트를 여기서 함께 읽힌다.
        accessibilityLabel={
          `${altText}. ${rank}위 손님` +
          (topicReviewCount !== undefined ? `, 리뷰 ${topicReviewCount}건` : '') +
          (share !== null ? `, 분석한 리뷰 ${validReviewCount}건 중 ${share}%` : '')
        }
        style={styles.statsHead}
      >
        <PersonaAvatar
          altText={altText}
          key={image.attempt}
          onLoadError={image.onLoadError}
          size="compact"
          source={source}
          variant={rank - 1}
        />
        <View style={styles.statsText}>
          {topicReviewCount !== undefined ? (
            <Text style={styles.statsCount}>리뷰 {topicReviewCount}건</Text>
          ) : null}
          {share !== null ? (
            <>
              <View style={styles.track}>
                {/* 100%를 넘는 값은 데이터가 이상하다는 뜻이다. 문장에는 그대로 보여 드러나게 하고, 막대만 카드 밖으로 나가지 않게 자른다. */}
                <View style={[styles.statsBar, { width: `${Math.min(100, share)}%` }]} />
              </View>
              <Text style={styles.statsShare}>
                분석한 리뷰 {validReviewCount}건 중 {share}%
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {image.showError ? <PersonaImageError canRetry={image.canRetry} onRetry={image.retry} /> : null}
    </View>
  );
}

// 넓은 화면(expanded)에서는 관점 카드를 두 장씩 한 줄로 놓는다(DESIGN_SYSTEM §7, TASK-028).
// 읽는 순서는 그대로다 — 줄 안에서 왼쪽→오른쪽, 줄은 위→아래라 4관점 순서가 바뀌지 않는다.
// 홀수면 마지막 줄 오른쪽을 빈칸으로 채워 카드 폭을 다른 줄과 같게 둔다.
function arrangePerspectiveCards(expanded: boolean, cards: (ReactElement | null)[]) {
  const present = cards.filter((card): card is ReactElement => card !== null);
  if (!expanded) return present;
  const rows: ReactElement[] = [];
  for (let index = 0; index < present.length; index += 2) {
    const pair = present.slice(index, index + 2);
    rows.push(
      <View key={`row-${pair[0].key}`} style={styles.cardRow}>
        {pair}
        {pair.length === 1 ? <View style={styles.cardInRow} /> : null}
      </View>,
    );
  }
  return rows;
}

function PersonaDetail({
  slot,
  client,
  analysisId,
  onOpenEvidence,
  onAdviceLayout,
  validReviewCount,
}: {
  slot: PodiumSlot;
  client: ApiClient;
  analysisId: string;
  onOpenEvidence?: OpenEvidence;
  onAdviceLayout: (y: number) => void;
  validReviewCount: number;
}) {
  const persona = slot.persona;
  const source = persona ? personaImageSource(client, persona.image) : null;
  const expanded = useExpandedLayout();

  if (!persona) return null;

  return (
    <View style={styles.detail}>
      <View style={styles.personaHead}>
        <Text style={styles.personaRank}>{slot.rank}위 손님</Text>
        <Text accessibilityRole="header" style={styles.personaTitle}>
          {persona.label}
        </Text>
        <Text style={styles.personaSummary}>{persona.summary}</Text>
        {persona.caveat ? <Text style={styles.personaCaveat}>{persona.caveat}</Text> : null}
      </View>

      {source ? (
        <PersonaStatsCard
          altText={persona.image.altText}
          rank={slot.rank}
          source={source}
          topicReviewCount={slot.topicReviewCount}
          validReviewCount={validReviewCount}
        />
      ) : null}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          이 손님이 남긴 이야기
        </Text>
        <Text style={styles.sectionNote}>
          굵은 문장은 AI가 리뷰를 읽고 해석한 내용이에요. 추론이라 사실과 다를 수 있어요.
        </Text>
        {arrangePerspectiveCards(
          expanded,
          perspectiveOrder.map((item) => {
            const block = persona.perspectives[item.key];
            if (!block) return null;
            return (
              <PerspectiveCard
                block={block}
                inRow={expanded}
                key={item.key}
                label={item.label}
                onOpenEvidence={
                  onOpenEvidence
                    ? () =>
                        onOpenEvidence({
                          analysisId,
                          personaId: persona.id,
                          personaLabel: persona.label,
                          perspective: item.key.toUpperCase(),
                        })
                    : undefined
                }
                perspective={item.key}
                topicReviewCount={slot.topicReviewCount}
                why={item.why}
              />
            );
          }),
        )}
      </View>

      <View onLayout={(event) => onAdviceLayout(event.nativeEvent.layout.y)} style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          검토해 볼 행동
        </Text>
        {persona.advice.length === 0 ? (
          // ADVICE-EMPTY — 근거 없는 제안을 지어내지 않았다는 사실을 적는다(SCREEN_STATES §6.5).
          <Notice
            title="검토해 볼 행동을 만들지 못했어요"
            message="리뷰에서 뒷받침되는 제안을 찾지 못해서 비워 뒀어요. 억지로 만든 제안은 넣지 않아요."
            tone="warning"
          />
        ) : (
          <>
            {persona.advice.map((advice, index) => (
              <AdviceCard advice={advice} key={advice.id} order={index + 1} />
            ))}
            <Text style={styles.adviceCaption}>
              제안은 리뷰를 바탕으로 한 참고 의견이에요. 결과를 보장하지 않아요.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// 관점 한 덩어리. 위에서부터 AI 해석(결론) → 리뷰에서 확인한 사실 → 실제 리뷰 순서다(DESIGN_SYSTEM §4.1).
// 해석 한 문장, 사실 한 줄, 대표 리뷰 한 건은 항상 보이고(PRD FR-002 대표 근거 기본 노출), 나머지는 더 보기에 둔다.
function PerspectiveCard({
  perspective,
  label,
  why,
  block,
  topicReviewCount,
  onOpenEvidence,
  inRow,
}: {
  perspective: PerspectiveKey;
  label: string;
  why: string;
  block: PerspectiveBlock;
  topicReviewCount?: number;
  onOpenEvidence?: () => void;
  inRow: boolean;
}) {
  const [open, setOpen] = useState(false);
  const tone = colors.perspective[perspective];
  const [lead, ...moreInterpretations] = block.aiInterpretations;
  const [firstFact, ...moreFacts] = block.reviewFacts;
  const [firstReview, ...moreReviews] = dedupeEvidence(block.evidencePreview);
  const hasMore = moreInterpretations.length + moreFacts.length + moreReviews.length > 0;
  // 이 관점에 연결된 리뷰가 이 손님 유형의 리뷰 가운데 얼마나 되는지. 앱이 계산한 값이다.
  // 연결된 리뷰 수가 유형 리뷰 수보다 크게 오면 비율로 말할 수 없으므로 건수만 적는다.
  const ratio =
    topicReviewCount && block.evidenceCount <= topicReviewCount
      ? block.evidenceCount / topicReviewCount
      : null;

  return (
    <View style={[styles.card, inRow && styles.cardInRow]}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: tone.tint }]}>
          <PerspectiveIcon color={tone.accent} perspective={perspective} />
        </View>
        <View style={styles.cardHeadText}>
          <Text style={[styles.cardTitle, { color: tone.text }]}>{label}</Text>
          <Text style={styles.cardWhy}>{why}</Text>
        </View>
      </View>

      {lead ? (
        <View style={styles.lead}>
          <View style={[styles.leadBar, { backgroundColor: tone.accent }]} />
          <View style={styles.leadBody}>
            <Text style={styles.tag}>AI 해석</Text>
            <Text style={styles.leadText}>{lead.text}</Text>
          </View>
        </View>
      ) : null}

      {block.evidenceCount > 0 ? (
        <View style={styles.ratio}>
          {ratio !== null ? (
            <View style={styles.track}>
              <View
                style={[styles.ratioBar, { backgroundColor: tone.accent, width: `${Math.round(ratio * 100)}%` }]}
              />
            </View>
          ) : null}
          <Text style={styles.ratioText}>
            {ratio !== null
              ? `이 손님 리뷰 ${topicReviewCount}건 중 ${block.evidenceCount}건에 나온 이야기예요.`
              : `리뷰 ${block.evidenceCount}건에 나온 이야기예요.`}
          </Text>
        </View>
      ) : null}

      {firstFact ? (
        <View style={styles.fact}>
          <Text style={styles.tag}>리뷰에서 확인</Text>
          <Text style={styles.factText}>{firstFact.text}</Text>
          {open ? moreFacts.map((fact) => <Text key={fact.id} style={styles.factText}>{fact.text}</Text>) : null}
        </View>
      ) : null}

      {firstReview ? (
        <View style={styles.evidence}>
          <Text style={styles.tag}>실제 리뷰</Text>
          {[firstReview, ...(open ? moreReviews : [])].map((review, index) => (
            <View key={`${review.reviewId}-${index}`} style={styles.quote}>
              <Text style={styles.quoteText}>“{review.excerpt}”</Text>
              <Text style={styles.quoteDate}>{formatDate(review.writtenAt)}</Text>
            </View>
          ))}
        </View>
      ) : (
        // INSIGHT-LIMITED — 없는 근거를 채워 넣지 않고 한계를 적는다(SCREEN_STATES §6.2).
        <Text style={styles.ratioText}>여기에는 보여드릴 대표 리뷰가 없어요.</Text>
      )}

      {open
        ? moreInterpretations.map((interpretation) => (
            <View key={interpretation.id} style={styles.fact}>
              <Text style={styles.tag}>AI 해석</Text>
              <Text style={styles.moreInterpretation}>{interpretation.text}</Text>
            </View>
          ))
        : null}

      {(hasMore || (onOpenEvidence && firstReview)) ? (
        <View style={styles.cardActions}>
          {onOpenEvidence && firstReview ? (
            <Pressable
              accessibilityRole="button"
              onPress={onOpenEvidence}
              style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
            >
              <Text style={styles.disclosureText}>실제 리뷰 {block.evidenceCount}건 모두 보기</Text>
            </Pressable>
          ) : null}
          {hasMore ? (
            <Pressable
              accessibilityLabel={open ? `${label} 접기` : `${label} 더 보기`}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpen((value) => !value)}
              style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
            >
              <Text style={styles.disclosureTextQuiet}>{open ? '접기' : '더 보기'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// 제안 한 덩어리. 남색 블록이 검토해 볼 행동, 바로 아래 흰 카드가 그 제안이 나온 리뷰 사실이다.
// 둘 다 기본으로 보이고 AI 해석·전문 지식은 펼쳐서 본다(PRD FR-005 인수 기준).
function AdviceCard({ advice, order }: { advice: Advice; order: number }) {
  const [open, setOpen] = useState(false);
  const { aiInterpretation, knowledgeReferences } = advice.details;
  return (
    <View style={styles.adviceGroup}>
      <View style={styles.adviceBlock}>
        <Text style={styles.adviceChip}>검토해 볼 행동 {order}</Text>
        <Text style={styles.adviceAction}>{advice.suggestedAction}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
        >
          <Text style={styles.adviceDisclosureText}>
            {open ? 'AI 해석·전문 지식 접기' : 'AI 해석·전문 지식 펼쳐보기'}
          </Text>
        </Pressable>
        {open ? (
          <>
            <View style={styles.adviceDetail}>
              <Text style={styles.adviceDetailBadge}>AI 해석</Text>
              <Text style={styles.adviceDetailText}>{aiInterpretation}</Text>
            </View>
            <View style={styles.adviceDetail}>
              <Text style={styles.adviceDetailBadge}>참고한 전문 지식</Text>
              {knowledgeReferences.length > 0 ? (
                knowledgeReferences.map((reference) => (
                  <Text key={reference.title + reference.locator} style={styles.adviceDetailText}>
                    {reference.title} · {reference.locator}
                  </Text>
                ))
              ) : (
                // ADVICE-NO-KNOWLEDGE — 없는 출처를 지어내지 않고 없다는 사실을 적는다(SCREEN_STATES §6.5).
                <Text style={styles.adviceDetailText}>이 제안에는 참고한 전문 지식이 없어요.</Text>
              )}
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.adviceFact}>
        <Text style={styles.tag}>리뷰에서 확인</Text>
        <Text style={styles.factText}>{advice.reviewFact}</Text>
      </View>
    </View>
  );
}

function LimitationsBlock({ result }: { result: AnalysisResult }) {
  return (
    <View style={styles.limitations}>
      <Notice
        title="이 결과를 읽을 때 알아 둘 것"
        message="리뷰를 남긴 손님이 전체 손님을 대표하지는 않아요. AI가 정리한 내용이니 참고 자료로 봐 주세요."
      />
      {result.metadata.containsReviewsOlderThanTwoYears ? (
        <Notice
          title="2년보다 오래된 리뷰가 섞여 있어요"
          message="지금의 가게 모습과 다를 수 있어요."
          tone="warning"
        />
      ) : null}
      {result.limitations.map((limitation, index) => (
        <Text key={limitation.code + index} style={styles.limitation}>
          {limitation.message}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[8],
    width: '100%',
    alignSelf: 'center',
  },
  intro: {
    gap: spacing[3],
  },
  storeName: {
    ...typography.head3,
    color: colors.text.strong,
  },
  introLine: {
    ...typography.body2,
    color: colors.text.primary,
  },
  introStrong: {
    fontFamily: fontFamilies.bold,
    color: colors.text.brand,
  },
  section: {
    gap: spacing[3],
  },
  detail: {
    gap: spacing[6],
  },
  sectionTitle: {
    ...typography.head5,
    color: colors.text.strong,
  },
  sectionNote: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  sectionHead: {
    flexDirection: 'row',
    // 글자를 키우면 옆 설명이 화면 밖으로 밀려난다. 자리가 모자라면 다음 줄로 내린다.
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    columnGap: spacing[3],
    rowGap: spacing[1],
    justifyContent: 'space-between',
  },
  sectionAside: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  podiumCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[3],
    padding: spacing[4],
  },
  // 유형 소개는 상자에 넣지 않는다. 제목 크기와 여백으로 새 덩어리가 시작됐다는 것을 알린다.
  personaHead: {
    gap: spacing[2],
  },
  personaRank: {
    ...typography.body5,
    color: colors.text.brand,
  },
  personaTitle: {
    ...typography.head3,
    color: colors.text.strong,
  },
  personaSummary: {
    ...typography.body2,
    color: colors.text.primary,
  },
  personaCaveat: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  statsCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[4],
    padding: spacing[4],
  },
  statsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  statsText: {
    flex: 1,
    gap: spacing[1],
  },
  statsCount: {
    ...typography.body1,
    color: colors.text.strong,
  },
  track: {
    height: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.background.emphasized,
    overflow: 'hidden',
  },
  statsBar: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.brand.primary,
  },
  statsShare: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing[3],
  },
  // 한 줄 안 두 카드의 폭을 같게 나눈다. 높이는 줄 안에서 긴 쪽에 맞춘다(cardRow의 stretch).
  cardInRow: {
    flex: 1,
    flexBasis: 0,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[4],
    padding: spacing[5],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: spacing[10],
    justifyContent: 'center',
    width: spacing[10],
  },
  cardHeadText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body1,
  },
  cardWhy: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  // 해석은 상자에 넣지 않고 큰 글자와 관점 색 강조선으로 세운다(2026-10-05 팀 디자인 피드백 #6).
  lead: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  leadBar: {
    borderRadius: radii.pill,
    width: spacing[1],
  },
  leadBody: {
    flex: 1,
    gap: spacing[1],
  },
  leadText: {
    ...typography.body2,
    fontFamily: fontFamilies.semibold,
    color: colors.text.strong,
  },
  moreInterpretation: {
    ...typography.body4,
    fontFamily: fontFamilies.semibold,
    color: colors.text.strong,
  },
  tag: {
    ...typography.caption,
    fontFamily: fontFamilies.semibold,
    color: colors.text.secondary,
  },
  ratio: {
    gap: spacing[1],
  },
  ratioBar: {
    height: '100%',
    borderRadius: radii.pill,
  },
  ratioText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  fact: {
    gap: spacing[1],
  },
  factText: {
    ...typography.body4,
    color: colors.text.primary,
  },
  evidence: {
    gap: spacing[2],
  },
  quote: {
    backgroundColor: colors.background.subtle,
    borderRadius: radii.control,
    gap: spacing[1],
    padding: spacing[3],
  },
  quoteText: {
    ...typography.body7,
    color: colors.text.primary,
  },
  quoteDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing[4],
    justifyContent: 'space-between',
  },
  disclosure: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
  },
  disclosureText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  disclosureTextQuiet: {
    ...typography.body6,
    color: colors.text.secondary,
  },
  adviceGroup: {
    gap: spacing[2],
  },
  adviceBlock: {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.panel,
    gap: spacing[3],
    padding: spacing[5],
  },
  adviceChip: {
    ...typography.caption,
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.onPrimary,
    borderRadius: radii.pill,
    color: colors.text.brand,
    overflow: 'hidden',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  adviceAction: {
    ...typography.body2,
    fontFamily: fontFamilies.semibold,
    color: colors.brand.onPrimary,
  },
  adviceDisclosureText: {
    ...typography.body6,
    color: colors.brand.onPrimary,
  },
  adviceDetail: {
    gap: spacing[1],
  },
  adviceDetailBadge: {
    ...typography.body5,
    color: colors.brand.onPrimary,
  },
  adviceDetailText: {
    ...typography.body7,
    color: colors.brand.onPrimary,
  },
  adviceFact: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[1],
    padding: spacing[4],
  },
  adviceCaption: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metaCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[2],
    padding: spacing[5],
  },
  metaLine: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  metaSource: {
    ...typography.body6,
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing[3],
  },
  metaCell: {
    flex: 1,
    gap: spacing[1],
  },
  metaColumn: {
    gap: spacing[3],
  },
  metaDivider: {
    width: strokes.hairline,
    backgroundColor: colors.border.default,
  },
  metaDividerStacked: {
    height: strokes.hairline,
    backgroundColor: colors.border.default,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metaValue: {
    ...typography.body5,
    color: colors.text.strong,
  },
  limitations: {
    gap: spacing[3],
  },
  limitation: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  jumpBar: {
    backgroundColor: colors.background.surface,
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
  },
  jumpItems: {
    alignItems: 'center',
    flexGrow: 1,
    gap: spacing[2],
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
  },
  jumpChip: {
    alignItems: 'center',
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
    minWidth: layout.touchTargetMin,
    paddingHorizontal: spacing[4],
  },
  jumpChipSelected: {
    backgroundColor: colors.brand.primary,
  },
  jumpChipPlain: {
    backgroundColor: colors.background.surface,
  },
  jumpChipText: {
    ...typography.body6,
    color: colors.text.primary,
  },
  // 선택은 색과 함께 글자 굵기로도 알린다. 읽기 이름에는 '지금 보는 중'이 붙는다.
  jumpChipTextSelected: {
    fontFamily: fontFamilies.bold,
    color: colors.brand.onPrimary,
  },
  jumpChipTextPlain: {
    ...typography.body6,
    color: colors.text.brand,
  },
  pressed: {
    opacity: 0.9,
  },
});
