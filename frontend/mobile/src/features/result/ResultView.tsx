import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ApiClient } from '@/api/client';
import { personaImageSource } from '@/api/personaImages';
import type { AnalysisResult, PerspectiveKey, PodiumSlot } from '@/api/types';
import { Notice } from '@/components/ui/Notice';
import { PersonaAvatarNotice } from '@/components/ui/PersonaAvatar';
import { PersonaImageBlock } from '@/components/ui/PersonaImageBlock';
import { PodiumTop3 } from '@/components/ui/PodiumTop3';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 결과 표시. 읽는 순서는 DESIGN_SYSTEM §4.1을 따른다.
// 1) 손님 TOP3 → 2) 선택한 유형의 4관점 → 3) 대표 근거 → 4) AI 해석 → 5) 검토할 행동 → 6) 무엇을 얼마나 분석했는가
// 분석 수치를 맨 아래로 내린 것은 2026-09-27 디자인 리뷰 #3이다. 먼저 보여 줄 것은 손님 유형이고,
// 리뷰 수와 수집 시점은 결과를 다 읽은 뒤 신뢰도를 판단할 때 필요하다.
// 상태 판정은 SCREEN_STATES §6.1: FILLED 개수 3 / 1~2 / 0 = RESULT-NORMAL / PARTIAL / NO-PERSONA.

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

export type OpenEvidence = (args: {
  analysisId: string;
  personaId: string;
  personaLabel: string;
  perspective: string;
}) => void;

export function ResultView({
  result,
  client,
  onOpenEvidence,
}: {
  result: AnalysisResult;
  client: ApiClient;
  onOpenEvidence?: OpenEvidence;
}) {
  // 응답이 rank 순이라는 보장이 계약에 없다. 최초 선택은 가장 낮은 rank다(SCREEN_STATES §6.1).
  const podium = useMemo(
    () => [...result.podium].sort((left, right) => left.rank - right.rank),
    [result.podium],
  );
  const filled = useMemo(
    () => podium.filter((slot) => slot.status === 'FILLED' && slot.persona),
    [podium],
  );
  const [selectedRank, setSelectedRank] = useState<number | null>(filled[0]?.rank ?? null);
  const selected = filled.find((slot) => slot.rank === selectedRank) ?? filled[0] ?? null;
  // 고지 문구가 달라진다. 실제 이미지가 한 장이라도 있으면 "AI가 만든 가상 이미지"라고 알린다.
  const anyRemoteImage = useMemo(
    () =>
      filled.some((slot) =>
          slot.persona ? personaImageSource(client, slot.persona.image).kind === 'remote' : false,
      ),
    [client, filled],
  );

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.storeName}>
        {result.store.name}
      </Text>

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
            onSelect={setSelectedRank}
            podium={podium}
            selectedRank={selected?.rank ?? null}
          />
          <PersonaAvatarNotice anyRemote={anyRemoteImage} />
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
        <PersonaDetail
          analysisId={result.analysisId}
          client={client}
          key={selected.rank}
          onOpenEvidence={onOpenEvidence}
          slot={selected}
        />
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
            <Text style={styles.metaLabel}>수집</Text>
            <Text style={styles.metaValue}>{formatDate(result.metadata.collectedAt)}</Text>
          </View>
          <View style={stacked ? styles.metaDividerStacked : styles.metaDivider} />
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>분석 완료</Text>
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

function PersonaDetail({
  slot,
  client,
  analysisId,
  onOpenEvidence,
}: {
  slot: PodiumSlot;
  client: ApiClient;
  analysisId: string;
  onOpenEvidence?: OpenEvidence;
}) {
  const persona = slot.persona;
  const source = persona ? personaImageSource(client, persona.image) : null;

  if (!persona) return null;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {persona.label}
      </Text>
      <Text style={styles.personaSummary}>{persona.summary}</Text>
      {persona.caveat ? <Text style={styles.personaCaveat}>{persona.caveat}</Text> : null}

      {source ? <PersonaImageBlock altText={persona.image.altText} source={source} /> : null}

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
                {onOpenEvidence ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      onOpenEvidence({
                        analysisId,
                        personaId: persona.id,
                        personaLabel: persona.label,
                        perspective: item.key.toUpperCase(),
                      })
                    }
                    style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
                  >
                    <Text style={styles.disclosureText}>근거 리뷰 전체 보기</Text>
                  </Pressable>
                ) : null}
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

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          검토해 볼 행동
        </Text>
        {persona.advice.length === 0 ? (
          // ADVICE-EMPTY — 근거 없는 제안을 지어내지 않았다는 사실을 적는다(SCREEN_STATES §6.5).
          <Notice
            title="검토해 볼 행동을 만들지 못했어요"
            message="근거가 충분한 제안을 찾지 못해서 비워 뒀어요. 억지로 만든 제안은 넣지 않아요."
            tone="warning"
          />
        ) : (
          persona.advice.map((advice) => (
            <AdviceCard
              key={advice.id}
              aiInterpretation={advice.details.aiInterpretation}
              knowledgeReferences={advice.details.knowledgeReferences}
              reviewFact={advice.reviewFact}
              suggestedAction={advice.suggestedAction}
            />
          ))
        )}
      </View>
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
    // 사실 → 제안 순서를 눈으로도 따라갈 수 있게 나눈다. 흰 카드는 리뷰에서 확인한 것,
    // 남색 블록은 그 위에서 끌어낸 제안이다(2026-09-26 발표 시안, DESIGN_SYSTEM §4.1).
    <View style={styles.adviceGroup}>
      <View style={styles.card}>
        <Text style={styles.factChip}>리뷰에서 확인</Text>
        <Text style={styles.layerText}>{reviewFact}</Text>
      </View>

      <Text aria-hidden style={styles.adviceArrow}>
        ↓
      </Text>

      <View style={styles.adviceBlock}>
        <Text style={styles.adviceChip}>검토해 볼 행동</Text>
        <Text style={styles.adviceAction}>{suggestedAction}</Text>
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

      <Text style={styles.adviceCaption}>
        제안은 리뷰를 바탕으로 한 참고 의견이에요. 결과를 보장하지 않아요.
      </Text>
    </View>
  );
}

function LimitationsBlock({ result }: { result: AnalysisResult }) {
  return (
    <View style={styles.limitations}>
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
  podiumCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[3],
    padding: spacing[4],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  sectionAside: {
    ...typography.caption,
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
  personaSummary: {
    ...typography.body4,
    color: colors.text.primary,
  },
  personaCaveat: {
    ...typography.body7,
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
    backgroundColor: 'transparent',
    borderColor: colors.border.strong,
    borderStyle: 'dashed',
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
  adviceGroup: {
    gap: spacing[2],
  },
  adviceArrow: {
    ...typography.body6,
    color: colors.text.secondary,
    textAlign: 'center',
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
  adviceCaption: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  factChip: {
    ...typography.caption,
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.tint,
    borderRadius: radii.pill,
    color: colors.text.brand,
    overflow: 'hidden',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
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
