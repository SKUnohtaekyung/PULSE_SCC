import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Field } from '@/components/ui/Field';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 글자 입력 한 칸. 규칙 정본은 DESIGN_SYSTEM §5.5다.
// label·오류·보조 설명의 배치는 Field가 담당하고, 여기서는 입력 자체만 다룬다.

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  /** 입력 아래에 두는 보조 설명. 오류가 있으면 오류가 우선한다. */
  hint?: string;
  /** 바로 위에 같은 제목이 이미 보이면 true. 읽기 이름은 그대로 label을 쓴다. */
  labelHidden?: boolean;
};

export function TextField({ label, error, hint, labelHidden, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Field error={error} hint={hint} label={label} labelHidden={labelHidden}>
      <TextInput
        accessibilityLabel={error ? `${label}, 오류: ${error}` : label}
        placeholderTextColor={colors.text.secondary}
        {...inputProps}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError]}
      />
    </Field>
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.body4,
    minHeight: layout.touchTargetMin,
    backgroundColor: colors.background.surface,
    borderColor: colors.border.control,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    color: colors.text.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  inputFocused: {
    borderColor: colors.focus.ring,
    borderWidth: strokes.focus,
  },
  inputError: {
    borderColor: colors.border.error,
    borderWidth: strokes.focus,
  },
});
