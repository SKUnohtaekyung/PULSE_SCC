import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 동의 한 줄. 체크 표시와 설명을 함께 누를 수 있게 한 행으로 묶는다.
// 색만으로 상태를 알리지 않도록 체크 표시(✓)와 접근성 상태를 함께 준다(DESIGN_SYSTEM §5.2).

export function CheckRow({
  label,
  description,
  checked,
  onToggle,
  error,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={[styles.box, checked && styles.boxChecked, error && styles.boxError]}>
          {checked ? <Text style={styles.mark}>✓</Text> : null}
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          ! {error}
        </Text>
      ) : null}
    </View>
  );
}

const boxSize = spacing[6];

const styles = StyleSheet.create({
  wrap: {
    gap: spacing[2],
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: layout.touchTargetMin,
    paddingVertical: spacing[2],
  },
  pressed: {
    opacity: 0.9,
  },
  box: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.small,
    borderWidth: strokes.hairline,
    height: boxSize,
    justifyContent: 'center',
    width: boxSize,
  },
  boxChecked: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  boxError: {
    borderColor: colors.border.error,
    borderWidth: strokes.focus,
  },
  mark: {
    ...typography.body6,
    color: colors.text.inverse,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  label: {
    ...typography.body4,
    color: colors.text.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  error: {
    ...typography.errorText,
    color: colors.status.errorText,
  },
});
