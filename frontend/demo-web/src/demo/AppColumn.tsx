import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { appMaxWidth } from '@/demo/appFrame';
import { useMediaQuery } from '@/demo/browserHooks';
import { colors, palette, shadows } from '@/design/tokens';

// 앱 기둥. 휴대폰에서는 화면 전체가 앱이고, 그보다 넓은 창(PC)에서는 가운데에 휴대폰 폭의 앱만 둔다.
// 바깥은 소개 문구 없이 차분한 배경만 둔다 — 보는 사람이 곧바로 앱을 쓰게 한다(2026-11-11 사용자 결정).
// 넓은 창인지는 미디어 쿼리로 판단한다. 정적 HTML과 첫 그리기가 같은 모양이어야 하이드레이션이 어긋나지 않는다.
export function AppColumn({ children }: { children: ReactNode }) {
  const framed = useMediaQuery(`(min-width: ${appMaxWidth + 1}px)`);

  return (
    <View style={[styles.outer, framed && styles.outerFramed]}>
      {/* 웹 전용 장식 배경. 정보를 담지 않는다. 좁은 화면에서는 앱 기둥이 덮어 보이지 않는다. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(900px 600px at 15% 10%, ${palette.royalBlue10}, transparent 70%),
            radial-gradient(800px 560px at 90% 95%, ${palette.royalBlue05}, transparent 70%)`,
        }}
      />
      <View style={[styles.column, framed && styles.columnFramed]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background.canvas,
  },
  outerFramed: {
    backgroundColor: colors.background.emphasized,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: appMaxWidth,
    overflow: 'hidden',
    backgroundColor: colors.background.canvas,
  },
  columnFramed: {
    ...shadows.soft,
  },
});
