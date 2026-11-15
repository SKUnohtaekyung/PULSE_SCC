import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { useReduceMotion } from '@/components/ui/Motion';
import { motion, spacing } from '@/design/tokens';

// 하위 화면이 열릴 때 본문이 오른쪽에서 살짝 밀려 들어온다(시연 앱, 2026-11-15).
// 웹의 화면 쌓기(Stack)는 전환 움직임이 없어 화면이 바뀐 줄 알기 어려웠다.
// 머리(뒤로가기)는 움직이지 않고 본문만 움직인다. 한 번만 움직이며, 모션 감소 설정에서는 바로 보인다(DESIGN_SYSTEM §9).
export function PageEnter({ children }: { children: ReactNode }) {
  const reduceMotion = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      duration: motion.duration.emphasized,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.page,
        {
          opacity: progress,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [spacing[6], 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
  },
});
