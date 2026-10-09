import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 짧은 선택지 한 칸. 2026-10-09에 업종 선택이 CategoryPicker로 바뀌어 지금은 쓰는 화면이 없다.

export function Chip({
  label,
  selected,
  onPress,
  radio = false,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  radio?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={radio ? 'radio' : 'button'}
      accessibilityState={radio ? { checked: selected, disabled } : { selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected, disabled && styles.textDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: layout.touchTargetMin,
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderColor: colors.border.control,
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  selected: {
    backgroundColor: colors.brand.tint,
    borderColor: colors.brand.primary,
    borderWidth: strokes.focus,
  },
  disabled: {
    backgroundColor: colors.background.emphasized,
    borderColor: colors.border.default,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    ...typography.body7,
    color: colors.text.primary,
  },
  textSelected: {
    ...typography.body6,
    color: colors.text.brand,
  },
  textDisabled: {
    color: colors.text.disabled,
  },
});
