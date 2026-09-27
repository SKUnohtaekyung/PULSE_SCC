import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PersonaImageSource } from '@/api/personaImages';
import type { PodiumSlot } from '@/api/types';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';

// 리뷰에 많이 나온 손님 TOP3. 1위를 가운데 가장 높게 두는 시상대 배치다(2026-09-26 발표 시안).
// 좌우 순서는 2위 · 1위 · 3위이고, 단상 높이로 순위를 한 번 더 알린다.
// 정본: SCREEN_STATES §6.1(빈 슬롯과 최초 선택), DESIGN_SYSTEM §3.6(생성 이미지 고지).

/** 화면에 놓이는 좌우 순서. 값은 rank다. */
const displayOrder = [2, 1, 3] as const;

/** 단상 높이. 순위가 높을수록 높다. 글자 크기와 무관한 장식이라 고정값을 쓴다. */
const blockHeights: Record<number, number> = {
  1: spacing[20],
  2: spacing[14],
  3: spacing[12],
};

export function PodiumTop3({
  podium,
  selectedRank,
  onSelect,
  imageSource,
}: {
  podium: PodiumSlot[];
  selectedRank: number | null;
  onSelect: (rank: number) => void;
  /** rank에 해당하는 손님 유형 그림. 없으면 자리표시를 그린다. */
  imageSource: (slot: PodiumSlot) => PersonaImageSource;
}) {
  const byRank = new Map(podium.map((slot) => [slot.rank, slot]));

  return (
    <View style={styles.row}>
      {displayOrder.map((rank) => {
        const slot = byRank.get(rank);
        if (!slot) return <View key={rank} style={styles.column} />;

        const filled = slot.status === 'FILLED' && slot.persona;
        const selected = selectedRank === rank;

        if (!filled) {
          return (
            <View key={rank} style={styles.column}>
              <View style={[styles.emptyAvatar, rank === 1 && styles.emptyAvatarFirst]} />
              <Text style={styles.emptyReason}>
                {slot.reason?.message ?? '채우지 못한 자리예요.'}
              </Text>
              <View style={[styles.block, styles.blockEmpty, { height: blockHeights[rank] }]}>
                <Text style={styles.blockRankEmpty}>{rank}</Text>
              </View>
            </View>
          );
        }

        const persona = slot.persona;
        if (!persona) return <View key={rank} style={styles.column} />;

        return (
          <Pressable
            accessibilityLabel={`${rank}위 ${persona.label}, 리뷰 ${slot.topicReviewCount ?? 0}건`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={rank}
            onPress={() => onSelect(rank)}
            style={({ pressed }) => [styles.column, pressed && styles.pressed]}
          >
            <PersonaAvatar
              altText={`${persona.label} 손님 유형을 나타내는 그림`}
              selected={selected}
              size={rank === 1 ? 'first' : 'runner'}
              source={imageSource(slot)}
            />
            <Text style={styles.name}>{persona.label}</Text>
            <Text style={styles.count}>리뷰 {slot.topicReviewCount ?? 0}건</Text>
            <View
              style={[
                styles.block,
                selected ? styles.blockSelected : styles.blockPlain,
                { height: blockHeights[rank] },
              ]}
            >
              <Text style={selected ? styles.blockRankSelected : styles.blockRank}>{rank}</Text>
              {selected ? <Text style={styles.blockState}>보는 중</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  name: {
    ...typography.body6,
    color: colors.text.strong,
    textAlign: 'center',
  },
  count: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  block: {
    width: '100%',
    alignItems: 'center',
    borderTopLeftRadius: radii.control,
    borderTopRightRadius: radii.control,
    justifyContent: 'center',
    marginTop: spacing[1],
    paddingHorizontal: spacing[1],
  },
  blockPlain: {
    backgroundColor: colors.background.emphasized,
  },
  blockSelected: {
    backgroundColor: colors.brand.primary,
  },
  blockEmpty: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    borderWidth: strokes.hairline,
  },
  blockRank: {
    ...typography.head5,
    color: colors.text.brand,
  },
  blockRankSelected: {
    ...typography.head5,
    color: colors.brand.onPrimary,
  },
  blockRankEmpty: {
    ...typography.head5,
    color: colors.text.disabled,
  },
  blockState: {
    ...typography.caption,
    color: colors.brand.onPrimary,
  },
  emptyAvatar: {
    width: spacing[20],
    height: spacing[20],
    borderColor: colors.border.strong,
    borderRadius: spacing[10],
    borderStyle: 'dashed',
    borderWidth: strokes.hairline,
  },
  emptyAvatarFirst: {
    width: spacing[24],
    height: spacing[24],
    borderRadius: spacing[12],
  },
  emptyReason: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
