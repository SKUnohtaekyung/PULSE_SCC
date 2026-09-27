import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AnalysisIcon, HomeIcon, ProfileIcon } from '@/components/icons/NavIcons';
import { colors, radii, shadows, spacing, strokes, typography } from '@/design/tokens';

// 하단 내비게이션. 상태 정본은 SCREEN_STATES §9다.
// 저장 결과가 없는 사용자와 첫 저장 완료 화면·새 결과 미리보기에서는 이 컴포넌트를 아예 그리지 않는다(NAV-HIDDEN).
// 분석하기가 현재 화면이면 가운데 원을 brand.primary로 바꾸고 눌러도 이동하지 않는다(NAV-ANALYSIS-ACTIVE).
//
// 아이콘은 `components/icons/NavIcons`에 24×24 SVG로 두고 굵기·모서리 규칙을 공유한다
// (2026-09-27 디자인 리뷰 #4. 그 전에는 View 도형을 겹쳐 그려 굵기가 제각각이었다).

export type NavTarget = 'home' | 'analysis' | 'mypage';

export function BottomNavigation({
  bottomInset,
  active = 'home',
  onHome,
  onAnalyze,
  onMyPage,
}: {
  bottomInset: number;
  active?: NavTarget;
  onHome?: () => void;
  onAnalyze?: () => void;
  onMyPage?: () => void;
}) {
  const unavailable = (name: string) =>
    Alert.alert('아직 연결하지 않은 화면', `${name} 화면은 이번 범위에 들어 있지 않아요.`);
  const homeActive = active === 'home';
  const analysisActive = active === 'analysis';
  const mypageActive = active === 'mypage';

  return (
    <View
      accessibilityLabel="하단 내비게이션"
      style={[styles.bottomNavigation, { paddingBottom: Math.max(bottomInset, spacing[2]) }]}
    >
      <Pressable
        accessibilityLabel={homeActive ? '홈, 현재 화면' : '홈'}
        accessibilityRole="button"
        accessibilityState={{ selected: homeActive }}
        onPress={homeActive ? () => undefined : (onHome ?? (() => unavailable('홈')))}
        style={({ pressed }) => [styles.navItem, pressed && !homeActive && styles.pressed]}
      >
        <HomeIcon color={homeActive ? colors.brand.primary : colors.text.secondary} />
        <Text style={[styles.navLabel, homeActive && styles.navLabelSelected]}>홈</Text>
      </Pressable>

      <Pressable
        accessibilityLabel={analysisActive ? '분석하기, 현재 화면' : '분석하기'}
        accessibilityRole="button"
        accessibilityState={{ selected: analysisActive }}
        onPress={analysisActive ? () => undefined : (onAnalyze ?? (() => unavailable('분석하기')))}
        style={({ pressed }) => [
          styles.navItem,
          styles.analysisNavItem,
          pressed && !analysisActive && styles.pressed,
        ]}
      >
        <View style={[styles.analysisButton, analysisActive && styles.analysisButtonCurrent]}>
          <AnalysisIcon color={colors.action.onPrimary} />
        </View>
        <Text style={styles.analysisNavLabel}>분석하기</Text>
      </Pressable>

      <Pressable
        accessibilityLabel={mypageActive ? '마이페이지, 현재 화면' : '마이페이지'}
        accessibilityRole="button"
        accessibilityState={{ selected: mypageActive }}
        onPress={mypageActive ? () => undefined : (onMyPage ?? (() => unavailable('마이페이지')))}
        style={({ pressed }) => [styles.navItem, pressed && !mypageActive && styles.pressed]}
      >
        <ProfileIcon color={mypageActive ? colors.brand.primary : colors.text.secondary} />
        <Text style={[styles.navLabel, mypageActive && styles.navLabelSelected]}>마이페이지</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background.surface,
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
    paddingTop: spacing[2],
    paddingHorizontal: spacing[2],
  },
  pressed: {
    opacity: 0.9,
  },
  navItem: {
    minHeight: spacing[14],
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  navLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  navLabelSelected: {
    color: colors.text.brand,
  },
  analysisNavItem: {
    marginTop: -spacing[5],
  },
  analysisButton: {
    ...shadows.soft,
    width: spacing[14],
    height: spacing[14],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action.primary,
    borderColor: colors.background.surface,
    borderRadius: radii.pill,
    borderWidth: spacing[1],
  },
  analysisButtonCurrent: {
    backgroundColor: colors.brand.primary,
  },
  analysisNavLabel: {
    ...typography.caption,
    color: colors.text.brand,
  },
});
