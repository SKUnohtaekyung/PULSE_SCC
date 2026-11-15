import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SuccessCheckIcon } from '@/components/icons/SuccessCheckIcon';
import { Screen } from '@/components/ui/Screen';
import { colors, fontFamilies, radii, spacing, strokes, typography } from '@/design/tokens';
import { filledSlots } from '@/features/result/resultFormat';
import { useAnalysisResult } from '@/features/result/useAnalysisResult';

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
  // 시연 앱: 저장된 결과의 TOP3를 미리 보여 준다. 첫 결과를 받는 순간에 "무엇을 찾았는지"가 보이게 한다(2026-11-15).
  // 불러오지 못하면 이 목록만 빼고 나머지는 그대로 보인다.
  const { state } = useAnalysisResult({ kind: 'saved' });
  const top = state.phase === 'ready' ? filledSlots(state.result) : [];
  return (
    <Screen centered verticalEdges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View accessibilityLabel="분석 완료" accessibilityRole="image" style={styles.mark}>
        <SuccessCheckIcon color={colors.status.success} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>분석 완료</Text>
        <Text accessibilityRole="header" style={styles.title}>
          첫 분석 결과를 저장했어요
        </Text>
        <Text style={styles.body1}>홈에서 언제든 다시 확인할 수 있어요.</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>분석한 가게</Text>
        <Text style={styles.summaryName}>{storeName}</Text>
        {validReviewCount !== null || personaCount !== null ? (
          <View style={styles.metrics}>
            {validReviewCount !== null ? (
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{validReviewCount}건</Text>
                <Text style={styles.metricLabel}>분석한 리뷰</Text>
              </View>
            ) : null}
            {validReviewCount !== null && personaCount !== null ? <View style={styles.divider} /> : null}
            {personaCount !== null ? (
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{personaCount}개</Text>
                <Text style={styles.metricLabel}>찾은 손님 유형</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {top.length > 0 ? (
        <View style={styles.top}>
          <Text style={styles.topTitle}>리뷰에 많이 나온 손님</Text>
          {top.map((slot) => (
            <View key={slot.rank} style={styles.topRow}>
              {/* 주황 포인트: 1위 순위 표시. */}
              <Text style={[styles.topRank, slot.rank === 1 && styles.topRankFirst]}>{slot.rank}</Text>
              <Text numberOfLines={1} style={styles.topLabel}>
                {slot.persona?.label}
              </Text>
              {slot.topicReviewCount !== undefined ? (
                <Text style={styles.topCount}>리뷰 {slot.topicReviewCount}건</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <Button label="결과 보기" onPress={() => router.replace('/home')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.status.successSubtle,
    borderRadius: radii.pill,
    height: spacing[14],
    justifyContent: 'center',
    width: spacing[14],
  },
  heading: {
    alignItems: 'center',
    gap: spacing[2],
  },
  eyebrow: {
    ...typography.body6,
    color: colors.status.success,
  },
  title: {
    ...typography.head3,
    color: colors.text.strong,
    textAlign: 'center',
  },
  body1: {
    ...typography.body4,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[3],
    padding: spacing[5],
    width: '100%',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  summaryName: {
    ...typography.body1,
    color: colors.text.primary,
  },
  metrics: {
    backgroundColor: colors.background.subtle,
    borderRadius: radii.control,
    flexDirection: 'row',
    padding: spacing[4],
  },
  metric: {
    flex: 1,
    gap: spacing[1],
  },
  metricValue: {
    ...typography.head5,
    color: colors.text.brand,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  top: {
    width: '100%',
    gap: spacing[2],
  },
  topTitle: {
    ...typography.body6,
    color: colors.text.secondary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  topRank: {
    ...typography.body5,
    width: spacing[6],
    height: spacing[6],
    lineHeight: spacing[6],
    textAlign: 'center',
    borderRadius: radii.pill,
    overflow: 'hidden',
    color: colors.text.brand,
    backgroundColor: colors.background.emphasized,
  },
  topRankFirst: {
    color: colors.action.onPrimary,
    backgroundColor: colors.action.primary,
  },
  topLabel: {
    ...typography.body4,
    fontFamily: fontFamilies.semibold,
    color: colors.text.strong,
    flex: 1,
  },
  topCount: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  divider: {
    backgroundColor: colors.border.default,
    marginHorizontal: spacing[4],
    width: strokes.hairline,
  },
});
