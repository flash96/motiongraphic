import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../../styles/theme';
import { slideUp, scaleIn } from '../../utils/animations';
import { StandingsData } from '../../data/types';

export const StandingsScene: React.FC<{
  standings: StandingsData;
  competition: string;
}> = ({ standings, competition }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerAnim = slideUp(frame, fps, 0, 40);
  const posAnim = scaleIn(frame, fps, 0.2);
  const detailsAnim = slideUp(frame, fps, 0.5, 30);

  const record = `${standings.won}W ${standings.drawn}D ${standings.lost}L`;

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
      <div style={headerAnim}>
        <span
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 48,
            color: theme.colors.brandGold,
            letterSpacing: 6,
          }}
        >
          KLASEMEN
        </span>
      </div>

      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 24,
          color: theme.colors.textMuted,
          letterSpacing: 2,
          opacity: Math.min(1, frame / 10),
        }}
      >
        {competition}
      </div>

      <div style={{ ...posAnim, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 180,
            color: theme.colors.textPrimary,
            lineHeight: 1,
          }}
        >
          #{standings.position}
        </div>
      </div>

      <div
        style={{
          ...detailsAnim,
          display: 'flex',
          gap: 50,
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: theme.fonts.display,
              fontSize: 72,
              color: theme.colors.brandGold,
              lineHeight: 1,
            }}
          >
            {standings.points}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 20,
              color: theme.colors.textMuted,
              marginTop: 4,
            }}
          >
            POIN
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: theme.fonts.display,
              fontSize: 72,
              color: theme.colors.textPrimary,
              lineHeight: 1,
            }}
          >
            {standings.gd > 0 ? `+${standings.gd}` : standings.gd}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 20,
              color: theme.colors.textMuted,
              marginTop: 4,
            }}
          >
            SELISIH GOL
          </div>
        </div>
      </div>

      <div
        style={{
          ...detailsAnim,
          fontFamily: theme.fonts.display,
          fontSize: 36,
          color: theme.colors.textMuted,
          letterSpacing: 4,
        }}
      >
        {record}
      </div>

      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 22,
          color: theme.colors.textMuted,
          opacity: Math.min(1, Math.max(0, (frame - 0.8 * fps) / 8)),
        }}
      >
        Matchday {standings.played}
      </div>
    </AbsoluteFill>
  );
};

