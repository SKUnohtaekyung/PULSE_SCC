import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

import { GUEST_VIEWBOX, guestCharacterShapes, type GuestShape } from '@/components/icons/guestCharacterShapes';
import { colors } from '@/design/tokens';

// 손님 유형 자리에 놓는 사람 그림. 실제 서버에 연결되면 AI가 만든 이미지로 바뀌고,
// 그 전까지 이 그림이 자리를 지킨다. 도형 정의는 `guestCharacterShapes.ts` 한 곳에 있고 Figma 보드도 같은 것을 쓴다.
//
// 2026-09-28: 같은 얼굴에 배경색만 다르던 그림을 서로 다른 세 사람으로 바꿨다(사용자 선택).
// 누가 누구인지는 여전히 이름과 리뷰 수가 말한다 — 그림으로 유형을 구분하지 않는다(DESIGN_SYSTEM §8.1).

export type GuestCharacterProps = {
  size: number;
  /** 사람을 고르는 값. 순위나 목록 인덱스를 넣는다. */
  variant?: number;
};

function renderShape(shape: GuestShape, key: number) {
  const paint = {
    fill: shape.fill ?? 'none',
    fillOpacity: shape.fillOpacity,
    opacity: shape.opacity,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (shape.type === 'circle') return <Circle cx={shape.cx} cy={shape.cy} key={key} r={shape.r} {...paint} />;
  if (shape.type === 'ellipse')
    return <Ellipse cx={shape.cx} cy={shape.cy} key={key} rx={shape.rx} ry={shape.ry} {...paint} />;
  return <Path d={shape.d} key={key} {...paint} />;
}

export function GuestCharacter({ size, variant = 0 }: GuestCharacterProps) {
  const { background, shapes } = guestCharacterShapes(variant, colors.illustration);
  const half = GUEST_VIEWBOX / 2;
  // 어깨 아래 모서리가 원 밖으로 나가지 않게 그림 안에서 원으로 자른다.
  // 틀(View)의 overflow로 자르면 Android에서 그림이 통째로 사라진다(PersonaAvatar 참고).
  // 한 화면에 여러 개가 놓이므로 id는 인스턴스마다 다르게 둔다.
  const clipId = 'guest-clip-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <Svg height={size} viewBox={`0 0 ${GUEST_VIEWBOX} ${GUEST_VIEWBOX}`} width={size}>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={half} cy={half} r={half} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Circle cx={half} cy={half} fill={background} r={half} />
        {shapes.map(renderShape)}
      </G>
    </Svg>
  );
}
