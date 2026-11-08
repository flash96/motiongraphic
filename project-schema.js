/**
 * Unified Project Schema, Validation, and Migration for Motion Graphic Studio.
 * Single source of truth for AI generation, visual editor, GSAP engine, and Remotion renderer.
 */

export const CURRENT_SCHEMA_VERSION = "1.0.0";

export const ELEMENT_TYPES = ["text", "image", "video", "shape", "logo", "audio", "component", "svg"];
export const ANIMATION_TYPES = ["none", "fade", "slide", "scale", "rotate", "counter"];
export const TRANSITION_TYPES = ["none", "fade", "slide", "slash"];

/**
 * Creates a clean, valid Unified Project with safe defaults.
 */
export function createDefaultProject(overrides = {}) {
  const fps = overrides.fps || 30;
  const duration = overrides.totalDuration || overrides.duration || 30;
  const canvas = overrides.canvas || { width: 1080, height: 1920 };

  const project = {
    version: CURRENT_SCHEMA_VERSION,
    id: overrides.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: overrides.name || overrides.topic || "Persib Motion Graphic",
    videoTitle: overrides.videoTitle || overrides.topic || "Persib Bandung",
    canvas: {
      width: Number(canvas.width) || 1080,
      height: Number(canvas.height) || 1920
    },
    fps: Number(fps) || 30,
    totalDuration: Number(duration) || 30,
    aspectRatio: overrides.aspectRatio || "9:16",
    background: overrides.background || {
      type: "theme",
      value: "radial-gradient(ellipse 95% 65% at 50% 18%, rgba(0, 61, 165, 0.45) 0%, #080d1a 60%, #0a0a0a 100%)"
    },
    theme: {
      colors: {
        primary: overrides.theme?.colors?.primary || overrides.colors?.primary || "#003da5",
        secondary: overrides.theme?.colors?.secondary || overrides.colors?.secondary || "#0a0a0a",
        text: overrides.theme?.colors?.text || overrides.colors?.text || "#ffffff",
        accent: overrides.theme?.colors?.accent || overrides.colors?.accent || "#f0a500"
      },
      fonts: {
        title: overrides.theme?.fonts?.title || "'Bebas Neue', 'Poppins', sans-serif",
        body: overrides.theme?.fonts?.body || "'Inter', sans-serif"
      }
    },
    audio: overrides.audio ? {
      enabled: Boolean(overrides.audio.enabled),
      assetId: overrides.audio.assetId || "",
      bgmUrl: overrides.audio.bgmUrl || "",
      volume: overrides.audio.volume !== undefined ? Number(overrides.audio.volume) : 0.8,
      muted: Boolean(overrides.audio.muted),
      startPosition: Number(overrides.audio.startPosition) || 0,
      duration: Number(overrides.audio.duration) || 0
    } : {
      enabled: false,
      assetId: "",
      bgmUrl: "",
      volume: 0.8,
      muted: false,
      startPosition: 0,
      duration: 0
    },
    scenes: [],
    metadata: {
      tabId: overrides.tabId || overrides.id || "post_match",
      category: overrides.category || "Hasil Pertandingan",
      angle: overrides.angle || "",
      audience: overrides.audience || "Bobotoh",
      goal: overrides.goal || "Rayakan Kemenangan",
      tone: overrides.tone || "Bangga & Bersemangat",
      preset: overrides.preset || "preset_b",
      metaphor: overrides.metaphor || "card",
      ...(overrides.metadata || {})
    }
  };

  if (Array.isArray(overrides.scenes) && overrides.scenes.length > 0) {
    project.scenes = overrides.scenes.map((s, idx) => sanitizeScene(s, idx, project.fps));
  } else {
    project.scenes = [
      sanitizeScene({
        id: "sc_1",
        name: overrides.videoTitle || overrides.name || "Adegan Pembuka",
        duration: project.totalDuration,
        elements: []
      }, 0, project.fps)
    ];
  }

  recalculateSceneTimings(project);

  return project;
}

/**
 * Sanitizes and normalizes an element object with safe defaults.
 */
function sanitizeElement(el, idx, sceneId, fps = 30) {
  const elemId = el.id ? String(el.id) : `el_${sceneId}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`;
  const type = ELEMENT_TYPES.includes(el.type) ? el.type : "text";

  const element = {
    id: elemId,
    type,
    name: el.name || `${type}_${idx + 1}`,
    content: el.content !== undefined ? String(el.content) : "",
    assetUrl: el.assetUrl || "",
    assetId: el.assetId || "",
    fitMode: el.fitMode || "contain",
    position: {
      x: Number(el.position?.x) || 0,
      y: Number(el.position?.y) || 0
    },
    size: {
      width: el.size?.width !== undefined ? el.size.width : "auto",
      height: el.size?.height !== undefined ? el.size.height : "auto"
    },
    rotation: Number(el.rotation) || 0,
    scale: Number(el.scale) || 1,
    opacity: el.opacity !== undefined ? Math.max(0, Math.min(1, Number(el.opacity))) : 1,
    zIndex: Number(el.zIndex) || idx + 1,
    visible: el.visible !== false,
    locked: el.locked === true,
    styling: { ...(el.styling || {}) },
    props: { ...(el.props || {}) }
  };

  if (el.animation) {
    const animType = ANIMATION_TYPES.includes(el.animation.type) ? el.animation.type : "none";
    element.animation = {
      type: animType,
      delay: Number(el.animation.delay) || 0,
      duration: Number(el.animation.duration) || 0.5,
      easing: el.animation.easing || "power2.out",
      from: el.animation.from ? { ...el.animation.from } : undefined,
      to: el.animation.to ? { ...el.animation.to } : undefined,
      startFrame: el.animation.startFrame !== undefined ? Number(el.animation.startFrame) : Math.round((Number(el.animation.delay) || 0) * fps),
      repeat: Number(el.animation.repeat) || 0
    };
  }

  return element;
}

/**
 * Sanitizes and normalizes a scene object.
 */
export function sanitizeScene(scene, idx, fps = 30) {
  const sceneId = scene.id !== undefined ? String(scene.id) : String(idx + 1);
  const duration = Math.max(0.5, Number(scene.duration) || 5);

  const transitionType = scene.transition?.type && TRANSITION_TYPES.includes(scene.transition.type)
    ? scene.transition.type
    : "none";

  const sanitized = {
    id: sceneId,
    name: scene.name || scene.title || `Adegan ${idx + 1}`,
    order: scene.order !== undefined ? Number(scene.order) : idx + 1,
    startTime: Number(scene.startTime) || 0,
    startFrame: Number(scene.startFrame) || 0,
    duration,
    durationInFrames: Math.round(duration * fps),
    transition: {
      type: transitionType,
      direction: scene.transition?.direction || "right",
      duration: Number(scene.transition?.duration) || 0.4
    },
    background: scene.background || "",
    elements: [],
    // Retain legacy fields for template choreography compatibility
    title: scene.title || scene.name || `Adegan ${idx + 1}`,
    narration: scene.narration || "",
    screenText: scene.screenText || "",
    highlightWord: scene.highlightWord || "",
    dataValue: scene.dataValue || "",
    dataLabel: scene.dataLabel || "",
    visualAction: scene.visualAction || ""
  };

  if (scene.voiceover) {
    sanitized.voiceover = {
      enabled: scene.voiceover.enabled !== false,
      provider: scene.voiceover.provider || "google",
      voiceId: scene.voiceover.voiceId || "id-ID-Standard-A",
      isCustomVoice: Boolean(scene.voiceover.isCustomVoice),
      speakerName: scene.voiceover.speakerName || "",
      language: scene.voiceover.language || "id-ID",
      parameters: {
        speakingRate: Number(scene.voiceover.parameters?.speakingRate) || 1.0,
        pitch: Number(scene.voiceover.parameters?.pitch) || 0.0,
        stability: Number(scene.voiceover.parameters?.stability) || 0.75,
        ...(scene.voiceover.parameters || {})
      },
      assetId: scene.voiceover.assetId || "",
      audioUrl: scene.voiceover.audioUrl || "",
      sourceText: scene.voiceover.sourceText || "",
      duration: Number(scene.voiceover.duration) || 0,
      status: scene.voiceover.status || (scene.voiceover.audioUrl ? "ready" : "idle"),
      generatedAt: scene.voiceover.generatedAt || "",
      timingMetadata: scene.voiceover.timingMetadata || null
    };

    // Auto-detect outdated voiceover if narration text differs from sourceText
    if (
      sanitized.voiceover.audioUrl &&
      sanitized.voiceover.sourceText &&
      sanitized.narration &&
      sanitized.voiceover.sourceText.trim() !== sanitized.narration.trim()
    ) {
      sanitized.voiceover.status = "outdated";
    }
  }

  if (scene.captions) {
    sanitized.captions = {
      enabled: scene.captions.enabled !== false,
      language: scene.captions.language || "id-ID",
      sourceText: scene.captions.sourceText || sanitized.narration || "",
      style: {
        preset: scene.captions.style?.preset || "persib_gold",
        fontSize: Number(scene.captions.style?.fontSize) || 34,
        textColor: scene.captions.style?.textColor || "#ffffff",
        highlightColor: scene.captions.style?.highlightColor || "#f0a500",
        backgroundColor: scene.captions.style?.backgroundColor || "rgba(10, 14, 24, 0.88)",
        position: scene.captions.style?.position || "bottom",
        textAlign: scene.captions.style?.textAlign || "center",
        textShadow: scene.captions.style?.textShadow || "0 2px 8px rgba(0, 0, 0, 0.9)",
        activeGlow: scene.captions.style?.activeGlow || "0 0 16px rgba(240, 165, 0, 0.75)",
        ...(scene.captions.style || {})
      },
      segments: Array.isArray(scene.captions.segments)
        ? scene.captions.segments.map((seg, sIdx) => ({
            id: seg.id || `seg_${sIdx}`,
            start: Number(seg.start) || 0,
            end: Number(seg.end) || 0,
            duration: Number(seg.duration) || Math.max(0, (Number(seg.end) || 0) - (Number(seg.start) || 0)),
            text: String(seg.text || ""),
            words: Array.isArray(seg.words)
              ? seg.words.map((w, wIdx) => ({
                  word: String(w.word || ""),
                  start: Number(w.start) || 0,
                  end: Number(w.end) || 0,
                  order: w.order !== undefined ? Number(w.order) : wIdx,
                  duration: Number(w.duration) || Math.max(0, (Number(w.end) || 0) - (Number(w.start) || 0))
                }))
              : []
          }))
        : [],
      generationMethod: scene.captions.generationMethod || "forced_alignment",
      status: scene.captions.status || "ready",
      generatedAt: scene.captions.generatedAt || ""
    };
  }

  if (Array.isArray(scene.elements)) {
    sanitized.elements = scene.elements.map((el, elIdx) => sanitizeElement(el, elIdx, sceneId, fps));
  }

  return sanitized;
}

/**
 * Recalculates sequential scene start times, start frames, and total duration.
 */
export function recalculateSceneTimings(project) {
  const fps = Number(project.fps) || 30;
  let runningTime = 0;

  project.scenes.forEach((scene, idx) => {
    scene.order = idx + 1;
    scene.startTime = runningTime;
    scene.startFrame = Math.round(runningTime * fps);
    scene.durationInFrames = Math.round(scene.duration * fps);
    runningTime += scene.duration;
  });

  project.totalDuration = Math.round(runningTime * 100) / 100;
  return project;
}

/**
 * Validates a project object against the Unified Project Schema.
 * Returns { valid: boolean, errors: string[], warnings: string[], project: UnifiedProject }.
 */
export function validateProject(rawProject) {
  const errors = [];
  const warnings = [];

  if (!rawProject || typeof rawProject !== "object") {
    return {
      valid: false,
      errors: ["Project data must be a valid JSON object."],
      warnings: [],
      project: createDefaultProject()
    };
  }

  // Version check
  if (!rawProject.version) {
    warnings.push(`Missing version; assuming current schema version ${CURRENT_SCHEMA_VERSION}.`);
  }

  // Canvas check
  const width = Number(rawProject.canvas?.width);
  const height = Number(rawProject.canvas?.height);
  if (!width || width <= 0 || !height || height <= 0) {
    errors.push(`Invalid canvas dimensions: width (${width}) and height (${height}) must be positive numbers.`);
  }

  // FPS check
  const fps = Number(rawProject.fps);
  if (!fps || fps <= 0 || fps > 120) {
    errors.push(`Invalid FPS: ${fps}. Must be between 1 and 120.`);
  }

  // Scenes check
  if (!Array.isArray(rawProject.scenes) || rawProject.scenes.length === 0) {
    errors.push("Project must contain at least one scene.");
  }

  // Scene ID uniqueness and duration checks
  const sceneIds = new Set();
  const elementIds = new Set();

  if (Array.isArray(rawProject.scenes)) {
    rawProject.scenes.forEach((scene, sIdx) => {
      const sId = String(scene.id ?? sIdx + 1);
      if (sceneIds.has(sId)) {
        errors.push(`Duplicate scene ID found: "${sId}". Scene IDs must be unique.`);
      }
      sceneIds.add(sId);

      const sDur = Number(scene.duration);
      if (isNaN(sDur) || sDur <= 0) {
        errors.push(`Scene "${sId}" has invalid duration (${scene.duration}). Must be > 0.`);
      }

      if (Array.isArray(scene.elements)) {
        scene.elements.forEach((el, eIdx) => {
          const eId = String(el.id ?? `${sId}_${eIdx}`);
          if (elementIds.has(eId)) {
            warnings.push(`Duplicate element ID "${eId}". Element IDs should be unique across the project.`);
          }
          elementIds.add(eId);

          if (el.type && !ELEMENT_TYPES.includes(el.type)) {
            warnings.push(`Unknown element type "${el.type}" in scene "${sId}". Defaulting to text.`);
          }
        });
      }

      if (scene.voiceover) {
        if (scene.voiceover.enabled && scene.voiceover.status === "ready" && !scene.voiceover.audioUrl) {
          warnings.push(`Scene "${sId}" voiceover is enabled and marked ready but has no audioUrl.`);
        }
        if (
          scene.voiceover.audioUrl &&
          scene.voiceover.sourceText &&
          scene.narration &&
          scene.voiceover.sourceText.trim() !== scene.narration.trim()
        ) {
          warnings.push(`Scene "${sId}" voiceover audio is outdated: narration text has changed.`);
        }
      }

      if (scene.captions) {
        if (scene.captions.enabled && (!Array.isArray(scene.captions.segments) || scene.captions.segments.length === 0)) {
          warnings.push(`Scene "${sId}" has captions enabled but segments list is empty.`);
        }
        if (Array.isArray(scene.captions.segments)) {
          scene.captions.segments.forEach((seg, sIdx) => {
            if (Number(seg.start) > Number(seg.end)) {
              warnings.push(`Scene "${sId}" caption segment ${sIdx} has start (${seg.start}) greater than end (${seg.end}).`);
            }
          });
        }
      }
    });
  }

  // Construct safe normalized project
  const normalized = createDefaultProject({
    ...rawProject,
    fps: isNaN(fps) || fps <= 0 ? 30 : fps,
    canvas: {
      width: width > 0 ? width : 1080,
      height: height > 0 ? height : 1920
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    project: normalized
  };
}

/**
 * Migrates a legacy template configuration (from templates.js / appState)
 * into a fully structured Unified Project JSON.
 */
export function migrateLegacyTemplateToProject(legacyConfig) {
  if (!legacyConfig || typeof legacyConfig !== "object") {
    return createDefaultProject();
  }

  // If already in Unified Project format, validate and return
  if (legacyConfig.version && Array.isArray(legacyConfig.scenes) && legacyConfig.canvas) {
    return validateProject(legacyConfig).project;
  }

  const tabId = legacyConfig.id || "post_match";
  const fps = 30;
  const legacyScenes = Array.isArray(legacyConfig.scenes) ? legacyConfig.scenes : [];

  const convertedScenes = legacyScenes.map((s, idx) => {
    const sceneId = `sc_${idx + 1}`;
    const sDuration = Number(s.duration) || 5;

    // Build structured visual elements matching the legacy template layers
    const elements = [];

    // 1. Scene Header Badge
    elements.push({
      id: `${sceneId}_badge`,
      type: "text",
      name: "Scene Badge",
      content: s.title || `ADEGAN ${idx + 1}`,
      position: { x: 80, y: 180 },
      size: { width: 920, height: 40 },
      zIndex: 10,
      styling: {
        fontSize: 22,
        fontWeight: 800,
        color: legacyConfig.colors?.accent || "#f0a500",
        letterSpacing: 3,
        textTransform: "uppercase"
      },
      animation: {
        type: "fade",
        delay: 0,
        duration: 0.3
      }
    });

    // 2. Kinetic Headline Text
    if (s.screenText) {
      elements.push({
        id: `${sceneId}_headline`,
        type: "text",
        name: "Screen Text Headline",
        content: s.screenText,
        position: { x: 80, y: 230 },
        size: { width: 920, height: 180 },
        zIndex: 20,
        styling: {
          fontFamily: "'Bebas Neue', 'Poppins', sans-serif",
          fontSize: 84,
          fontWeight: 900,
          color: legacyConfig.colors?.text || "#ffffff",
          accentColor: legacyConfig.colors?.accent || "#f0a500",
          lineHeight: 1.05
        },
        props: {
          highlightWord: s.highlightWord || ""
        },
        animation: {
          type: "slide",
          delay: 0.1,
          duration: 0.5,
          from: { y: 60, opacity: 0 },
          to: { y: 0, opacity: 1 }
        }
      });
    }

    // 3. Theme Visual Graphics Component
    elements.push({
      id: `${sceneId}_theme_visual`,
      type: "component",
      name: `Visual Stage ${tabId} Scene ${idx + 1}`,
      content: s.visualAction || "",
      position: { x: 90, y: 440 },
      size: { width: 900, height: 800 },
      zIndex: 15,
      props: {
        tabId,
        sceneIndex: idx + 1,
        visualAction: s.visualAction || "",
        dataValue: s.dataValue || "",
        dataLabel: s.dataLabel || ""
      },
      animation: {
        type: "scale",
        delay: 0.15,
        duration: 0.6
      }
    });

    // 4. Data Pill Milestone Card (if dataValue exists)
    if (s.dataValue && s.dataValue.trim() !== "") {
      elements.push({
        id: `${sceneId}_data_pill`,
        type: "component",
        name: "Data Milestone Card",
        content: s.dataValue,
        position: { x: 190, y: 1300 },
        size: { width: 700, height: 160 },
        zIndex: 25,
        styling: {
          backgroundColor: "rgba(10, 15, 26, 0.94)",
          borderColor: legacyConfig.colors?.accent || "#f0a500",
          borderWidth: 2,
          borderRadius: 20
        },
        props: {
          value: s.dataValue,
          label: s.dataLabel || "Data Terverifikasi"
        },
        animation: {
          type: "slide",
          delay: 0.3,
          duration: 0.5,
          from: { y: 40, opacity: 0 },
          to: { y: 0, opacity: 1 }
        }
      });
    }

    // 5. Narration Subtitle
    if (s.narration) {
      elements.push({
        id: `${sceneId}_subtitle`,
        type: "text",
        name: "Narration Subtitle",
        content: s.narration,
        position: { x: 80, y: 1540 },
        size: { width: 920, height: 150 },
        zIndex: 20,
        styling: {
          fontFamily: "'Inter', sans-serif",
          fontSize: 32,
          lineHeight: 1.45,
          color: legacyConfig.colors?.text || "#ffffff",
          textAlign: "center"
        },
        props: {
          highlightWord: s.highlightWord || ""
        },
        animation: {
          type: "fade",
          delay: 0.2,
          duration: 0.4
        }
      });
    }

    return {
      id: sceneId,
      name: s.title || `Adegan ${idx + 1}`,
      order: idx + 1,
      duration: sDuration,
      transition: {
        type: idx > 0 ? "slash" : "none",
        direction: idx % 2 === 0 ? "right" : "left",
        duration: 0.4
      },
      elements,
      // Retain legacy template fields
      title: s.title || `Adegan ${idx + 1}`,
      narration: s.narration || "",
      screenText: s.screenText || "",
      highlightWord: s.highlightWord || "",
      dataValue: s.dataValue || "",
      dataLabel: s.dataLabel || "",
      visualAction: s.visualAction || ""
    };
  });

  const project = createDefaultProject({
    id: `persib_${tabId}`,
    name: legacyConfig.name || legacyConfig.topic || "Persib Motion Studio",
    videoTitle: legacyConfig.topic || "Persib Bandung",
    canvas: { width: 1080, height: 1920 },
    fps,
    totalDuration: Number(legacyConfig.duration) || 30,
    aspectRatio: "9:16",
    theme: {
      colors: {
        primary: legacyConfig.colors?.primary || "#003da5",
        secondary: legacyConfig.colors?.secondary || "#0a0a0a",
        text: legacyConfig.colors?.text || "#ffffff",
        accent: legacyConfig.colors?.accent || "#f0a500"
      },
      fonts: {
        title: "'Bebas Neue', 'Poppins', sans-serif",
        body: "'Inter', sans-serif"
      }
    },
    metadata: {
      tabId,
      category: legacyConfig.category || "Hasil Pertandingan",
      angle: legacyConfig.angle || "",
      audience: legacyConfig.audience || "Bobotoh",
      goal: legacyConfig.goal || "Rayakan Kemenangan",
      tone: legacyConfig.tone || "Bangga & Bersemangat",
      preset: legacyConfig.preset || "preset_b",
      metaphor: legacyConfig.metaphor || "card",
      badge: legacyConfig.badge || "",
      icon: legacyConfig.icon || "⚽"
    },
    scenes: convertedScenes
  });

  return project;
}

/**
 * Converts a Unified Project back to the legacy template format
 * if required by backward compatibility layers.
 */
export function projectToLegacyConfig(project) {
  if (!project) return null;

  return {
    id: project.metadata?.tabId || project.id || "post_match",
    name: project.name,
    topic: project.videoTitle || project.name,
    category: project.metadata?.category || "Hasil Pertandingan",
    angle: project.metadata?.angle || "",
    audience: project.metadata?.audience || "Bobotoh",
    goal: project.metadata?.goal || "Rayakan Kemenangan",
    tone: project.metadata?.tone || "Bangga & Bersemangat",
    preset: project.metadata?.preset || "preset_b",
    metaphor: project.metadata?.metaphor || "card",
    colors: {
      primary: project.theme?.colors?.primary || "#003da5",
      secondary: project.theme?.colors?.secondary || "#0a0a0a",
      text: project.theme?.colors?.text || "#ffffff",
      accent: project.theme?.colors?.accent || "#f0a500"
    },
    duration: project.totalDuration,
    scenes: (project.scenes || []).map((s, idx) => ({
      id: idx + 1,
      title: s.title || s.name || `Adegan ${idx + 1}`,
      duration: s.duration,
      narration: s.narration || "",
      screenText: s.screenText || "",
      highlightWord: s.highlightWord || "",
      dataValue: s.dataValue || "",
      dataLabel: s.dataLabel || "",
      visualAction: s.visualAction || ""
    }))
  };
}

/**
 * Adds a new scene to the project and recalculates timings.
 */
export function addScene(project, sceneData = {}, insertAfterIndex = -1) {
  const newIndex = insertAfterIndex >= 0 ? insertAfterIndex + 1 : project.scenes.length;
  const sceneId = sceneData.id || `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const fps = project.fps || 30;

  const newScene = sanitizeScene({
    id: sceneId,
    name: sceneData.name || sceneData.title || `Adegan ${newIndex + 1}`,
    duration: Number(sceneData.duration) || 5,
    transition: sceneData.transition || { type: "slash", direction: "right", duration: 0.4 },
    background: sceneData.background || "",
    elements: sceneData.elements || [
      {
        id: `${sceneId}_headline`,
        type: "text",
        name: "Teks Judul",
        content: sceneData.screenText || "JUDUL ADEGAN BARU",
        position: { x: 80, y: 230 },
        size: { width: 920, height: 180 },
        zIndex: 10,
        styling: { fontSize: 80, fontWeight: 900, color: project.theme?.colors?.text || "#ffffff" },
        animation: { type: "slide", delay: 0.1, duration: 0.5 }
      }
    ],
    title: sceneData.title || sceneData.name || `Adegan ${newIndex + 1}`,
    narration: sceneData.narration || "",
    screenText: sceneData.screenText || "JUDUL ADEGAN BARU",
    highlightWord: sceneData.highlightWord || "",
    dataValue: sceneData.dataValue || "",
    dataLabel: sceneData.dataLabel || "",
    visualAction: sceneData.visualAction || ""
  }, newIndex, fps);

  project.scenes.splice(newIndex, 0, newScene);
  recalculateSceneTimings(project);
  return newScene;
}

/**
 * Deletes a scene by ID, maintaining minimal 1 scene constraint.
 */
export function deleteScene(project, sceneId) {
  if (project.scenes.length <= 1) {
    return false;
  }
  const idx = project.scenes.findIndex(s => String(s.id) === String(sceneId));
  if (idx === -1) return false;

  project.scenes.splice(idx, 1);
  recalculateSceneTimings(project);
  return true;
}

/**
 * Duplicates a scene with deep cloned elements and unique IDs.
 */
export function duplicateScene(project, sceneId) {
  const idx = project.scenes.findIndex(s => String(s.id) === String(sceneId));
  if (idx === -1) return null;

  const source = project.scenes[idx];
  const newSceneId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cloned = JSON.parse(JSON.stringify(source));

  cloned.id = newSceneId;
  cloned.name = `${source.name || source.title || 'Adegan'} (Salinan)`;
  cloned.title = cloned.name;

  if (Array.isArray(cloned.elements)) {
    cloned.elements = cloned.elements.map((el, eIdx) => ({
      ...el,
      id: `${newSceneId}_el_${eIdx + 1}_${Math.random().toString(36).substring(2, 5)}`
    }));
  }

  project.scenes.splice(idx + 1, 0, cloned);
  recalculateSceneTimings(project);
  return cloned;
}

/**
 * Reorders a scene from one index to another.
 */
export function reorderScenes(project, fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= project.scenes.length) return false;
  if (toIndex < 0 || toIndex >= project.scenes.length) return false;
  if (fromIndex === toIndex) return true;

  const [moved] = project.scenes.splice(fromIndex, 1);
  project.scenes.splice(toIndex, 0, moved);
  recalculateSceneTimings(project);
  return true;
}

/**
 * Adds an element to a specified scene.
 */
export function addElement(project, sceneId, elementData = {}) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene) return null;

  const fps = project.fps || 30;
  const elIdx = scene.elements.length;
  const newEl = sanitizeElement(elementData, elIdx, sceneId, fps);
  scene.elements.push(newEl);
  return newEl;
}

/**
 * Deletes an element from a specified scene.
 */
export function deleteElement(project, sceneId, elementId) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene) return false;

  const idx = scene.elements.findIndex(el => String(el.id) === String(elementId));
  if (idx === -1) return false;

  scene.elements.splice(idx, 1);
  return true;
}

/**
 * Duplicates an element within a scene, shifting its position slightly.
 */
export function duplicateElement(project, sceneId, elementId) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene) return null;

  const source = scene.elements.find(el => String(el.id) === String(elementId));
  if (!source) return null;

  const cloned = JSON.parse(JSON.stringify(source));
  cloned.id = `el_${sceneId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
  cloned.name = `${source.name || source.type} (Salinan)`;
  cloned.position = {
    x: (Number(source.position?.x) || 0) + 20,
    y: (Number(source.position?.y) || 0) + 20
  };
  cloned.zIndex = (Number(source.zIndex) || 1) + 1;

  scene.elements.push(cloned);
  return cloned;
}

/**
 * Reorders elements within a scene, updating zIndex accordingly.
 */
export function reorderElements(project, sceneId, fromIndex, toIndex) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene || !Array.isArray(scene.elements)) return false;
  if (fromIndex < 0 || fromIndex >= scene.elements.length) return false;
  if (toIndex < 0 || toIndex >= scene.elements.length) return false;
  if (fromIndex === toIndex) return true;

  const [moved] = scene.elements.splice(fromIndex, 1);
  scene.elements.splice(toIndex, 0, moved);

  scene.elements.forEach((el, idx) => {
    el.zIndex = idx + 1;
  });

  return true;
}

/**
 * Sets element visibility.
 */
export function setElementVisibility(project, sceneId, elementId, visible) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene) return false;

  const el = scene.elements.find(e => String(e.id) === String(elementId));
  if (!el) return false;

  el.visible = Boolean(visible);
  return true;
}

/**
 * Sets element lock state.
 */
export function setElementLock(project, sceneId, elementId, locked) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene) return false;

  const el = scene.elements.find(e => String(e.id) === String(elementId));
  if (!el) return false;

  el.locked = Boolean(locked);
  return true;
}

/**
 * Updates properties of an element in a scene.
 */
export function updateElementProperties(project, sceneId, elementId, updates = {}) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene) return null;

  const el = scene.elements.find(e => String(e.id) === String(elementId));
  if (!el) return null;

  if (updates.name !== undefined) el.name = updates.name;
  if (updates.content !== undefined) el.content = updates.content;
  if (updates.assetUrl !== undefined) el.assetUrl = updates.assetUrl;
  if (updates.rotation !== undefined) el.rotation = Number(updates.rotation) || 0;
  if (updates.scale !== undefined) el.scale = Number(updates.scale) || 1;
  if (updates.opacity !== undefined) el.opacity = Math.max(0, Math.min(1, Number(updates.opacity)));
  if (updates.zIndex !== undefined) el.zIndex = Number(updates.zIndex);
  if (updates.visible !== undefined) el.visible = Boolean(updates.visible);
  if (updates.locked !== undefined) el.locked = Boolean(updates.locked);

  if (updates.position) {
    el.position = {
      x: updates.position.x !== undefined ? Number(updates.position.x) : el.position.x,
      y: updates.position.y !== undefined ? Number(updates.position.y) : el.position.y
    };
  }

  if (updates.size) {
    el.size = {
      width: updates.size.width !== undefined ? updates.size.width : el.size.width,
      height: updates.size.height !== undefined ? updates.size.height : el.size.height
    };
  }

  if (updates.styling) {
    el.styling = { ...el.styling, ...updates.styling };
  }

  if (updates.animation) {
    el.animation = { ...el.animation, ...updates.animation };
  }

  if (updates.props) {
    el.props = { ...el.props, ...updates.props };
  }

  return el;
}

/**
 * Updates scene properties and recalculates timings if duration changed.
 */
export function updateSceneProperties(project, sceneId, updates = {}) {
  const scene = project.scenes.find(s => String(s.id) === String(sceneId));
  if (!scene) return null;

  if (updates.name !== undefined) {
    scene.name = updates.name;
    scene.title = updates.name;
  }
  if (updates.duration !== undefined) {
    scene.duration = Math.max(0.5, Number(updates.duration) || 5);
    recalculateSceneTimings(project);
  }
  if (updates.transition !== undefined) {
    scene.transition = { ...scene.transition, ...updates.transition };
  }
  if (updates.background !== undefined) {
    scene.background = updates.background;
  }
  if (updates.narration !== undefined) scene.narration = updates.narration;
  if (updates.screenText !== undefined) scene.screenText = updates.screenText;
  if (updates.highlightWord !== undefined) scene.highlightWord = updates.highlightWord;
  if (updates.dataValue !== undefined) scene.dataValue = updates.dataValue;
  if (updates.dataLabel !== undefined) scene.dataLabel = updates.dataLabel;
  if (updates.visualAction !== undefined) scene.visualAction = updates.visualAction;

  return scene;
}

/**
 * Updates audio configuration.
 */
export function updateAudioProperties(project, audioUpdates = {}) {
  if (!project.audio) {
    project.audio = { enabled: false, bgmUrl: "", volume: 0.8, muted: false, startPosition: 0, duration: 0 };
  }
  project.audio = {
    ...project.audio,
    ...audioUpdates
  };
  return project.audio;
}

