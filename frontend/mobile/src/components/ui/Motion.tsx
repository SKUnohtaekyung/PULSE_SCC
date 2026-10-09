import { type ReactNode, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  type DimensionValue,
  Easing,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { motion, spacing } from '@/design/tokens';

// 화면에 움직임을 주는 공용 조각(2026-10-09 사용자 요청 — 화면이 전체적으로 정적이다).
// 모두 '나타날 때 한 번'만 움직인다. 되풀이되는 장식 모션이 아니고, 무엇이 새로 나타났는지를 알린다
// (DESIGN_SYSTEM §9). 모션 감소 설정에서는 움직이지 않고 바로 최종 모습을 보여 준다.

/** 모션 감소 설정. 아직 확인하지 못한 동안은 null이다. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

/** 여러 조각이 차례로 나타날 때 한 칸 사이의 시차. */
export const revealStagger = motion.duration.quick / 2;

/** 0 → 1로 한 번 올라가는 값. 나타나는 순간의 움직임에 쓴다. */
function useEntrance(delay: number, useNativeDriver: boolean) {
  const reduceMotion = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // 설정을 확인하기 전에는 시작하지 않는다. 모션 감소 사용자에게 첫 움직임이 새어 나가지 않게 한다.
    if (reduceMotion === null) return;
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      delay,
      duration: motion.duration.reveal,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduceMotion, useNativeDriver]);

  return progress;
}

/** 나타날 때 살짝 떠오르며 또렷해진다. 감싼 내용의 배치는 style로 그대로 넘긴다. */
export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  /** 앞선 조각 뒤에 차례로 나타나게 할 때의 지연(ms). */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useEntrance(delay, true);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [spacing[4], 0] });
  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/** 막대가 0에서 제 길이까지 자란다. 가로 막대는 width, 세로 단상은 height를 준다. */
export function Grow({
  children,
  delay = 0,
  width,
  height,
  style,
}: {
  children?: ReactNode;
  delay?: number;
  /** 최종 가로 길이(예: '56%'). */
  width?: DimensionValue;
  /** 최종 세로 길이(dp). */
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  // 길이는 레이아웃 속성이라 네이티브 드라이버를 쓸 수 없다. 한 번만 움직이는 짧은 모션이다.
  const progress = useEntrance(delay, false);
  const animated: Animated.WithAnimatedObject<ViewStyle> = {};
  if (typeof width === 'string' && width.endsWith('%')) {
    animated.width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', width] });
  } else if (typeof width === 'number') {
    animated.width = progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  }
  if (height !== undefined) {
    animated.height = progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] });
  }
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
