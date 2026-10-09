import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout, radii, spacing, typography } from '@/design/tokens';

// 분석을 기다리는 동안 보여 주는 안내. 분석이 오래 걸려 화면이 비어 보이고 지루하다는 피드백에서 나왔다
// (2026-10-05 팀 디자인 피드백 #1·#13). 결과 화면을 어떻게 읽는지 미리 알려 준다.
//
// 진행 상황을 흉내 내지 않는다 — 안내는 분석 단계와 무관하게 넘어가고, 얼마나 남았는지 말하지 않는다
// (DESIGN_SYSTEM §9). 모션 감소 설정이나 화면 읽기 기능을 쓰는 중에는 스스로 넘어가지 않고 사용자가 누를 때만 바뀐다.

const tips = [
  {
    title: '손님 유형은 리뷰 수 순서로 보여 드려요',
    body: '리뷰에 자주 나온 손님 이야기를 최대 세 가지로 묶어 순위대로 정리해요.',
  },
  {
    title: "'AI 해석'이 붙은 굵은 문장은 AI의 해석이에요",
    body: '해석 바로 아래에 리뷰에서 확인한 사실과 실제 리뷰가 이어져요.',
  },
  {
    title: '실제 리뷰를 바로 확인할 수 있어요',
    body: '어떤 리뷰에서 나온 이야기인지 눌러서 볼 수 있어요.',
  },
  {
    title: '제안은 참고 의견이에요',
    body: '검토해 볼 행동을 정리해 드리지만 결과를 보장하지는 않아요.',
  },
] as const;

const autoAdvanceMs = 6000;

export function WaitingTips({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const [index, setIndex] = useState(0);
  // 화면 읽기 기능을 쓰는 중에는 읽는 도중 내용이 바뀌지 않게 스스로 넘기지 않는다.
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion || screenReader) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % tips.length), autoAdvanceMs);
    return () => clearInterval(timer);
    // index를 넣어, 사용자가 직접 넘긴 뒤에는 그때부터 다시 센다.
  }, [index, reduceMotion, screenReader]);

  const tip = tips[index];

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>기다리는 동안 · 결과는 이렇게 읽어요</Text>
      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.body}>{tip.body}</Text>
      <View style={styles.footer}>
        <View accessibilityLabel={`안내 ${tips.length}개 중 ${index + 1}번째`} accessible style={styles.dots}>
          {tips.map((item, dot) => (
            <View key={item.title} style={[styles.dot, dot === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIndex((current) => (current + 1) % tips.length)}
          style={({ pressed }) => [styles.next, pressed && styles.pressed]}
        >
          <Text style={styles.nextText}>다음 안내</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.tint,
    borderRadius: radii.panel,
    gap: spacing[2],
    padding: spacing[5],
  },
  eyebrow: {
    ...typography.caption,
    color: colors.text.brand,
  },
  title: {
    ...typography.body1,
    color: colors.text.strong,
  },
  body: {
    ...typography.body4,
    color: colors.text.primary,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  dot: {
    backgroundColor: colors.border.brand,
    borderRadius: radii.pill,
    height: spacing[2],
    width: spacing[2],
  },
  dotActive: {
    backgroundColor: colors.brand.primary,
    width: spacing[4],
  },
  next: {
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
    paddingLeft: spacing[3],
  },
  nextText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  pressed: {
    opacity: 0.9,
  },
});
