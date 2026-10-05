import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, strokes, typography } from '@/design/tokens';

// 분석 진행 목록. 받은 단계를 쌓아 보여준다(Step 5 합성, SCREEN_STATES §5).
// 서버가 보내지 않은 단계를 시간에 맞춰 흉내 내지 않는다.
// 실패하면 마지막 진행 행은 '멈춘 행'으로 두고 목록 끝에 실패 결과 행을 붙인다(§5.1).
//
// 단계마다 시각을 적지 않는다. 서버는 지금 단계(progressStep) 하나만 보내고 단계별 시각을 주지 않는다.
// 앱이 화면에서 처음 본 시각은 서버가 그 단계를 끝낸 시각과 다르므로, 사실처럼 적지 않는다(SCREEN_STATES §11).

export type ProgressRowState = 'done' | 'running' | 'paused' | 'failed';

export type ProgressRow = {
  key: string;
  label: string;
  state: ProgressRowState;
  note?: string;
};

export function ProgressList({
  rows,
  progress,
  progressStatus,
  reduceMotion = false,
  hint,
}: {
  rows: ProgressRow[];
  progress: number;
  progressStatus: string;
  reduceMotion?: boolean;
  hint?: string;
}) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const [animatedProgress] = useState(() => new Animated.Value(safeProgress));
  const failed = rows.some((row) => row.state === 'failed');
  const running = rows.some((row) => row.state === 'running');
  // 채워진 구간 안에서만 빛이 지나간다. 막대 길이는 서버가 확인해 준 단계에서만 바뀌므로
  // 진행을 흉내 내지 않고 '지금도 일하는 중'이라는 것만 알린다(DESIGN_SYSTEM §9, 2026-10-05 팀 디자인 피드백 #11).
  const [sweep] = useState(() => new Animated.Value(0));
  const sweeping = running && !failed && !reduceMotion;

  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.setValue(safeProgress);
      return;
    }
    const animation = Animated.timing(animatedProgress, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
      toValue: safeProgress,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedProgress, reduceMotion, safeProgress]);

  useEffect(() => {
    if (!sweeping) {
      sweep.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(sweep, {
        duration: sweepDurationMs,
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, sweeping]);

  const sweepLeft = sweep.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '100%'] });

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View accessibilityLiveRegion="polite" style={styles.card}>
      <View style={styles.progressHeader}>
        <View style={styles.progressCopy}>
          <Text style={[styles.progressValue, failed && styles.progressValueFailed]}>{safeProgress}%</Text>
          <Text style={styles.progressStatus}>{progressStatus}</Text>
        </View>
      </View>
      <View
        accessibilityLabel={`분석 진행률 ${safeProgress}%`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: safeProgress }}
        style={styles.progressTrack}
      >
        <Animated.View
          style={[
            styles.progressFill,
            failed && styles.progressFillFailed,
            { width: progressWidth },
          ]}
        >
          {sweeping ? <Animated.View style={[styles.progressSweep, { left: sweepLeft }]} /> : null}
          <View style={[styles.progressKnob, failed && styles.progressKnobFailed]} />
        </Animated.View>
      </View>
      <View style={styles.rows}>
      {rows.map((row, index) => (
        <View key={row.key} style={[styles.row, index > 0 && styles.rowDivided]}>
          <View style={styles.marker}>
            {row.state === 'done' ? (
              <View style={styles.done}>
                <Text style={styles.doneMark}>✓</Text>
              </View>
            ) : row.state === 'running' ? (
              reduceMotion ? (
                <View style={styles.running} />
              ) : (
                <ActivityIndicator color={colors.brand.primary} size="small" />
              )
            ) : row.state === 'paused' ? (
              <View style={styles.paused}>
                <View style={styles.pausedBar} />
              </View>
            ) : (
              <View style={styles.failed}>
                <Text style={styles.failedMark}>!</Text>
              </View>
            )}
          </View>
          <View style={styles.copy}>
            <View style={styles.labelRow}>
              <Text
                style={[
                  styles.label,
                  row.state === 'running' && styles.labelRunning,
                  row.state === 'failed' && styles.labelFailed,
                ]}
              >
                {row.label}
              </Text>
              {row.state === 'running' ? <Text style={styles.stateBadge}>진행 중</Text> : null}
            </View>
            {row.note ? <Text style={styles.note}>{row.note}</Text> : null}
          </View>
        </View>
      ))}
      </View>
      {hint ? (
        <View style={styles.hintRow}>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const markerSize = 20;
const sweepDurationMs = 1600;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[3],
    padding: spacing[4],
  },
  progressHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCopy: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing[2],
  },
  progressValue: {
    ...typography.head2,
    color: colors.text.brand,
  },
  progressValueFailed: {
    color: colors.status.errorText,
  },
  progressStatus: {
    ...typography.body6,
    color: colors.text.primary,
  },
  progressTrack: {
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.pill,
    height: spacing[3],
    overflow: 'hidden',
  },
  progressFill: {
    alignItems: 'flex-end',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.pill,
    height: '100%',
    justifyContent: 'center',
    minWidth: spacing[3],
    overflow: 'hidden',
  },
  progressSweep: {
    backgroundColor: colors.brand.onPrimary,
    bottom: 0,
    opacity: 0.25,
    position: 'absolute',
    top: 0,
    width: '40%',
  },
  progressFillFailed: {
    backgroundColor: colors.status.errorText,
  },
  progressKnob: {
    backgroundColor: colors.brand.onPrimary,
    borderRadius: radii.pill,
    height: spacing[2],
    marginRight: spacing[1] / 2,
    width: spacing[2],
  },
  progressKnobFailed: {
    backgroundColor: colors.text.inverse,
  },
  rows: {
    gap: spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  rowDivided: {
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
    paddingTop: spacing[3],
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stateBadge: {
    ...typography.caption,
    backgroundColor: colors.brand.tint,
    borderRadius: radii.pill,
    color: colors.text.brand,
    overflow: 'hidden',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  hintRow: {
    borderTopColor: colors.border.default,
    borderTopWidth: strokes.hairline,
    borderStyle: 'dashed',
    paddingTop: spacing[3],
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing[6],
    paddingTop: spacing[1],
  },
  // 끝난 단계가 여러 줄 쌓이므로 진한 초록을 넓게 깔지 않는다(2026-09-27 디자인 리뷰 #8).
  done: {
    alignItems: 'center',
    backgroundColor: colors.status.successSubtle,
    borderRadius: radii.pill,
    height: markerSize,
    justifyContent: 'center',
    width: markerSize,
  },
  doneMark: {
    ...typography.body5,
    color: colors.status.success,
  },
  running: {
    borderColor: colors.brand.primary,
    borderRadius: radii.pill,
    borderWidth: strokes.focus,
    height: markerSize,
    width: markerSize,
  },
  paused: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.pill,
    borderWidth: strokes.hairline,
    height: markerSize,
    justifyContent: 'center',
    width: markerSize,
  },
  pausedBar: {
    backgroundColor: colors.text.secondary,
    height: strokes.focus,
    width: markerSize / 2,
  },
  failed: {
    alignItems: 'center',
    backgroundColor: colors.status.errorText,
    borderRadius: radii.pill,
    height: markerSize,
    justifyContent: 'center',
    width: markerSize,
  },
  failedMark: {
    ...typography.caption,
    color: colors.text.inverse,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  label: {
    ...typography.body7,
    color: colors.text.primary,
  },
  labelRunning: {
    ...typography.body6,
    color: colors.text.brand,
  },
  labelFailed: {
    ...typography.body6,
    color: colors.status.errorText,
  },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
