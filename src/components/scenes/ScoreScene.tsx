import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../../styles/theme';
import { ScoreDisplay } from '../common/ScoreDisplay';
import { TeamInfo } from '../../data/types';

export const ScoreScene: React.FC<{
  home: TeamInfo;
  away: TeamInfo;
  date: string;
  stadium: string;
}> = ({ home, away, date, stadium }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.surfaceDark,
        padding: 60,
      }}
    >
      <ScoreDisplay home={home} away={away} date={date} stadium={stadium} />
    </AbsoluteFill>
  );
};

