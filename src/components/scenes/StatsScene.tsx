import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../../styles/theme';
import { StatBar } from '../common/StatBar';
import { slideUp } from '../../utils/animations';
import { StatItem } from '../../data/types';

export const StatsScene: React.FC<{
  stats: StatItem[];
  homeName: string;
  awayName: string;
}> = ({ stats, homeName, awayName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerAnim = slideUp(frame, fps, 0, 40);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.surfaceDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 20px',
        gap: 24,
      }}
    >
      <div style={headerAnim}>
        <span
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 56,
            color: theme.colors.brandGold,
            letterSpacing: 6,
          }}
        >
          MATCH STATS
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          paddingLeft: 40,
          paddingRight: 40,
          marginBottom: 20,
          opacity: Math.min(1, frame / 8),
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 32,
            color: theme.colors.persibLightBlue,
            letterSpacing: 3,
          }}
        >
          {homeName}
        </span>
        <span
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 32,
            color: theme.colors.textMuted,
            letterSpacing: 3,
          }}
        >
          {awayName}
        </span>
      </div>

      {stats.map((stat, i) => (
        <StatBar
          key={stat.label}
          label={stat.label}
          homeValue={stat.home}
          awayValue={stat.away}
          unit={stat.unit}
          delay={0.3 + i * 0.25}
        />
      ))}
    </AbsoluteFill>
  );
};

