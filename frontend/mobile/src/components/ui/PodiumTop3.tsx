import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { PersonaImageSource } from '@/api/personaImages';
import type { PodiumSlot } from '@/api/types';
import { Grow, revealStagger } from '@/components/ui/Motion';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { colors, radii, spacing, strokes, typography } from '@/design/tokens';

// 리뷰에 많이 나온 손님 TOP3. 1위를 가운데 가장 높게 두는 시상대 배치다(2026-09-26 발표 시안).
// 좌우 순서는 2위 · 1위 · 3위이고, 단상 높이로 순위를 한 번 더 알린다.
// 정본: SCREEN_STATES §6.1(빈 슬롯과 최초 선택), DESIGN_SYSTEM §3.6(생성 이미지 고지).

/** 화면에 놓이는 좌우 순서. 값은 rank다. */
const displayOrder = [2, 1, 3] as const;

/** 단상 높이. 순위가 높을수록 높다. */
const blockHeights: Record<number, number> = {
  1: spacing[20],
  2: spacing[14],
  3: spacing[12],
};

/**
 * 단상 안에는 순위와 `보는 중`이 두 줄로 들어간다. 글자를 키우면 가장 낮은 3위 단상에서 글자가 잘린다
 * (글자 크기 200%, 2026-09-28). 세 단상에 같은 값을 더해 늘리므로 높이 차이와 순위 순서는 그대로다.
 * 두 줄의 줄높이 합(head5 28 + caption 18 = 46)이 배율대로 커져도 3위 단상(48 × 배율)에 들어가도록 48씩 더한다.
 */
function podiumBlockHeight(rank: number, fontScale: number) {
  return blockHeights[rank] + spacing[12] * Math.max(0, fontScale - 1);
}

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
  const { fontScale } = useWindowDimensions();

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
              <Grow
                delay={revealStagger * rank}
                height={podiumBlockHeight(rank, fontScale)}
                style={[styles.block, styles.blockEmpty]}
              >
                <Text style={styles.blockRankEmpty}>{rank}</Text>
              </Grow>
            </View>
          );
        }

        const persona = slot.persona;
        if (!persona) return <View key={rank} style={styles.column} />;
        // 지금 보는 유형만 남색으로 세운다. 순위는 숫자와 단상 높이가 알린다(색만으로 구분하지 않는다).
        const tone = selected ? colors.podium.selected : colors.podium.idle;

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
              variant={rank - 1}
            />
            <Text style={styles.name}>{persona.label}</Text>
            <Text style={styles.count}>리뷰 {slot.topicReviewCount ?? 0}건</Text>
            {/* 1위부터 차례로 단상이 올라온다. 높이 차이가 순위를 알린다. */}
            <Grow
              delay={revealStagger * rank}
              height={podiumBlockHeight(rank, fontScale)}
              style={[styles.block, { backgroundColor: tone.background }]}
            >
              <Text style={[styles.blockRank, { color: tone.on }]}>{rank}</Text>
              {selected ? (
                <Text style={[styles.blockState, { color: tone.on }]}>보는 중</Text>
              ) : null}
            </Grow>
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
    overflow: 'hidden',
    paddingHorizontal: spacing[1],
  },
  blockEmpty: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    borderWidth: strokes.hairline,
  },
  blockRank: {
    ...typography.head5,
  },
  blockRankEmpty: {
    ...typography.head5,
    color: colors.text.disabled,
  },
  blockState: {
    ...typography.caption,
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
