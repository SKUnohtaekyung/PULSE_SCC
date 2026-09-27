import type { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { usePagePadding } from '@/components/ui/Screen';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 화면 위쪽 머리. 2026-09-26 발표 시안에 맞춰 흰 배경 + 얇은 아래 경계선으로 바꿨다.
// 네이비 헤더는 화면마다 큰 색면을 차지해 정작 읽어야 할 결과보다 먼저 눈에 들어왔다.
//
// - brand: 왼쪽에 PULSE 워드마크를 둔다. 결과를 보여 주는 화면에서 쓴다.
// - label: 왼쪽에 지금 어느 화면인지 알리는 짧은 말. 작업 화면에서 쓴다.
// - badge: 오른쪽 상태 칩. 화면의 큰 제목은 헤더가 아니라 본문 첫 줄이 맡는다.

export function ScreenHeader({
  brand = false,
  label,
  badge,
  right,
}: {
  brand?: boolean;
  label?: string;
  badge?: string;
  right?: ReactNode;
}) {
  const { fontScale } = useWindowDimensions();
  const horizontalPadding = usePagePadding();
  const largeText = fontScale >= 1.5;

  return (
    <View style={styles.header}>
      <View
        style={[styles.inner, largeText && styles.innerLargeText, { paddingHorizontal: horizontalPadding }]}
      >
        {brand ? (
          <Text accessibilityRole="header" style={styles.wordmark}>
            PULSE
          </Text>
        ) : null}
        {label ? (
          <Text accessibilityRole="header" style={styles.label}>
            {label}
          </Text>
        ) : null}
        <View style={largeText ? styles.trailingWrapped : styles.trailing}>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          {right}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.surface,
    borderBottomColor: colors.border.default,
    borderBottomWidth: strokes.hairline,
  },
  inner: {
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: layout.touchTargetMin,
    paddingVertical: spacing[2],
  },
  // 글자를 키우면 한 줄에 다 들어가지 않는다. 배지를 다음 줄로 내린다.
  innerLargeText: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  wordmark: {
    ...typography.body1,
    color: colors.brand.primary,
    letterSpacing: 1,
  },
  label: {
    ...typography.body6,
    color: colors.text.strong,
  },
  trailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginLeft: 'auto',
  },
  trailingWrapped: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  // 배지는 View로 감싸지 않고 Text 자체에 테두리를 준다.
  // Text를 View 안에 넣으면 Android에서 글자 너비를 짧게 재서 '저장된 결과'가 '저장된 결'로 잘렸다.
  badge: {
    ...typography.body7,
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.pill,
    color: colors.text.secondary,
    overflow: 'hidden',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
});
