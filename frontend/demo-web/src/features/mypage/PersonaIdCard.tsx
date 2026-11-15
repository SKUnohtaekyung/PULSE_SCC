import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PersonaImageSource } from '@/api/personaImages';
import { useReduceMotion } from '@/components/ui/Motion';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { colors, motion, radii, shadows, spacing, strokes, typography } from '@/design/tokens';

// 저장된 손님 유형을 신분증 모양 카드로 보여 준다(2026-10-12 사용자 요청).
// 앞면에는 그림과 리뷰에서 나온 값만 적고, 누르면 뒤집혀 뒷면의 PULSE 로고가 보인다. 다시 누르면 앞면으로 돌아온다.
//
// 신분증처럼 보여도 사람의 신상은 적지 않는다. 연령·성별 같은 값은 리뷰로 알 수 없으므로 칸을 만들지 않고
// (PRD §7 페르소나 취급 규칙 2), 실제 이미지일 때 그림 바로 아래에 AI가 만든 가상 인물이라고 적는다(IMAGE-003). 자리표시 그림일 때는 자리표시라고 적는다.
// 지문·서명처럼 실제 사람의 것으로 읽힐 장식도 넣지 않는다.

const wordmark = require('../../../assets/images/brand/pulse-wordmark.png');
const symbol = require('../../../assets/images/brand/pulse-symbol.png');

/** 신용카드·신분증 규격(ID-1)의 가로세로 비율. 글자가 커지면 카드는 이보다 길어진다. */
const cardRatio = 85.6 / 53.98;
const wordmarkRatio = 1740 / 673;
const symbolRatio = 565 / 458;
const flipPerspective = 1000;
/** 뒷면에서 로고가 카드 폭에서 차지하는 비율. */
const wordmarkShare = 0.56;

export function PersonaIdCard({
  width,
  rank,
  label,
  altText,
  source,
  generated,
  topicReviewCount,
  share,
  storeName,
  analyzedOn,
  imageKey,
  onLoadError,
}: {
  width: number;
  rank: number;
  label: string;
  altText: string;
  source: PersonaImageSource;
  /** AI가 만든 이미지를 보여 줄 수 있으면 true. 자리표시 그림이나 불러오기 실패면 false다. */
  generated: boolean;
  topicReviewCount?: number;
  /** 분석한 리뷰 가운데 이 유형 리뷰의 비율(%). 계산할 수 없으면 주지 않는다. */
  share?: number;
  storeName: string;
  /** 분석한 날. 화면에 적을 모양 그대로 받는다. */
  analyzedOn: string;
  /** 이미지를 다시 받을 때 바꾸는 값(usePersonaImageRetry의 attempt). */
  imageKey: number;
  onLoadError: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const [flipped, setFlipped] = useState(false);
  const [turn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const target = flipped ? 1 : 0;
    if (reduceMotion !== false) {
      // 모션 감소 설정이거나 아직 설정을 모르면 돌리지 않고 바로 바꾼다.
      turn.setValue(target);
      return;
    }
    const animation = Animated.timing(turn, {
      duration: motion.duration.reveal,
      easing: Easing.inOut(Easing.cubic),
      toValue: target,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [flipped, reduceMotion, turn]);

  // 반 바퀴 돈 지점에서 앞뒤를 바꿔 보여 준다. 뒷면 숨김(backfaceVisibility)은 Android에서 기기마다 달라 쓰지 않는다.
  const frontStyle = {
    opacity: turn.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] }),
    transform: [
      { perspective: flipPerspective },
      { rotateY: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
    ],
  };
  const backStyle = {
    opacity: turn.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] }),
    transform: [
      { perspective: flipPerspective },
      { rotateY: turn.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) },
    ],
  };

  const wordmarkWidth = width * wordmarkShare;

  // 카드 전체가 버튼 하나라 안쪽 글자는 따로 읽히지 않는다. 화면에 보이는 값을 모두 이름에 담는다.
  const facts = [
    `${rank}위 ${label}`,
    topicReviewCount !== undefined ? `리뷰 ${topicReviewCount}건` : null,
    share !== undefined ? `분석한 리뷰의 ${share}%` : null,
    storeName ? `가게 ${storeName}` : null,
    analyzedOn ? `분석한 날 ${analyzedOn}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const flip = () => {
    const next = !flipped;
    setFlipped(next);
    // 누른 뒤에도 초점은 같은 버튼에 있어 바뀐 이름이 저절로 읽히지 않는다. 어느 면인지 알린다.
    AccessibilityInfo.announceForAccessibility(next ? '카드 뒷면이에요.' : '카드 앞면이에요.');
  };

  return (
    <Pressable
      accessibilityHint={flipped ? '누르면 앞면을 보여 줘요.' : '누르면 뒷면을 보여 줘요.'}
      accessibilityLabel={
        flipped
          ? `PULSE 손님 유형 카드 뒷면. ${rank}위 ${label}`
          : `${altText}. PULSE 손님 유형 카드 앞면. ${facts}`
      }
      accessibilityRole="button"
      onPress={flip}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <Animated.View
        importantForAccessibility={flipped ? 'no-hide-descendants' : 'auto'}
        style={[styles.face, { minHeight: width / cardRatio }, frontStyle]}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>손님 유형 카드</Text>
          <Image accessibilityLabel="PULSE" resizeMode="contain" source={symbol} style={styles.symbol} />
        </View>

        <View style={styles.main}>
          <View style={styles.photoColumn}>
            <PersonaAvatar
              altText={altText}
              key={imageKey}
              onLoadError={onLoadError}
              source={source}
              tile
              variant={rank - 1}
            />
            {/* 실제 이미지가 아닐 때 AI가 만든 인물이라고 적지 않는다(DESIGN_SYSTEM §3.6). */}
            <Text style={styles.photoNote}>{generated ? 'AI 가상 인물' : '자리표시 그림'}</Text>
          </View>

          <View style={styles.fields}>
            <Field label="유형" value={label} />
            <View style={styles.fieldRow}>
              <Field label="순위" value={`${rank}위`} />
              {topicReviewCount !== undefined ? <Field label="리뷰" value={`${topicReviewCount}건`} /> : null}
              {share !== undefined ? <Field label="비율" value={`${share}%`} /> : null}
            </View>
            <View style={styles.fieldRow}>
              <Field label="가게" value={storeName} wide />
              <Field label="분석한 날" value={analyzedOn} />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Stripes seed={`${rank}${label}${storeName}`} />
          <Text style={styles.hint}>누르면 뒤집혀요</Text>
        </View>
      </Animated.View>

      <Animated.View
        importantForAccessibility={flipped ? 'auto' : 'no-hide-descendants'}
        pointerEvents="none"
        style={[styles.face, styles.back, backStyle]}
      >
        {/* 크기를 숫자로 준다. 비율(%)과 aspectRatio만 주면 Android에서 원본 크기(1740px)로 그려져 카드를 넘친다. */}
        <Image
          accessibilityLabel="PULSE"
          resizeMode="contain"
          source={wordmark}
          style={{ height: wordmarkWidth / wordmarkRatio, width: wordmarkWidth }}
        />
        <Text style={styles.backCaption}>손님 유형 카드</Text>
        <Text style={[styles.hint, styles.backHint]}>누르면 앞면으로 돌아와요</Text>
      </Animated.View>
    </Pressable>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={wide ? styles.fieldWide : styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {/* 가게 이름만 한 줄로 자른다. 전체 이름은 카드의 접근성 이름에 들어 있다. */}
      <Text numberOfLines={wide ? 1 : undefined} style={styles.fieldValue}>
        {value}
      </Text>
    </View>
  );
}

/**
 * 카드 아래의 줄무늬 장식. 바코드처럼 보이지만 아무 값도 담지 않는다 — 읽는 기계가 없고 읽히지도 않는다.
 * 카드마다 무늬가 달라 보이도록 글자에서 굵기를 뽑을 뿐이다.
 */
function Stripes({ seed }: { seed: string }) {
  const widths = Array.from({ length: 22 }, (_, index) => {
    const code = seed.charCodeAt(index % Math.max(seed.length, 1)) || 0;
    return 1 + ((code + index * 7) % 3);
  });
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.stripes}>
      {widths.map((stripe, index) => (
        <View key={index} style={[styles.stripe, { width: stripe * strokes.hairline }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    ...shadows.soft,
    backgroundColor: colors.background.surface,
    borderColor: colors.border.brand,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[2],
    padding: spacing[3],
  },
  back: {
    alignItems: 'center',
    overflow: 'hidden',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pressed: {
    opacity: 0.9,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    ...typography.body5,
    color: colors.text.brand,
  },
  symbol: {
    height: spacing[5],
    width: spacing[5] * symbolRatio,
  },
  main: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  photoColumn: {
    gap: spacing[1],
    width: '34%',
  },
  photoNote: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  fields: {
    flex: 1,
    gap: spacing[1],
  },
  // 글자가 커져 한 줄에 다 들어가지 않으면 다음 줄로 넘긴다.
  fieldRow: {
    columnGap: spacing[2],
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // 칸 하나가 줄보다 넓어지면 카드 밖으로 나가지 않고 안에서 줄바꿈한다.
  field: {
    flexShrink: 1,
  },
  // 가게 이름은 남는 폭을 쓰되, 한 글자씩 세로로 쪼개질 만큼 좁아지지 않게 한다.
  fieldWide: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: spacing[20],
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  fieldValue: {
    ...typography.body6,
    color: colors.text.strong,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  stripes: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: strokes.hairline,
    height: spacing[4],
  },
  stripe: {
    backgroundColor: colors.text.strong,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  backCaption: {
    ...typography.body6,
    color: colors.text.brand,
  },
  backHint: {
    bottom: spacing[3],
    position: 'absolute',
  },
});
