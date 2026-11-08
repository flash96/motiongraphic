import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { theme } from '../../styles/theme';
import { scaleIn, slideIn } from '../../utils/animations';
import { TeamInfo } from '../../data/types';

export const ScoreDisplay: React.FC<{
  home: TeamInfo;
  away: TeamInfo;
  date: string;
  stadium: string;
}> = ({ home, away, date, stadium }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const homeLogoAnim = slideIn(frame, fps, 0.2, -120);
  const awayLogoAnim = slideIn(frame, fps, 0.2, 120);
  const scoreAnim = scaleIn(frame, fps, 0.4);
  const infoOpacity = Math.min(1, Math.max(0, (frame - 0.8 * fps) / 8));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 40,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        width: '100%',
      }}>
        {/* Home team */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          ...homeLogoAnim,
        }}>
          <img
            src={staticFile(`logos/teams/${home.logo}`)}
            alt=""
            style={{ width: 180, height: 180, objectFit: 'contain' }}
          />
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize: 36,
            color: theme.colors.textPrimary,
            letterSpacing: 3,
          }}>
            {home.name}
          </span>
        </div>

        {/* Score */}
        <div style={{ ...scoreAnim, display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize: 160,
            color: theme.colors.textPrimary,
            lineHeight: 1,
          }}>
            {home.score}
          </span>
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize: 80,
            color: theme.colors.brandGold,
            lineHeight: 1,
          }}>
            —
          </span>
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize: 160,
            color: theme.colors.textPrimary,
            lineHeight: 1,
          }}>
            {away.score}
          </span>
        </div>

        {/* Away team */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          ...awayLogoAnim,
        }}>
          <img
            src={staticFile(`logos/teams/${away.logo}`)}
            alt=""
            style={{ width: 180, height: 180, objectFit: 'contain' }}
          />
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize: 36,
            color: theme.colors.textPrimary,
            letterSpacing: 3,
          }}>
            {away.name}
          </span>
        </div>
      </div>

      {/* Match info */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: infoOpacity,
      }}>
        <span style={{
          fontFamily: theme.fonts.body,
          fontSize: 28,
          color: theme.colors.textMuted,
        }}>
          {stadium}
        </span>
        <span style={{
          fontFamily: theme.fonts.body,
          fontSize: 24,
          color: theme.colors.brandGold,
        }}>
          {date}
        </span>
      </div>
    </div>
  );
};

