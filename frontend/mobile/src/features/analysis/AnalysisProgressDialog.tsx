import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, layout, radii, spacing, typography } from '@/design/tokens';

// 분석이 진행되는 동안 화면을 덮는 진행 팝업(2026-10-09 사용자 결정). 퍼센트 게이지를 크게 두고
// 그 밑에 지금 단계를 작게 적는다.
//
// 닫는 버튼이 없고 뒤로가기로도 닫히지 않는다 — 분석이 끝나거나 실패해 화면이 바뀔 때, 또는 저장 상태를
// 확인하지 못해 뒤 화면의 재시도 버튼이 필요할 때 화면 쪽에서 내린다.
// 게이지는 서버가 확인해 준 단계에서만 움직인다. 시간에 맞춰 채우지 않는다(DESIGN_SYSTEM §9).

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const gaugeSize = spacing[32] + spacing[10];
const gaugeStroke = spacing[3];
const radius = (gaugeSize - gaugeStroke) / 2;
const circumference = 2 * Math.PI * radius;
const center = gaugeSize / 2;

export function AnalysisProgressDialog({
  visible,
  storeName,
  progress,
  stepLabel,
  offline = false,
  reduceMotion = false,
}: {
  visible: boolean;
  storeName: string;
  /** 0~100. 서버가 확인해 준 단계의 위치다. */
  progress: number;
  /** 지금 하고 있는 단계. */
  stepLabel: string;
  /** 진행 상태를 확인하는 연결이 끊겼으면 true. */
  offline?: boolean;
  reduceMotion?: boolean;
}) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const [animated] = useState(() => new Animated.Value(safeProgress));

  useEffect(() => {
    if (reduceMotion) {
      animated.setValue(safeProgress);
      return;
    }
    const animation = Animated.timing(animated, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
      toValue: safeProgress,
      // 선의 길이(strokeDashoffset)는 네이티브 드라이버로 움직일 수 없다.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, reduceMotion, safeProgress]);

  const dashOffset = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      // 분석 중에는 닫지 않는다. 뒤로가기를 눌러도 그대로 둔다.
      onRequestClose={() => undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              리뷰를 읽고 있어요
            </Text>
            {storeName ? (
              <Text numberOfLines={1} style={styles.store}>
                {storeName}
              </Text>
            ) : null}
          </View>

          <View
            accessibilityLabel={`분석 진행률 ${safeProgress}%`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: safeProgress }}
            accessible
            style={styles.gauge}
          >
            <Svg height={gaugeSize} width={gaugeSize}>
              <Circle
                cx={center}
                cy={center}
                fill="none"
                r={radius}
                stroke={colors.background.emphasized}
                strokeWidth={gaugeStroke}
              />
              <AnimatedCircle
                cx={center}
                cy={center}
                fill="none"
                origin={`${center}, ${center}`}
                r={radius}
                // 12시 방향에서 시작해 시계 방향으로 찬다.
                rotation={-90}
                stroke={colors.brand.primary}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                strokeWidth={gaugeStroke}
              />
            </Svg>
            <Text style={styles.percent}>{safeProgress}%</Text>
          </View>

          <View accessibilityLiveRegion="polite" style={styles.status}>
            <View style={styles.stepRow}>
              {reduceMotion ? null : <ActivityIndicator color={colors.brand.primary} size="small" />}
              <Text style={styles.step}>{stepLabel}</Text>
            </View>
            <Text style={[styles.note, offline && styles.noteWarning]}>
              {offline
                ? '연결이 끊겼어요. 연결되면 이어서 확인해요.'
                : '끝나면 결과 화면으로 넘어가요.'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.brand.strongOverlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing[5],
  },
  dialog: {
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: radii.panel,
    gap: spacing[5],
    maxWidth: layout.readingMaxWidth,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[8],
    width: '100%',
  },
  heading: {
    alignItems: 'center',
    gap: spacing[1],
  },
  title: {
    ...typography.head5,
    color: colors.text.strong,
  },
  store: {
    ...typography.body7,
    color: colors.text.secondary,
  },
  gauge: {
    alignItems: 'center',
    height: gaugeSize,
    justifyContent: 'center',
    width: gaugeSize,
  },
  percent: {
    ...typography.head1,
    color: colors.text.brand,
    position: 'absolute',
  },
  status: {
    alignItems: 'center',
    gap: spacing[1],
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  step: {
    ...typography.body6,
    color: colors.text.brand,
    flexShrink: 1,
  },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  noteWarning: {
    color: colors.status.warningText,
  },
});
