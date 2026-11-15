import { Player, Thumbnail } from '@remotion/player';

import { useIsClient, useMediaQuery } from '@/demo/browserHooks';
import { PulseSignal, pulseComposition } from '@/demo/motion/PulseSignal';

// 맥박 장면을 화면에 재생한다(웹 전용 — 시연 사이트는 웹만 빌드한다).
// 모션 감소 설정이면 재생하지 않고 장면 한 컷을 멈춘 채로 보여 준다(DESIGN_SYSTEM §9).
// 장면은 장식이다. 같은 정보는 주변 글에 있으므로 보조 기술에는 숨긴다.
// 앱 시작·분석 대기 화면에서만 쓴다(사용자 결정). 둘 다 기다리는 동안의 로딩 표시라 되풀이한다.
// 로딩이 아닌 화면에 붙일 때는 loop를 끄고 한 번만 재생한다 — 반복되는 장식 모션을 피한다(DESIGN_SYSTEM §9).

// 양 끝을 흐리게 해 눈금이 상자처럼 잘려 보이지 않게 한다.
const edgeFade = 'linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)';
const style = {
  width: '100%',
  aspectRatio: `${pulseComposition.width} / ${pulseComposition.height}`,
  background: 'transparent',
} as const;
const common = {
  component: PulseSignal,
  compositionWidth: pulseComposition.width,
  compositionHeight: pulseComposition.height,
  durationInFrames: pulseComposition.durationInFrames,
  fps: pulseComposition.fps,
  style,
};

export function PulsePlayer({ loop = false }: { loop?: boolean }) {
  const client = useIsClient();
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <div aria-hidden style={{ width: '100%', pointerEvents: 'none', maskImage: edgeFade, WebkitMaskImage: edgeFade }}>
      {/* 정적 렌더(서버)에서는 같은 크기의 빈 칸만 둔다. 재생기는 브라우저에서 붙인다. */}
      {!client ? (
        <div style={style} />
      ) : reduced ? (
        <Thumbnail {...common} frameToDisplay={Math.round(pulseComposition.durationInFrames * 0.82)} />
      ) : (
        <Player {...common} autoPlay controls={false} loop={loop} />
      )}
    </div>
  );
}
