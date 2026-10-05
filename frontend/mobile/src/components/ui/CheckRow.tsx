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
  invalid = Boolean(error),
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  /** 이 줄 아래에 보일 오류 문장. 여러 줄이 한 오류를 나눠 가지면 마지막 줄에만 준다. */
  error?: string;
  /** 빨간 테두리. 오류 문장이 다른 줄에 있어도 이 칸이 원인이면 true를 준다. */
  invalid?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        // 빨간 테두리는 색이라 화면 읽기에는 전해지지 않는다. TextField처럼 읽기 이름에 오류를 붙인다.
        // 이름을 undefined로 되돌리면 Android에 이전 이름('오류: …')이 남으므로 늘 값을 준다.
        accessibilityLabel={[label, description, invalid ? '오류: 동의가 필요해요' : undefined]
          .filter(Boolean)
          .join(', ')}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={[styles.box, checked && styles.boxChecked, invalid && styles.boxError]}>
          {/* 체크 상태는 accessibilityState로 읽힌다. 표시 글자는 화면 읽기에서 뺀다. */}
          {checked ? (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.mark}
            >
              ✓
            </Text>
          ) : null}
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
