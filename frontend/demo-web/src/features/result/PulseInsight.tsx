import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radii, spacing, strokes, typography } from '@/design/tokens';

// 펄스의 분석(원본 앱의 "AI 해석"). 리뷰에서 확인한 사실과 같은 확신도로 보이지 않게
// P 로고·연한 바탕·보통 굵기로 구분하고, AI가 만든 해석이라는 사실을 작은 글로 함께 적는다(PRD FR-006).
// 2026-11-15 사용자 결정: 별 아이콘 대신 PULSE의 P 심볼, "펄스의 분석" 이름.

const symbol = require('@/assets/images/brand/pulse-symbol.png');
const symbolRatio = 565 / 458;

export function PulseSymbol({ size = spacing[4] }: { size?: number }) {
  return (
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no"
      resizeMode="contain"
      source={symbol}
      style={{ width: size * symbolRatio, height: size }}
    />
  );
}

export function PulseInsight({ texts, compact = false }: { texts: string[]; compact?: boolean }) {
  if (texts.length === 0) return null;
  return (
    <View
      accessibilityLabel={`펄스의 분석. ${texts.join(' ')} AI로 분석한 내용이에요.`}
      accessible
      style={[styles.box, compact && styles.boxCompact]}
    >
      <View style={styles.head}>
        <PulseSymbol size={spacing[4]} />
        <Text style={styles.label}>펄스의 분석</Text>
      </View>
      {texts.map((text) => (
        <Text key={text} style={styles.text}>
          {text}
        </Text>
      ))}
      <Text style={styles.note}>AI로 분석한 내용이에요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing[1],
    padding: spacing[4],
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    borderColor: colors.border.brand,
    borderStyle: 'dashed',
    backgroundColor: colors.background.subtle,
  },
  boxCompact: {
    padding: spacing[3],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  label: {
    ...typography.body6,
    fontFamily: fontFamilies.bold,
    color: colors.text.brand,
  },
  text: {
    ...typography.body4,
    color: colors.text.primary,
  },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
