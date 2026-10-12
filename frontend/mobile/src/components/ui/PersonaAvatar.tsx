import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PersonaImageSource } from '@/api/personaImages';
import { GuestCharacter } from '@/components/icons/GuestCharacter';
import { usePersonaImage } from '@/components/ui/usePersonaImage';
import { colors, layout, radii, spacing, strokes, typography } from '@/design/tokens';

// 순위 목록(TOP3)·선택한 유형 요약 카드에 쓰는 동그란 손님 유형 그림.
// 마이페이지 저장 이미지 격자는 같은 그림을 정사각 타일(tile)로 그린다.
// 실제 서버에 연결되면 AI가 만든 이미지를 원형으로 보여 주고, 그 전에는 코드로 그린 자리표시를 쓴다.
// 프로토타입 에셋을 제품 화면에 쓰지 않는다(DESIGN_SYSTEM §3.6). 생성 사실 고지는 목록이 한 번만 한다.

export type PersonaAvatarSize = 'first' | 'runner' | 'compact';

const diameters: Record<PersonaAvatarSize, number> = {
  first: spacing[24],
  runner: spacing[20],
  // 선택한 유형 요약 카드(ResultView)와 마이페이지 저장 이미지 줄(MyPageScreen)
  compact: spacing[16],
};

export function PersonaAvatar({
  source,
  altText,
  size = 'runner',
  selected = false,
  variant = 0,
  onLoadError,
  tile = false,
}: {
  source: PersonaImageSource;
  /** 기능 중심 대체 텍스트. 이미지가 없을 때도 같은 뜻이 전달돼야 한다. */
  altText: string;
  size?: PersonaAvatarSize;
  selected?: boolean;
  /** 자리표시 그림의 사람(모습·배경색)을 고르는 값. 순위를 넣는다 — 유형과 짝짓지 않는다(DESIGN_SYSTEM §3.6). */
  variant?: number;
  /** 원격 이미지를 받지 못했을 때 알린다. 다시 불러오기를 둘 화면만 쓴다 — 다시 받으려면 부모가 key를 바꿔 새로 그린다. */
  onLoadError?: () => void;
  /** 원 대신 부모 칸을 꽉 채우는 정사각형으로 그린다. 마이페이지 저장 이미지 격자가 쓴다. size는 무시한다. */
  tile?: boolean;
}) {
  // 타일은 칸 폭을 재서 자리표시 그림의 크기로 쓴다. 재기 전에는 compact 크기로 그린다.
  const [tileWidth, setTileWidth] = useState<number>(diameters.compact);
  const diameter = tile ? tileWidth : diameters[size];
  const image = usePersonaImage(source);
  const showImage = Boolean(image.uri) && !image.failed;
  const remoteFailed = source.kind === 'remote' && image.failed;

  // 이미지는 인증 요청으로 받아 온다(usePersonaImage). 받지 못하면 다시 불러오기를 둔 화면에 알린다.
  useEffect(() => {
    if (remoteFailed) onLoadError?.();
    // onLoadError는 부모가 매 렌더마다 새로 만든다. 실패로 바뀐 순간에만 알린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteFailed]);

  return (
    <View
      accessible
      accessibilityLabel={altText}
      accessibilityRole="image"
      onLayout={tile ? (event) => setTileWidth(event.nativeEvent.layout.width) : undefined}
      style={[
        styles.frame,
        tile ? styles.tile : { width: diameter, height: diameter, borderRadius: diameter / 2 },
        showImage && styles.clip,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: image.uri ?? undefined }}
          style={tile ? styles.tileImage : { width: diameter, height: diameter, borderRadius: diameter / 2 }}
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

/**
 * IMAGE-LOAD-ERROR(SCREEN_STATES §6.4)를 다시 불러오기로 되돌리는 상태.
 * `attempt`를 PersonaAvatar의 key로 주면, 다시 불러오기 때 새로 그려져 이미지를 다시 요청한다.
 */
export function usePersonaImageRetry(source: PersonaImageSource) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return {
    attempt,
    onLoadError: () => setFailed(true),
    showError: failed || source.kind === 'unavailable',
    // 가상 서버에는 다시 받을 이미지가 없다. 눌러도 아무 일이 없는 버튼을 두지 않는다.
    canRetry: source.kind === 'remote',
    retry: () => {
      setFailed(false);
      setAttempt((count) => count + 1);
    },
  };
}

/** 그림을 받지 못했을 때 그림 가까이 두는 원인 문장과 다시 불러오기. 유형 정보는 그대로 둔다. */
export function PersonaImageError({ canRetry, onRetry }: { canRetry: boolean; onRetry: () => void }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.error}>
      <Text style={styles.notice}>이미지를 불러오지 못했어요. 손님 유형 내용은 그대로 볼 수 있어요.</Text>
      {canRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>이미지 다시 불러오기</Text>
        </Pressable>
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
        : '지금은 그림을 불러오지 못해 자리표시를 보여 드려요. 원래는 AI가 만든 가상 이미지가 나와요.'}
    </Text>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: colors.background.emphasized,
    justifyContent: 'center',
  },
  // 사진만 틀에서 원 밖을 잘라 낸다. 자리표시 SVG는 그림 안에서 스스로 원으로 자른다(GuestCharacter) —
  // Android에서 테두리 없는 둥근 클리핑이 SVG를 통째로 지워 선택되지 않은 순위의 그림이 사라졌다.
  clip: {
    overflow: 'hidden',
  },
  tile: {
    aspectRatio: 1,
    borderRadius: radii.control,
    width: '100%',
  },
  tileImage: {
    height: '100%',
    width: '100%',
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
  error: {
    gap: spacing[1],
  },
  retry: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
  },
  retryText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  pressed: {
    opacity: 0.9,
  },
});
