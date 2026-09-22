import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, strokes, typography } from '@/design/tokens';

// 하단 내비게이션. 상태 정본은 SCREEN_STATES §9다.
// 저장 결과가 없는 사용자와 첫 저장 완료 화면·새 결과 미리보기에서는 이 컴포넌트를 아예 그리지 않는다(NAV-HIDDEN).
// 분석하기가 현재 화면이면 가운데 원을 brand.primary로 바꾸고 눌러도 이동하지 않는다(NAV-ANALYSIS-ACTIVE).
//
// 아이콘은 라이브러리를 쓰지 않고 View 도형으로 그린다(2026-09-22 Step 7 결정, DESIGN_SYSTEM §13).

export type NavTarget = 'home' | 'analysis' | 'mypage';

function HomeIcon({ color }: { color: string }) {
  return (
    <View aria-hidden style={styles.homeIcon}>
      <View style={[styles.homeRoof, { borderColor: color }]} />
      <View style={[styles.homeBody, { borderColor: color }]} />
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View aria-hidden style={styles.profileIcon}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

function AnalysisIcon({ color = colors.action.onPrimary }: { color?: string }) {
  return (
    <View aria-hidden style={styles.analysisBars}>
      <View style={[styles.analysisBar, styles.analysisBarShort, { backgroundColor: color }]} />
      <View style={[styles.analysisBar, styles.analysisBarMedium, { backgroundColor: color }]} />
      <View style={[styles.analysisBar, styles.analysisBarTall, { backgroundColor: color }]} />
    </View>
  );
}

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
        onPress={onHome ?? (() => unavailable('홈'))}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
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
          <AnalysisIcon color={analysisActive ? colors.brand.onPrimary : colors.action.onPrimary} />
        </View>
        <Text style={styles.analysisNavLabel}>분석하기</Text>
      </Pressable>

      <Pressable
        accessibilityLabel={mypageActive ? '마이페이지, 현재 화면' : '마이페이지'}
        accessibilityRole="button"
        accessibilityState={{ selected: mypageActive }}
        onPress={onMyPage ?? (() => unavailable('마이페이지'))}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
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
  analysisBars: {
    height: spacing[6],
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  analysisBar: {
    width: spacing[1],
    backgroundColor: colors.action.onPrimary,
    borderRadius: radii.small,
  },
  analysisBarShort: {
    height: spacing[2],
  },
  analysisBarMedium: {
    height: spacing[4],
  },
  analysisBarTall: {
    height: spacing[6],
  },
  homeIcon: {
    width: spacing[6],
    height: spacing[6],
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeRoof: {
    position: 'absolute',
    top: spacing[1],
    width: spacing[4],
    height: spacing[4],
    borderLeftWidth: strokes.focus,
    borderTopWidth: strokes.focus,
    transform: [{ rotate: '45deg' }],
  },
  homeBody: {
    width: spacing[4],
    height: spacing[3],
    borderBottomWidth: strokes.focus,
    borderLeftWidth: strokes.focus,
    borderRightWidth: strokes.focus,
  },
  profileIcon: {
    width: spacing[6],
    height: spacing[6],
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHead: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radii.pill,
    borderWidth: strokes.focus,
  },
  profileBody: {
    width: spacing[5],
    height: spacing[3],
    borderLeftWidth: strokes.focus,
    borderRightWidth: strokes.focus,
    borderTopLeftRadius: radii.control,
    borderTopRightRadius: radii.control,
    borderTopWidth: strokes.focus,
  },
});
