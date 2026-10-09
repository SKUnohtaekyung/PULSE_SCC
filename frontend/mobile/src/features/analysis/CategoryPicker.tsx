import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/icons/CategoryIcons';
import { useReduceMotion } from '@/components/ui/Motion';
import { colors, fontFamilies, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 업종 선택. 글자 칩을 늘어놓던 것을 아이콘 타일 격자로 바꿨다(2026-10-09 사용자 요청).
// 하나만 고르는 선택이라 radiogroup이고, 고른 칸은 색·굵기와 접근성 상태로 함께 알린다.

const columns = 4;
const gap = spacing[2];

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: readonly string[];
  value: string;
  onChange: (category: string) => void;
}) {
  // 칸 폭을 재서 4칸으로 나눈다. 마지막 줄이 모자라도 칸 폭은 같게 둔다.
  const [width, setWidth] = useState(0);
  const tileWidth = width > 0 ? (width - gap * (columns - 1)) / columns : 0;

  return (
    <View
      accessibilityLabel="업종"
      accessibilityRole="radiogroup"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.grid}
    >
      {tileWidth > 0
        ? categories.map((category) => (
            <CategoryTile
              category={category}
              key={category}
              onPress={() => onChange(category)}
              selected={value === category}
              width={tileWidth}
            />
          ))
        : null}
    </View>
  );
}

function CategoryTile({
  category,
  selected,
  width,
  onPress,
}: {
  category: string;
  selected: boolean;
  width: number;
  onPress: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(1));

  // 고른 순간 한 번 통 튀어 고른 칸이 어디인지 알린다. 처음부터 골라져 있던 칸(미리 채움)은 튀지 않는다.
  const wasSelected = useRef(selected);
  useEffect(() => {
    const justSelected = selected && !wasSelected.current;
    wasSelected.current = selected;
    if (!justSelected || reduceMotion !== false) return;
    scale.setValue(0.92);
    const animation = Animated.spring(scale, { friction: 5, toValue: 1, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, scale, selected]);

  return (
    <Animated.View style={{ transform: [{ scale }], width }}>
      <Pressable
        accessibilityLabel={category}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        onPress={onPress}
        style={({ pressed }) => [styles.tile, selected && styles.tileSelected, pressed && styles.pressed]}
      >
        <CategoryIcon
          category={category}
          color={selected ? colors.brand.onPrimary : colors.text.secondary}
        />
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {category}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radii.control,
    borderWidth: strokes.hairline,
    gap: spacing[1],
    justifyContent: 'center',
    minHeight: layout.touchTargetMin + spacing[8],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[3],
  },
  tileSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  // 글자를 키워도 잘리지 않게 줄 수를 제한하지 않는다. 길면 줄을 바꾸고 타일이 함께 높아진다(DESIGN_SYSTEM §8).
  label: {
    ...typography.caption,
    color: colors.text.primary,
    textAlign: 'center',
  },
  labelSelected: {
    fontFamily: fontFamilies.semibold,
    color: colors.brand.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
