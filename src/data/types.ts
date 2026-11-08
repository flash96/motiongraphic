// Legacy match input types
export interface TeamInfo {
  name: string;
  logo: string;
  score: number;
}

export interface StatItem {
  label: string;
  home: number;
  away: number;
  unit?: string;
}

export interface MotmData {
  name: string;
  photo: string;
  rating: number;
  goals: number;
  assists: number;
}

export interface StandingsData {
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
}

export interface BrandingData {
  handle: string;
  tagline: string;
}

export interface PostMatchInput {
  template: 'post-match-recap';
  match: {
    date: string;
    stadium: string;
    competition: string;
    home: TeamInfo;
    away: TeamInfo;
    stats: StatItem[];
    motm: MotmData;
    standings: StandingsData;
  };
  branding: BrandingData;
}

// Unified Project Architecture (Phase 1)
export type ElementType = 'text' | 'image' | 'video' | 'shape' | 'logo' | 'audio' | 'component' | 'svg';
export type AnimationType = 'none' | 'fade' | 'slide' | 'scale' | 'rotate' | 'counter';
export type TransitionType = 'none' | 'fade' | 'slide' | 'slash';

export interface ElementAnimation {
  type: AnimationType;
  delay?: number;
  duration?: number;
  easing?: string;
  startFrame?: number;
  from?: Record<string, any>;
  to?: Record<string, any>;
  repeat?: number;
}

export interface ProjectElement {
  id: string;
  type: ElementType;
  name?: string;
  content?: string;
  assetUrl?: string;
  assetId?: string;
  fitMode?: 'contain' | 'cover' | 'fill';
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number | string;
    height: number | string;
  };
  rotation?: number;
  scale?: number;
  opacity?: number;
  zIndex?: number;
  visible?: boolean;
  locked?: boolean;
  styling?: Record<string, any>;
  animation?: ElementAnimation;
  props?: Record<string, any>;
}

export interface SceneTransition {
  type: TransitionType;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration: number;
}

export interface VoiceoverParameters {
  speakingRate?: number;
  pitch?: number;
  stability?: number;
  similarityBoost?: number;
  [key: string]: any;
}

export interface SceneVoiceover {
  enabled: boolean;
  provider: 'google' | 'elevenlabs' | string;
  voiceId: string;
  isCustomVoice?: boolean;
  speakerName?: string;
  language?: string;
  parameters?: VoiceoverParameters;
  assetId?: string;
  audioUrl?: string;
  sourceText?: string;
  duration?: number;
  status?: 'idle' | 'generating' | 'ready' | 'outdated' | 'error';
  generatedAt?: string;
  timingMetadata?: any;
}

export interface CustomVoiceRecord {
  id: string;
  name: string;
  description?: string;
  provider: string;
  isCustom: true;
  speakerName: string;
  consentRecord?: {
    speakerName: string;
    agreed: boolean;
    rightsConfirmed: boolean;
    timestamp: string;
  };
  createdAt: string;
  previewUrl?: string;
}

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
  order: number;
  duration?: number;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  duration?: number;
  text: string;
  words: CaptionWord[];
}

export interface CaptionStyle {
  preset?: string;
  fontSize?: number;
  textColor?: string;
  highlightColor?: string;
  backgroundColor?: string;
  position?: 'bottom' | 'center' | 'top';
  textAlign?: 'center' | 'left' | 'right';
  textShadow?: string;
  activeGlow?: string;
  badgeBackground?: string;
  [key: string]: any;
}

export interface SceneCaptions {
  enabled: boolean;
  language?: string;
  sourceText?: string;
  style?: CaptionStyle;
  segments: CaptionSegment[];
  generationMethod?: 'provider_timestamps' | 'forced_alignment' | string;
  status?: 'ready' | 'outdated' | 'error';
  generatedAt?: string;
}

export interface ProjectScene {
  id: string | number;
  name: string;
  order: number;
  startTime?: number;
  startFrame?: number;
  duration: number;
  durationInFrames?: number;
  transition?: SceneTransition;
  background?: string;
  elements: ProjectElement[];
  voiceover?: SceneVoiceover;
  captions?: SceneCaptions;

  // Legacy metadata fields for template compatibility
  title?: string;
  narration?: string;
  screenText?: string;
  highlightWord?: string;
  dataValue?: string;
  dataLabel?: string;
  visualAction?: string;
}

export interface ProjectBackground {
  type: 'color' | 'gradient' | 'image' | 'theme';
  value: string;
}

export interface ProjectTheme {
  colors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
    [key: string]: string;
  };
  fonts?: {
    title?: string;
    body?: string;
  };
}

export interface ProjectAudio {
  enabled: boolean;
  assetId?: string;
  bgmUrl?: string;
  volume?: number;
  muted?: boolean;
  startPosition?: number;
  duration?: number;
}

export interface UnifiedProject {
  version: string;
  id: string;
  name: string;
  videoTitle: string;
  canvas: {
    width: number;
    height: number;
  };
  fps: number;
  totalDuration: number;
  aspectRatio: string;
  background: ProjectBackground;
  theme: ProjectTheme;
  audio?: ProjectAudio;
  scenes: ProjectScene[];
  metadata?: {
    tabId?: string;
    category?: string;
    angle?: string;
    audience?: string;
    goal?: string;
    tone?: string;
    preset?: string;
    metaphor?: string;
    [key: string]: any;
  };
}
