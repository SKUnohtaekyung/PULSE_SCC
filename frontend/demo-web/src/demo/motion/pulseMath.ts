// 맥박 신호의 모양을 계산한다. 화면·영상 어디서든 같은 모양이 나오도록 순수 함수로만 둔다.
//
// 심전도의 한 박동(PQRST)을 가우시안 다섯 개의 합으로 근사한다.
// P(작은 언덕) → Q(살짝 내려감) → R(높은 봉우리) → S(깊게 내려감) → T(완만한 언덕).
// R 봉우리 높이를 박동마다 다르게 주어, "리뷰 데이터가 맥박의 세기가 된다"는 장면을 만든다.

type Wave = { center: number; width: number; amplitude: number };

const shape: Wave[] = [
  { center: 0.16, width: 0.028, amplitude: 0.09 }, // P
  { center: 0.355, width: 0.009, amplitude: -0.12 }, // Q
  { center: 0.39, width: 0.0115, amplitude: 1 }, // R — 박동마다 세기를 곱한다
  { center: 0.425, width: 0.011, amplitude: -0.26 }, // S
  { center: 0.63, width: 0.05, amplitude: 0.2 }, // T
];

const gaussian = (x: number, wave: Wave) =>
  wave.amplitude * Math.exp(-((x - wave.center) ** 2) / (2 * wave.width ** 2));

/** 한 박동 안의 위치(0~1)에서 높이. R 봉우리만 strength배 한다. */
export function beatHeight(phase: number, strength: number) {
  let sum = 0;
  for (let index = 0; index < shape.length; index += 1) {
    const wave = shape[index];
    sum += gaussian(phase, wave) * (index === 2 ? strength : Math.max(0.6, strength));
  }
  return sum;
}

/** R 봉우리가 박동 안에서 놓이는 자리(0~1). 라벨·물결을 여기에 맞춘다. */
export const rPeakPhase = shape[2].center;

export type PulseTrack = {
  /** 박동 하나의 가로 길이(px). */
  beatWidth: number;
  /** 박동마다 R 봉우리 세기(0~1). 길이만큼 되풀이한다. */
  strengths: number[];
};

/** 화면 x좌표(px)에서 신호 높이(-0.3~1 근처). */
export function signalAt(x: number, track: PulseTrack) {
  const beatIndex = Math.floor(x / track.beatWidth);
  const phase = x / track.beatWidth - beatIndex;
  const strength = track.strengths[((beatIndex % track.strengths.length) + track.strengths.length) % track.strengths.length];
  return beatHeight(phase, strength);
}

/** [from, to] 구간의 신호를 SVG 경로로 만든다. step이 작을수록 매끄럽다. */
export function signalPath(
  from: number,
  to: number,
  track: PulseTrack,
  baseline: number,
  amplitude: number,
  step = 2,
) {
  if (to <= from) return '';
  let d = '';
  for (let x = from; x <= to; x += step) {
    const y = baseline - signalAt(x, track) * amplitude;
    d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const yEnd = baseline - signalAt(to, track) * amplitude;
  return `${d}L${to.toFixed(1)} ${yEnd.toFixed(1)}`;
}

/** 각 박동의 R 봉우리 x좌표. */
export function peakXs(width: number, track: PulseTrack) {
  const peaks: { x: number; beat: number }[] = [];
  for (let beat = 0; beat * track.beatWidth < width; beat += 1) {
    peaks.push({ x: (beat + rPeakPhase) * track.beatWidth, beat });
  }
  return peaks;
}
