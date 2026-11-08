import { interpolate, spring, SpringConfig } from 'remotion';

export const SPRING_SNAPPY: SpringConfig = {
  damping: 15,
  mass: 0.8,
  stiffness: 200,
};

export const SPRING_SMOOTH: SpringConfig = {
  damping: 20,
  mass: 1,
  stiffness: 120,
};

export const SPRING_BOUNCE: SpringConfig = {
  damping: 10,
  mass: 0.6,
  stiffness: 180,
};

export function slideUp(
  frame: number,
  fps: number,
  delay: number = 0,
  distance: number = 60
) {
  const s = spring({ frame: frame - delay * fps, fps, config: SPRING_SNAPPY });
  return {
    transform: `translateY(${interpolate(s, [0, 1], [distance, 0])}px)`,
    opacity: s,
  };
}

export function slideIn(
  frame: number,
  fps: number,
  delay: number = 0,
  fromX: number = -80
) {
  const s = spring({ frame: frame - delay * fps, fps, config: SPRING_SNAPPY });
  return {
    transform: `translateX(${interpolate(s, [0, 1], [fromX, 0])}px)`,
    opacity: s,
  };
}

export function scaleIn(
  frame: number,
  fps: number,
  delay: number = 0
) {
  const s = spring({ frame: frame - delay * fps, fps, config: SPRING_BOUNCE });
  return {
    transform: `scale(${interpolate(s, [0, 1], [0, 1])})`,
    opacity: s,
  };
}

export function expandWidth(
  frame: number,
  fps: number,
  delay: number = 0
) {
  const s = spring({ frame: frame - delay * fps, fps, config: SPRING_SMOOTH });
  return interpolate(s, [0, 1], [0, 100]);
}

export function countUp(
  frame: number,
  fps: number,
  target: number,
  delay: number = 0,
  durationSec: number = 0.8
) {
  const progress = interpolate(
    frame - delay * fps,
    [0, durationSec * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return Math.round(progress * target);
}

