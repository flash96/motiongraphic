import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../../styles/theme';
import { BrandLogo, GoldLine } from '../common/Logo';
import { slideUp } from '../../utils/animations';

export const IntroScene: React.FC<{
  title: string;
  competition?: string;
}> = ({ title, competition }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAnim = slideUp(frame, fps, 0.5, 50);
  const compAnim = slideUp(frame, fps, 0.8, 30);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.surfaceDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
      }}
    >
      <BrandLogo size={220} delay={0} />
      <GoldLine width={300} height={5} delay={0.3} />
      <div style={titleAnim}>
        <span
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 72,
            color: theme.colors.textPrimary,
            letterSpacing: 8,
          }}
        >
          {title}
        </span>
      </div>
      {competition && (
        <div style={compAnim}>
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 28,
              color: theme.colors.brandGold,
              letterSpacing: 2,
            }}
          >
            {competition}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

