import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, motion, radii, shadows, spacing, strokes, typography } from '@/design/tokens';

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

type JourneyStage = {
  label: '탐색' | '방문' | '식사' | '공유';
  title: string;
  description: string;
};

type Persona = {
  id: string;
  rank: number;
  name: string;
  tags: [string, string];
  shortSignal: string;
  summary: string;
  image: ImageSourcePropType;
  imageAlt: string;
  perspectives: Perspective[];
  reviews: ReviewEvidence[];
  journey: JourneyStage[];
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
    tags: ['#재방문', '#익숙한맛'],
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
    journey: [
      {
        label: '탐색',
        title: '예전부터 알던 맛을 다시 확인해요',
        description: '리뷰와 매장 정보를 보며 변함없는 맛인지 살펴봐요.',
      },
      {
        label: '방문',
        title: '익숙한 간판과 위치가 방문을 도와요',
        description: '오래 본 매장이라는 익숙함이 다시 찾는 신호가 돼요.',
      },
      {
        label: '식사',
        title: '맛과 상차림에서 추억을 확인해요',
        description: '변함없는 쌈밥 맛과 정갈한 반찬을 중요하게 봐요.',
      },
      {
        label: '공유',
        title: '여전한 맛이라는 경험을 남겨요',
        description: '오래 다닌 곳이라는 기억과 재방문 경험을 리뷰로 공유해요.',
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
    tags: ['#맵기조절', '#개운한맛'],
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
    journey: [
      {
        label: '탐색',
        title: '내가 먹을 수 있는 맵기인지 확인해요',
        description: '리뷰에서 맵기 체감과 조절 가능 여부를 찾아봐요.',
      },
      {
        label: '방문',
        title: '함께 먹는 사람의 취향을 떠올려요',
        description: '각자 원하는 맵기를 고를 수 있는지 방문 전에 판단해요.',
      },
      {
        label: '식사',
        title: '개운한 매운맛과 단계 차이를 경험해요',
        description: '주문한 맵기가 기대와 맞는지 가장 중요하게 느껴요.',
      },
      {
        label: '공유',
        title: '다음 손님을 위해 맵기 팁을 남겨요',
        description: '자신이 느낀 맵기와 조절 경험을 리뷰로 알려줘요.',
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
    tags: ['#혼밥', '#편안한식사'],
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
    journey: [
      {
        label: '탐색',
        title: '혼자 주문할 수 있는지 먼저 살펴봐요',
        description: '1인 메뉴와 혼잡 시간 이용 후기를 중심으로 확인해요.',
      },
      {
        label: '방문',
        title: '눈치 보지 않을 시간과 자리를 찾아요',
        description: '혼자 방문해도 편안한 시간대인지 판단해요.',
      },
      {
        label: '식사',
        title: '빠르고 정갈한 한 끼를 기대해요',
        description: '1인 상차림의 구성과 식사 속도를 중요하게 봐요.',
      },
      {
        label: '공유',
        title: '혼밥하기 편한 경험을 알려줘요',
        description: '다른 혼밥 손님에게 좌석과 주문 경험을 공유해요.',
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

function CalendarIcon() {
  return (
    <View aria-hidden style={styles.calendarIcon}>
      <View style={styles.calendarBindingRow}>
        <View style={styles.calendarBinding} />
        <View style={styles.calendarBinding} />
      </View>
      <View style={styles.calendarDivider} />
      <View style={styles.calendarDateDot} />
    </View>
  );
}

function CompletionArt({ largeText }: { largeText: boolean }) {
  return (
    <View aria-hidden style={[styles.heroArt, largeText && styles.heroArtLargeText]}>
      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />
      <Text style={styles.heroSparkleLeft}>✦</Text>
      <Text style={styles.heroSparkleRight}>✦</Text>
      <View style={styles.heroDocument}>
        <View style={[styles.heroDocumentLine, styles.heroDocumentLineWide]} />
        <View style={[styles.heroDocumentLine, styles.heroDocumentLineMedium]} />
        <View style={[styles.heroDocumentLine, styles.heroDocumentLineShort]} />
      </View>
      <View style={styles.heroCheckCircle}>
        <Text style={styles.heroCheck}>✓</Text>
      </View>
    </View>
  );
}

function PersonaGroupIcon() {
  return (
    <View aria-hidden style={styles.personaGroupIcon}>
      <View style={styles.personaGroupSecondaryHead} />
      <View style={styles.personaGroupPrimaryHead} />
      <View style={styles.personaGroupSecondaryBody} />
      <View style={styles.personaGroupPrimaryBody} />
    </View>
  );
}

function RankCard({
  persona,
  selected,
  onPress,
  progress,
  largeText,
}: {
  persona: Persona;
  selected: boolean;
  onPress: () => void;
  progress: Animated.Value;
  largeText: boolean;
}) {
  const flexGrow = progress.interpolate({
    inputRange: [0, 1],
    outputRange: largeText ? [0.94, 1.12] : [0.82, 1.36],
  });
  const imageSize = progress.interpolate({
    inputRange: [0, 1],
    outputRange: largeText ? [spacing[14], spacing[16]] : [spacing[14], spacing[24]],
  });
  const lift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: largeText ? [0, 0] : [0, -spacing[2]],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  return (
    <Animated.View
      style={[
        styles.rankCardSlot,
        largeText && styles.rankCardSlotLargeText,
        {
          flexGrow,
          opacity,
          transform: [{ translateY: lift }],
        },
      ]}
    >
      <Pressable
        accessibilityHint="선택하면 이 카드가 커지고 아래 상세 내용이 이 손님 유형으로 바뀝니다."
        accessibilityLabel={`${persona.rank}위 ${persona.name}, ${persona.shortSignal}`}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.rankCard,
          largeText && styles.rankCardLargeText,
          selected && styles.rankCardSelected,
          pressed && styles.pressed,
        ]}
      >
        <Animated.Image
          accessibilityIgnoresInvertColors
          accessible={false}
          importantForAccessibility="no"
          resizeMode="contain"
          source={persona.image}
          style={[styles.rankImage, { width: imageSize, height: imageSize }]}
        />
        {selected ? (
          <View style={styles.rankTagRow}>
            {persona.tags.map((tag) => (
              <View key={tag} style={styles.rankTag}>
                <Text style={styles.rankTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={[styles.rankCopy, largeText && styles.rankCopyLargeText]}>
          <Text style={[styles.rankName, largeText && styles.rankTextLarge]}>{persona.name}</Text>
          {selected ? (
            <Text style={[styles.rankSignal, largeText && styles.rankTextLarge]}>{persona.shortSignal}</Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function JourneyMap({ stages }: { stages: JourneyStage[] }) {
  return (
    <View style={styles.journeyPanel}>
      <View style={styles.journeyHeadingRow}>
        <SectionHeading eyebrow="AI 해석 기반 시안" title="고객 여정 지도" />
        <View style={styles.unconfirmedBadge}>
          <Text style={styles.unconfirmedBadgeText}>제품 미확정</Text>
        </View>
      </View>
      <Text style={styles.journeyIntro}>
        첫 번째 디자인의 흐름을 직접 비교하기 위한 탐색 기능이며, 현재 MVP 결과 계약에는 포함되지 않았어요.
      </Text>
      <View style={styles.journeyList}>
        {stages.map((stage, index) => (
          <View key={stage.label} style={styles.journeyRow}>
            <View style={styles.journeyRail}>
              <View style={styles.journeyDot}>
                <Text style={styles.journeyDotText}>{index + 1}</Text>
              </View>
              {index < stages.length - 1 ? <View style={styles.journeyLine} /> : null}
            </View>
            <View style={styles.journeyCard}>
              <Text style={styles.journeyStage}>{stage.label}</Text>
              <Text style={styles.journeyTitle}>{stage.title}</Text>
              <Text style={styles.journeyDescription}>{stage.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
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
    <View style={styles.disclosure}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.disclosureHeading,
          expanded && styles.disclosureHeadingExpanded,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.disclosureTitle}>{title}</Text>
        <Text aria-hidden style={[styles.disclosureArrow, expanded && styles.disclosureArrowExpanded]}>
          ›
        </Text>
      </Pressable>
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
    </View>
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

function AnalysisIcon({ color = colors.action.onPrimary }: { color?: string }) {
  return (
    <View aria-hidden style={styles.analysisBars}>
      <View style={[styles.analysisBar, styles.analysisBarShort, { backgroundColor: color }]} />
      <View style={[styles.analysisBar, styles.analysisBarMedium, { backgroundColor: color }]} />
      <View style={[styles.analysisBar, styles.analysisBarTall, { backgroundColor: color }]} />
    </View>
  );
}

export function BottomNavigation({
  bottomInset,
  active = 'home',
  onHome,
  onAnalyze,
}: {
  bottomInset: number;
  active?: 'home' | 'analysis';
  onHome?: () => void;
  onAnalyze?: () => void;
}) {
  const unavailable = (name: string) =>
    Alert.alert('디자인 프로토타입', `${name} 화면은 아직 연결하지 않았어요.`);
  const homeActive = active === 'home';

  return (
    <View
      accessibilityLabel="하단 내비게이션"
      style={[styles.bottomNavigation, { paddingBottom: Math.max(bottomInset, spacing[2]) }]}
    >
      <Pressable
        accessibilityLabel={homeActive ? '홈, 현재 화면' : '홈'}
        accessibilityRole="button"
        accessibilityState={{ selected: homeActive }}
        onPress={onHome ?? (() => unavailable('홈'))}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
      >
        <HomeIcon color={homeActive ? colors.brand.primary : colors.text.secondary} />
        <Text style={[styles.navLabel, homeActive && styles.navLabelSelected]}>홈</Text>
      </Pressable>

      <Pressable
        accessibilityLabel={homeActive ? '분석하기' : '분석하기, 현재 화면'}
        accessibilityRole="button"
        accessibilityState={{ selected: !homeActive }}
        onPress={onAnalyze ?? (() => unavailable('분석하기'))}
        style={({ pressed }) => [styles.navItem, styles.analysisNavItem, pressed && homeActive && styles.pressed]}
      >
        <View style={[styles.analysisButton, !homeActive && styles.analysisButtonCurrent]}>
          <AnalysisIcon color={homeActive ? colors.action.onPrimary : colors.brand.onPrimary} />
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

type SaveDialog = 'replace' | 'leave' | null;

export function ResultPrototype({ mode = 'saved' }: { mode?: 'saved' | 'preview' }) {
  const router = useRouter();
  const isPreview = mode === 'preview';
  const [saveDialog, setSaveDialog] = useState<SaveDialog>(null);
  const [saving, setSaving] = useState<'replace' | 'keep' | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fontScale, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = width >= layout.breakpoint.medium ? spacing[6] : spacing[4];
  const largeText = fontScale >= 1.5;
  const [selectedId, setSelectedId] = useState(personas[0].id);
  const [expanded, setExpanded] = useState<'ai' | 'knowledge' | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cardAnimations] = useState(() =>
    personas.map((persona) => new Animated.Value(persona.id === personas[0].id ? 1 : 0)),
  );
  const scrollRef = useRef<ScrollView>(null);
  const detailOffset = useRef(0);
  const selectedPersona = useMemo(
    () => personas.find((persona) => persona.id === selectedId) ?? personas[0],
    [selectedId],
  );

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const selectPersona = (id: string) => {
    if (id === selectedId) return;

    setSelectedId(id);
    setExpanded(null);
    Animated.parallel(
      cardAnimations.map((animation, index) =>
        Animated.timing(animation, {
          toValue: personas[index].id === id ? 1 : 0,
          duration: reduceMotion ? motion.duration.instant : motion.duration.emphasized,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  };

  useEffect(() => {
    if (!isPreview) return;
    // 미리보기에서 뒤로가기를 누르면 새 결과를 조용히 버리지 않고 선택을 묻는다.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (saving === null) setSaveDialog('leave');
      return true;
    });
    return () => subscription.remove();
  }, [isPreview, saving]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const finishSave = (choice: 'replace' | 'keep') => {
    setSaveDialog(null);
    setSaving(choice);
    AccessibilityInfo.announceForAccessibility(
      choice === 'replace' ? '새 결과로 바꾸는 중이에요.' : '기존 결과로 돌아가는 중이에요.',
    );
    // 가상 저장 요청. 실제 구현에서는 교체만 PUT /api/v1/me/saved-analysis/{analysisId}를 호출한다.
    saveTimer.current = setTimeout(() => router.dismissTo('/'), 900);
  };

  const scrollToSelectedDetails = () => {
    scrollRef.current?.scrollTo({
      animated: !reduceMotion,
      y: Math.max(detailOffset.current - spacing[3], 0),
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.appHeader, largeText && styles.appHeaderLargeText]}>
            <Text accessibilityRole="header" style={styles.wordmark}>
              PULSE
            </Text>
            <Text style={styles.headerTitle}>손님 분석</Text>
            <View style={[styles.prototypeBadge, largeText && styles.prototypeBadgeLargeText]}>
              <Text style={styles.prototypeBadgeText}>실행 프로토타입 · 가상 데이터</Text>
            </View>
          </View>

          {isPreview ? (
            <View accessibilityRole="alert" style={styles.previewNotice}>
              <Text aria-hidden style={styles.previewNoticeMark}>
                !
              </Text>
              <Text style={styles.previewNoticeText}>새 분석 결과예요. 아직 저장된 결과를 바꾸지 않았어요.</Text>
            </View>
          ) : null}

          <View style={styles.insightHero}>
            <View style={[styles.insightCopy, largeText && styles.insightCopyLargeText]}>
              <Text style={styles.insightEyebrow}>{isPreview ? '새 분석 결과 · 저장 전' : '리뷰 분석 완료'}</Text>
              <Text accessibilityRole="header" style={styles.insightTitle}>
                영등원조쌈밥
              </Text>
              <Text style={styles.insightBody}>네이버 공개 리뷰 59건에서 손님 유형 3개를 찾았어요.</Text>
              <View style={styles.heroDateRow}>
                <CalendarIcon />
                <View style={styles.heroDateList}>
                  <Text style={styles.heroDateText}>수집 {isPreview ? '2026.09.20' : '2026.09.18'}</Text>
                  <Text style={styles.heroDateText}>분석 완료 {isPreview ? '2026.09.20' : '2026.09.18'}</Text>
                </View>
              </View>
            </View>
            <CompletionArt largeText={largeText} />
            <View accessibilityRole="text" style={styles.heroLimitNotice}>
              <View style={styles.infoMark}>
                <Text style={styles.infoMarkText}>i</Text>
              </View>
              <Text style={styles.limitText}>공개 리뷰 작성자가 전체 손님을 대표하지 않을 수 있어요.</Text>
            </View>
          </View>

          <View accessibilityRole="tablist" style={[styles.sectionBlock, styles.rankSection]}>
            <View style={styles.rankHeadingRow}>
              <View style={styles.rankTitleGroup}>
                <PersonaGroupIcon />
                <SectionHeading eyebrow="리뷰에서 많이 반복된 순서" title="손님 유형 TOP 3" />
              </View>
              <Pressable
                accessibilityHint="현재 선택한 손님 유형의 상세 영역으로 이동합니다."
                accessibilityLabel={`${selectedPersona.name} 상세 더보기`}
                accessibilityRole="button"
                onPress={scrollToSelectedDetails}
                style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
              >
                <Text style={styles.moreButtonText}>더보기</Text>
                <Text aria-hidden style={styles.chevron}>
                  ›
                </Text>
              </Pressable>
            </View>
            <View style={[styles.rankGrid, largeText && styles.rankGridLargeText]}>
              {personas.map((persona, index) => (
                <RankCard
                  key={persona.id}
                  largeText={largeText}
                  onPress={() => selectPersona(persona.id)}
                  persona={persona}
                  progress={cardAnimations[index]}
                  selected={persona.id === selectedPersona.id}
                />
              ))}
            </View>
            <View
              accessibilityLabel={`${selectedPersona.rank} / ${personas.length}, ${selectedPersona.name} 선택됨`}
              accessibilityRole="text"
              style={styles.rankPager}
            >
              <View style={styles.rankPagerDots}>
                {personas.map((persona) => (
                  <View
                    key={persona.id}
                    style={[
                      styles.rankPagerDot,
                      persona.id === selectedPersona.id && styles.rankPagerDotSelected,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.rankPagerText}>
                {selectedPersona.rank} / {personas.length}
              </Text>
            </View>
          </View>

          <View
            onLayout={(event) => {
              detailOffset.current = event.nativeEvent.layout.y;
            }}
            style={styles.personaCard}
          >
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
                accessibilityRole="image"
                accessible
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

          <JourneyMap stages={selectedPersona.journey} />

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
      {isPreview ? (
        <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: saving !== null, busy: saving === 'replace' }}
            disabled={saving !== null}
            onPress={() => setSaveDialog('replace')}
            style={({ pressed }) => [
              styles.savePrimary,
              saving !== null && styles.saveDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.savePrimaryText}>
              {saving === 'replace' ? '새 결과로 바꾸는 중…' : '새 결과로 바꾸기'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: saving !== null, busy: saving === 'keep' }}
            disabled={saving !== null}
            onPress={() => finishSave('keep')}
            style={({ pressed }) => [
              styles.saveSecondary,
              saving !== null && styles.saveDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.saveSecondaryText}>
              {saving === 'keep' ? '기존 결과로 돌아가는 중…' : '기존 결과 유지'}
            </Text>
          </Pressable>
          <Text style={styles.saveNote}>
            기존 결과를 유지하면 이번 새 결과는 저장되지 않고, 이 화면을 닫은 뒤에는 다시 볼 수 없을 수 있어요.
          </Text>
        </View>
      ) : (
        <BottomNavigation bottomInset={insets.bottom} onAnalyze={() => router.push('/flow?scenario=saved')} />
      )}

      <Modal
        animationType={reduceMotion ? 'none' : 'fade'}
        navigationBarTranslucent
        onRequestClose={() => setSaveDialog(null)}
        statusBarTranslucent
        transparent
        visible={saveDialog !== null}
      >
        <View style={styles.dialogBackdrop}>
          <View aria-hidden style={styles.dialogScrim} />
          <View accessibilityViewIsModal style={styles.dialog}>
            {saveDialog === 'replace' ? (
              <>
                <Text accessibilityRole="header" style={styles.dialogTitle}>
                  저장된 결과를 바꿀까요?
                </Text>
                <View style={styles.dialogTarget}>
                  <Text style={styles.dialogTargetLabel}>지금 저장된 결과</Text>
                  <Text style={styles.dialogTargetValue}>영등원조쌈밥 · 2026.09.18 분석</Text>
                </View>
                <Text style={styles.dialogBody}>바꾸면 이전 결과는 앱에서 다시 볼 수 없어요.</Text>
                <View style={styles.dialogActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSaveDialog(null)}
                    style={({ pressed }) => [styles.dialogButton, styles.dialogCancel, pressed && styles.pressed]}
                  >
                    <Text style={styles.dialogCancelText}>취소</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => finishSave('replace')}
                    style={({ pressed }) => [
                      styles.dialogButton,
                      styles.dialogDestructive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.dialogDestructiveText}>바꾸기</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text accessibilityRole="header" style={styles.dialogTitle}>
                  새 결과를 어떻게 할까요?
                </Text>
                <Text style={styles.dialogBody}>선택하지 않고 나가면 새 결과를 다시 볼 수 없을 수 있어요.</Text>
                <View style={styles.dialogStack}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSaveDialog('replace')}
                    style={({ pressed }) => [styles.dialogButton, styles.dialogOutline, pressed && styles.pressed]}
                  >
                    <Text style={styles.dialogOutlineText}>새 결과로 바꾸기</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => finishSave('keep')}
                    style={({ pressed }) => [styles.dialogButton, styles.dialogOutline, pressed && styles.pressed]}
                  >
                    <Text style={styles.dialogOutlineText}>기존 결과 유지</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSaveDialog(null)}
                    style={({ pressed }) => [styles.dialogButton, styles.dialogCancel, pressed && styles.pressed]}
                  >
                    <Text style={styles.dialogCancelText}>계속 보기</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  previewNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderLeftColor: colors.status.warning,
    borderLeftWidth: spacing[1],
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[3],
  },
  previewNoticeMark: {
    ...typography.body5,
    color: colors.status.warningText,
  },
  previewNoticeText: {
    ...typography.body6,
    flex: 1,
    color: colors.text.primary,
  },
  saveBar: {
    backgroundColor: colors.background.surface,
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  savePrimary: {
    minHeight: layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  savePrimaryText: {
    ...typography.buttonMain,
    color: colors.action.onPrimary,
    textAlign: 'center',
  },
  saveSecondary: {
    minHeight: layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderColor: colors.brand.primary,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  saveSecondaryText: {
    ...typography.buttonMain,
    color: colors.text.brand,
    textAlign: 'center',
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveNote: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dialogBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  dialogScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background.inverse,
    opacity: 0.5,
  },
  dialog: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.panel,
    padding: spacing[6],
    gap: spacing[4],
  },
  dialogTitle: {
    ...typography.head5,
    color: colors.text.strong,
  },
  dialogTarget: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[3],
    gap: spacing[1],
  },
  dialogTargetLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dialogTargetValue: {
    ...typography.body6,
    color: colors.text.primary,
  },
  dialogBody: {
    ...typography.body4,
    color: colors.text.primary,
  },
  dialogActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  dialogStack: {
    gap: spacing[2],
  },
  dialogButton: {
    minHeight: layout.touchTargetMin,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  dialogCancel: {
    backgroundColor: colors.background.emphasized,
  },
  dialogCancelText: {
    ...typography.buttonSub,
    color: colors.text.primary,
  },
  dialogDestructive: {
    backgroundColor: colors.destructive.primary,
  },
  dialogDestructiveText: {
    ...typography.buttonMain,
    color: colors.destructive.onPrimary,
  },
  dialogOutline: {
    borderColor: colors.brand.primary,
    borderWidth: strokes.hairline,
  },
  dialogOutlineText: {
    ...typography.buttonSub,
    color: colors.text.brand,
  },
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
    gap: spacing[2],
  },
  appHeaderLargeText: {
    flexWrap: 'wrap',
    paddingVertical: spacing[2],
  },
  wordmark: {
    ...typography.head4,
    color: colors.brand.primary,
  },
  headerTitle: {
    ...typography.body7,
    flexShrink: 1,
    color: colors.text.secondary,
    borderLeftColor: colors.border.strong,
    borderLeftWidth: strokes.hairline,
    paddingLeft: spacing[2],
  },
  prototypeBadge: {
    maxWidth: '52%',
    marginLeft: 'auto',
    backgroundColor: colors.brand.tint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  prototypeBadgeLargeText: {
    width: '100%',
    maxWidth: '100%',
    marginLeft: spacing[0],
  },
  prototypeBadgeText: {
    ...typography.caption,
    color: colors.text.brand,
    textAlign: 'center',
  },
  insightHero: {
    ...shadows.soft,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[5],
    gap: spacing[4],
  },
  insightCopy: {
    zIndex: 1,
    paddingRight: spacing[24] + spacing[4],
    gap: spacing[2],
  },
  insightCopyLargeText: {
    paddingRight: spacing[0],
  },
  insightEyebrow: {
    ...typography.caption,
    color: colors.text.inverse,
    opacity: 0.84,
  },
  insightTitle: {
    ...typography.head3,
    color: colors.text.inverse,
  },
  insightBody: {
    ...typography.body4,
    color: colors.text.inverse,
    opacity: 0.92,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  heroDateList: {
    flexShrink: 1,
  },
  heroDateText: {
    ...typography.body6,
    color: colors.text.inverse,
  },
  calendarIcon: {
    width: spacing[5],
    height: spacing[5],
    justifyContent: 'center',
    borderColor: colors.brand.onPrimary,
    borderRadius: radii.small,
    borderWidth: strokes.focus,
  },
  calendarBindingRow: {
    position: 'absolute',
    top: -strokes.focus,
    right: spacing[1],
    left: spacing[1],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarBinding: {
    width: strokes.focus,
    height: spacing[1],
    backgroundColor: colors.brand.onPrimary,
    borderRadius: radii.pill,
  },
  calendarDivider: {
    height: strokes.hairline,
    backgroundColor: colors.brand.onPrimary,
    opacity: 0.8,
  },
  calendarDateDot: {
    width: spacing[1],
    height: spacing[1],
    alignSelf: 'center',
    marginTop: spacing[1],
    backgroundColor: colors.brand.onPrimary,
    borderRadius: radii.pill,
  },
  heroArt: {
    position: 'absolute',
    top: spacing[6],
    right: spacing[4],
    width: spacing[24] + spacing[4],
    height: spacing[24] + spacing[5],
  },
  heroArtLargeText: {
    display: 'none',
  },
  heroOrbLarge: {
    position: 'absolute',
    top: spacing[0],
    right: spacing[0],
    width: spacing[24] + spacing[4],
    height: spacing[24] + spacing[4],
    backgroundColor: colors.background.surface,
    borderRadius: radii.pill,
    opacity: 0.07,
  },
  heroOrbSmall: {
    position: 'absolute',
    right: -spacing[8],
    bottom: -spacing[10],
    width: spacing[20],
    height: spacing[20],
    backgroundColor: colors.background.surface,
    borderRadius: radii.pill,
    opacity: 0.08,
  },
  heroSparkleLeft: {
    ...typography.head5,
    position: 'absolute',
    top: spacing[2],
    left: spacing[0],
    color: colors.text.inverse,
    opacity: 0.86,
  },
  heroSparkleRight: {
    ...typography.body1,
    position: 'absolute',
    right: spacing[0],
    top: spacing[12],
    color: colors.text.inverse,
    opacity: 0.86,
  },
  heroDocument: {
    position: 'absolute',
    top: spacing[5],
    left: spacing[8],
    width: spacing[14],
    height: spacing[20],
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: radii.control,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  heroDocumentLine: {
    height: spacing[2],
    backgroundColor: colors.brand.tint,
    borderRadius: radii.pill,
  },
  heroDocumentLineWide: {
    width: '100%',
  },
  heroDocumentLineMedium: {
    width: '78%',
  },
  heroDocumentLineShort: {
    width: '56%',
  },
  heroCheckCircle: {
    ...shadows.soft,
    position: 'absolute',
    right: spacing[1],
    bottom: spacing[1],
    width: spacing[12],
    height: spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderColor: colors.brand.tint,
    borderRadius: radii.pill,
    borderWidth: strokes.focus,
  },
  heroCheck: {
    ...typography.head4,
    color: colors.text.brand,
  },
  heroLimitNotice: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[3],
    gap: spacing[2],
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
  rankSection: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[4],
  },
  rankHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  rankTitleGroup: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  personaGroupIcon: {
    position: 'relative',
    width: spacing[8],
    height: spacing[8],
  },
  personaGroupPrimaryHead: {
    position: 'absolute',
    top: spacing[0],
    left: spacing[1],
    width: spacing[3],
    height: spacing[3],
    borderColor: colors.brand.primary,
    borderRadius: radii.pill,
    borderWidth: strokes.focus,
  },
  personaGroupSecondaryHead: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    width: spacing[2],
    height: spacing[2],
    borderColor: colors.brand.primary,
    borderRadius: radii.pill,
    borderWidth: strokes.focus,
  },
  personaGroupPrimaryBody: {
    position: 'absolute',
    left: spacing[0],
    bottom: spacing[0],
    width: spacing[5],
    height: spacing[3],
    borderColor: colors.brand.primary,
    borderTopLeftRadius: radii.control,
    borderTopRightRadius: radii.control,
    borderWidth: strokes.focus,
  },
  personaGroupSecondaryBody: {
    position: 'absolute',
    right: spacing[0],
    bottom: spacing[0],
    width: spacing[4],
    height: spacing[3],
    borderColor: colors.brand.primary,
    borderTopLeftRadius: radii.control,
    borderTopRightRadius: radii.control,
    borderWidth: strokes.focus,
  },
  moreButton: {
    minHeight: layout.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  moreButtonText: {
    ...typography.body6,
    color: colors.text.brand,
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
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingTop: spacing[2],
  },
  rankGridLargeText: {
    gap: spacing[1],
  },
  rankCardSlot: {
    flexBasis: 0,
    minWidth: 0,
  },
  rankCardSlotLargeText: {
    alignSelf: 'stretch',
  },
  rankCard: {
    width: '100%',
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
  rankCardLargeText: {
    minHeight: spacing[32] + spacing[20],
    paddingHorizontal: spacing[1],
  },
  rankCardSelected: {
    ...shadows.soft,
    backgroundColor: colors.background.surface,
    borderColor: colors.brand.primary,
    borderWidth: strokes.focus,
  },
  pressed: {
    opacity: 0.7,
  },
  rankImage: {
    width: spacing[14],
    height: spacing[14],
  },
  rankTagRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[1],
  },
  rankTag: {
    backgroundColor: colors.brand.tint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  rankTagText: {
    ...typography.caption,
    color: colors.text.brand,
  },
  rankCopy: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[1],
  },
  rankCopyLargeText: {
    minWidth: 0,
  },
  rankName: {
    ...typography.body5,
    color: colors.text.primary,
    textAlign: 'center',
  },
  rankTextLarge: {
    width: '100%',
    flexShrink: 1,
  },
  rankSignal: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  rankPager: {
    minHeight: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  rankPagerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  rankPagerDot: {
    width: spacing[2],
    height: spacing[2],
    backgroundColor: colors.border.strong,
    borderRadius: radii.pill,
  },
  rankPagerDotSelected: {
    width: spacing[3],
    height: spacing[3],
    backgroundColor: colors.brand.primary,
  },
  rankPagerText: {
    ...typography.body6,
    color: colors.text.brand,
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
  journeyPanel: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    padding: spacing[4],
    gap: spacing[3],
  },
  journeyHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  unconfirmedBadge: {
    minHeight: spacing[8],
    justifyContent: 'center',
    backgroundColor: colors.background.emphasized,
    borderColor: colors.border.default,
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[3],
  },
  unconfirmedBadgeText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  journeyIntro: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  journeyList: {
    gap: spacing[1],
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing[3],
  },
  journeyRail: {
    width: spacing[8],
    alignItems: 'center',
  },
  journeyDot: {
    width: spacing[8],
    height: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.tint,
    borderColor: colors.border.brand,
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
  },
  journeyDotText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  journeyLine: {
    width: strokes.focus,
    minHeight: spacing[8],
    flex: 1,
    backgroundColor: colors.border.brand,
  },
  journeyCard: {
    flex: 1,
    marginBottom: spacing[2],
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    padding: spacing[3],
    gap: spacing[1],
  },
  journeyStage: {
    ...typography.caption,
    color: colors.text.brand,
  },
  journeyTitle: {
    ...typography.body5,
    color: colors.text.primary,
  },
  journeyDescription: {
    ...typography.body7,
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
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
  },
  disclosureHeading: {
    minHeight: layout.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    padding: spacing[4],
  },
  disclosureHeadingExpanded: {
    paddingBottom: spacing[2],
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
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
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
    flexShrink: 1,
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
  analysisButtonCurrent: {
    backgroundColor: colors.brand.primary,
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
