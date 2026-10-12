import Svg, { Path } from 'react-native-svg';

export function GoogleIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg accessibilityElementsHidden height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M21.35 11.1H12v3.8h5.35c-.23 1.22-.94 2.25-2 2.94v2.46h3.24c1.9-1.75 3-4.33 3-7.38 0-.62-.06-1.23-.17-1.82h-.07Z"
        fill={color}
      />
      <Path
        d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.24-2.46c-.9.6-2.05.96-3.37.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.54A10 10 0 0 0 12 22Z"
        fill={color}
      />
      <Path
        d="M6.4 13.94A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.32-1.94V7.52H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.48l3.35-2.54Z"
        fill={color}
      />
      <Path
        d="M12 5.93c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.96 2.94 14.7 2 12 2a10 10 0 0 0-8.95 5.52l3.35 2.54C7.19 7.69 9.4 5.93 12 5.93Z"
        fill={color}
      />
    </Svg>
  );
}
