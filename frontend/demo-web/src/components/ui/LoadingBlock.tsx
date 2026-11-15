import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/design/tokens';

// 로딩 자리표시. DESIGN_SYSTEM §5.2 — background.emphasized 영역과
// 무엇을 불러오는지 알리는 문장으로 만들고, 결과 수치처럼 보이게 하지 않는다.
// 모션 감소 설정에서는 인디케이터를 끄고 문장만 남긴다.

export function LoadingBlock({
  message,
  reduceMotion = false,
  height,
}: {
  message: string;
  reduceMotion?: boolean;
  height?: number;
}) {
  return (
    <View accessibilityLiveRegion="polite" style={[styles.block, height ? { minHeight: height } : null]}>
      {reduceMotion ? null : <ActivityIndicator color={colors.brand.primary} size="small" />}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.control,
    gap: spacing[3],
    justifyContent: 'center',
    minHeight: 120,
    padding: spacing[5],
  },
  message: {
    ...typography.body7,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
