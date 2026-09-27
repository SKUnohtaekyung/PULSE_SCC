import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/design/tokens';

// 입력을 몇 단계 중 어디까지 했는지 알리는 막대. 2026-09-26 발표 시안의 상단 표시를 옮긴 것이다.
// 색만으로 알리지 않는다 — 라벨과 접근성 문장으로 같은 사실을 전한다(DESIGN_SYSTEM §3.4).

export function StepIndicator({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <View
      accessibilityLabel={`전체 ${steps.length}단계 중 ${activeIndex + 1}단계, ${steps[activeIndex] ?? ''}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: steps.length, now: activeIndex + 1 }}
      style={styles.row}
    >
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <View key={step} style={styles.item}>
            <View style={[styles.bar, done && styles.barDone, active && styles.barActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  item: {
    flex: 1,
    gap: spacing[1],
  },
  bar: {
    height: spacing[1],
    backgroundColor: colors.border.default,
    borderRadius: radii.pill,
  },
  barDone: {
    backgroundColor: colors.brand.primary,
  },
  // 지금 하는 단계만 주황으로 짚는다. 넓은 면이 아니라 작은 포인트다(2026-09-27 디자인 리뷰 #2).
  barActive: {
    backgroundColor: colors.focus.ring,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  labelActive: {
    ...typography.body6,
    color: colors.text.strong,
  },
});
