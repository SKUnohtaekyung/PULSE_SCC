import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 공용 버튼. 규칙 정본은 DESIGN_SYSTEM §5.2 필수 상태와 §5.4 버튼이다.
// loading·disabled 표현은 2026-09-22 Step 7에서 정했다.
// - disabled: background.emphasized 배경 + text.disabled 글자. 눌러도 아무 일이 없고 색만으로 알리지 않도록
//   접근성 상태(disabled)를 함께 준다.
// - loading: 버튼 색을 그대로 두고(방금 누른 대상이라는 연속성) 글자를 수행 중인 행동 문구로 바꾼다.
//   앞에 작은 인디케이터를 두되, 모션 감소 설정에서는 인디케이터 없이 문구만 남긴다.

export type ButtonVariant = 'action' | 'primary' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** 로딩 중 보여줄 문구. 없으면 label을 그대로 쓴다. */
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  reduceMotion?: boolean;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'action',
  loadingLabel,
  loading = false,
  disabled = false,
  reduceMotion = false,
  accessibilityHint,
}: ButtonProps) {
  const blocked = loading || disabled;
  const text = loading ? (loadingLabel ?? label) : label;
  const tone = variantStyles[variant];
  const spinnerColor = variant === 'ghost' ? colors.brand.primary : tone.text.color;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone.container,
        disabled && styles.disabled,
        pressed && !blocked && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {loading && !reduceMotion ? <ActivityIndicator color={spinnerColor} size="small" /> : null}
        <Text style={[styles.label, tone.text, disabled && styles.disabledLabel]}>{text}</Text>
      </View>
    </Pressable>
  );
}

const variantStyles: Record<ButtonVariant, { container: object; text: { color: string } }> = {
  action: {
    container: { backgroundColor: colors.action.primary },
    text: { color: colors.action.onPrimary },
  },
  primary: {
    container: { backgroundColor: colors.brand.primary },
    text: { color: colors.brand.onPrimary },
  },
  ghost: {
    container: {
      backgroundColor: colors.background.surface,
      borderColor: colors.border.control,
      borderWidth: strokes.hairline,
    },
    text: { color: colors.text.brand },
  },
};

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchTargetMin,
    borderRadius: radii.control,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  label: {
    ...typography.buttonMain,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    backgroundColor: colors.background.emphasized,
    borderWidth: 0,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
});
