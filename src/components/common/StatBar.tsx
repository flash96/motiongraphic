import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../../styles/theme';
import { expandWidth } from '../../utils/animations';

export const StatBar: React.FC<{
  label: string;
  homeValue: number;
  awayValue: number;
  unit?: string;
  delay?: number;
}> = ({ label, homeValue, awayValue, unit = '', delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  const progress = expandWidth(frame, fps, delay) / 100;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      opacity: Math.min(1, Math.max(0, (frame - delay * fps) / 6)),
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: 40,
        paddingRight: 40,
      }}>
        <span style={{
          fontFamily: theme.fonts.display,
          fontSize: 52,
          color: theme.colors.textPrimary,
          letterSpacing: 1,
        }}>
          {homeValue}{unit}
        </span>
        <span style={{
          fontFamily: theme.fonts.body,
          fontSize: 28,
          color: theme.colors.textMuted,
          alignSelf: 'center',
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: theme.fonts.display,
          fontSize: 52,
          color: theme.colors.textPrimary,
          letterSpacing: 1,
        }}>
          {awayValue}{unit}
        </span>
      </div>

      <div style={{
        display: 'flex',
        width: 'calc(100% - 80px)',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceCard,
      }}>
        <div style={{
          width: `${homePercent * progress}%`,
          height: '100%',
          backgroundColor: theme.colors.persibBlue,
          borderRadius: '5px 0 0 5px',
          transition: 'width 0.1s',
        }} />
        <div style={{ width: 3, backgroundColor: theme.colors.surfaceDark }} />
        <div style={{
          width: `${awayPercent * progress}%`,
          height: '100%',
          backgroundColor: theme.colors.brandGray,
          borderRadius: '0 5px 5px 0',
          marginLeft: 'auto',
        }} />
      </div>
    </div>
  );
};

