import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { theme } from '../../styles/theme';
import { slideUp, scaleIn } from '../../utils/animations';
import { MotmData } from '../../data/types';

export const MotmScene: React.FC<{
  motm: MotmData;
}> = ({ motm }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerAnim = slideUp(frame, fps, 0, 40);
  const photoAnim = scaleIn(frame, fps, 0.2);
  const nameAnim = slideUp(frame, fps, 0.5, 50);
  const statsAnim = slideUp(frame, fps, 0.7, 30);

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
          MAN OF THE MATCH
        </span>
      </div>

      {/* Player photo */}
      <div
        style={{
          ...photoAnim,
          width: 280,
          height: 350,
          borderRadius: 16,
          overflow: 'hidden',
          border: `4px solid ${theme.colors.brandGold}`,
          backgroundColor: theme.colors.surfaceCard,
        }}
      >
        <img
          src={staticFile(`players/${motm.photo}`)}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      <div style={{ ...nameAnim, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 64,
            color: theme.colors.textPrimary,
            letterSpacing: 4,
          }}
        >
          {motm.name}
        </div>
      </div>

      {/* Rating + stats */}
      <div
        style={{
          ...statsAnim,
          display: 'flex',
          alignItems: 'center',
          gap: 50,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: theme.fonts.display,
              fontSize: 80,
              color: theme.colors.brandGold,
              lineHeight: 1,
            }}
          >
            {motm.rating.toFixed(1)}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 20,
              color: theme.colors.textMuted,
              marginTop: 4,
            }}
          >
            RATING
          </div>
        </div>

        {motm.goals > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 64,
                color: theme.colors.textPrimary,
                lineHeight: 1,
              }}
            >
              {motm.goals}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 20,
                color: theme.colors.textMuted,
                marginTop: 4,
              }}
            >
              GOALS
            </div>
          </div>
        )}

        {motm.assists > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 64,
                color: theme.colors.textPrimary,
                lineHeight: 1,
              }}
            >
              {motm.assists}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 20,
                color: theme.colors.textMuted,
                marginTop: 4,
              }}
            >
              ASSISTS
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

