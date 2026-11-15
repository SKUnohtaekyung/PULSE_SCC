import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/design/tokens';

const targetLetters = ['P', 'U', 'L', 'S', 'E'] as const;
const flipSequences = [
  ['7', 'R', 'P'],
  ['4', 'M', 'U'],
  ['8', 'I', 'L'],
  ['3', 'Z', 'S'],
  ['6', 'F', 'E'],
] as const;

export function SplitFlapLogo({
  logo,
  onComplete,
}: {
  logo: ImageSourcePropType;
  onComplete: (reduceMotion: boolean) => void;
}) {
  const [letters, setLetters] = useState<string[]>(() => flipSequences.map(([first]) => first));
  const [flipValues] = useState(() => targetLetters.map(() => new Animated.Value(0)));
  const [tilesOpacity] = useState(() => new Animated.Value(1));
  const [logoOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const animations: Animated.CompositeAnimation[] = [];

    const schedule = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        if (!cancelled) callback();
      }, delay);
      timers.push(timer);
    };

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;

      if (reduceMotion) {
        setLetters([...targetLetters]);
        tilesOpacity.setValue(0);
        logoOpacity.setValue(1);
        schedule(() => onComplete(true), 600);
        return;
      }

      flipSequences.forEach((sequence, letterIndex) => {
        sequence.forEach((character, stepIndex) => {
          schedule(() => {
            setLetters((current) => {
              const next = [...current];
              next[letterIndex] = character;
              return next;
            });
            flipValues[letterIndex].setValue(0);
            const animation = Animated.timing(flipValues[letterIndex], {
              duration: 105,
              easing: Easing.out(Easing.cubic),
              toValue: 1,
              useNativeDriver: true,
            });
            animations.push(animation);
            animation.start();
          }, letterIndex * 70 + stepIndex * 120);
        });
      });

      schedule(() => {
        const reveal = Animated.parallel([
          Animated.timing(tilesOpacity, {
            duration: 220,
            easing: Easing.in(Easing.quad),
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
            toValue: 1,
            useNativeDriver: true,
          }),
        ]);
        animations.push(reveal);
        reveal.start();
      }, 780);

      schedule(() => onComplete(false), 1480);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      animations.forEach((animation) => animation.stop());
    };
  }, [flipValues, logoOpacity, onComplete, tilesOpacity]);

  return (
    <View accessibilityLabel="PULSE" accessibilityRole="text" style={styles.stage}>
      <Animated.View aria-hidden style={[styles.tileRow, { opacity: tilesOpacity }]}>
        {letters.map((letter, index) => {
          const rotateX = flipValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['-82deg', '0deg'],
          });
          const shade = flipValues[index].interpolate({
            inputRange: [0, 0.65, 1],
            outputRange: [0.48, 0.92, 1],
          });

          return (
            <Animated.View
              key={targetLetters[index]}
              style={[styles.tile, { opacity: shade, transform: [{ perspective: 520 }, { rotateX }] }]}
            >
              <View style={styles.tileTopHighlight} />
              <View style={styles.tileDivider} />
              <Text style={styles.letter}>{letter}</Text>
            </Animated.View>
          );
        })}
      </Animated.View>

      <Animated.Image
        aria-hidden
        resizeMode="contain"
        source={logo}
        style={[styles.logo, { opacity: logoOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    height: spacing[32],
    justifyContent: 'center',
    width: spacing[32] * 2 + spacing[16],
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tile: {
    ...shadows.soft,
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    borderColor: colors.border.brand,
    borderRadius: radii.control,
    borderWidth: 1,
    height: spacing[16],
    justifyContent: 'center',
    overflow: 'hidden',
    width: spacing[12],
  },
  tileTopHighlight: {
    backgroundColor: colors.brand.subduedOverlay,
    height: '50%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tileDivider: {
    backgroundColor: colors.brand.strongOverlay,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  letter: {
    ...typography.head2,
    color: colors.brand.onPrimary,
  },
  logo: {
    height: spacing[32],
    position: 'absolute',
    width: spacing[32] * 2 + spacing[16],
  },
});
