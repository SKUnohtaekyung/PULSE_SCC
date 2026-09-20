import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radii, shadows, spacing, strokes, typography } from '@/design/tokens';

type PerspectiveTone = 'priority' | 'positive' | 'negative' | 'perception';

type Perspective = {
  label: string;
  summary: string;
  detail: string;
  evidenceCount: number;
  tone: PerspectiveTone;
};

type ReviewEvidence = {
  quote: string;
  date: string;
};

type Persona = {
  id: string;
  rank: number;
  name: string;
  shortSignal: string;
  summary: string;
  image: ImageSourcePropType;
  imageAlt: string;
  perspectives: Perspective[];
  reviews: ReviewEvidence[];
  adviceFact: string;
  adviceTitle: string;
  adviceBody: string;
  aiInterpretation: string;
  referenceKnowledge: string;
  referenceSourceSlot: string;
};

const personaImages = {
  revisit: require('../../../assets/images/personas/prototype/revisit-memory.png') as ImageSourcePropType,
  spice: require('../../../assets/images/personas/prototype/spice-control.png') as ImageSourcePropType,
  solo: require('../../../assets/images/personas/prototype/solo-comfort.png') as ImageSourcePropType,
};

const personas: Persona[] = [
  {
    id: 'revisit',
    rank: 1,
    name: '추억 재방문형',
    shortSignal: '변함없는 맛을 다시 찾는 방문',
    summary:
      '예전부터 방문해 온 손님이 익숙한 맛과 정겨운 분위기를 이유로 다시 찾는 패턴이에요.',
    image: personaImages.revisit,
    imageAlt: '추억 재방문형을 나타내는 따뜻한 음식 그릇과 재방문 모티프',
    perspectives: [
      {
        label: '우선순위',
        summary: '혼잡 시간 안내부터 확인',
        detail: '주말과 점심의 대기 언급이 반복되어 먼저 볼 항목이에요.',
        evidenceCount: 12,
        tone: 'priority',
      },
      {
        label: '긍정 신호',
        summary: '변함없는 쌈밥 맛',
        detail: '맛이 여전하고 반찬이 정갈하다는 표현이 반복돼요.',
        evidenceCount: 18,
        tone: 'positive',
      },
      {
        label: '부정 신호',
        summary: '혼잡한 시간의 긴 대기',
        detail: '주말과 점심에는 대기가 길어 불편했다는 의견이 있어요.',
        evidenceCount: 11,
        tone: 'negative',
      },
      {
        label: '인식',
        summary: '오래된 믿을 수 있는 식당',
        detail: '오래 운영한 곳, 변함없는 맛, 정겨운 분위기로 인식해요.',
        evidenceCount: 9,
        tone: 'perception',
      },
    ],
    reviews: [
      {
        quote: '몇 년 만에 다시 왔는데 여전히 맛있네요. 이 맛 그대로여서 반가웠어요.',
        date: '2026.08.12',
      },
      {
        quote: '예전에도 자주 왔는데 지금도 변함없이 맛있어요. 주말에는 대기가 조금 길어요.',
        date: '2026.07.03',
      },
    ],
    adviceFact: '주말 등 혼잡 시간대에 대기가 길다는 언급이 반복돼요.',
    adviceTitle: '혼잡 시간과 예상 대기 안내를 먼저 정리해 보세요',
    adviceBody: '반복된 리뷰 사실을 바탕으로 방문 전에 예상 대기 정보를 확인할 수 있게 안내해 보세요.',
    aiInterpretation:
      '변함없는 맛과 정겨운 분위기가 재방문의 핵심으로 보입니다. 다만 혼잡 시간의 대기가 이 경험을 방해할 수 있어요.',
    referenceKnowledge:
      '대기 안내는 실제 운영 가능 시간과 일치해야 하며, 확정되지 않은 대기 시간을 보장형 문구로 표시하지 않습니다.',
    referenceSourceSlot: '대기 안내 운영 기준',
  },
  {
    id: 'spice',
    rank: 2,
    name: '매운맛 조절형',
    shortSignal: '취향에 맞는 맵기를 찾는 방문',
    summary: '맛있는 매운맛을 선호하지만 단계나 조절 가능 여부를 미리 알고 싶어 하는 패턴이에요.',
    image: personaImages.spice,
    imageAlt: '매운맛 조절형을 나타내는 찌개와 맵기 단계 모티프',
    perspectives: [
      {
        label: '우선순위',
        summary: '맵기 단계 안내 확인',
        detail: '맵기 체감과 조절 가능 여부를 묻는 표현이 반복돼요.',
        evidenceCount: 10,
        tone: 'priority',
      },
      {
        label: '긍정 신호',
        summary: '개운한 매운맛',
        detail: '자극적이기보다 개운하고 계속 당긴다는 표현이 있어요.',
        evidenceCount: 15,
        tone: 'positive',
      },
      {
        label: '부정 신호',
        summary: '날마다 다른 맵기 체감',
        detail: '같은 메뉴도 방문 시점에 따라 더 맵게 느껴졌다는 의견이 있어요.',
        evidenceCount: 8,
        tone: 'negative',
      },
      {
        label: '인식',
        summary: '맵기를 골라 즐기는 식당',
        detail: '함께 온 사람의 취향에 맞춰 선택하기 좋은 곳으로 인식해요.',
        evidenceCount: 7,
        tone: 'perception',
      },
    ],
    reviews: [
      {
        quote: '칼칼한데 너무 자극적이지 않아서 좋았어요. 맵기 선택 안내가 있으면 더 편할 것 같아요.',
        date: '2026.08.08',
      },
      {
        quote: '같이 간 사람은 조금 맵다고 했지만 저는 개운하게 먹었어요.',
        date: '2026.07.21',
      },
    ],
    adviceFact: '맵기 체감과 조절 가능 여부를 묻는 리뷰가 반복돼요.',
    adviceTitle: '주문 전에 맵기 기준을 확인할 수 있게 해보세요',
    adviceBody: '메뉴판이나 주문 안내에서 기본 맵기와 조절 가능 범위를 실제 운영 기준에 맞춰 알려보세요.',
    aiInterpretation:
      '매운맛 자체는 강점이지만 손님마다 체감 차이가 큽니다. 선택 기준을 먼저 보여주면 주문 판단을 도울 수 있어요.',
    referenceKnowledge:
      '맵기 단계는 주관적이므로 숫자만 제시하기보다 재료나 조리 기준처럼 매장에서 유지할 수 있는 설명을 함께 둡니다.',
    referenceSourceSlot: '매운맛 안내 기준',
  },
  {
    id: 'solo',
    rank: 3,
    name: '혼밥 안심형',
    shortSignal: '혼자서도 편안한 한 끼를 찾는 방문',
    summary: '혼자 방문해도 부담 없는 상차림과 빠른 식사를 중요하게 보는 패턴이에요.',
    image: personaImages.solo,
    imageAlt: '혼밥 안심형을 나타내는 한 사람용 밥과 반찬 상차림',
    perspectives: [
      {
        label: '우선순위',
        summary: '1인 주문 안내 확인',
        detail: '혼자 주문할 수 있는 구성과 시간대 문의가 반복돼요.',
        evidenceCount: 8,
        tone: 'priority',
      },
      {
        label: '긍정 신호',
        summary: '혼자 먹기 편한 구성',
        detail: '반찬과 한 끼 구성이 알차고 부담 없다는 표현이 있어요.',
        evidenceCount: 13,
        tone: 'positive',
      },
      {
        label: '부정 신호',
        summary: '붐비는 시간의 좌석 부담',
        detail: '혼잡할 때 혼자 자리를 차지하기 조심스럽다는 의견이 있어요.',
        evidenceCount: 6,
        tone: 'negative',
      },
      {
        label: '인식',
        summary: '든든하게 혼자 먹는 식당',
        detail: '빠르고 정갈한 한 끼가 가능한 곳으로 인식해요.',
        evidenceCount: 6,
        tone: 'perception',
      },
    ],
    reviews: [
      {
        quote: '혼자 왔는데도 눈치 보지 않고 편하게 먹었어요. 반찬 구성이 알찼어요.',
        date: '2026.08.02',
      },
      {
        quote: '점심에 혼자 든든하게 먹기 좋아요. 붐빌 때 가능한 자리 안내가 있으면 좋겠어요.',
        date: '2026.07.18',
      },
    ],
    adviceFact: '1인 주문 가능 여부와 혼잡 시간 좌석을 묻는 표현이 반복돼요.',
    adviceTitle: '1인 주문 가능 시간과 구성을 먼저 안내해 보세요',
    adviceBody: '실제 운영 기준에 맞춰 혼자 방문하기 편한 시간과 주문 가능한 구성을 짧게 안내해 보세요.',
    aiInterpretation:
      '혼자서도 정갈한 한 끼를 먹을 수 있다는 점이 강점입니다. 주문 가능 조건이 불명확하면 방문을 망설일 수 있어요.',
    referenceKnowledge:
      '1인 이용 안내는 좌석을 보장하지 않고, 실제 주문 가능 인원과 시간대가 바뀌면 즉시 수정할 수 있어야 합니다.',
    referenceSourceSlot: '1인 이용 안내 기준',
  },
];

const toneColor: Record<PerspectiveTone, string> = {
  priority: colors.brand.primary,
  positive: colors.status.success,
  negative: colors.status.error,
  perception: colors.brand.primary,
};

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

function RankCard({
  persona,
  selected,
  onPress,
}: {
  persona: Persona;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityHint="선택하면 아래 분석 내용이 이 손님 유형으로 바뀝니다."
      accessibilityLabel={`${persona.rank}위 ${persona.name}, ${persona.shortSignal}`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.rankCard,
        selected && styles.rankCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.rankBadge, selected && styles.rankBadgeSelected]}>
        <Text style={[styles.rankBadgeText, selected && styles.rankBadgeTextSelected]}>{persona.rank}위</Text>
      </View>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={persona.imageAlt}
        resizeMode="contain"
        source={persona.image}
        style={styles.rankImage}
      />
      <Text style={styles.rankName}>{persona.name}</Text>
      <Text style={styles.rankSignal}>{persona.shortSignal}</Text>
    </Pressable>
  );
}

function PerspectiveCard({ perspective }: { perspective: Perspective }) {
  return (
    <View style={styles.perspectiveCard}>
      <View style={[styles.perspectiveBar, { backgroundColor: toneColor[perspective.tone] }]} />
      <View style={styles.perspectiveCopy}>
        <Text style={styles.perspectiveLabel}>{perspective.label}</Text>
        <Text style={styles.perspectiveSummary}>{perspective.summary}</Text>
        <Text style={styles.perspectiveDetail}>{perspective.detail}</Text>
        <Pressable
          accessibilityLabel={`${perspective.label} 근거 리뷰 ${perspective.evidenceCount}건 보기`}
          accessibilityRole="button"
          hitSlop={spacing[2]}
          onPress={() =>
            Alert.alert('프로토타입 안내', '전체 근거 목록은 제품 구현 단계에서 실제 데이터와 연결합니다.')
          }
          style={({ pressed }) => [styles.evidenceLink, pressed && styles.pressed]}
        >
          <Text style={styles.evidenceLinkText}>근거 리뷰 {perspective.evidenceCount}건</Text>
          <Text aria-hidden style={styles.chevron}>
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function DisclosureRow({
  title,
  body,
  expanded,
  onPress,
  sourceSlot,
}: {
  title: string;
  body: string;
  expanded: boolean;
  onPress: () => void;
  sourceSlot?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
    >
      <View style={styles.disclosureHeading}>
        <Text style={styles.disclosureTitle}>{title}</Text>
        <Text aria-hidden style={[styles.disclosureArrow, expanded && styles.disclosureArrowExpanded]}>
          ›
        </Text>
      </View>
      {expanded ? (
        <View style={styles.disclosureContent}>
          <Text style={styles.disclosureBody}>{body}</Text>
          {sourceSlot ? (
            <Pressable
              accessibilityHint="제품 구현에서는 실제 자료명, URL, 검증일과 연결됩니다."
              accessibilityLabel={`${sourceSlot} 출처 확인, 시안용 슬롯`}
              accessibilityRole="link"
              onPress={() =>
                Alert.alert(
                  '시안용 출처 슬롯',
                  '현재는 출처 진입점의 위치와 레이블만 검증합니다. 제품 구현 시 실제 자료명·URL·검증일을 연결해야 합니다.',
                )
              }
              style={({ pressed }) => [styles.sourceLink, pressed && styles.pressed]}
            >
              <Text style={styles.sourceLinkText}>출처 확인 · {sourceSlot} (시안)</Text>
              <Text aria-hidden style={styles.chevron}>
                ›
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <View aria-hidden style={styles.homeIcon}>
      <View style={[styles.homeRoof, { borderColor: color }]} />
      <View style={[styles.homeBody, { borderColor: color }]} />
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View aria-hidden style={styles.profileIcon}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

function AnalysisIcon() {
  return (
    <View aria-hidden style={styles.analysisBars}>
      <View style={[styles.analysisBar, styles.analysisBarShort]} />
      <View style={[styles.analysisBar, styles.analysisBarMedium]} />
      <View style={[styles.analysisBar, styles.analysisBarTall]} />
    </View>
  );
}

function BottomNavigation({ bottomInset }: { bottomInset: number }) {
  const unavailable = (name: string) =>
    Alert.alert('디자인 프로토타입', `${name} 화면은 아직 연결하지 않았어요. 현재는 결과 화면만 확인할 수 있습니다.`);

  return (
    <View
      accessibilityLabel="하단 내비게이션"
      style={[styles.bottomNavigation, { paddingBottom: Math.max(bottomInset, spacing[2]) }]}
    >
      <Pressable
        accessibilityLabel="홈, 현재 화면"
        accessibilityRole="button"
        accessibilityState={{ selected: true }}
        onPress={() => unavailable('홈')}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
      >
        <HomeIcon color={colors.brand.primary} />
        <Text style={[styles.navLabel, styles.navLabelSelected]}>홈</Text>
      </Pressable>

      <Pressable
        accessibilityHint="프로토타입에서는 분석 입력 화면을 열지 않습니다."
        accessibilityLabel="분석하기"
        accessibilityRole="button"
        onPress={() => unavailable('분석하기')}
        style={({ pressed }) => [styles.navItem, styles.analysisNavItem, pressed && styles.pressed]}
      >
        <View style={styles.analysisButton}>
          <AnalysisIcon />
        </View>
        <Text style={styles.analysisNavLabel}>분석하기</Text>
      </Pressable>

      <Pressable
        accessibilityLabel="마이페이지"
        accessibilityRole="button"
        onPress={() => unavailable('마이페이지')}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
      >
        <ProfileIcon color={colors.text.secondary} />
        <Text style={styles.navLabel}>마이페이지</Text>
      </Pressable>
    </View>
  );
}

export function ResultPrototype() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = width >= layout.breakpoint.medium ? spacing[6] : spacing[4];
  const [selectedId, setSelectedId] = useState(personas[0].id);
  const [expanded, setExpanded] = useState<'ai' | 'knowledge' | null>(null);
  const selectedPersona = useMemo(
    () => personas.find((persona) => persona.id === selectedId) ?? personas[0],
    [selectedId],
  );

  const selectPersona = (id: string) => {
    setSelectedId(id);
    setExpanded(null);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHeader}>
            <Text accessibilityRole="header" style={styles.wordmark}>
              PULSE
            </Text>
            <View style={styles.prototypeBadge}>
              <Text style={styles.prototypeBadgeText}>실행 프로토타입 · 가상 데이터</Text>
            </View>
          </View>

          <View style={styles.metadataSection}>
            <Text accessibilityRole="header" style={styles.storeName}>
              영등원조쌈밥
            </Text>
            <Text style={styles.metadata}>네이버 공개 리뷰 59건 · 2026.09.18 분석</Text>
          </View>

          <View accessibilityRole="text" style={styles.limitNotice}>
            <View style={styles.infoMark}>
              <Text style={styles.infoMarkText}>i</Text>
            </View>
            <Text style={styles.limitText}>
              분석 한계 · 공개 리뷰 작성자가 전체 손님을 대표하지 않을 수 있어요.
            </Text>
          </View>

          <View style={styles.sectionBlock}>
            <SectionHeading eyebrow="리뷰에서 많이 반복된 순서" title="손님 유형 TOP 3" />
            <View style={styles.rankGrid}>
              {personas.map((persona) => (
                <RankCard
                  key={persona.id}
                  onPress={() => selectPersona(persona.id)}
                  persona={persona}
                  selected={persona.id === selectedPersona.id}
                />
              ))}
            </View>
          </View>

          <View style={styles.personaCard}>
            <View style={styles.personaCopy}>
              <Text style={styles.selectedRank}>{selectedPersona.rank}위 손님 유형</Text>
              <Text accessibilityRole="header" style={styles.personaName}>
                {selectedPersona.name}
              </Text>
              <Text style={styles.personaSignal}>{selectedPersona.shortSignal}</Text>
              <Text style={styles.personaSummary}>{selectedPersona.summary}</Text>
            </View>
            <View style={styles.personaImageWrap}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel={selectedPersona.imageAlt}
                resizeMode="contain"
                source={selectedPersona.image}
                style={styles.personaImage}
              />
              <Text style={styles.aiImageLabel}>AI 생성 이미지</Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <SectionHeading title="4가지 관점으로 본 손님 유형" />
            <View style={styles.perspectiveList}>
              {selectedPersona.perspectives.map((perspective) => (
                <PerspectiveCard key={perspective.label} perspective={perspective} />
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.evidenceTitleRow}>
              <SectionHeading eyebrow="리뷰에서 확인" title="대표 근거 2건" />
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert('프로토타입 안내', '근거 리뷰 전체 보기는 제품 구현 단계에서 실제 데이터와 연결합니다.')
                }
                style={({ pressed }) => [styles.headerLink, pressed && styles.pressed]}
              >
                <Text style={styles.headerLinkText}>전체 보기</Text>
              </Pressable>
            </View>
            <View style={styles.reviewList}>
              {selectedPersona.reviews.map((review) => (
                <View key={`${selectedPersona.id}-${review.date}`} style={styles.reviewCard}>
                  <Text style={styles.reviewQuote}>“{review.quote}”</Text>
                  <Text style={styles.reviewMeta}>네이버 공개 리뷰 · {review.date}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.adviceCard}>
            <SectionHeading eyebrow="검토해 볼 행동" title={selectedPersona.adviceTitle} />
            <View style={styles.factBlock}>
              <Text style={styles.factLabel}>리뷰에서 확인</Text>
              <Text style={styles.factBody}>{selectedPersona.adviceFact}</Text>
            </View>
            <Text style={styles.adviceBody}>{selectedPersona.adviceBody}</Text>
          </View>

          <View style={styles.disclosureList}>
            <DisclosureRow
              body={selectedPersona.aiInterpretation}
              expanded={expanded === 'ai'}
              onPress={() => setExpanded((current) => (current === 'ai' ? null : 'ai'))}
              title={expanded === 'ai' ? 'AI 해석 접기' : 'AI 해석 펼쳐보기'}
            />
            <DisclosureRow
              body={selectedPersona.referenceKnowledge}
              expanded={expanded === 'knowledge'}
              onPress={() => setExpanded((current) => (current === 'knowledge' ? null : 'knowledge'))}
              sourceSlot={selectedPersona.referenceSourceSlot}
              title={expanded === 'knowledge' ? '참고 지식 접기' : '참고 지식 펼쳐보기'}
            />
          </View>

          <Text style={styles.prototypeFootnote}>
            이 화면의 상호명·리뷰·날짜·수치는 디자인 검증을 위한 가상 데이터입니다.
          </Text>
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation bottomInset={insets.bottom} />
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
  },
  content: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignSelf: 'center',
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  appHeader: {
    minHeight: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  wordmark: {
    ...typography.head3,
    color: colors.brand.primary,
  },
  prototypeBadge: {
    maxWidth: '65%',
    backgroundColor: colors.brand.tint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  prototypeBadgeText: {
    ...typography.caption,
    color: colors.text.brand,
    textAlign: 'center',
  },
  metadataSection: {
    gap: spacing[1],
  },
  storeName: {
    ...typography.head3,
    color: colors.text.strong,
  },
  metadata: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.emphasized,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[3],
    gap: spacing[2],
  },
  infoMark: {
    width: spacing[5],
    height: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.secondary,
    borderRadius: radii.pill,
  },
  infoMarkText: {
    ...typography.body6,
    color: colors.text.inverse,
  },
  limitText: {
    ...typography.body7,
    flex: 1,
    color: colors.text.secondary,
  },
  sectionBlock: {
    gap: spacing[3],
  },
  sectionHeading: {
    flex: 1,
    gap: spacing[1],
  },
  sectionEyebrow: {
    ...typography.caption,
    color: colors.text.brand,
  },
  sectionTitle: {
    ...typography.head5,
    color: colors.text.strong,
  },
  rankGrid: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  rankCard: {
    flex: 1,
    minWidth: 0,
    minHeight: spacing[32] + spacing[14],
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[2],
    gap: spacing[1],
  },
  rankCardSelected: {
    backgroundColor: colors.brand.stripe,
    borderColor: colors.brand.primary,
    borderWidth: strokes.focus,
  },
  pressed: {
    opacity: 0.7,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  rankBadgeSelected: {
    backgroundColor: colors.brand.primary,
  },
  rankBadgeText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  rankBadgeTextSelected: {
    color: colors.text.inverse,
  },
  rankImage: {
    width: spacing[16] + spacing[2],
    height: spacing[16] + spacing[2],
  },
  rankName: {
    ...typography.body6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  rankSignal: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  personaCard: {
    ...shadows.soft,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[3],
  },
  personaCopy: {
    flex: 1,
    gap: spacing[1],
  },
  selectedRank: {
    ...typography.body6,
    color: colors.text.brand,
  },
  personaName: {
    ...typography.head4,
    color: colors.text.strong,
  },
  personaSignal: {
    ...typography.body6,
    color: colors.text.primary,
  },
  personaSummary: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  personaImageWrap: {
    width: spacing[24] + spacing[4],
    alignItems: 'center',
    gap: spacing[1],
  },
  personaImage: {
    width: spacing[24],
    height: spacing[24],
  },
  aiImageLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  perspectiveList: {
    gap: spacing[2],
  },
  perspectiveCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
  },
  perspectiveBar: {
    width: spacing[1],
  },
  perspectiveCopy: {
    flex: 1,
    padding: spacing[3],
    gap: spacing[1],
  },
  perspectiveLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  perspectiveSummary: {
    ...typography.body5,
    color: colors.text.primary,
  },
  perspectiveDetail: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  evidenceLink: {
    minHeight: layout.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1],
  },
  evidenceLinkText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  chevron: {
    ...typography.head5,
    color: colors.text.brand,
  },
  evidenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  headerLink: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  headerLinkText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  reviewList: {
    gap: spacing[2],
  },
  reviewCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[2],
  },
  reviewQuote: {
    ...typography.body4,
    color: colors.text.primary,
  },
  reviewMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  adviceCard: {
    backgroundColor: colors.background.surface,
    borderColor: colors.action.primary,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[3],
  },
  factBlock: {
    backgroundColor: colors.brand.tint,
    borderRadius: radii.control,
    padding: spacing[3],
    gap: spacing[1],
  },
  factLabel: {
    ...typography.body6,
    color: colors.text.brand,
  },
  factBody: {
    ...typography.body7,
    color: colors.text.primary,
  },
  adviceBody: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  disclosureList: {
    gap: spacing[2],
  },
  disclosure: {
    minHeight: layout.touchTargetMin,
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[2],
  },
  disclosureHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  disclosureTitle: {
    ...typography.body6,
    flex: 1,
    color: colors.text.brand,
  },
  disclosureArrow: {
    ...typography.head5,
    color: colors.text.brand,
    transform: [{ rotate: '90deg' }],
  },
  disclosureArrowExpanded: {
    transform: [{ rotate: '-90deg' }],
  },
  disclosureBody: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  disclosureContent: {
    gap: spacing[2],
  },
  sourceLink: {
    minHeight: layout.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1],
  },
  sourceLinkText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  prototypeFootnote: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background.surface,
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
    paddingTop: spacing[2],
    paddingHorizontal: spacing[2],
  },
  navItem: {
    minHeight: spacing[14],
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  navLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  navLabelSelected: {
    color: colors.text.brand,
  },
  analysisNavItem: {
    marginTop: -spacing[5],
  },
  analysisButton: {
    ...shadows.soft,
    width: spacing[14],
    height: spacing[14],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action.primary,
    borderColor: colors.background.surface,
    borderRadius: radii.pill,
    borderWidth: spacing[1],
  },
  analysisNavLabel: {
    ...typography.caption,
    color: colors.text.brand,
  },
  analysisBars: {
    height: spacing[6],
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  analysisBar: {
    width: spacing[1],
    backgroundColor: colors.action.onPrimary,
    borderRadius: radii.small,
  },
  analysisBarShort: {
    height: spacing[2],
  },
  analysisBarMedium: {
    height: spacing[4],
  },
  analysisBarTall: {
    height: spacing[6],
  },
  homeIcon: {
    width: spacing[6],
    height: spacing[6],
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeRoof: {
    position: 'absolute',
    top: spacing[1],
    width: spacing[4],
    height: spacing[4],
    borderLeftWidth: strokes.focus,
    borderTopWidth: strokes.focus,
    transform: [{ rotate: '45deg' }],
  },
  homeBody: {
    width: spacing[4],
    height: spacing[3],
    borderBottomWidth: strokes.focus,
    borderLeftWidth: strokes.focus,
    borderRightWidth: strokes.focus,
  },
  profileIcon: {
    width: spacing[6],
    height: spacing[6],
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHead: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radii.pill,
    borderWidth: strokes.focus,
  },
  profileBody: {
    width: spacing[5],
    height: spacing[3],
    borderLeftWidth: strokes.focus,
    borderRightWidth: strokes.focus,
    borderTopLeftRadius: radii.control,
    borderTopRightRadius: radii.control,
    borderTopWidth: strokes.focus,
  },
});
