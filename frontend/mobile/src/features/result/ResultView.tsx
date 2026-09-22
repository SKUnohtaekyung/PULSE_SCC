import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ApiClient } from '@/api/client';
import { isFixtureMode } from '@/api/config';
import { personaImageSource } from '@/api/personaImages';
import type { AnalysisResult, PerspectiveKey, PodiumSlot } from '@/api/types';
import { Notice } from '@/components/ui/Notice';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 결과 표시. 읽는 순서는 DESIGN_SYSTEM §4.1을 따른다.
// 1) 무엇을 얼마나 분석했는가 → 2) 3칸 포디움 → 3) 선택한 유형의 4관점 → 4) 대표 근거 → 5) AI 해석 → 6) 검토할 행동
// 상태 판정은 SCREEN_STATES §6.1: FILLED 개수 3 / 1~2 / 0 = RESULT-NORMAL / PARTIAL / NO-PERSONA.

/** 페르소나 이미지 영역 높이. 로딩·실패·자리표시도 같은 높이를 쓴다. */
const imageHeight = spacing[24] * 2 + spacing[2];

const perspectiveOrder: { key: PerspectiveKey; label: string; why: string }[] = [
  { key: 'priority', label: '먼저 볼 것', why: '반복된 리뷰가 가장 많아 먼저 확인할 항목이에요.' },
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

export function ResultView({ result, client }: { result: AnalysisResult; client: ApiClient }) {
  const filled = useMemo(
    () => result.podium.filter((slot) => slot.status === 'FILLED' && slot.persona),
    [result.podium],
  );
  const [selectedRank, setSelectedRank] = useState<number | null>(filled[0]?.rank ?? null);
  const selected = filled.find((slot) => slot.rank === selectedRank) ?? filled[0] ?? null;

  return (
    <View style={styles.container}>
      <MetadataBlock result={result} />

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          가장 많이 반복된 손님 유형
        </Text>
        <Text style={styles.sectionHint}>
          분석에 사용한 리뷰 {result.metadata.validReviewCount}건 안에서 관찰된 순서예요.
        </Text>
        <View style={styles.podium}>
          {result.podium.map((slot) => (
            <PodiumCard
              key={slot.rank}
              onSelect={() => setSelectedRank(slot.rank)}
              selected={selected?.rank === slot.rank}
              slot={slot}
            />
          ))}
        </View>
      </View>

      {filled.length === 0 ? (
        <Notice
          title="채울 수 있는 손님 유형이 없었어요"
          message="근거를 충족한 반복 패턴을 찾지 못했어요. 리뷰가 더 쌓인 뒤 다시 분석해 볼 수 있어요."
          tone="warning"
        />
      ) : null}

      {selected?.persona ? (
        <PersonaDetail client={client} key={selected.rank} slot={selected} />
      ) : null}

      <LimitationsBlock result={result} />
    </View>
  );
}

function MetadataBlock({ result }: { result: AnalysisResult }) {
  const platform = result.metadata.platform === 'NAVER' ? '네이버' : result.metadata.platform;
  return (
    <View style={styles.metaCard}>
      <Text accessibilityRole="header" style={styles.storeName}>
        {result.store.name}
      </Text>
      <Text style={styles.metaLine}>
        {platform} 리뷰 {result.metadata.collectedReviewCount}건을 모아 그중 {result.metadata.validReviewCount}건을
        분석했어요.
      </Text>
      <Text style={styles.metaLine}>
        수집 {formatDate(result.metadata.collectedAt)} · 분석 {formatDate(result.metadata.analyzedAt)}
      </Text>
    </View>
  );
}

function PodiumCard({
  slot,
  selected,
  onSelect,
}: {
  slot: PodiumSlot;
  selected: boolean;
  onSelect: () => void;
}) {
  if (slot.status === 'EMPTY' || !slot.persona) {
    return (
      <View style={[styles.podiumCard, styles.podiumEmpty]}>
        <Text style={styles.rank}>{slot.rank}위</Text>
        <Text style={styles.podiumEmptyText}>{slot.reason?.message ?? '채우지 못한 자리예요.'}</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={`${slot.rank}위 ${slot.persona.label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.podiumCard,
        selected && styles.podiumSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.rank}>{slot.rank}위</Text>
      <Text style={styles.podiumLabel}>{slot.persona.label}</Text>
      {typeof slot.topicReviewCount === 'number' ? (
        <Text style={styles.podiumCount}>리뷰 {slot.topicReviewCount}건</Text>
      ) : null}
    </Pressable>
  );
}

function PersonaDetail({ slot, client }: { slot: PodiumSlot; client: ApiClient }) {
  const persona = slot.persona;
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const source = persona ? personaImageSource(client, persona.image) : null;

  if (!persona) return null;

  const retryImage = () => {
    setImageFailed(false);
    setImageLoading(true);
    setRetryCount((count) => count + 1);
  };

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {persona.label}
      </Text>
      <Text style={styles.personaSummary}>{persona.summary}</Text>
      {persona.caveat ? <Text style={styles.personaCaveat}>{persona.caveat}</Text> : null}

      <View style={styles.imageBlock}>
        {source?.kind === 'remote' && !imageFailed ? (
          <View>
            <Image
              accessibilityLabel={persona.image.altText}
              key={retryCount}
              onError={() => {
                setImageLoading(false);
                setImageFailed(true);
              }}
              onLoadEnd={() => setImageLoading(false)}
              source={source.source}
              style={styles.image}
            />
            {imageLoading ? (
              // IMAGE-LOADING — 같은 크기 영역에 문장을 둬 레이아웃이 흔들리지 않게 한다(DESIGN_SYSTEM §3.6).
              <View style={[styles.imageFallback, styles.imageOverlay]}>
                <Text style={styles.imageFallbackBody}>손님 유형 이미지를 불러오고 있어요.</Text>
              </View>
            ) : null}
          </View>
        ) : source?.kind === 'fixture' ? (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackTitle}>지금은 예시 화면이라 이미지가 없어요</Text>
            <Text style={styles.imageFallbackBody}>
              실제 서버에 연결하면 여기에 손님 유형 이미지가 나와요. 설명: {persona.image.altText}
            </Text>
          </View>
        ) : (
          // IMAGE-LOAD-ERROR — 유형 정보는 그대로 두고 이미지만 다시 불러온다(SCREEN_STATES §6.4).
          <View accessibilityLiveRegion="polite" style={styles.imageFallback}>
            <Text style={styles.imageFallbackTitle}>이미지를 불러오지 못했어요</Text>
            <Text style={styles.imageFallbackBody}>
              손님 유형 내용은 그대로 볼 수 있어요. 설명: {persona.image.altText}
            </Text>
            {isFixtureMode ? (
              // 가상 서버에는 다시 불러올 이미지가 없다. 눌러도 아무 일이 없는 버튼을 두지 않는다.
              <Text style={styles.imageFallbackBody}>예시 화면이라 다시 불러올 수 없어요.</Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={retryImage}
                style={({ pressed }) => [styles.imageRetry, pressed && styles.pressed]}
              >
                <Text style={styles.imageRetryText}>이미지 다시 불러오기</Text>
              </Pressable>
            )}
          </View>
        )}
        <Text style={styles.imageNotice}>
          {source?.kind === 'remote' && !imageFailed
            ? '이 이미지는 리뷰 패턴을 설명하려고 AI가 만든 그림이에요. 실제 손님 사진이 아니에요.'
            : '손님 유형 이미지는 리뷰 패턴을 설명하려고 AI가 만드는 그림이에요. 실제 손님 사진이 아니에요.'}
        </Text>
      </View>

      {perspectiveOrder.map((item) => {
        const block = persona.perspectives[item.key];
        if (!block) return null;
        return (
          <View key={item.key} style={styles.card}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardWhy}>{item.why}</Text>

            {block.reviewFacts.map((fact) => (
              <View key={fact.id} style={styles.layer}>
                <Text style={styles.layerBadge}>리뷰에서 확인</Text>
                <Text style={styles.layerText}>{fact.text}</Text>
              </View>
            ))}

            {block.evidencePreview.length > 0 ? (
              <View style={styles.evidence}>
                {block.evidencePreview.map((review) => (
                  <View key={review.reviewId} style={styles.quote}>
                    <Text style={styles.quoteText}>“{review.excerpt}”</Text>
                    <Text style={styles.quoteDate}>{formatDate(review.writtenAt)}</Text>
                  </View>
                ))}
                <Text style={styles.evidenceCount}>
                  이 관점에 연결된 근거 리뷰 {block.evidenceCount}건 가운데 대표 {block.evidencePreview.length}건이에요.
                </Text>
              </View>
            ) : (
              // INSIGHT-LIMITED — 없는 근거를 채워 넣지 않고 한계를 적는다(SCREEN_STATES §6.2).
              <Text style={styles.evidenceCount}>
                이 관점에는 보여드릴 대표 리뷰가 없어요.
              </Text>
            )}

            {block.aiInterpretations.map((interpretation) => (
              <View key={interpretation.id} style={[styles.layer, styles.layerAi]}>
                <Text style={styles.layerBadge}>AI 해석</Text>
                <Text style={styles.layerText}>{interpretation.text}</Text>
                <Text style={styles.layerNote}>리뷰를 바탕으로 한 추론이라 사실과 다를 수 있어요.</Text>
              </View>
            ))}
          </View>
        );
      })}

      {persona.advice.length > 0 ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            검토해 볼 행동
          </Text>
          {persona.advice.map((advice) => (
            <AdviceCard
              key={advice.id}
              aiInterpretation={advice.details.aiInterpretation}
              knowledgeReferences={advice.details.knowledgeReferences}
              reviewFact={advice.reviewFact}
              suggestedAction={advice.suggestedAction}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AdviceCard({
  reviewFact,
  suggestedAction,
  aiInterpretation,
  knowledgeReferences,
}: {
  reviewFact: string;
  suggestedAction: string;
  aiInterpretation: string;
  knowledgeReferences: { title: string; locator: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.card}>
      <View style={styles.layer}>
        <Text style={styles.layerBadge}>리뷰에서 확인</Text>
        <Text style={styles.layerText}>{reviewFact}</Text>
      </View>
      <Text style={styles.adviceAction}>{suggestedAction}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
      >
        <Text style={styles.disclosureText}>{open ? 'AI 해석 접기' : 'AI 해석 보기'}</Text>
      </Pressable>
      {open ? (
        <>
          <View style={[styles.layer, styles.layerAi]}>
            <Text style={styles.layerBadge}>AI 해석</Text>
            <Text style={styles.layerText}>{aiInterpretation}</Text>
          </View>
          <View style={styles.layer}>
            <Text style={styles.layerBadge}>참고한 전문 지식</Text>
            {knowledgeReferences.length > 0 ? (
              knowledgeReferences.map((reference) => (
                <Text key={reference.title + reference.locator} style={styles.layerText}>
                  {reference.title} · {reference.locator}
                </Text>
              ))
            ) : (
              // ADVICE-NO-KNOWLEDGE — 없는 출처를 지어내지 않고 없다는 사실을 적는다(SCREEN_STATES §6.5).
              <Text style={styles.layerText}>이 제안에는 참고한 전문 지식이 없어요.</Text>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

function LimitationsBlock({ result }: { result: AnalysisResult }) {
  return (
    <View style={styles.section}>
      <Notice
        title="이 결과를 읽을 때 알아 둘 것"
        message="리뷰를 남긴 손님이 전체 손님을 대표하지는 않아요. 참고 자료로 봐 주세요."
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
    gap: spacing[6],
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    ...typography.head5,
    color: colors.text.strong,
  },
  sectionHint: {
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
  storeName: {
    ...typography.head4,
    color: colors.text.strong,
  },
  metaLine: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  podium: {
    gap: spacing[3],
  },
  podiumCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[1],
    minHeight: layout.touchTargetMin,
    padding: spacing[4],
  },
  podiumSelected: {
    borderColor: colors.brand.primary,
    borderWidth: strokes.focus,
  },
  podiumEmpty: {
    borderColor: colors.border.strong,
    borderStyle: 'dashed',
    backgroundColor: colors.background.subtle,
  },
  podiumEmptyText: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  rank: {
    ...typography.caption,
    color: colors.text.brand,
  },
  podiumLabel: {
    ...typography.body1,
    color: colors.text.primary,
  },
  podiumCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  personaSummary: {
    ...typography.body4,
    color: colors.text.primary,
  },
  personaCaveat: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  imageBlock: {
    gap: spacing[2],
  },
  image: {
    width: '100%',
    height: imageHeight,
    borderRadius: radii.panel,
    resizeMode: 'cover',
  },
  // 로딩·조회 실패·자리표시는 이미지와 같은 높이에서 시작한다(DESIGN_SYSTEM §3.6).
  // 고정 높이가 아니라 최소 높이다. 글자 크기를 키우면 상자가 늘어나 내용이 잘리지 않는다(§8.1).
  imageFallback: {
    alignItems: 'center',
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.panel,
    gap: spacing[2],
    justifyContent: 'center',
    minHeight: imageHeight,
    padding: spacing[5],
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
  },
  imageRetry: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
    paddingHorizontal: spacing[4],
  },
  imageRetryText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  imageFallbackTitle: {
    ...typography.body6,
    color: colors.text.primary,
  },
  imageFallbackBody: {
    ...typography.body7,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  imageNotice: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[3],
    padding: spacing[5],
  },
  cardTitle: {
    ...typography.body1,
    color: colors.text.primary,
  },
  cardWhy: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  layer: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[1],
    padding: spacing[4],
  },
  layerAi: {
    borderColor: colors.border.brand,
  },
  layerBadge: {
    ...typography.body5,
    color: colors.text.brand,
  },
  layerText: {
    ...typography.body7,
    color: colors.text.primary,
  },
  layerNote: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  evidence: {
    gap: spacing[2],
  },
  quote: {
    borderLeftColor: colors.border.brand,
    borderLeftWidth: strokes.focus,
    gap: spacing[1],
    paddingLeft: spacing[3],
  },
  quoteText: {
    ...typography.body7,
    color: colors.text.primary,
  },
  quoteDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  evidenceCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  adviceAction: {
    ...typography.body2,
    color: colors.text.primary,
  },
  disclosure: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
  },
  disclosureText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  pressed: {
    opacity: 0.9,
  },
  limitation: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
