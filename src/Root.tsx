import React from 'react';
import { Composition } from 'remotion';
import { PostMatchRecap, totalDuration } from './templates/PostMatchRecap';
import { UnifiedProjectComposition } from './components/UnifiedProjectComposition';
import { theme } from './styles/theme';
import { UnifiedProject } from './data/types';

import exampleData from '../input/example-match.json';
import defaultProjectData from '../input/unified-project.json';

const defaultProject = defaultProjectData as unknown as UnifiedProject;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Primary Remotion composition reading Unified Project JSON */}
      <Composition
        id="UnifiedProject"
        component={UnifiedProjectComposition}
        durationInFrames={Math.round((defaultProject.totalDuration || 30) * (defaultProject.fps || 30))}
        fps={defaultProject.fps || 30}
        width={defaultProject.canvas?.width || 1080}
        height={defaultProject.canvas?.height || 1920}
        defaultProps={defaultProject}
      />

      {/* Legacy PostMatchRecap composition for backward compatibility */}
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
