import Svg, { Path } from 'react-native-svg';

// 하단 내비게이션 아이콘. 24×24 격자에 굵기 2, 끝과 모서리는 둥글게 — 세 아이콘이 같은 규칙을 쓴다.
// 이전에는 View 도형을 겹쳐 그렸는데 굵기와 모서리가 제각각이라 급조한 티가 났다(2026-09-27 디자인 리뷰 #4).
//
// 색은 부모가 정한다. 선택 상태는 색과 라벨로 알리고 모양은 바꾸지 않는다(DESIGN_SYSTEM §8.1).

const size = 24;
const stroke = 2;

export function HomeIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M3.5 10.2 12 3.6l8.5 6.6V19a1.5 1.5 0 0 1-1.5 1.5h-3.8v-5.6H8.8v5.6H5A1.5 1.5 0 0 1 3.5 19v-8.8Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
      />
    </Svg>
  );
}

export function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 11.3a3.65 3.65 0 1 0 0-7.3 3.65 3.65 0 0 0 0 7.3Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
      />
      <Path
        d="M4.8 20.4c0-3.6 3.2-6.2 7.2-6.2s7.2 2.6 7.2 6.2"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
      />
    </Svg>
  );
}

/** 가운데 원 버튼 안에 들어가는 아이콘. 리뷰를 훑어 세운다는 뜻으로 스캔 틀 + 막대를 쓴다. */
export function AnalysisIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M3.6 8.4V5.6a2 2 0 0 1 2-2h2.8M15.6 3.6h2.8a2 2 0 0 1 2 2v2.8M20.4 15.6v2.8a2 2 0 0 1-2 2h-2.8M8.4 20.4H5.6a2 2 0 0 1-2-2v-2.8"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
      />
      <Path
        d="M8.8 15.2v-2.4M12 15.2V8.8M15.2 15.2v-4"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={stroke}
      />
    </Svg>
  );
}
