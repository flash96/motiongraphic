import React from 'react';
import { Composition } from 'remotion';
import { PostMatchRecap, totalDuration } from './templates/PostMatchRecap';
import { theme } from './styles/theme';

import exampleData from '../input/example-match.json';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PostMatchRecap"
        component={PostMatchRecap}
        durationInFrames={totalDuration * theme.fps}
        fps={theme.fps}
        width={theme.canvas.width}
        height={theme.canvas.height}
        defaultProps={exampleData as any}
      />
    </>
  );
};

