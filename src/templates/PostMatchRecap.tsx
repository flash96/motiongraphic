import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { IntroScene } from '../components/scenes/IntroScene';
import { ScoreScene } from '../components/scenes/ScoreScene';
import { StatsScene } from '../components/scenes/StatsScene';
import { MotmScene } from '../components/scenes/MotmScene';
import { StandingsScene } from '../components/scenes/StandingsScene';
import { OutroScene } from '../components/scenes/OutroScene';
import { SlashTransition } from '../components/common/Transition';
import { PostMatchInput } from '../data/types';
import { theme } from '../styles/theme';

const fps = theme.fps;
const d = theme.duration;

const sceneTimings = {
  intro:     { from: 0,                                      dur: d.intro },
  score:     { from: d.intro,                                dur: d.score },
  stats:     { from: d.intro + d.score,                      dur: d.stats },
  motm:      { from: d.intro + d.score + d.stats,            dur: d.motm },
  standings: { from: d.intro + d.score + d.stats + d.motm,   dur: d.standings },
  outro:     { from: d.intro + d.score + d.stats + d.motm + d.standings, dur: d.outro },
};

export const totalDuration = Object.values(sceneTimings).reduce((sum, s) => Math.max(sum, s.from + s.dur), 0);

export const PostMatchRecap: React.FC<PostMatchInput> = (data) => {
  const { match, branding } = data;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.surfaceDark }}>
      <Sequence from={sceneTimings.intro.from * fps} durationInFrames={sceneTimings.intro.dur * fps}>
        <IntroScene title="MATCH RESULT" competition={match.competition} />
      </Sequence>

      {/* Transition: intro → score */}
      <Sequence from={(sceneTimings.score.from - 0.2) * fps} durationInFrames={Math.round(0.5 * fps)}>
        <SlashTransition direction="right" />
      </Sequence>

      <Sequence from={sceneTimings.score.from * fps} durationInFrames={sceneTimings.score.dur * fps}>
        <ScoreScene
          home={match.home}
          away={match.away}
          date={match.date}
          stadium={match.stadium}
        />
      </Sequence>

      {/* Transition: score → stats */}
      <Sequence from={(sceneTimings.stats.from - 0.2) * fps} durationInFrames={Math.round(0.5 * fps)}>
        <SlashTransition direction="left" />
      </Sequence>

      <Sequence from={sceneTimings.stats.from * fps} durationInFrames={sceneTimings.stats.dur * fps}>
        <StatsScene
          stats={match.stats}
          homeName={match.home.name}
          awayName={match.away.name}
        />
      </Sequence>

      {/* Transition: stats → motm */}
      <Sequence from={(sceneTimings.motm.from - 0.2) * fps} durationInFrames={Math.round(0.5 * fps)}>
        <SlashTransition direction="right" />
      </Sequence>

      <Sequence from={sceneTimings.motm.from * fps} durationInFrames={sceneTimings.motm.dur * fps}>
        <MotmScene motm={match.motm} />
      </Sequence>

      {/* Transition: motm → standings */}
      <Sequence from={(sceneTimings.standings.from - 0.2) * fps} durationInFrames={Math.round(0.5 * fps)}>
        <SlashTransition direction="left" />
      </Sequence>

      <Sequence from={sceneTimings.standings.from * fps} durationInFrames={sceneTimings.standings.dur * fps}>
        <StandingsScene
          standings={match.standings}
          competition={match.competition}
        />
      </Sequence>

      {/* Transition: standings → outro */}
      <Sequence from={(sceneTimings.outro.from - 0.2) * fps} durationInFrames={Math.round(0.5 * fps)}>
        <SlashTransition direction="right" />
      </Sequence>

      <Sequence from={sceneTimings.outro.from * fps} durationInFrames={sceneTimings.outro.dur * fps}>
        <OutroScene handle={branding.handle} tagline={branding.tagline} />
      </Sequence>
    </AbsoluteFill>
  );
};

