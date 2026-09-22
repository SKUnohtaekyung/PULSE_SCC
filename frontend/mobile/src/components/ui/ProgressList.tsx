import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, strokes, typography } from '@/design/tokens';

// 분석 진행 목록. 받은 단계를 쌓아 보여준다(Step 5 합성, SCREEN_STATES §5).
// 서버가 보내지 않은 단계를 시간에 맞춰 흉내 내지 않는다.
// 실패하면 마지막 진행 행은 '멈춘 행'으로 두고 목록 끝에 실패 결과 행을 붙인다(§5.1).

export type ProgressRowState = 'done' | 'running' | 'paused' | 'failed';

export type ProgressRow = {
  key: string;
  label: string;
  state: ProgressRowState;
  note?: string;
};

export function ProgressList({
  rows,
  reduceMotion = false,
  hint,
}: {
  rows: ProgressRow[];
  reduceMotion?: boolean;
  hint?: string;
}) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.card}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
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
            <Text
              style={[
                styles.label,
                row.state === 'running' && styles.labelRunning,
                row.state === 'failed' && styles.labelFailed,
              ]}
            >
              {row.label}
            </Text>
            {row.note ? <Text style={styles.note}>{row.note}</Text> : null}
          </View>
        </View>
      ))}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const markerSize = 20;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radii.panel,
    borderWidth: strokes.hairline,
    gap: spacing[4],
    padding: spacing[5],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing[6],
    paddingTop: spacing[1],
  },
  done: {
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.pill,
    height: markerSize,
    justifyContent: 'center',
    width: markerSize,
  },
  doneMark: {
    ...typography.caption,
    color: colors.text.inverse,
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
