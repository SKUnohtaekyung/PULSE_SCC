import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Modal, StyleSheet, Text, View } from 'react-native';

import { appMaxWidth } from '@/demo/appFrame';
import { PulsePlayer } from '@/demo/motion/PulsePlayer';
import { WaitingTips } from '@/features/analysis/WaitingTips';
import { colors, layout, radii, spacing, typography } from '@/design/tokens';

// 분석이 진행되는 동안 화면을 덮는 진행 화면. 시연 사이트는 발표 시안의 스플래시를 따른다:
// PULSE 로고 → 맥박 신호(Remotion) → 지금 하는 일 → 진행 막대 → "외식업의 맥박을 읽다".
// (원본 앱은 팝업 안의 퍼센트 원형 게이지다 — 2026-10-09 사용자 결정.)
//
// 닫는 버튼이 없고 뒤로가기로도 닫히지 않는다 — 분석이 끝나거나 실패해 화면이 바뀔 때 화면 쪽에서 내린다.
// 진행 막대는 서버가 확인해 준 단계에서만 움직인다. 시간에 맞춰 채우지 않는다(DESIGN_SYSTEM §9).
// 맥박 신호는 "읽는 중"이라는 분위기를 주는 장식이며 진행 정도를 뜻하지 않는다.

export function AnalysisProgressDialog({
  visible,
  progress,
  stepLabel,
  offline = false,
  reduceMotion = false,
}: {
  visible: boolean;
  /** 원본 앱은 진행 화면에 가게 이름을 보여 준다. 시연 사이트는 시안에 따라 보여 주지 않는다. */
  storeName?: string;
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
      // 막대 폭은 네이티브 드라이버로 움직일 수 없다.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, reduceMotion, safeProgress]);

  const width = animated.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

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
      <View accessibilityViewIsModal style={styles.screen}>
        <View style={styles.center}>
          <Image
            accessibilityLabel="PULSE"
            resizeMode="contain"
            source={require('@/assets/images/brand/pulse-wordmark.png')}
            style={styles.wordmark}
          />

          <View style={styles.monitor}>
            <PulsePlayer loop />
          </View>

          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              리뷰에서 손님을 찾고 있어요
            </Text>
            <Text accessibilityLiveRegion="polite" style={[styles.step, offline && styles.stepWarning]}>
              {offline ? '연결이 끊겼어요. 연결되면 이어서 확인해요' : stepLabel}
            </Text>
          </View>

          <View
            accessibilityLabel={`분석 진행률 ${safeProgress}%, ${stepLabel}`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: safeProgress }}
            accessible
            style={styles.track}
          >
            <Animated.View style={[styles.bar, { width }]} />
          </View>

          {/* 기다리는 동안 결과 읽는 법을 알려 준다. 원본 앱은 진행 화면 뒤에 깔려 보이지 않았다(2026-11-15). */}
          <View style={styles.tips}>
            <WaitingTips reduceMotion={reduceMotion} />
          </View>
        </View>

        <Text style={styles.tagline}>외식업의 맥박을 읽다</Text>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 시연 앱: PC에서도 앱 기둥(휴대폰 폭) 안에만 덮는다. 바깥은 비워 두어 PC 배경이 그대로 보인다.
  backdrop: {
    flex: 1,
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: appMaxWidth,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[16],
    paddingBottom: spacing[10],
  },
  center: {
    flex: 1,
    width: '100%',
    maxWidth: layout.readingMaxWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
  },
  wordmark: {
    width: spacing[32],
    height: spacing[32] * (673 / 1740),
  },
  monitor: {
    width: '100%',
    marginVertical: -spacing[2],
  },
  heading: {
    alignItems: 'center',
    gap: spacing[1],
  },
  title: {
    ...typography.head5,
    color: colors.text.strong,
    textAlign: 'center',
  },
  // 시안처럼 짧은 막대. 길이는 서버가 확인해 준 단계만큼만 찬다.
  track: {
    width: spacing[32] + spacing[16],
    height: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: colors.background.emphasized,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.brand.primary,
  },
  step: {
    ...typography.body7,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stepWarning: {
    color: colors.status.warningText,
  },
  tips: {
    width: '100%',
    marginTop: spacing[4],
  },
  tagline: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
});
