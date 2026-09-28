import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { isFixtureMode } from '@/api/config';
import type { PersonaImageSource } from '@/api/personaImages';
import { colors, layout, radii, spacing, typography } from '@/design/tokens';

// 페르소나 이미지 한 덩어리. 지금은 마이페이지만 쓴다 — 결과 화면은 2026-09-28부터 선택 유형 요약 카드
// (ResultView의 PersonaStatsCard)가 같은 상태 규칙을 작은 그림으로 표현한다.
// 정본: SCREEN_STATES §6.4(IMAGE-READY·IMAGE-LOADING·IMAGE-LOAD-ERROR, 마이페이지의 STORED-IMAGES-*도 같은 규칙),
// DESIGN_SYSTEM §3.6(생성 사실 고지, 기능 중심 대체 텍스트, 같은 크기의 로딩·실패 대체 표현).

export type PersonaImageBlockSize = 'large' | 'small';

const heights: Record<PersonaImageBlockSize, number> = {
  // 토큰에서 유도한다. 로딩·실패·자리표시도 같은 높이에서 시작한다.
  large: spacing[24] * 2 + spacing[2],
  small: spacing[20] * 2,
};

export function PersonaImageBlock({
  source,
  altText,
  size = 'large',
  fixtureNote = '실제 서버에 연결하면 여기에 손님 유형 이미지가 나와요.',
  showNotice = true,
}: {
  source: PersonaImageSource;
  altText: string;
  size?: PersonaImageBlockSize;
  fixtureNote?: string;
  /** 여러 장을 나열해 고지를 한 번만 둘 때는 false로 주고, 화면이 직접 고지를 표시한다. */
  showNotice?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const height = heights[size];
  const showImage = source.kind === 'remote' && !failed;

  return (
    <View style={styles.block}>
      {showImage ? (
        <View>
          <Image
            accessibilityLabel={altText}
            key={retryCount}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            onLoadEnd={() => setLoading(false)}
            source={source.kind === 'remote' ? source.source : undefined}
            style={[styles.image, { height }]}
          />
          {loading ? (
            // IMAGE-LOADING — 같은 크기 영역에 문장을 둬 레이아웃이 흔들리지 않게 한다.
            <View style={[styles.fallback, styles.overlay, { minHeight: height }]}>
              <Text style={styles.body}>손님 유형 이미지를 불러오고 있어요.</Text>
            </View>
          ) : null}
        </View>
      ) : source.kind === 'fixture' ? (
        <View style={[styles.fallback, { minHeight: height }]}>
          <Text style={styles.title}>지금은 예시 화면이라 이미지가 없어요</Text>
          <Text style={styles.body}>
            {fixtureNote} 설명: {altText}
          </Text>
        </View>
      ) : (
        // IMAGE-LOAD-ERROR — 유형 정보는 그대로 두고 이미지만 다시 불러온다(§6.4).
        <View accessibilityLiveRegion="polite" style={[styles.fallback, { minHeight: height }]}>
          <Text style={styles.title}>이미지를 불러오지 못했어요</Text>
          <Text style={styles.body}>손님 유형 내용은 그대로 볼 수 있어요. 설명: {altText}</Text>
          {isFixtureMode ? (
            // 가상 서버에는 다시 불러올 이미지가 없다. 눌러도 아무 일이 없는 버튼을 두지 않는다.
            <Text style={styles.body}>예시 화면이라 다시 불러올 수 없어요.</Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setFailed(false);
                setLoading(true);
                setRetryCount((count) => count + 1);
              }}
              style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>이미지 다시 불러오기</Text>
            </Pressable>
          )}
        </View>
      )}
      {showNotice ? (
        <Text style={styles.notice}>
          {showImage
            ? '이 이미지는 리뷰 패턴을 설명하려고 AI가 만든 그림이에요. 실제 손님 사진이 아니에요.'
            : '손님 유형 이미지는 리뷰 패턴을 설명하려고 AI가 만드는 그림이에요. 실제 손님 사진이 아니에요.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing[2],
  },
  image: {
    width: '100%',
    borderRadius: radii.panel,
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.background.emphasized,
    borderRadius: radii.panel,
    gap: spacing[2],
    justifyContent: 'center',
    padding: spacing[5],
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  title: {
    ...typography.body6,
    color: colors.text.primary,
  },
  body: {
    ...typography.body7,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retry: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
    paddingHorizontal: spacing[4],
  },
  retryText: {
    ...typography.body6,
    color: colors.text.brand,
  },
  pressed: {
    opacity: 0.9,
  },
  notice: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
