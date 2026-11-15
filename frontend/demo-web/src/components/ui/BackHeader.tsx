import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { usePagePadding } from '@/components/ui/Screen';
import { colors, layout, spacing, strokes, typography } from '@/design/tokens';

// 하위 화면의 머리: 왼쪽 뒤로가기(‹)와 화면 이름. 시연 앱이 결과를 여러 화면으로 나누면서 생겼다(2026-11-15).
// ScreenHeader는 워드마크·상태 칩을 두는 첫 화면용이라, 뒤로가기가 필요한 화면은 이 머리를 쓴다.
// 링크로 바로 들어와 돌아갈 화면이 없으면 fallback(보통 홈)으로 간다.
export function BackHeader({ title, fallback = '/home' }: { title: string; fallback?: Href }) {
  const router = useRouter();
  const horizontalPadding = usePagePadding();

  return (
    <View style={styles.header}>
      <View style={[styles.inner, { paddingRight: horizontalPadding }]}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Svg
            accessibilityElementsHidden
            height={spacing[6]}
            importantForAccessibility="no"
            viewBox="0 0 24 24"
            width={spacing[6]}
          >
            <Path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke={colors.text.strong}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={strokes.focus}
            />
          </Svg>
        </Pressable>
        <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.touchTargetMin + spacing[2],
    paddingLeft: spacing[1],
  },
  back: {
    width: layout.touchTargetMin,
    height: layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  title: {
    ...typography.body1,
    color: colors.text.strong,
    flex: 1,
  },
});
