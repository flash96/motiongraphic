import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../../styles/theme';
import { BrandLogo, GoldLine } from '../common/Logo';
import { slideUp } from '../../utils/animations';

export const OutroScene: React.FC<{
  handle?: string;
  tagline?: string;
}> = ({ handle = '@persibmotion', tagline = '' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const handleAnim = slideUp(frame, fps, 0.4, 30);
  const tagAnim = slideUp(frame, fps, 0.6, 20);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.surfaceDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <BrandLogo size={180} delay={0} />
      <GoldLine width={250} height={4} delay={0.2} />
      <div style={handleAnim}>
        <span
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 36,
            color: theme.colors.textPrimary,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {handle}
        </span>
      </div>
      {tagline && (
        <div style={tagAnim}>
          <span
            style={{
              fontFamily: theme.fonts.display,
              fontSize: 28,
              color: theme.colors.brandGold,
              letterSpacing: 4,
            }}
          >
            {tagline}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

