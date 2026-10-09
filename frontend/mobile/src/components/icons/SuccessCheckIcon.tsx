import Svg, { Path } from 'react-native-svg';

export function SuccessCheckIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg accessibilityElementsHidden height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="m5 12.5 4.1 4.1L19 6.8"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}
