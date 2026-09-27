import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { PersonaImageSource } from '@/api/personaImages';
import { GuestCharacter } from '@/components/icons/GuestCharacter';
import { colors, spacing, strokes, typography } from '@/design/tokens';

// 순위 목록(TOP3)에 쓰는 동그란 손님 유형 그림.
// 실제 서버에 연결되면 AI가 만든 이미지를 원형으로 보여 주고, 그 전에는 코드로 그린 자리표시를 쓴다.
// 프로토타입 에셋을 제품 화면에 쓰지 않는다(DESIGN_SYSTEM §3.6). 생성 사실 고지는 목록이 한 번만 한다.

export type PersonaAvatarSize = 'first' | 'runner';

const diameters: Record<PersonaAvatarSize, number> = {
  first: spacing[24],
  runner: spacing[20],
};

export function PersonaAvatar({
  source,
  altText,
  size = 'runner',
  selected = false,
  variant = 0,
}: {
  source: PersonaImageSource;
  /** 기능 중심 대체 텍스트. 이미지가 없을 때도 같은 뜻이 전달돼야 한다. */
  altText: string;
  size?: PersonaAvatarSize;
  selected?: boolean;
  /** 자리표시 그림의 배경색을 고르는 값. 순위를 넣는다. */
  variant?: number;
}) {
  const [failed, setFailed] = useState(false);
  const diameter = diameters[size];
  const showImage = source.kind === 'remote' && !failed;

  return (
    <View
      accessible
      accessibilityLabel={altText}
      accessibilityRole="image"
      style={[
        styles.frame,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
        showImage && styles.clip,
      ]}
    >
      {showImage ? (
        <Image
          onError={() => setFailed(true)}
          source={source.source}
          style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
        />
      ) : (
        // 내려받을 이미지가 없을 때의 자리표시. 이름과 리뷰 수가 누구인지 말하므로 그림은 중립으로 둔다.
        <GuestCharacter size={diameter} variant={variant} />
      )}
      {selected ? (
        // 선택 테두리는 그림 위에 겹쳐 그린다. 그림이 원을 꽉 채워 틀의 테두리를 덮기 때문이다.
        <View
          pointerEvents="none"
          style={[
            styles.selectedRing,
            { width: diameter, height: diameter, borderRadius: diameter / 2 },
          ]}
        />
      ) : null}
    </View>
  );
}

/** 이미지가 실제로 보이지 않을 때 목록 아래에 한 번 두는 문장. */
export function PersonaAvatarNotice({ anyRemote }: { anyRemote: boolean }) {
  return (
    <Text style={styles.notice}>
      {anyRemote
        ? '그림은 AI로 만든 가상 이미지예요. 실제 손님이 아니에요.'
        : '예시 화면이라 그림 대신 자리표시를 보여 드려요. 실제 서버에서는 AI가 만든 가상 이미지가 나와요.'}
    </Text>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: colors.background.emphasized,
    justifyContent: 'center',
  },
  // 사진만 원 밖을 잘라 낸다. 자리표시 SVG는 스스로 원을 그리므로 자르지 않는다 —
  // Android에서 테두리 없는 둥근 클리핑이 SVG를 통째로 지워 선택되지 않은 순위의 그림이 사라졌다.
  clip: {
    overflow: 'hidden',
  },
  selectedRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderColor: colors.brand.primary,
    borderWidth: strokes.focus,
  },
  notice: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
