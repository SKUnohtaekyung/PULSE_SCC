import type { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 화면 위쪽 네이비 헤더. Step 5 합성에서 입력·진행 화면의 헤더를 네이비로 정했다.
// 상태 표시줄 아이콘 색은 화면마다 StatusBar로 지정한다.

export function ScreenHeader({
  title,
  badge,
  right,
}: {
  title?: string;
  badge?: string;
  right?: ReactNode;
}) {
  const { fontScale, width } = useWindowDimensions();
  const horizontalPadding = width >= layout.breakpoint.medium ? spacing[6] : spacing[4];
  const largeText = fontScale >= 1.5;

  return (
    <View style={styles.header}>
      <View style={[styles.inner, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.row, largeText && styles.rowLargeText]}>
          <Text accessibilityRole="header" style={styles.wordmark}>
            PULSE
          </Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand.primary,
  },
  inner: {
    alignSelf: 'center',
    gap: spacing[3],
    maxWidth: layout.readingMaxWidth,
    paddingBottom: spacing[6],
    paddingTop: spacing[3],
    width: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: spacing[12],
  },
  rowLargeText: {
    flexWrap: 'wrap',
  },
  wordmark: {
    ...typography.head4,
    color: colors.text.inverse,
  },
  // 배지는 View로 감싸지 않고 Text 자체에 테두리를 준다.
  // Text를 View 안에 넣으면 Android에서 글자 너비를 짧게 재서 '저장된 결과'가 '저장된 결'로 잘렸다.
  badge: {
    ...typography.body6,
    color: colors.text.inverse,
    borderColor: colors.text.inverse,
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
    flexShrink: 0,
    overflow: 'hidden',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  right: {
    marginLeft: 'auto',
  },
  title: {
    ...typography.head3,
    color: colors.text.inverse,
  },
});
