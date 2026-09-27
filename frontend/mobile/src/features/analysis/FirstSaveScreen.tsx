import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';
import { FixtureBanner } from '@/features/dev/FixtureBanner';

// SAVE-FIRST-SUCCESS. 첫 결과는 서버가 작업 완료와 같은 트랜잭션에서 저장하므로
// 이 화면은 저장 요청 상태가 아니라 '저장됐다는 사실'을 알리는 별도 완료 화면이다(SCREEN_STATES §7).
// 하단 내비게이션은 표시하지 않는다(NAV-HIDDEN, §9).

export function FirstSaveScreen({
  storeName,
  validReviewCount,
  personaCount,
}: {
  storeName: string;
  validReviewCount: number | null;
  personaCount: number | null;
}) {
  const router = useRouter();
  const summary = [
    validReviewCount === null ? null : `분석에 쓴 리뷰 ${validReviewCount}건`,
    personaCount === null ? null : `손님 유형 ${personaCount}개`,
  ]
    .filter((item): item is string => item !== null)
    .join(' · ');

  return (
    <Screen centered verticalEdges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <FixtureBanner />

      <View aria-hidden style={styles.mark}>
        <Text style={styles.markText}>✓</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        첫 분석 결과를 저장했어요
      </Text>
      <Text style={styles.body1}>홈에서 언제든 다시 볼 수 있어요.</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryName}>{storeName}</Text>
        {summary ? <Text style={styles.summaryMeta}>{summary}</Text> : null}
      </View>

      <Button label="결과 보기" onPress={() => router.replace('/home')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 저장이 끝났다는 한 번의 신호. 주황을 쓰는 몇 안 되는 자리다(2026-09-27 디자인 리뷰 #6).
  mark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.action.primary,
    borderRadius: radii.pill,
    height: spacing[14],
    justifyContent: 'center',
    width: spacing[14],
  },
  markText: {
    ...typography.head4,
    color: colors.action.onPrimary,
  },
  title: {
    ...typography.head3,
    color: colors.text.strong,
  },
  body1: {
    ...typography.body4,
    color: colors.text.secondary,
  },
  summary: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[2],
    padding: spacing[5],
  },
  summaryName: {
    ...typography.body1,
    color: colors.text.primary,
  },
  summaryMeta: {
    ...typography.body7,
    color: colors.text.secondary,
  },
});
