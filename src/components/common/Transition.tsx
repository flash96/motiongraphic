import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { theme } from '../../styles/theme';

export const SlashTransition: React.FC<{
  direction?: 'left' | 'right';
  color?: string;
}> = ({ direction = 'right', color = theme.colors.brandGold }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(frame, [0.3 * fps, 0.5 * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const skewDir = direction === 'right' ? -20 : 20;

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: direction === 'right' ? `${-120 + progress * 240}%` : `${120 - progress * 240}%`,
          width: '120%',
          height: '140%',
          backgroundColor: color,
          transform: `skewX(${skewDir}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const FadeTransition: React.FC<{
  color?: string;
}> = ({ color = '#000000' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 0.2 * fps, 0.4 * fps],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity,
        pointerEvents: 'none',
        zIndex: 99,
      }}
    />
  );
};

export const SlideTransition: React.FC<{
  direction?: 'left' | 'right';
  color?: string;
}> = ({ direction = 'right', color = '#003da5' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.35 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(frame, [0.35 * fps, 0.5 * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateX = direction === 'right'
    ? interpolate(progress, [0, 1], [-100, 100])
    : interpolate(progress, [0, 1], [100, -100]);

  return (
    <AbsoluteFill style={{ opacity: fadeOut, overflow: 'hidden', zIndex: 99 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: color,
          transform: `translateX(${translateX}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

