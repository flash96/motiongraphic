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

