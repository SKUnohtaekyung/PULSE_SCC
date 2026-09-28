import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/design/tokens';

// 입력 한 묶음의 공통 껍데기. label은 항상 보이고 오류는 입력 바로 아래에 둔다(DESIGN_SYSTEM §5.5).
// 글자 입력은 TextField가, 선택(칩 등)은 이 컴포넌트가 직접 감싼다.

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          ! {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing[2],
  },
  label: {
    ...typography.body6,
    color: colors.text.primary,
  },
  error: {
    ...typography.errorText,
    color: colors.status.errorText,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
