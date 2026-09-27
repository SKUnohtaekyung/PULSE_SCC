import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '@/design/tokens';

// 손님 유형 자리에 놓는 사람 그림. 실제 서버에 연결되면 AI가 만든 이미지로 바뀌고,
// 그 전까지 이 그림이 자리를 지킨다(2026-09-27 디자인 리뷰 #4 — 급조한 도형 대신 제대로 그린 캐릭터).
//
// 특정 인물로 읽히지 않게 이목구비를 최소한으로 둔다. 유형마다 다른 것은 배경색뿐이고,
// 누가 누구인지는 이름과 리뷰 수가 말한다 — 색만으로 정보를 전하지 않는다(DESIGN_SYSTEM §8.1).

/** 유형 순서에 따라 도는 배경색. 세 가지 모두 얼굴·옷과 대비가 충분한 연한 색이다. */
const backgrounds = colors.illustration.backgrounds;

export type GuestCharacterProps = {
  size: number;
  /** 배경색을 고르는 값. 순위나 목록 인덱스를 넣는다. */
  variant?: number;
};

export function GuestCharacter({ size, variant = 0 }: GuestCharacterProps) {
  const background = backgrounds[Math.abs(variant) % backgrounds.length];
  // 어깨 아래 모서리가 원 밖으로 나가지 않게 그림 안에서 원으로 자른다.
  // 틀(View)의 overflow로 자르면 Android에서 그림이 통째로 사라진다(PersonaAvatar 참고).
  // 한 화면에 여러 개가 놓이므로 id는 인스턴스마다 다르게 둔다.
  const clipId = 'guest-clip-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={32} cy={32} r={32} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Circle cx={32} cy={32} fill={background} r={32} />

        {/* 어깨 — 원 아래쪽을 채운다. 옷은 브랜드 남색이라 세 유형이 한 가족으로 보인다. */}
        <Path d="M12 64c0-11 9-19 20-19s20 8 20 19H12Z" fill={colors.brand.primary} />

        {/* 목 */}
        <Rect fill={colors.illustration.skinShade} height={8} rx={3} width={10} x={27} y={38} />

        {/* 얼굴 */}
        <Circle cx={32} cy={28} fill={colors.illustration.skin} r={13} />

        {/* 머리카락 — 이마를 덮는 앞머리 */}
        <Path
          d="M19 27a13 13 0 0 1 26 0c0-4-4-5-7-6-3-1-5-3-9-2s-6 3-7 5-3 2-3 3Z"
          fill={colors.text.strong}
        />

        {/* 눈 두 개와 웃는 입. 표정은 여기까지만 둔다. */}
        <Circle cx={27} cy={28} fill={colors.text.strong} r={1.7} />
        <Circle cx={37} cy={28} fill={colors.text.strong} r={1.7} />
        <Path
          d="M28.5 33.5a4.5 4.5 0 0 0 7 0"
          stroke={colors.text.strong}
          strokeLinecap="round"
          strokeWidth={1.6}
        />
  </G>
    </Svg>
  );
}
