import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Audio, staticFile } from 'remotion';
import { UnifiedProject, ProjectScene, ProjectElement, ElementAnimation } from '../data/types';
import { SlashTransition } from './common/Transition';
import { BrandLogo } from './common/Logo';
// @ts-ignore
import { renderSvgComponent } from '../../shared-svg-library.js';

// Calculates element transformation & opacity based on animation configuration
function useElementAnimation(anim?: ElementAnimation) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!anim || anim.type === 'none') {
    return { opacity: 1, transform: 'none' };
  }

  const delayInFrames = anim.startFrame ?? Math.round((anim.delay || 0) * fps);
  const relFrame = Math.max(0, frame - delayInFrames);
  const animDurFrames = Math.max(1, Math.round((anim.duration || 0.5) * fps));

  switch (anim.type) {
    case 'fade': {
      const op = interpolate(relFrame, [0, animDurFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return { opacity: op, transform: 'none' };
    }

    case 'slide': {
      const spr = spring({
        frame: relFrame,
        fps,
        config: { damping: 15, mass: 0.8, stiffness: 180 },
      });
      const fromY = anim.from?.y !== undefined ? Number(anim.from.y) : 60;
      const toY = anim.to?.y !== undefined ? Number(anim.to.y) : 0;
      const fromX = anim.from?.x !== undefined ? Number(anim.from.x) : 0;
      const toX = anim.to?.x !== undefined ? Number(anim.to.x) : 0;

      const curY = interpolate(spr, [0, 1], [fromY, toY]);
      const curX = interpolate(spr, [0, 1], [fromX, toX]);
      const op = interpolate(spr, [0, 1], [anim.from?.opacity ?? 0, anim.to?.opacity ?? 1]);

      return {
        opacity: op,
        transform: `translate(${curX}px, ${curY}px)`,
      };
    }

    case 'scale': {
      const spr = spring({
        frame: relFrame,
        fps,
        config: { damping: 12, mass: 0.7, stiffness: 190 },
      });
      return {
        opacity: interpolate(spr, [0, 1], [0, 1]),
        transform: `scale(${interpolate(spr, [0, 1], [0.6, 1])})`,
      };
    }

    case 'rotate': {
      const spr = spring({
        frame: relFrame,
        fps,
        config: { damping: 14, mass: 0.8, stiffness: 160 },
      });
      return {
        opacity: interpolate(spr, [0, 1], [0, 1]),
        transform: `rotate(${interpolate(spr, [0, 1], [-15, 0])}deg)`,
      };
    }

    default:
      return { opacity: 1, transform: 'none' };
  }
}

// Renders individual visual element according to its type and styling
const ElementRenderer: React.FC<{
  element: ProjectElement;
  theme: UnifiedProject['theme'];
}> = ({ element, theme }) => {
  if (element.visible === false) {
    return null;
  }

  const animStyle = useElementAnimation(element.animation);
  const { type, content, position, size, zIndex, styling, props } = element;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: zIndex || 1,
    transformOrigin: 'center center',
    ...animStyle,
  };

  if (type === 'logo') {
    return (
      <div style={baseStyle}>
        <BrandLogo size={Number(size.width) || 120} delay={0} />
      </div>
    );
  }

  if (type === 'text') {
    const highlightWord = props?.highlightWord || '';
    const textContent = content || '';

    // If highlight word is specified, render accented split text
    if (highlightWord && textContent.toUpperCase().includes(highlightWord.toUpperCase())) {
      const parts = textContent.split(new RegExp(`(${highlightWord})`, 'gi'));
      return (
        <div
          style={{
            ...baseStyle,
            fontFamily: styling?.fontFamily || theme.fonts?.title || "'Bebas Neue', sans-serif",
            fontSize: styling?.fontSize || 48,
            fontWeight: styling?.fontWeight || 800,
            color: styling?.color || theme.colors.text,
            textAlign: styling?.textAlign || 'left',
            lineHeight: styling?.lineHeight || 1.1,
            letterSpacing: styling?.letterSpacing || 2,
            textTransform: styling?.textTransform || 'none',
          }}
        >
          {parts.map((part, pIdx) => {
            const isMatch = part.toUpperCase() === highlightWord.toUpperCase();
            return (
              <span
                key={pIdx}
                style={{
                  color: isMatch ? (styling?.accentColor || theme.colors.accent) : (styling?.color || theme.colors.text),
                  textShadow: isMatch ? `0 0 30px ${theme.colors.accent}66` : undefined,
                }}
              >
                {part}
              </span>
            );
          })}
        </div>
      );
    }

    return (
      <div
        style={{
          ...baseStyle,
          fontFamily: styling?.fontFamily || theme.fonts?.body || "'Inter', sans-serif",
          fontSize: styling?.fontSize || 24,
          fontWeight: styling?.fontWeight || 400,
          color: styling?.color || theme.colors.text,
          textAlign: styling?.textAlign || 'left',
          lineHeight: styling?.lineHeight || 1.4,
          letterSpacing: styling?.letterSpacing || 1,
          textTransform: styling?.textTransform || 'none',
        }}
      >
        {content}
      </div>
    );
  }

  if (type === 'image') {
    if (!element.assetUrl) {
      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #ef4444',
            borderRadius: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: 8,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 28 }}>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Aset Hilang</span>
          <span style={{ fontSize: 11, opacity: 0.85 }}>{element.name || element.assetId || 'Image'}</span>
        </div>
      );
    }
    return (
      <div style={baseStyle}>
        <img
          src={element.assetUrl}
          alt={element.name || ''}
          style={{
            width: '100%',
            height: '100%',
            objectFit: element.fitMode || 'contain',
            borderRadius: styling?.borderRadius || 8,
          }}
        />
      </div>
    );
  }

  if (type === 'svg' || (type === 'component' && (props?.componentId || element.assetId))) {
    const compId = props?.componentId || element.assetId;
    if (compId) {
      const svgMarkup = renderSvgComponent(compId, {
        ...styling,
        width: typeof size.width === 'number' ? size.width : undefined,
        height: typeof size.height === 'number' ? size.height : undefined,
      });
      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      );
    }

    if (element.content && element.content.includes('<svg')) {
      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: element.content }}
        />
      );
    }
  }

  if (type === 'component') {
    // Data milestone card component
    if (props?.value !== undefined) {
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: styling?.backgroundColor || 'rgba(10, 15, 26, 0.94)',
            border: `${styling?.borderWidth || 2}px solid ${styling?.borderColor || theme.colors.accent}`,
            borderRadius: styling?.borderRadius || 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 24px',
            boxShadow: `0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px ${theme.colors.accent}33`,
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts?.title || "'Bebas Neue', sans-serif",
              fontSize: 64,
              fontWeight: 900,
              color: theme.colors.accent,
              letterSpacing: 4,
            }}
          >
            {props.value}
          </div>
          {props.label && (
            <div
              style={{
                fontFamily: theme.fonts?.body || "'Inter', sans-serif",
                fontSize: 22,
                fontWeight: 600,
                color: theme.colors.text,
                letterSpacing: 2,
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              {props.label}
            </div>
          )}
        </div>
      );
    }

    // Generic visual placeholder / action container
    return (
      <div
        style={{
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Render fallback graphic card if no custom SVG */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 24,
            border: `2px solid ${theme.colors.accent}44`,
            background: `linear-gradient(135deg, ${theme.colors.primary}33, ${theme.colors.secondary}bb)`,
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30,
            gap: 16,
          }}
        >
          <BrandLogo size={140} delay={0} />
          {content && (
            <div
              style={{
                fontFamily: theme.fonts?.body || "'Inter', sans-serif",
                fontSize: 22,
                color: theme.colors.accent,
                textAlign: 'center',
                letterSpacing: 1,
              }}
            >
              {content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default box / shape
  return (
    <div
      style={{
        ...baseStyle,
        backgroundColor: styling?.backgroundColor || 'transparent',
        border: styling?.border || undefined,
        borderRadius: styling?.borderRadius || 0,
      }}
    >
      {content}
    </div>
  );
};

// Scene Sequence Renderer
const SceneRenderer: React.FC<{
  scene: ProjectScene;
  theme: UnifiedProject['theme'];
  category?: string;
}> = ({ scene, theme, category }) => {
  return (
    <AbsoluteFill
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: scene.background || theme.colors.secondary,
        overflow: 'hidden',
      }}
    >
      {/* Stadium floodlight radial overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 15%, ${theme.colors.primary}55 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Safe Zone */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 40,
          borderBottom: `2px solid ${theme.colors.accent}40`,
          paddingBottom: 20,
        }}
      >
        <div
          style={{
            padding: '8px 24px',
            background: `linear-gradient(135deg, ${theme.colors.primary}, #001a44)`,
            color: '#ffffff',
            borderRadius: 8,
            border: `1px solid ${theme.colors.accent}`,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {category || 'PERSIB MEDIA'}
        </div>
        <div
          style={{
            fontFamily: theme.fonts?.title || "'Bebas Neue', sans-serif",
            fontSize: 36,
            color: theme.colors.accent,
            letterSpacing: 3,
          }}
        >
          PERSIB MEDIA
        </div>
      </div>

      {/* Render structured scene elements */}
      {scene.elements.map((el) => (
        <ElementRenderer key={el.id} element={el} theme={theme} />
      ))}

      {/* Bottom Footer Safe Zone */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 40,
          borderTop: `1px solid ${theme.colors.accent}33`,
          paddingTop: 16,
          fontFamily: theme.fonts?.body || "'Inter', sans-serif",
          fontSize: 20,
          color: theme.colors.accent,
          letterSpacing: 2,
        }}
      >
        <div>#BanggaJadiBobotoh</div>
        <div style={{ color: theme.colors.text, opacity: 0.7 }}>@persibmotion</div>
      </div>
    </AbsoluteFill>
  );
};

// Root Composition for any Unified Project JSON
export const UnifiedProjectComposition: React.FC<UnifiedProject> = (project) => {
  const fps = project.fps || 30;
  const scenes = project.scenes || [];
  const theme = project.theme || {
    colors: {
      primary: '#003da5',
      secondary: '#0a0a0a',
      text: '#ffffff',
      accent: '#f0a500',
    },
  };
  const category = project.metadata?.category || 'PERSIB MEDIA';

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.secondary }}>
      {scenes.map((scene, idx) => {
        const fromFrame = scene.startFrame ?? Math.round((scene.startTime || 0) * fps);
        const durationFrames = scene.durationInFrames ?? Math.round(scene.duration * fps);
        const nextScene = scenes[idx + 1];

        return (
          <React.Fragment key={scene.id}>
            <Sequence from={fromFrame} durationInFrames={durationFrames}>
              <SceneRenderer scene={scene} theme={theme} category={category} />
            </Sequence>

            {/* Render transition into next scene if defined */}
            {nextScene && nextScene.transition && nextScene.transition.type === 'slash' && (
              <Sequence
                from={fromFrame + durationFrames - Math.round(0.3 * fps)}
                durationInFrames={Math.round(0.5 * fps)}
              >
                <SlashTransition
                  direction={nextScene.transition.direction === 'left' ? 'left' : 'right'}
                  color={theme.colors.accent}
                />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}

      {/* Scene Voiceover Tracks */}
      {scenes.map((scene) => {
        if (!scene.voiceover?.enabled || !scene.voiceover?.audioUrl || scene.voiceover.audioUrl.includes('example.com')) {
          return null;
        }
        const fromFrame = scene.startFrame ?? Math.round((scene.startTime || 0) * fps);
        const durationFrames = scene.durationInFrames ?? Math.round(scene.duration * fps);
        const voSrc = scene.voiceover.audioUrl.startsWith('/public/')
          ? staticFile(scene.voiceover.audioUrl.replace(/^\/public\//, ''))
          : scene.voiceover.audioUrl.startsWith('http')
          ? scene.voiceover.audioUrl
          : staticFile(scene.voiceover.audioUrl);

        return (
          <Sequence key={`vo_${scene.id}`} from={fromFrame} durationInFrames={durationFrames}>
            <Audio src={voSrc} volume={1.0} />
          </Sequence>
        );
      })}

      {/* Background Audio Track */}
      {project.audio?.enabled && project.audio?.bgmUrl && !project.audio.bgmUrl.includes('example.com') && (
        <Audio
          src={
            project.audio.bgmUrl.startsWith('/public/')
              ? staticFile(project.audio.bgmUrl.replace(/^\/public\//, ''))
              : project.audio.bgmUrl.startsWith('http')
              ? project.audio.bgmUrl
              : staticFile(project.audio.bgmUrl)
          }
          volume={project.audio.muted ? 0 : (project.audio.volume ?? 0.8)}
          startFrom={Math.round((project.audio.startPosition || 0) * fps)}
        />
      )}
    </AbsoluteFill>
  );
};

