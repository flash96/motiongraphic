import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../../styles/theme';
import { scaleIn } from '../../utils/animations';

export const BrandLogo: React.FC<{
  size?: number;
  delay?: number;
}> = ({ size = 200, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anim = scaleIn(frame, fps, delay);

  return (
    <div style={{ ...anim, width: size, height: size }}>
      <img
        src={require('../../../public/logos/brand/logo.png')}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

export const GoldLine: React.FC<{
  width?: number;
  height?: number;
  delay?: number;
}> = ({ width = 200, height = 4, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = Math.min(
    1,
    Math.max(0, (frame - delay * fps) / (0.4 * fps))
  );

  return (
    <div
      style={{
        width: width * progress,
        height,
        backgroundColor: theme.colors.brandGold,
        borderRadius: height / 2,
      }}
    />
  );
};

export const DiagonalSlash: React.FC<{
  color?: string;
  thickness?: number;
  angle?: number;
}> = ({
  color = theme.colors.brandGold,
  thickness = 6,
  angle = -20,
}) => {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-10%',
          width: '120%',
          height: thickness,
          backgroundColor: color,
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'center center',
        }}
      />
    </AbsoluteFill>
  );
};

