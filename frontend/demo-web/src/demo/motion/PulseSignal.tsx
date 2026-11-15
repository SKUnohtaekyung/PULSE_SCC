import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';

import { peakXs, type PulseTrack, signalAt, signalPath } from '@/demo/motion/pulseMath';
import { palette } from '@/design/tokens';

// PULSE의 맥박 장면(Remotion 컴포지션). "리뷰를 읽어 가게의 맥박을 살핀다"는 브랜드 이미지를 보여 주는 장식이다.
// 봉우리 높이는 데이터가 아니라 자연스러워 보이게 정한 값이다 — 어떤 수치도 뜻하지 않는다.
//
// - 병원 모니터처럼 신호 머리가 왼쪽에서 오른쪽으로 쓸고 지나가며 새 신호를 덮어 쓴다. 머리 바로 앞은 비워 둔다.
//   신호의 "나이"(그려진 뒤 지난 거리)로 투명도를 정해, 마지막 프레임과 첫 프레임이 이어져 끊김 없이 되풀이된다.
// - 리뷰를 뜻하는 점들이 아래위에서 신호 머리로 흘러들어 신호가 된다.
// - 봉우리를 지날 때마다 주황 물결이 퍼지고 머리가 한 번 뛴다.
//
// 장식이다. 진행 정도를 뜻하지 않고(진행은 화면의 막대가 알린다) 색은 디자인 토큰만 쓴다.

export const pulseComposition = { width: 960, height: 240, fps: 30, durationInFrames: 180 } as const;

const navy = palette.royalBlue;
const orange = palette.actionOrange;
const beats = 6;
const gap = 34;
const particles = 22;
const travel = 26;

function track(width: number): PulseTrack {
  // 박동마다 세기를 조금씩 달리해 기계적인 반복으로 보이지 않게 한다.
  const strengths = Array.from({ length: beats }, (_, beat) => 0.42 + random(`beat-${beat}`) * 0.5);
  return { beatWidth: width / beats, strengths };
}

export function PulseSignal() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const pulse = track(width);
  const speed = width / durationInFrames; // px / frame
  const headX = frame * speed;
  const baseline = height * 0.64;
  const amplitude = height * 0.5;
  const headY = baseline - signalAt(headX, pulse) * amplitude;

  // 신호의 나이(머리가 지나간 뒤 흐른 거리, px)에 따른 불투명도. 오래될수록 옅다.
  const ageOpacity = (age: number) => interpolate(age, [0, width - gap], [1, 0.16], { extrapolateRight: 'clamp' });
  const freshStop = ageOpacity(0);
  const oldestFresh = ageOpacity(headX);
  const newestOld = ageOpacity(width - gap);

  const fresh = signalPath(0, headX, pulse, baseline, amplitude);
  const old = signalPath(Math.min(width, headX + gap), width, pulse, baseline, amplitude);

  const peaks = peakXs(width, pulse);
  const ageOf = (x: number) => (x <= headX ? headX - x : headX - x + width);

  // 머리가 마지막으로 지난 봉우리에서 흐른 프레임. 머리가 한 번 뛰는 데 쓴다.
  const lastPeak = peaks.filter((peak) => peak.x <= headX).at(-1) ?? peaks.at(-1);
  const sinceBeat = lastPeak ? ageOf(lastPeak.x) / speed : 999;
  const beatKick = interpolate(sinceBeat, [0, 4, 16], [0, 1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="pulse-fresh" x1={0} x2={Math.max(1, headX)} y1={0} y2={0}>
            <stop offset="0" stopColor={navy} stopOpacity={oldestFresh} />
            <stop offset="1" stopColor={navy} stopOpacity={freshStop} />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="pulse-old" x1={headX + gap} x2={width} y1={0} y2={0}>
            <stop offset="0" stopColor={navy} stopOpacity={newestOld} />
            <stop offset="1" stopColor={navy} stopOpacity={oldestFresh} />
          </linearGradient>
          <radialGradient id="pulse-head">
            <stop offset="0" stopColor={orange} stopOpacity={0.55} />
            <stop offset="1" stopColor={orange} stopOpacity={0} />
          </radialGradient>
          <filter height="200%" id="pulse-glow" width="200%" x="-50%" y="-50%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
        </defs>

        {/* 모니터 눈금 */}
        {Array.from({ length: Math.ceil(width / 40) + 1 }, (_, index) => (
          <line
            key={`v${index}`}
            stroke={navy}
            strokeOpacity={index % 5 === 0 ? 0.07 : 0.03}
            x1={index * 40}
            x2={index * 40}
            y1={0}
            y2={height}
          />
        ))}
        {Array.from({ length: Math.ceil(height / 40) + 1 }, (_, index) => (
          <line
            key={`h${index}`}
            stroke={navy}
            strokeOpacity={index % 5 === 0 ? 0.07 : 0.03}
            x1={0}
            x2={width}
            y1={index * 40}
            y2={index * 40}
          />
        ))}
        <line stroke={navy} strokeDasharray="2 8" strokeOpacity={0.12} x1={0} x2={width} y1={baseline} y2={baseline} />

        {/* 리뷰 점이 신호로 흘러든다 */}
        {Array.from({ length: particles }, (_, index) => {
          const seed = `p${index}`;
          const arrival = (index / particles) * durationInFrames + random(`${seed}-t`) * 6;
          // 되풀이 경계를 넘는 점도 이어서 보이게 한 바퀴 앞뒤를 함께 본다.
          const local = [frame - arrival, frame - arrival + durationInFrames, frame - arrival - durationInFrames].find(
            (value) => value >= -travel && value <= 0,
          );
          if (local === undefined) return null;
          const progress = interpolate(local, [-travel, 0], [0, 1]);
          const eased = 1 - (1 - progress) ** 3;
          const targetX = (((arrival * speed) % width) + width) % width;
          const targetY = baseline - signalAt(targetX, pulse) * amplitude;
          const fromTop = random(`${seed}-side`) > 0.5;
          const startX = targetX - 50 - random(`${seed}-x`) * 140;
          const startY = fromTop ? -10 + random(`${seed}-y`) * height * 0.2 : height * (0.86 + random(`${seed}-y`) * 0.2);
          const x = startX + (targetX - startX) * eased;
          const y = startY + (targetY - startY) * eased;
          const size = 1.8 + random(`${seed}-s`) * 2;
          const accent = random(`${seed}-c`) > 0.82;
          const opacity = interpolate(progress, [0, 0.2, 0.85, 1], [0, 0.75, 0.75, 0]);
          return (
            <circle
              cx={x}
              cy={y}
              fill={accent ? orange : navy}
              key={seed}
              opacity={opacity * (accent ? 1 : 0.55)}
              r={size * (1 - progress * 0.4)}
            />
          );
        })}

        {/* 지난 바퀴의 신호(옅게) */}
        {old ? (
          <path d={old} fill="none" stroke="url(#pulse-old)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} />
        ) : null}

        {/* 이번 바퀴의 신호: 빛 번짐 + 선 */}
        {fresh ? (
          <>
            <path d={fresh} fill="none" filter="url(#pulse-glow)" opacity={0.35} stroke="url(#pulse-fresh)" strokeWidth={7} />
            <path d={fresh} fill="none" stroke="url(#pulse-fresh)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} />
          </>
        ) : null}

        {/* 봉우리를 지날 때 퍼지는 물결 */}
        {peaks.map((peak) => {
          const age = ageOf(peak.x) / speed;
          if (age > 26) return null;
          const strength = pulse.strengths[peak.beat % pulse.strengths.length];
          const py = baseline - signalAt(peak.x, pulse) * amplitude;
          const radius = interpolate(age, [0, 26], [6, 40 * (0.6 + strength)]);
          const opacity = interpolate(age, [0, 26], [0.45, 0]) * (0.5 + strength / 2);
          return <circle cx={peak.x} cy={py} fill="none" key={`ring-${peak.beat}`} opacity={opacity} r={radius} stroke={orange} strokeWidth={2} />;
        })}

        {/* 신호 머리 */}
        <circle cx={headX} cy={headY} fill="url(#pulse-head)" r={22} />
        <circle cx={headX} cy={headY} fill={orange} r={5 * (1 + beatKick * 0.35)} />
        <circle cx={headX} cy={headY} fill={palette.white} r={1.8} />
      </svg>
    </AbsoluteFill>
  );
}
