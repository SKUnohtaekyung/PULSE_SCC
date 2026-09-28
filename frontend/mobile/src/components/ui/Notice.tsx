import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, strokes, typography } from '@/design/tokens';

// 안내·경고·오류 한 덩어리. DESIGN_SYSTEM §5.2·§5.4와 SCREEN_STATES 공통 불변식 1·3을 따른다.
// 색만으로 뜻을 전하지 않도록 항상 제목 문장을 함께 둔다.

export type NoticeTone = 'info' | 'warning' | 'error' | 'success';

export function Notice({
  tone = 'info',
  title,
  message,
  children,
  alert = false,
}: {
  tone?: NoticeTone;
  title: string;
  message?: string;
  children?: ReactNode;
  /** 방금 생긴 오류처럼 즉시 읽혀야 하면 true. */
  alert?: boolean;
}) {
  const toneStyle = toneStyles[tone];
  return (
    <View
      accessibilityLiveRegion={alert ? 'assertive' : 'polite'}
      accessibilityRole={alert ? 'alert' : undefined}
      style={[styles.container, toneStyle.container]}
    >
      <Text style={[styles.title, toneStyle.title]}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children}
    </View>
  );
}

const toneStyles: Record<NoticeTone, { container: object; title: object }> = {
  info: {
    container: { backgroundColor: colors.brand.tint, borderColor: colors.border.brand },
    title: { color: colors.text.brand },
  },
  warning: {
    container: { backgroundColor: colors.background.subtle, borderColor: colors.status.warningText },
    title: { color: colors.status.warningText },
  },
  error: {
    container: { backgroundColor: colors.background.surface, borderColor: colors.border.error },
    title: { color: colors.status.errorText },
  },
  success: {
    container: { backgroundColor: colors.background.subtle, borderColor: colors.status.success },
    title: { color: colors.status.success },
  },
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[2],
    padding: spacing[4],
  },
  title: {
    ...typography.body6,
  },
  message: {
    ...typography.body7,
    color: colors.text.primary,
  },
});
