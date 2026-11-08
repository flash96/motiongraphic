"use strict";
(() => {
  // project-schema.js
  var CURRENT_SCHEMA_VERSION = "1.0.0";
  var ELEMENT_TYPES = ["text", "image", "video", "shape", "logo", "audio", "component", "svg"];
  var ANIMATION_TYPES = ["none", "fade", "slide", "scale", "rotate", "counter"];
  var TRANSITION_TYPES = ["none", "fade", "slide", "slash"];
  function createDefaultProject(overrides = {}) {
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
        volume: overrides.audio.volume !== void 0 ? Number(overrides.audio.volume) : 0.8,
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
        ...overrides.metadata || {}
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
  function sanitizeElement(el, idx, sceneId, fps = 30) {
    const elemId = el.id ? String(el.id) : `el_${sceneId}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`;
    const type = ELEMENT_TYPES.includes(el.type) ? el.type : "text";
    const element = {
      id: elemId,
      type,
      name: el.name || `${type}_${idx + 1}`,
      content: el.content !== void 0 ? String(el.content) : "",
      assetUrl: el.assetUrl || "",
      assetId: el.assetId || "",
      fitMode: el.fitMode || "contain",
      position: {
        x: Number(el.position?.x) || 0,
        y: Number(el.position?.y) || 0
      },
      size: {
        width: el.size?.width !== void 0 ? el.size.width : "auto",
        height: el.size?.height !== void 0 ? el.size.height : "auto"
      },
      rotation: Number(el.rotation) || 0,
      scale: Number(el.scale) || 1,
      opacity: el.opacity !== void 0 ? Math.max(0, Math.min(1, Number(el.opacity))) : 1,
      zIndex: Number(el.zIndex) || idx + 1,
      visible: el.visible !== false,
      locked: el.locked === true,
      styling: { ...el.styling || {} },
      props: { ...el.props || {} }
    };
    if (el.animation) {
      const animType = ANIMATION_TYPES.includes(el.animation.type) ? el.animation.type : "none";
      element.animation = {
        type: animType,
        delay: Number(el.animation.delay) || 0,
        duration: Number(el.animation.duration) || 0.5,
        easing: el.animation.easing || "power2.out",
        from: el.animation.from ? { ...el.animation.from } : void 0,
        to: el.animation.to ? { ...el.animation.to } : void 0,
        startFrame: el.animation.startFrame !== void 0 ? Number(el.animation.startFrame) : Math.round((Number(el.animation.delay) || 0) * fps),
        repeat: Number(el.animation.repeat) || 0
      };
    }
    return element;
  }
  function sanitizeScene(scene, idx, fps = 30) {
    const sceneId = scene.id !== void 0 ? String(scene.id) : String(idx + 1);
    const duration = Math.max(0.5, Number(scene.duration) || 5);
    const transitionType = scene.transition?.type && TRANSITION_TYPES.includes(scene.transition.type) ? scene.transition.type : "none";
    const sanitized = {
      id: sceneId,
      name: scene.name || scene.title || `Adegan ${idx + 1}`,
      order: scene.order !== void 0 ? Number(scene.order) : idx + 1,
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
          speakingRate: Number(scene.voiceover.parameters?.speakingRate) || 1,
          pitch: Number(scene.voiceover.parameters?.pitch) || 0,
          stability: Number(scene.voiceover.parameters?.stability) || 0.75,
          ...scene.voiceover.parameters || {}
        },
        assetId: scene.voiceover.assetId || "",
        audioUrl: scene.voiceover.audioUrl || "",
        sourceText: scene.voiceover.sourceText || "",
        duration: Number(scene.voiceover.duration) || 0,
        status: scene.voiceover.status || (scene.voiceover.audioUrl ? "ready" : "idle"),
        generatedAt: scene.voiceover.generatedAt || "",
        timingMetadata: scene.voiceover.timingMetadata || null
      };
      if (sanitized.voiceover.audioUrl && sanitized.voiceover.sourceText && sanitized.narration && sanitized.voiceover.sourceText.trim() !== sanitized.narration.trim()) {
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
          ...scene.captions.style || {}
        },
        segments: Array.isArray(scene.captions.segments) ? scene.captions.segments.map((seg, sIdx) => ({
          id: seg.id || `seg_${sIdx}`,
          start: Number(seg.start) || 0,
          end: Number(seg.end) || 0,
          duration: Number(seg.duration) || Math.max(0, (Number(seg.end) || 0) - (Number(seg.start) || 0)),
          text: String(seg.text || ""),
          words: Array.isArray(seg.words) ? seg.words.map((w, wIdx) => ({
            word: String(w.word || ""),
            start: Number(w.start) || 0,
            end: Number(w.end) || 0,
            order: w.order !== void 0 ? Number(w.order) : wIdx,
            duration: Number(w.duration) || Math.max(0, (Number(w.end) || 0) - (Number(w.start) || 0))
          })) : []
        })) : [],
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
  function recalculateSceneTimings(project) {
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
  function validateProject(rawProject) {
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
    if (!rawProject.version) {
      warnings.push(`Missing version; assuming current schema version ${CURRENT_SCHEMA_VERSION}.`);
    }
    const width = Number(rawProject.canvas?.width);
    const height = Number(rawProject.canvas?.height);
    if (!width || width <= 0 || !height || height <= 0) {
      errors.push(`Invalid canvas dimensions: width (${width}) and height (${height}) must be positive numbers.`);
    }
    const fps = Number(rawProject.fps);
    if (!fps || fps <= 0 || fps > 120) {
      errors.push(`Invalid FPS: ${fps}. Must be between 1 and 120.`);
    }
    if (!Array.isArray(rawProject.scenes) || rawProject.scenes.length === 0) {
      errors.push("Project must contain at least one scene.");
    }
    const sceneIds = /* @__PURE__ */ new Set();
    const elementIds = /* @__PURE__ */ new Set();
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
          if (scene.voiceover.audioUrl && scene.voiceover.sourceText && scene.narration && scene.voiceover.sourceText.trim() !== scene.narration.trim()) {
            warnings.push(`Scene "${sId}" voiceover audio is outdated: narration text has changed.`);
          }
        }
        if (scene.captions) {
          if (scene.captions.enabled && (!Array.isArray(scene.captions.segments) || scene.captions.segments.length === 0)) {
            warnings.push(`Scene "${sId}" has captions enabled but segments list is empty.`);
          }
          if (Array.isArray(scene.captions.segments)) {
            scene.captions.segments.forEach((seg, sIdx2) => {
              if (Number(seg.start) > Number(seg.end)) {
                warnings.push(`Scene "${sId}" caption segment ${sIdx2} has start (${seg.start}) greater than end (${seg.end}).`);
              }
            });
          }
        }
      });
    }
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
  function migrateLegacyTemplateToProject(legacyConfig) {
    if (!legacyConfig || typeof legacyConfig !== "object") {
      return createDefaultProject();
    }
    if (legacyConfig.version && Array.isArray(legacyConfig.scenes) && legacyConfig.canvas) {
      return validateProject(legacyConfig).project;
    }
    const tabId = legacyConfig.id || "post_match";
    const fps = 30;
    const legacyScenes = Array.isArray(legacyConfig.scenes) ? legacyConfig.scenes : [];
    const convertedScenes = legacyScenes.map((s, idx) => {
      const sceneId = `sc_${idx + 1}`;
      const sDuration = Number(s.duration) || 5;
      const elements = [];
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
        icon: legacyConfig.icon || "\u26BD"
      },
      scenes: convertedScenes
    });
    return project;
  }
  function addScene(project, sceneData = {}, insertAfterIndex = -1) {
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
  function deleteScene(project, sceneId) {
    if (project.scenes.length <= 1) {
      return false;
    }
    const idx = project.scenes.findIndex((s) => String(s.id) === String(sceneId));
    if (idx === -1) return false;
    project.scenes.splice(idx, 1);
    recalculateSceneTimings(project);
    return true;
  }
  function duplicateScene(project, sceneId) {
    const idx = project.scenes.findIndex((s) => String(s.id) === String(sceneId));
    if (idx === -1) return null;
    const source = project.scenes[idx];
    const newSceneId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cloned = JSON.parse(JSON.stringify(source));
    cloned.id = newSceneId;
    cloned.name = `${source.name || source.title || "Adegan"} (Salinan)`;
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
  function reorderScenes(project, fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= project.scenes.length) return false;
    if (toIndex < 0 || toIndex >= project.scenes.length) return false;
    if (fromIndex === toIndex) return true;
    const [moved] = project.scenes.splice(fromIndex, 1);
    project.scenes.splice(toIndex, 0, moved);
    recalculateSceneTimings(project);
    return true;
  }
  function addElement(project, sceneId, elementData = {}) {
    const scene = project.scenes.find((s) => String(s.id) === String(sceneId));
    if (!scene) return null;
    const fps = project.fps || 30;
    const elIdx = scene.elements.length;
    const newEl = sanitizeElement(elementData, elIdx, sceneId, fps);
    scene.elements.push(newEl);
    return newEl;
  }
  function deleteElement(project, sceneId, elementId) {
    const scene = project.scenes.find((s) => String(s.id) === String(sceneId));
    if (!scene) return false;
    const idx = scene.elements.findIndex((el) => String(el.id) === String(elementId));
    if (idx === -1) return false;
    scene.elements.splice(idx, 1);
    return true;
  }
  function duplicateElement(project, sceneId, elementId) {
    const scene = project.scenes.find((s) => String(s.id) === String(sceneId));
    if (!scene) return null;
    const source = scene.elements.find((el) => String(el.id) === String(elementId));
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
  function setElementVisibility(project, sceneId, elementId, visible) {
    const scene = project.scenes.find((s) => String(s.id) === String(sceneId));
    if (!scene) return false;
    const el = scene.elements.find((e) => String(e.id) === String(elementId));
    if (!el) return false;
    el.visible = Boolean(visible);
    return true;
  }
  function setElementLock(project, sceneId, elementId, locked) {
    const scene = project.scenes.find((s) => String(s.id) === String(sceneId));
    if (!scene) return false;
    const el = scene.elements.find((e) => String(e.id) === String(elementId));
    if (!el) return false;
    el.locked = Boolean(locked);
    return true;
  }
  function updateSceneProperties(project, sceneId, updates = {}) {
    const scene = project.scenes.find((s) => String(s.id) === String(sceneId));
    if (!scene) return null;
    if (updates.name !== void 0) {
      scene.name = updates.name;
      scene.title = updates.name;
    }
    if (updates.duration !== void 0) {
      scene.duration = Math.max(0.5, Number(updates.duration) || 5);
      recalculateSceneTimings(project);
    }
    if (updates.transition !== void 0) {
      scene.transition = { ...scene.transition, ...updates.transition };
    }
    if (updates.background !== void 0) {
      scene.background = updates.background;
    }
    if (updates.narration !== void 0) scene.narration = updates.narration;
    if (updates.screenText !== void 0) scene.screenText = updates.screenText;
    if (updates.highlightWord !== void 0) scene.highlightWord = updates.highlightWord;
    if (updates.dataValue !== void 0) scene.dataValue = updates.dataValue;
    if (updates.dataLabel !== void 0) scene.dataLabel = updates.dataLabel;
    if (updates.visualAction !== void 0) scene.visualAction = updates.visualAction;
    return scene;
  }
  function updateAudioProperties(project, audioUpdates = {}) {
    if (!project.audio) {
      project.audio = { enabled: false, bgmUrl: "", volume: 0.8, muted: false, startPosition: 0, duration: 0 };
    }
    project.audio = {
      ...project.audio,
      ...audioUpdates
    };
    return project.audio;
  }

  // templates.js
  var PERSIB_TABS = {
    post_match: {
      id: "post_match",
      name: "Post-Match Recap",
      icon: "\u26BD",
      badge: "Hasil Laga",
      topic: "Kemenangan Dramatis Maung Bandung!",
      category: "Hasil Pertandingan",
      angle: "Persib tampil dominan dan amankan 3 poin penting di kandang",
      audience: "Bobotoh & Pecinta Sepak Bola Indonesia",
      goal: "Rayakan Kemenangan & Rekap Hasil",
      tone: "Bangga, Bersemangat & Tegas",
      preset: "preset_b",
      colors: {
        primary: "#003da5",
        // Biru Persib
        secondary: "#0a0a0a",
        // Gelap Modern
        text: "#ffffff",
        // Putih Bersih
        accent: "#f0a500"
        // Emas Brand Logo
      },
      duration: 30,
      metaphor: "card",
      scenes: [
        {
          id: 1,
          title: "Peluit Akhir",
          duration: 5,
          narration: "Peluit panjang berbunyi! Maung Bandung kembali amankan poin penuh di kandang!",
          screenText: "FULL TIME 3 POIN",
          highlightWord: "3 POIN",
          dataValue: "",
          dataLabel: "",
          visualAction: "Logo Maung Bandung dan plakat kemenangan mendarat mantap di panggung."
        },
        {
          id: 2,
          title: "Papan Skor Akhir",
          duration: 6,
          narration: "Dominasi tak terbendung sejak menit awal berbuah kemenangan meyakinkan 3 gol di Si Jalak Harupat.",
          screenText: "SKOR AKHIR PERSIB MENANG",
          highlightWord: "MENANG",
          dataValue: "3 - 1",
          dataLabel: "Skor Akhir",
          visualAction: "Papan skor besar beranimasi counter dinamis dengan highlight warna emas."
        },
        {
          id: 3,
          title: "Statistik Penguasaan",
          duration: 6,
          narration: "Persib unggul mutlak dalam penguasaan bola dan menciptakan 14 peluang tembakan berbahaya.",
          screenText: "DOMINASI TOTAL 58 PERSEN",
          highlightWord: "DOMINASI",
          dataValue: "58%",
          dataLabel: "Ball Possession",
          visualAction: "Grafik metrik statistik melonjak menunjukkan supremasi lini tengah."
        },
        {
          id: 4,
          title: "Man of the Match",
          duration: 7,
          narration: "Penampilan luar biasa sang juru gedor dengan torehan brace membawa Pangeran Biru terbang tinggi.",
          screenText: "MAN OF THE MATCH",
          highlightWord: "MATCH",
          dataValue: "8.9",
          dataLabel: "Rating Penampilan",
          visualAction: "Kartu bintang pertandingan terangkat dengan lencana penghargaan emas."
        },
        {
          id: 5,
          title: "Posisi Klasemen & Penutup",
          duration: 6,
          narration: "Tambahan 3 poin menjaga Maung Bandung tetap kokoh di jalur perebutan gelar juara!",
          screenText: "PUNCAK KLASEMEN MILIK KITA",
          highlightWord: "PUNCAK",
          dataValue: "#1",
          dataLabel: "Posisi Klasemen",
          visualAction: "Tangga klasemen terkunci di urutan teratas diikuti seruan bangga Bobotoh."
        }
      ]
    },
    weekly_recap: {
      id: "weekly_recap",
      name: "Rangkuman Mingguan",
      icon: "\u{1F4CA}",
      badge: "Tren Pekan Ini",
      topic: "Rapor Sepekan Persib Bandung",
      category: "Rangkuman Mingguan",
      angle: "Catatan performa sepekan, konsistensi taktik dan tren poin klasemen",
      audience: "Bobotoh & Pemerhati Liga 1",
      goal: "Analisis & Update Performa",
      tone: "Objektif, Taktis & Optimis",
      preset: "preset_b",
      colors: {
        primary: "#003da5",
        secondary: "#0d1117",
        text: "#f0f6fc",
        accent: "#f0a500"
      },
      duration: 30,
      metaphor: "chart",
      scenes: [
        {
          id: 1,
          title: "Pembuka Pekan Ini",
          duration: 5,
          narration: "Inilah rangkuman catatan penting perjuangan Maung Bandung sepanjang pekan ini.",
          screenText: "RAPOR MINGGUAN SEPEKAN",
          highlightWord: "RAPOR",
          dataValue: "",
          dataLabel: "",
          visualAction: "Folder laporan mingguan terbuka memunculkan rangkuman data penting."
        },
        {
          id: 2,
          title: "Rentetan Tak Terkalahkan",
          duration: 6,
          narration: "Tren positif terus terjaga dengan torehan lima kemenangan beruntun di semua ajang.",
          screenText: "LIMA LAGA TANPA KALAH",
          highlightWord: "TANPA",
          dataValue: "5 LAGA",
          dataLabel: "Unbeaten Streak",
          visualAction: "Grafik garis melesat naik membentuk kurva kemenangan yang stabil."
        },
        {
          id: 3,
          title: "Produktivitas Lini Depan",
          duration: 7,
          narration: "Lini serang menunjukkan ketajaman impresif dengan total 12 gol tercipta dari berbagai skema.",
          screenText: "DUA BELAS GOL TERCIPTA",
          highlightWord: "DUA BELAS",
          dataValue: "12 GOL",
          dataLabel: "Gol Pekan Ini",
          visualAction: "Meteran produktivitas terisi penuh mencapai zona hijau maksimal."
        },
        {
          id: 4,
          title: "Koleksi Poin Klasemen",
          duration: 6,
          narration: "Koleksi poin kini mencapai 37 poin dan terus menempel ketat rival terdekat di papan atas.",
          screenText: "TIGA PULUH TUJUH POIN",
          highlightWord: "TUJUH",
          dataValue: "37 POIN",
          dataLabel: "Total Poin",
          visualAction: "Indikator poin bertambah cepat dan mengunci peringkat papan atas."
        },
        {
          id: 5,
          title: "Fokus Laga Berikutnya",
          duration: 6,
          narration: "Pekan depan duel akbar telah menanti. Jaga kekompakan dan kawal Maung Bandung sampai tuntas!",
          screenText: "KAWAL KEBANGGAAN TERUS",
          highlightWord: "KEBANGGAAN",
          dataValue: "MATCHDAY 16",
          dataLabel: "Laga Berikutnya",
          visualAction: "Jadwal pertandingan pekan depan menyala sebagai penutup aksi."
        }
      ]
    },
    trivia_facts: {
      id: "trivia_facts",
      name: "Fakta & Trivia Unik",
      icon: "\u{1F4A1}",
      badge: "Sejarah & Rekor",
      topic: "Tahukah Kamu? Rekor Bersejarah Persib",
      category: "Fakta & Trivia Unik",
      angle: "Membongkar catatan rekor emas legendaris yang membuktikan kebesaran klub",
      audience: "Bobotoh Lintas Generasi & Fans Bola",
      goal: "Edukasi & Menghidupkan Sejarah",
      tone: "Menarik, Edukatif & Penuh Respek",
      preset: "preset_c",
      colors: {
        primary: "#003da5",
        secondary: "#090d16",
        text: "#ffffff",
        accent: "#f0a500"
      },
      duration: 30,
      metaphor: "meter",
      scenes: [
        {
          id: 1,
          title: "Hook Misteri Rekor",
          duration: 5,
          narration: "Tahukah kamu ada satu rekor bersejarah Maung Bandung yang sulit dipecahkan hingga hari ini?",
          screenText: "TAHUKAH KAMU REKOR EMAS",
          highlightWord: "REKOR",
          dataValue: "",
          dataLabel: "",
          visualAction: "Simbol mahkota dan emblem tahun 1933 berputar masuk dengan efek partikel emas."
        },
        {
          id: 2,
          title: "Rekor Tak Terkalahkan",
          duration: 6,
          narration: "Persib pernah mencatatkan rekor spektakuler 14 laga beruntun tanpa menelan satu pun kekalahan.",
          screenText: "EMPAT BELAS LAGA KEBANGGAAN",
          highlightWord: "EMPAT BELAS",
          dataValue: "14 LAGA",
          dataLabel: "Laga Unbeaten",
          visualAction: "Perisai baja tak tertembus terpampang kokoh di tengah panggung."
        },
        {
          id: 3,
          title: "Duet Legendaris Tersubur",
          duration: 7,
          narration: "Kombinasi gol dari duet penyerang maut ini pernah menyumbangkan 35 gol dalam satu musim kompetisi.",
          screenText: "TIGA PULUH LIMA GOL",
          highlightWord: "TIGA PULUH",
          dataValue: "35 GOL",
          dataLabel: "Duet Mematikan",
          visualAction: "Dua sepatu emas menyatu membentuk angka rekor yang berkilau."
        },
        {
          id: 4,
          title: "Basis Suporter Raksasa",
          duration: 6,
          narration: "Dukungan tanpa henti Bobotoh menjadikan atmosfer kandang Persib diakui sebagai salah satu yang terpanas di Asia.",
          screenText: "JUTAAN BOBOTOH SETIA",
          highlightWord: "BOBOTOH",
          dataValue: "5.000.000+",
          dataLabel: "Suporter Setia",
          visualAction: "Gelombang lautan biru Bobotoh menyala menggetarkan layar."
        },
        {
          id: 5,
          title: "Kebanggaan Abadi",
          duration: 6,
          narration: "Sejarah emas membuktikan kebesaran nama Persib Bandung. Bagikan jika kamu bangga jadi Bobotoh!",
          screenText: "BANGGA DUKUNG PERSIB BANDUNG",
          highlightWord: "PERSIB",
          dataValue: "SINCE 1933",
          dataLabel: "Warisan Sejarah",
          visualAction: "Stempel verifikasi kehormatan terkunci mantap di penutup video."
        }
      ]
    },
    before_match: {
      id: "before_match",
      name: "Before Match (Preview)",
      icon: "\u2694\uFE0F",
      badge: "Jadwal & Preview",
      topic: "BIG MATCH ALERT: Menatap Duel Klasik",
      category: "Preview Pertandingan",
      angle: "Kesiapan armada Maung Bandung menghadapi laga sarat gengsi dan adu taktik",
      audience: "Bobotoh & Penonton Sepak Bola",
      goal: "Hype Pertandingan & Info Siaran",
      tone: "Tegang, Agresif & Berenergi Tinggi",
      preset: "preset_b",
      colors: {
        primary: "#003da5",
        secondary: "#080c14",
        text: "#ffffff",
        accent: "#f0a500"
      },
      duration: 30,
      metaphor: "container",
      scenes: [
        {
          id: 1,
          title: "Alarm Big Match",
          duration: 5,
          narration: "Panggung panas sepak bola tanah air siap membara! Duel penuh gengsi menanti di akhir pekan.",
          screenText: "BIG MATCH PERSIB READY",
          highlightWord: "BIG MATCH",
          dataValue: "",
          dataLabel: "",
          visualAction: "Dua kubu lambang bertabrakan memicu percikan energi persaingan panas."
        },
        {
          id: 2,
          title: "Catatan Head to Head",
          duration: 6,
          narration: "Dari lima duel terakhir, Pangeran Biru mendominasi dengan merebut tiga kemenangan krusial.",
          screenText: "HEAD TO HEAD UNGGUL",
          highlightWord: "UNGGUL",
          dataValue: "3 WINS",
          dataLabel: "5 Duel Terakhir",
          visualAction: "Timbangan head-to-head condong berat ke kubu biru Persib."
        },
        {
          id: 3,
          title: "Kondisi Kesiapan Skuad",
          duration: 7,
          narration: "Seluruh pilar inti dalam kondisi fisik seratus persen dan siap menjalankan instruksi strategi pelatih.",
          screenText: "SERATUS PERSEN SIAP TEMPUR",
          highlightWord: "SERATUS",
          dataValue: "100%",
          dataLabel: "Kesiapan Tim",
          visualAction: "Meteran kesiapan armada naik cepat hingga batas maksimal."
        },
        {
          id: 4,
          title: "Kunci Strategi Laga",
          duration: 6,
          narration: "Transisi kilat dari bertahan ke menyerang serta determinasi lini sayap akan menjadi kunci penentu.",
          screenText: "TRANSISI KILAT PENENTU KEMENANGAN",
          highlightWord: "KILAT",
          dataValue: "TRANSISI",
          dataLabel: "Kunci Taktik",
          visualAction: "Papan taktik berkedip memetakan jalur serangan tajam menuju gawang lawan."
        },
        {
          id: 5,
          title: "Jadwal Kickoff & Siaran",
          duration: 6,
          narration: "Jangan lewatkan siaran langsung kickoff Sabtu malam pukul 19.00 WIB. Birukan stadion dan layar kacamumu!",
          screenText: "KICK OFF SABTU MALAM",
          highlightWord: "KICK OFF",
          dataValue: "19:00 WIB",
          dataLabel: "Stadion Si Jalak Harupat",
          visualAction: "Jam hitung mundur berdetik tepat ke waktu kickoff dan mengunci jadwal."
        }
      ]
    },
    transfer_news: {
      id: "transfer_news",
      name: "Transfer & Berita",
      icon: "\u{1F4F0}",
      badge: "Breaking News",
      topic: "WILUJENG SUMPING: Amunisi Baru Tiba!",
      category: "Kabar Transfer & Skuad",
      angle: "Pengumuman resmi rekrutan anyar untuk memperkokoh kedalaman armada Maung Bandung",
      audience: "Bobotoh & Pecinta Bursa Transfer",
      goal: "Pengumuman Resmi & Antusiasme",
      tone: "Eksklusif, Resmi & Cepat",
      preset: "preset_b",
      colors: {
        primary: "#003da5",
        secondary: "#070b12",
        text: "#ffffff",
        accent: "#f0a500"
      },
      duration: 25,
      metaphor: "card",
      scenes: [
        {
          id: 1,
          title: "Breaking News Sump \uBC14",
          duration: 5,
          narration: "Resmi! Maung Bandung resmi memperkenalkan pilar baru untuk mengarungi sisa musim ini.",
          screenText: "RESMI WILUJENG SUMPING",
          highlightWord: "WILUJENG",
          dataValue: "",
          dataLabel: "",
          visualAction: "Stempel resmi 'Wilujeng Sumping' mencap panggung dengan efek kilat."
        },
        {
          id: 2,
          title: "Profil & Posisi Baru",
          duration: 5,
          narration: "Gelandang kreatif berlabel tim nasional ini siap mengenakan nomor punggung keramat di Bandung.",
          screenText: "PLAYMAKER BARU TIBA",
          highlightWord: "PLAYMAKER",
          dataValue: "NO. 10",
          dataLabel: "Posisi Pemain",
          visualAction: "Jersey nomor 10 terbentang megah dengan nama pilar anyar."
        },
        {
          id: 3,
          title: "Catatan Statistik Mentereng",
          duration: 5,
          narration: "Koleksi delapan assist dan akurasi umpan tinggi menjadi modal besar mempertajam daya gedor.",
          screenText: "DELAPAN ASSIST MUSIM LALU",
          highlightWord: "DELAPAN",
          dataValue: "8 ASSIST",
          dataLabel: "Rekor Musim Lalu",
          visualAction: "Kartu statistik pemain terisi data pencapaian yang memukau."
        },
        {
          id: 4,
          title: "Masa Kontrak Jangka Panjang",
          duration: 5,
          narration: "Manajemen langsung mengikat kontrak dua tahun penuh demi komitmen mempertahankan kejayaan klub.",
          screenText: "KONTRAK RESMI DUA TAHUN",
          highlightWord: "DUA TAHUN",
          dataValue: "2 TAHUN",
          dataLabel: "Durasi Kontrak",
          visualAction: "Tanda tangan dokumen resmi terkunci dengan segel lambang klub."
        },
        {
          id: 5,
          title: "Sambutan Hangat Bobotoh",
          duration: 5,
          narration: "Selamat datang di Bumi Pasundan! Tuliskan pesan dan doa terbaikmu untuk penggawa baru kita di kolom komentar!",
          screenText: "SELAMAT DATANG DI BANDUNG",
          highlightWord: "BANDUNG",
          dataValue: "PERSIB 1933",
          dataLabel: "Official Media",
          visualAction: "Pita sambutan selamat datang membentang diiringi riuh gembira Bobotoh."
        }
      ]
    }
  };
  var DEFAULT_TAB = "post_match";
  var DEFAULT_FRAMEWORK = PERSIB_TABS[DEFAULT_TAB];
  var PERSIB_PROJECTS = {
    post_match: migrateLegacyTemplateToProject(PERSIB_TABS.post_match),
    weekly_recap: migrateLegacyTemplateToProject(PERSIB_TABS.weekly_recap),
    trivia_facts: migrateLegacyTemplateToProject(PERSIB_TABS.trivia_facts),
    before_match: migrateLegacyTemplateToProject(PERSIB_TABS.before_match),
    transfer_news: migrateLegacyTemplateToProject(PERSIB_TABS.transfer_news)
  };

  // gsap-lib.js
  var GSAP_INLINE = `/*!
 * GSAP 3.12.5
 * https://gsap.com
 * 
 * @license Copyright 2024, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license or for Club GSAP members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
 */

!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t=t||self).window=t.window||{})}(this,function(e){"use strict";function _inheritsLoose(t,e){t.prototype=Object.create(e.prototype),(t.prototype.constructor=t).__proto__=e}function _assertThisInitialized(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function r(t){return"string"==typeof t}function s(t){return"function"==typeof t}function t(t){return"number"==typeof t}function u(t){return void 0===t}function v(t){return"object"==typeof t}function w(t){return!1!==t}function x(){return"undefined"!=typeof window}function y(t){return s(t)||r(t)}function P(t){return(i=yt(t,ot))&&ze}function Q(t,e){return console.warn("Invalid property",t,"set to",e,"Missing plugin? gsap.registerPlugin()")}function R(t,e){return!e&&console.warn(t)}function S(t,e){return t&&(ot[t]=e)&&i&&(i[t]=e)||ot}function T(){return 0}function ea(t){var e,r,i=t[0];if(v(i)||s(i)||(t=[t]),!(e=(i._gsap||{}).harness)){for(r=gt.length;r--&&!gt[r].targetTest(i););e=gt[r]}for(r=t.length;r--;)t[r]&&(t[r]._gsap||(t[r]._gsap=new Vt(t[r],e)))||t.splice(r,1);return t}function fa(t){return t._gsap||ea(Mt(t))[0]._gsap}function ga(t,e,r){return(r=t[e])&&s(r)?t[e]():u(r)&&t.getAttribute&&t.getAttribute(e)||r}function ha(t,e){return(t=t.split(",")).forEach(e)||t}function ia(t){return Math.round(1e5*t)/1e5||0}function ja(t){return Math.round(1e7*t)/1e7||0}function ka(t,e){var r=e.charAt(0),i=parseFloat(e.substr(2));return t=parseFloat(t),"+"===r?t+i:"-"===r?t-i:"*"===r?t*i:t/i}function la(t,e){for(var r=e.length,i=0;t.indexOf(e[i])<0&&++i<r;);return i<r}function ma(){var t,e,r=dt.length,i=dt.slice(0);for(ct={},t=dt.length=0;t<r;t++)(e=i[t])&&e._lazy&&(e.render(e._lazy[0],e._lazy[1],!0)._lazy=0)}function na(t,e,r,i){dt.length&&!L&&ma(),t.render(e,r,i||L&&e<0&&(t._initted||t._startAt)),dt.length&&!L&&ma()}function oa(t){var e=parseFloat(t);return(e||0===e)&&(t+"").match(at).length<2?e:r(t)?t.trim():t}function pa(t){return t}function qa(t,e){for(var r in e)r in t||(t[r]=e[r]);return t}function ta(t,e){for(var r in e)"__proto__"!==r&&"constructor"!==r&&"prototype"!==r&&(t[r]=v(e[r])?ta(t[r]||(t[r]={}),e[r]):e[r]);return t}function ua(t,e){var r,i={};for(r in t)r in e||(i[r]=t[r]);return i}function va(t){var e=t.parent||I,r=t.keyframes?function _setKeyframeDefaults(i){return function(t,e){for(var r in e)r in t||"duration"===r&&i||"ease"===r||(t[r]=e[r])}}(Z(t.keyframes)):qa;if(w(t.inherit))for(;e;)r(t,e.vars.defaults),e=e.parent||e._dp;return t}function xa(t,e,r,i,n){void 0===r&&(r="_first"),void 0===i&&(i="_last");var a,s=t[i];if(n)for(a=e[n];s&&s[n]>a;)s=s._prev;return s?(e._next=s._next,s._next=e):(e._next=t[r],t[r]=e),e._next?e._next._prev=e:t[i]=e,e._prev=s,e.parent=e._dp=t,e}function ya(t,e,r,i){void 0===r&&(r="_first"),void 0===i&&(i="_last");var n=e._prev,a=e._next;n?n._next=a:t[r]===e&&(t[r]=a),a?a._prev=n:t[i]===e&&(t[i]=n),e._next=e._prev=e.parent=null}function za(t,e){t.parent&&(!e||t.parent.autoRemoveChildren)&&t.parent.remove&&t.parent.remove(t),t._act=0}function Aa(t,e){if(t&&(!e||e._end>t._dur||e._start<0))for(var r=t;r;)r._dirty=1,r=r.parent;return t}function Ca(t,e,r,i){return t._startAt&&(L?t._startAt.revert(ht):t.vars.immediateRender&&!t.vars.autoRevert||t._startAt.render(e,!0,i))}function Ea(t){return t._repeat?Tt(t._tTime,t=t.duration()+t._rDelay)*t:0}function Ga(t,e){return(t-e._start)*e._ts+(0<=e._ts?0:e._dirty?e.totalDuration():e._tDur)}function Ha(t){return t._end=ja(t._start+(t._tDur/Math.abs(t._ts||t._rts||X)||0))}function Ia(t,e){var r=t._dp;return r&&r.smoothChildTiming&&t._ts&&(t._start=ja(r._time-(0<t._ts?e/t._ts:((t._dirty?t.totalDuration():t._tDur)-e)/-t._ts)),Ha(t),r._dirty||Aa(r,t)),t}function Ja(t,e){var r;if((e._time||!e._dur&&e._initted||e._start<t._time&&(e._dur||!e.add))&&(r=Ga(t.rawTime(),e),(!e._dur||Ot(0,e.totalDuration(),r)-e._tTime>X)&&e.render(r,!0)),Aa(t,e)._dp&&t._initted&&t._time>=t._dur&&t._ts){if(t._dur<t.duration())for(r=t;r._dp;)0<=r.rawTime()&&r.totalTime(r._tTime),r=r._dp;t._zTime=-X}}function Ka(e,r,i,n){return r.parent&&za(r),r._start=ja((t(i)?i:i||e!==I?xt(e,i,r):e._time)+r._delay),r._end=ja(r._start+(r.totalDuration()/Math.abs(r.timeScale())||0)),xa(e,r,"_first","_last",e._sort?"_start":0),bt(r)||(e._recent=r),n||Ja(e,r),e._ts<0&&Ia(e,e._tTime),e}function La(t,e){return(ot.ScrollTrigger||Q("scrollTrigger",e))&&ot.ScrollTrigger.create(e,t)}function Ma(t,e,r,i,n){return Qt(t,e,n),t._initted?!r&&t._pt&&!L&&(t._dur&&!1!==t.vars.lazy||!t._dur&&t.vars.lazy)&&f!==Rt.frame?(dt.push(t),t._lazy=[n,i],1):void 0:1}function Ra(t,e,r,i){var n=t._repeat,a=ja(e)||0,s=t._tTime/t._tDur;return s&&!i&&(t._time*=a/t._dur),t._dur=a,t._tDur=n?n<0?1e10:ja(a*(n+1)+t._rDelay*n):a,0<s&&!i&&Ia(t,t._tTime=t._tDur*s),t.parent&&Ha(t),r||Aa(t.parent,t),t}function Sa(t){return t instanceof Xt?Aa(t):Ra(t,t._dur)}function Va(e,r,i){var n,a,s=t(r[1]),o=(s?2:1)+(e<2?0:1),u=r[o];if(s&&(u.duration=r[1]),u.parent=i,e){for(n=u,a=i;a&&!("immediateRender"in n);)n=a.vars.defaults||{},a=w(a.vars.inherit)&&a.parent;u.immediateRender=w(n.immediateRender),e<2?u.runBackwards=1:u.startAt=r[o-1]}return new $t(r[0],u,r[1+o])}function Wa(t,e){return t||0===t?e(t):e}function Ya(t,e){return r(t)&&(e=st.exec(t))?e[1]:""}function _a(t,e){return t&&v(t)&&"length"in t&&(!e&&!t.length||t.length-1 in t&&v(t[0]))&&!t.nodeType&&t!==h}function cb(r){return r=Mt(r)[0]||R("Invalid scope")||{},function(t){var e=r.current||r.nativeElement||r;return Mt(t,e.querySelectorAll?e:e===r?R("Invalid scope")||a.createElement("div"):r)}}function db(t){return t.sort(function(){return.5-Math.random()})}function eb(t){if(s(t))return t;var p=v(t)?t:{each:t},_=jt(p.ease),m=p.from||0,g=parseFloat(p.base)||0,y={},e=0<m&&m<1,T=isNaN(m)||e,b=p.axis,w=m,x=m;return r(m)?w=x={center:.5,edges:.5,end:1}[m]||0:!e&&T&&(w=m[0],x=m[1]),function(t,e,r){var i,n,a,s,o,u,h,l,f,d=(r||p).length,c=y[d];if(!c){if(!(f="auto"===p.grid?0:(p.grid||[1,U])[1])){for(h=-U;h<(h=r[f++].getBoundingClientRect().left)&&f<d;);f<d&&f--}for(c=y[d]=[],i=T?Math.min(f,d)*w-.5:m%f,n=f===U?0:T?d*x/f-.5:m/f|0,l=U,u=h=0;u<d;u++)a=u%f-i,s=n-(u/f|0),c[u]=o=b?Math.abs("y"===b?s:a):K(a*a+s*s),h<o&&(h=o),o<l&&(l=o);"random"===m&&db(c),c.max=h-l,c.min=l,c.v=d=(parseFloat(p.amount)||parseFloat(p.each)*(d<f?d-1:b?"y"===b?d/f:f:Math.max(f,d/f))||0)*("edges"===m?-1:1),c.b=d<0?g-d:g,c.u=Ya(p.amount||p.each)||0,_=_&&d<0?Yt(_):_}return d=(c[t]-c.min)/c.max||0,ja(c.b+(_?_(d):d)*c.v)+c.u}}function fb(i){var n=Math.pow(10,((i+"").split(".")[1]||"").length);return function(e){var r=ja(Math.round(parseFloat(e)/i)*i*n);return(r-r%1)/n+(t(e)?0:Ya(e))}}function gb(h,e){var l,f,r=Z(h);return!r&&v(h)&&(l=r=h.radius||U,h.values?(h=Mt(h.values),(f=!t(h[0]))&&(l*=l)):h=fb(h.increment)),Wa(e,r?s(h)?function(t){return f=h(t),Math.abs(f-t)<=l?f:t}:function(e){for(var r,i,n=parseFloat(f?e.x:e),a=parseFloat(f?e.y:0),s=U,o=0,u=h.length;u--;)(r=f?(r=h[u].x-n)*r+(i=h[u].y-a)*i:Math.abs(h[u]-n))<s&&(s=r,o=u);return o=!l||s<=l?h[o]:e,f||o===e||t(e)?o:o+Ya(e)}:fb(h))}function hb(t,e,r,i){return Wa(Z(t)?!e:!0===r?!!(r=0):!i,function(){return Z(t)?t[~~(Math.random()*t.length)]:(r=r||1e-5)&&(i=r<1?Math.pow(10,(r+"").length-2):1)&&Math.floor(Math.round((t-r/2+Math.random()*(e-t+.99*r))/r)*r*i)/i})}function lb(e,r,t){return Wa(t,function(t){return e[~~r(t)]})}function ob(t){for(var e,r,i,n,a=0,s="";~(e=t.indexOf("random(",a));)i=t.indexOf(")",e),n="["===t.charAt(e+7),r=t.substr(e+7,i-e-7).match(n?at:tt),s+=t.substr(a,e-a)+hb(n?r:+r[0],n?0:+r[1],+r[2]||1e-5),a=i+1;return s+t.substr(a,t.length-a)}function rb(t,e,r){var i,n,a,s=t.labels,o=U;for(i in s)(n=s[i]-e)<0==!!r&&n&&o>(n=Math.abs(n))&&(a=i,o=n);return a}function tb(t){return za(t),t.scrollTrigger&&t.scrollTrigger.kill(!!L),t.progress()<1&&Ct(t,"onInterrupt"),t}function wb(t){if(t)if(t=!t.name&&t.default||t,x()||t.headless){var e=t.name,r=s(t),i=e&&!r&&t.init?function(){this._props=[]}:t,n={init:T,render:he,add:Wt,kill:ce,modifier:fe,rawVars:0},a={targetTest:0,get:0,getSetter:ne,aliases:{},register:0};if(Ft(),t!==i){if(pt[e])return;qa(i,qa(ua(t,n),a)),yt(i.prototype,yt(n,ua(t,a))),pt[i.prop=e]=i,t.targetTest&&(gt.push(i),ft[e]=1),e=("css"===e?"CSS":e.charAt(0).toUpperCase()+e.substr(1))+"Plugin"}S(e,i),t.register&&t.register(ze,i,_e)}else At.push(t)}function zb(t,e,r){return(6*(t+=t<0?1:1<t?-1:0)<1?e+(r-e)*t*6:t<.5?r:3*t<2?e+(r-e)*(2/3-t)*6:e)*St+.5|0}function Ab(e,r,i){var n,a,s,o,u,h,l,f,d,c,p=e?t(e)?[e>>16,e>>8&St,e&St]:0:zt.black;if(!p){if(","===e.substr(-1)&&(e=e.substr(0,e.length-1)),zt[e])p=zt[e];else if("#"===e.charAt(0)){if(e.length<6&&(e="#"+(n=e.charAt(1))+n+(a=e.charAt(2))+a+(s=e.charAt(3))+s+(5===e.length?e.charAt(4)+e.charAt(4):"")),9===e.length)return[(p=parseInt(e.substr(1,6),16))>>16,p>>8&St,p&St,parseInt(e.substr(7),16)/255];p=[(e=parseInt(e.substr(1),16))>>16,e>>8&St,e&St]}else if("hsl"===e.substr(0,3))if(p=c=e.match(tt),r){if(~e.indexOf("="))return p=e.match(et),i&&p.length<4&&(p[3]=1),p}else o=+p[0]%360/360,u=p[1]/100,n=2*(h=p[2]/100)-(a=h<=.5?h*(u+1):h+u-h*u),3<p.length&&(p[3]*=1),p[0]=zb(o+1/3,n,a),p[1]=zb(o,n,a),p[2]=zb(o-1/3,n,a);else p=e.match(tt)||zt.transparent;p=p.map(Number)}return r&&!c&&(n=p[0]/St,a=p[1]/St,s=p[2]/St,h=((l=Math.max(n,a,s))+(f=Math.min(n,a,s)))/2,l===f?o=u=0:(d=l-f,u=.5<h?d/(2-l-f):d/(l+f),o=l===n?(a-s)/d+(a<s?6:0):l===a?(s-n)/d+2:(n-a)/d+4,o*=60),p[0]=~~(o+.5),p[1]=~~(100*u+.5),p[2]=~~(100*h+.5)),i&&p.length<4&&(p[3]=1),p}function Bb(t){var r=[],i=[],n=-1;return t.split(Et).forEach(function(t){var e=t.match(rt)||[];r.push.apply(r,e),i.push(n+=e.length+1)}),r.c=i,r}function Cb(t,e,r){var i,n,a,s,o="",u=(t+o).match(Et),h=e?"hsla(":"rgba(",l=0;if(!u)return t;if(u=u.map(function(t){return(t=Ab(t,e,1))&&h+(e?t[0]+","+t[1]+"%,"+t[2]+"%,"+t[3]:t.join(","))+")"}),r&&(a=Bb(t),(i=r.c).join(o)!==a.c.join(o)))for(s=(n=t.replace(Et,"1").split(rt)).length-1;l<s;l++)o+=n[l]+(~i.indexOf(l)?u.shift()||h+"0,0,0,0)":(a.length?a:u.length?u:r).shift());if(!n)for(s=(n=t.split(Et)).length-1;l<s;l++)o+=n[l]+u[l];return o+n[s]}function Fb(t){var e,r=t.join(" ");if(Et.lastIndex=0,Et.test(r))return e=Dt.test(r),t[1]=Cb(t[1],e),t[0]=Cb(t[0],e,Bb(t[1])),!0}function Ob(t){var e=(t+"").split("("),r=Lt[e[0]];return r&&1<e.length&&r.config?r.config.apply(null,~t.indexOf("{")?[function _parseObjectInString(t){for(var e,r,i,n={},a=t.substr(1,t.length-3).split(":"),s=a[0],o=1,u=a.length;o<u;o++)r=a[o],e=o!==u-1?r.lastIndexOf(","):r.length,i=r.substr(0,e),n[s]=isNaN(i)?i.replace(Bt,"").trim():+i,s=r.substr(e+1).trim();return n}(e[1])]:function _valueInParentheses(t){var e=t.indexOf("(")+1,r=t.indexOf(")"),i=t.indexOf("(",e);return t.substring(e,~i&&i<r?t.indexOf(")",r+1):r)}(t).split(",").map(oa)):Lt._CE&&It.test(t)?Lt._CE("",t):r}function Qb(t,e){for(var r,i=t._first;i;)i instanceof Xt?Qb(i,e):!i.vars.yoyoEase||i._yoyo&&i._repeat||i._yoyo===e||(i.timeline?Qb(i.timeline,e):(r=i._ease,i._ease=i._yEase,i._yEase=r,i._yoyo=e)),i=i._next}function Sb(t,e,r,i){void 0===r&&(r=function easeOut(t){return 1-e(1-t)}),void 0===i&&(i=function easeInOut(t){return t<.5?e(2*t)/2:1-e(2*(1-t))/2});var n,a={easeIn:e,easeOut:r,easeInOut:i};return ha(t,function(t){for(var e in Lt[t]=ot[t]=a,Lt[n=t.toLowerCase()]=r,a)Lt[n+("easeIn"===e?".in":"easeOut"===e?".out":".inOut")]=Lt[t+"."+e]=a[e]}),a}function Tb(e){return function(t){return t<.5?(1-e(1-2*t))/2:.5+e(2*(t-.5))/2}}function Ub(r,t,e){function Jm(t){return 1===t?1:i*Math.pow(2,-10*t)*H((t-a)*n)+1}var i=1<=t?t:1,n=(e||(r?.3:.45))/(t<1?t:1),a=n/N*(Math.asin(1/i)||0),s="out"===r?Jm:"in"===r?function(t){return 1-Jm(1-t)}:Tb(Jm);return n=N/n,s.config=function(t,e){return Ub(r,t,e)},s}function Vb(e,r){function Rm(t){return t?--t*t*((r+1)*t+r)+1:0}void 0===r&&(r=1.70158);var t="out"===e?Rm:"in"===e?function(t){return 1-Rm(1-t)}:Tb(Rm);return t.config=function(t){return Vb(e,t)},t}var F,L,l,I,h,n,a,i,o,f,d,c,p,_,m,g,b,O,k,M,C,A,z,E,D,B,Y,j,q={autoSleep:120,force3D:"auto",nullTargetWarn:1,units:{lineHeight:""}},V={duration:.5,overwrite:!1,delay:0},U=1e8,X=1/U,N=2*Math.PI,G=N/4,W=0,K=Math.sqrt,J=Math.cos,H=Math.sin,$="function"==typeof ArrayBuffer&&ArrayBuffer.isView||function(){},Z=Array.isArray,tt=/(?:-?\\.?\\d|\\.)+/gi,et=/[-+=.]*\\d+[.e\\-+]*\\d*[e\\-+]*\\d*/g,rt=/[-+=.]*\\d+[.e-]*\\d*[a-z%]*/g,it=/[-+=.]*\\d+\\.?\\d*(?:e-|e\\+)?\\d*/gi,nt=/[+-]=-?[.\\d]+/,at=/[^,'"\\[\\]\\s]+/gi,st=/^[+\\-=e\\s\\d]*\\d+[.\\d]*([a-z]*|%)\\s*$/i,ot={},ut={suppressEvents:!0,isStart:!0,kill:!1},ht={suppressEvents:!0,kill:!1},lt={suppressEvents:!0},ft={},dt=[],ct={},pt={},_t={},mt=30,gt=[],vt="",yt=function _merge(t,e){for(var r in e)t[r]=e[r];return t},Tt=function _animationCycle(t,e){var r=Math.floor(t/=e);return t&&r===t?r-1:r},bt=function _isFromOrFromStart(t){var e=t.data;return"isFromStart"===e||"isStart"===e},wt={_start:0,endTime:T,totalDuration:T},xt=function _parsePosition(t,e,i){var n,a,s,o=t.labels,u=t._recent||wt,h=t.duration()>=U?u.endTime(!1):t._dur;return r(e)&&(isNaN(e)||e in o)?(a=e.charAt(0),s="%"===e.substr(-1),n=e.indexOf("="),"<"===a||">"===a?(0<=n&&(e=e.replace(/=/,"")),("<"===a?u._start:u.endTime(0<=u._repeat))+(parseFloat(e.substr(1))||0)*(s?(n<0?u:i).totalDuration()/100:1)):n<0?(e in o||(o[e]=h),o[e]):(a=parseFloat(e.charAt(n-1)+e.substr(n+1)),s&&i&&(a=a/100*(Z(i)?i[0]:i).totalDuration()),1<n?_parsePosition(t,e.substr(0,n-1),i)+a:h+a)):null==e?h:+e},Ot=function _clamp(t,e,r){return r<t?t:e<r?e:r},kt=[].slice,Mt=function toArray(t,e,i){return l&&!e&&l.selector?l.selector(t):!r(t)||i||!n&&Ft()?Z(t)?function _flatten(t,e,i){return void 0===i&&(i=[]),t.forEach(function(t){return r(t)&&!e||_a(t,1)?i.push.apply(i,Mt(t)):i.push(t)})||i}(t,i):_a(t)?kt.call(t,0):t?[t]:[]:kt.call((e||a).querySelectorAll(t),0)},Pt=function mapRange(e,t,r,i,n){var a=t-e,s=i-r;return Wa(n,function(t){return r+((t-e)/a*s||0)})},Ct=function _callback(t,e,r){var i,n,a,s=t.vars,o=s[e],u=l,h=t._ctx;if(o)return i=s[e+"Params"],n=s.callbackScope||t,r&&dt.length&&ma(),h&&(l=h),a=i?o.apply(n,i):o.call(n),l=u,a},At=[],St=255,zt={aqua:[0,St,St],lime:[0,St,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,St],navy:[0,0,128],white:[St,St,St],olive:[128,128,0],yellow:[St,St,0],orange:[St,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[St,0,0],pink:[St,192,203],cyan:[0,St,St],transparent:[St,St,St,0]},Et=function(){var t,e="(?:\\\\b(?:(?:rgb|rgba|hsl|hsla)\\\\(.+?\\\\))|\\\\B#(?:[0-9a-f]{3,4}){1,2}\\\\b";for(t in zt)e+="|"+t+"\\\\b";return new RegExp(e+")","gi")}(),Dt=/hsl[a]?\\(/,Rt=(k=Date.now,M=500,C=33,A=k(),z=A,D=E=1e3/240,g={time:0,frame:0,tick:function tick(){yl(!0)},deltaRatio:function deltaRatio(t){return b/(1e3/(t||60))},wake:function wake(){o&&(!n&&x()&&(h=n=window,a=h.document||{},ot.gsap=ze,(h.gsapVersions||(h.gsapVersions=[])).push(ze.version),P(i||h.GreenSockGlobals||!h.gsap&&h||{}),At.forEach(wb)),m="undefined"!=typeof requestAnimationFrame&&requestAnimationFrame,p&&g.sleep(),_=m||function(t){return setTimeout(t,D-1e3*g.time+1|0)},c=1,yl(2))},sleep:function sleep(){(m?cancelAnimationFrame:clearTimeout)(p),c=0,_=T},lagSmoothing:function lagSmoothing(t,e){M=t||1/0,C=Math.min(e||33,M)},fps:function fps(t){E=1e3/(t||240),D=1e3*g.time+E},add:function add(n,t,e){var a=t?function(t,e,r,i){n(t,e,r,i),g.remove(a)}:n;return g.remove(n),B[e?"unshift":"push"](a),Ft(),a},remove:function remove(t,e){~(e=B.indexOf(t))&&B.splice(e,1)&&e<=O&&O--},_listeners:B=[]}),Ft=function _wake(){return!c&&Rt.wake()},Lt={},It=/^[\\d.\\-M][\\d.\\-,\\s]/,Bt=/["']/g,Yt=function _invertEase(e){return function(t){return 1-e(1-t)}},jt=function _parseEase(t,e){return t&&(s(t)?t:Lt[t]||Ob(t))||e};function yl(t){var e,r,i,n,a=k()-z,s=!0===t;if((M<a||a<0)&&(A+=a-C),(0<(e=(i=(z+=a)-A)-D)||s)&&(n=++g.frame,b=i-1e3*g.time,g.time=i/=1e3,D+=e+(E<=e?4:E-e),r=1),s||(p=_(yl)),r)for(O=0;O<B.length;O++)B[O](i,b,n,t)}function gn(t){return t<j?Y*t*t:t<.7272727272727273?Y*Math.pow(t-1.5/2.75,2)+.75:t<.9090909090909092?Y*(t-=2.25/2.75)*t+.9375:Y*Math.pow(t-2.625/2.75,2)+.984375}ha("Linear,Quad,Cubic,Quart,Quint,Strong",function(t,e){var r=e<5?e+1:e;Sb(t+",Power"+(r-1),e?function(t){return Math.pow(t,r)}:function(t){return t},function(t){return 1-Math.pow(1-t,r)},function(t){return t<.5?Math.pow(2*t,r)/2:1-Math.pow(2*(1-t),r)/2})}),Lt.Linear.easeNone=Lt.none=Lt.Linear.easeIn,Sb("Elastic",Ub("in"),Ub("out"),Ub()),Y=7.5625,j=1/2.75,Sb("Bounce",function(t){return 1-gn(1-t)},gn),Sb("Expo",function(t){return t?Math.pow(2,10*(t-1)):0}),Sb("Circ",function(t){return-(K(1-t*t)-1)}),Sb("Sine",function(t){return 1===t?1:1-J(t*G)}),Sb("Back",Vb("in"),Vb("out"),Vb()),Lt.SteppedEase=Lt.steps=ot.SteppedEase={config:function config(t,e){void 0===t&&(t=1);var r=1/t,i=t+(e?0:1),n=e?1:0;return function(t){return((i*Ot(0,.99999999,t)|0)+n)*r}}},V.ease=Lt["quad.out"],ha("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt",function(t){return vt+=t+","+t+"Params,"});var qt,Vt=function GSCache(t,e){this.id=W++,(t._gsap=this).target=t,this.harness=e,this.get=e?e.get:ga,this.set=e?e.getSetter:ne},Ut=((qt=Animation.prototype).delay=function delay(t){return t||0===t?(this.parent&&this.parent.smoothChildTiming&&this.startTime(this._start+t-this._delay),this._delay=t,this):this._delay},qt.duration=function duration(t){return arguments.length?this.totalDuration(0<this._repeat?t+(t+this._rDelay)*this._repeat:t):this.totalDuration()&&this._dur},qt.totalDuration=function totalDuration(t){return arguments.length?(this._dirty=0,Ra(this,this._repeat<0?t:(t-this._repeat*this._rDelay)/(this._repeat+1))):this._tDur},qt.totalTime=function totalTime(t,e){if(Ft(),!arguments.length)return this._tTime;var r=this._dp;if(r&&r.smoothChildTiming&&this._ts){for(Ia(this,t),!r._dp||r.parent||Ja(r,this);r&&r.parent;)r.parent._time!==r._start+(0<=r._ts?r._tTime/r._ts:(r.totalDuration()-r._tTime)/-r._ts)&&r.totalTime(r._tTime,!0),r=r.parent;!this.parent&&this._dp.autoRemoveChildren&&(0<this._ts&&t<this._tDur||this._ts<0&&0<t||!this._tDur&&!t)&&Ka(this._dp,this,this._start-this._delay)}return(this._tTime!==t||!this._dur&&!e||this._initted&&Math.abs(this._zTime)===X||!t&&!this._initted&&(this.add||this._ptLookup))&&(this._ts||(this._pTime=t),na(this,t,e)),this},qt.time=function time(t,e){return arguments.length?this.totalTime(Math.min(this.totalDuration(),t+Ea(this))%(this._dur+this._rDelay)||(t?this._dur:0),e):this._time},qt.totalProgress=function totalProgress(t,e){return arguments.length?this.totalTime(this.totalDuration()*t,e):this.totalDuration()?Math.min(1,this._tTime/this._tDur):0<this.rawTime()?1:0},qt.progress=function progress(t,e){return arguments.length?this.totalTime(this.duration()*(!this._yoyo||1&this.iteration()?t:1-t)+Ea(this),e):this.duration()?Math.min(1,this._time/this._dur):0<this.rawTime()?1:0},qt.iteration=function iteration(t,e){var r=this.duration()+this._rDelay;return arguments.length?this.totalTime(this._time+(t-1)*r,e):this._repeat?Tt(this._tTime,r)+1:1},qt.timeScale=function timeScale(t,e){if(!arguments.length)return this._rts===-X?0:this._rts;if(this._rts===t)return this;var r=this.parent&&this._ts?Ga(this.parent._time,this):this._tTime;return this._rts=+t||0,this._ts=this._ps||t===-X?0:this._rts,this.totalTime(Ot(-Math.abs(this._delay),this._tDur,r),!1!==e),Ha(this),function _recacheAncestors(t){for(var e=t.parent;e&&e.parent;)e._dirty=1,e.totalDuration(),e=e.parent;return t}(this)},qt.paused=function paused(t){return arguments.length?(this._ps!==t&&((this._ps=t)?(this._pTime=this._tTime||Math.max(-this._delay,this.rawTime()),this._ts=this._act=0):(Ft(),this._ts=this._rts,this.totalTime(this.parent&&!this.parent.smoothChildTiming?this.rawTime():this._tTime||this._pTime,1===this.progress()&&Math.abs(this._zTime)!==X&&(this._tTime-=X)))),this):this._ps},qt.startTime=function startTime(t){if(arguments.length){this._start=t;var e=this.parent||this._dp;return!e||!e._sort&&this.parent||Ka(e,this,t-this._delay),this}return this._start},qt.endTime=function endTime(t){return this._start+(w(t)?this.totalDuration():this.duration())/Math.abs(this._ts||1)},qt.rawTime=function rawTime(t){var e=this.parent||this._dp;return e?t&&(!this._ts||this._repeat&&this._time&&this.totalProgress()<1)?this._tTime%(this._dur+this._rDelay):this._ts?Ga(e.rawTime(t),this):this._tTime:this._tTime},qt.revert=function revert(t){void 0===t&&(t=lt);var e=L;return L=t,(this._initted||this._startAt)&&(this.timeline&&this.timeline.revert(t),this.totalTime(-.01,t.suppressEvents)),"nested"!==this.data&&!1!==t.kill&&this.kill(),L=e,this},qt.globalTime=function globalTime(t){for(var e=this,r=arguments.length?t:e.rawTime();e;)r=e._start+r/(Math.abs(e._ts)||1),e=e._dp;return!this.parent&&this._sat?this._sat.globalTime(t):r},qt.repeat=function repeat(t){return arguments.length?(this._repeat=t===1/0?-2:t,Sa(this)):-2===this._repeat?1/0:this._repeat},qt.repeatDelay=function repeatDelay(t){if(arguments.length){var e=this._time;return this._rDelay=t,Sa(this),e?this.time(e):this}return this._rDelay},qt.yoyo=function yoyo(t){return arguments.length?(this._yoyo=t,this):this._yoyo},qt.seek=function seek(t,e){return this.totalTime(xt(this,t),w(e))},qt.restart=function restart(t,e){return this.play().totalTime(t?-this._delay:0,w(e))},qt.play=function play(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},qt.reverse=function reverse(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},qt.pause=function pause(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},qt.resume=function resume(){return this.paused(!1)},qt.reversed=function reversed(t){return arguments.length?(!!t!==this.reversed()&&this.timeScale(-this._rts||(t?-X:0)),this):this._rts<0},qt.invalidate=function invalidate(){return this._initted=this._act=0,this._zTime=-X,this},qt.isActive=function isActive(){var t,e=this.parent||this._dp,r=this._start;return!(e&&!(this._ts&&this._initted&&e.isActive()&&(t=e.rawTime(!0))>=r&&t<this.endTime(!0)-X))},qt.eventCallback=function eventCallback(t,e,r){var i=this.vars;return 1<arguments.length?(e?(i[t]=e,r&&(i[t+"Params"]=r),"onUpdate"===t&&(this._onUpdate=e)):delete i[t],this):i[t]},qt.then=function then(t){var i=this;return new Promise(function(e){function Co(){var t=i.then;i.then=null,s(r)&&(r=r(i))&&(r.then||r===i)&&(i.then=t),e(r),i.then=t}var r=s(t)?t:pa;i._initted&&1===i.totalProgress()&&0<=i._ts||!i._tTime&&i._ts<0?Co():i._prom=Co})},qt.kill=function kill(){tb(this)},Animation);function Animation(t){this.vars=t,this._delay=+t.delay||0,(this._repeat=t.repeat===1/0?-2:t.repeat||0)&&(this._rDelay=t.repeatDelay||0,this._yoyo=!!t.yoyo||!!t.yoyoEase),this._ts=1,Ra(this,+t.duration,1,1),this.data=t.data,l&&(this._ctx=l).data.push(this),c||Rt.wake()}qa(Ut.prototype,{_time:0,_start:0,_end:0,_tTime:0,_tDur:0,_dirty:0,_repeat:0,_yoyo:!1,parent:null,_initted:!1,_rDelay:0,_ts:1,_dp:0,ratio:0,_zTime:-X,_prom:0,_ps:!1,_rts:1});var Xt=function(i){function Timeline(t,e){var r;return void 0===t&&(t={}),(r=i.call(this,t)||this).labels={},r.smoothChildTiming=!!t.smoothChildTiming,r.autoRemoveChildren=!!t.autoRemoveChildren,r._sort=w(t.sortChildren),I&&Ka(t.parent||I,_assertThisInitialized(r),e),t.reversed&&r.reverse(),t.paused&&r.paused(!0),t.scrollTrigger&&La(_assertThisInitialized(r),t.scrollTrigger),r}_inheritsLoose(Timeline,i);var e=Timeline.prototype;return e.to=function to(t,e,r){return Va(0,arguments,this),this},e.from=function from(t,e,r){return Va(1,arguments,this),this},e.fromTo=function fromTo(t,e,r,i){return Va(2,arguments,this),this},e.set=function set(t,e,r){return e.duration=0,e.parent=this,va(e).repeatDelay||(e.repeat=0),e.immediateRender=!!e.immediateRender,new $t(t,e,xt(this,r),1),this},e.call=function call(t,e,r){return Ka(this,$t.delayedCall(0,t,e),r)},e.staggerTo=function staggerTo(t,e,r,i,n,a,s){return r.duration=e,r.stagger=r.stagger||i,r.onComplete=a,r.onCompleteParams=s,r.parent=this,new $t(t,r,xt(this,n)),this},e.staggerFrom=function staggerFrom(t,e,r,i,n,a,s){return r.runBackwards=1,va(r).immediateRender=w(r.immediateRender),this.staggerTo(t,e,r,i,n,a,s)},e.staggerFromTo=function staggerFromTo(t,e,r,i,n,a,s,o){return i.startAt=r,va(i).immediateRender=w(i.immediateRender),this.staggerTo(t,e,i,n,a,s,o)},e.render=function render(t,e,r){var i,n,a,s,o,u,h,l,f,d,c,p,_=this._time,m=this._dirty?this.totalDuration():this._tDur,g=this._dur,v=t<=0?0:ja(t),y=this._zTime<0!=t<0&&(this._initted||!g);if(this!==I&&m<v&&0<=t&&(v=m),v!==this._tTime||r||y){if(_!==this._time&&g&&(v+=this._time-_,t+=this._time-_),i=v,f=this._start,u=!(l=this._ts),y&&(g||(_=this._zTime),!t&&e||(this._zTime=t)),this._repeat){if(c=this._yoyo,o=g+this._rDelay,this._repeat<-1&&t<0)return this.totalTime(100*o+t,e,r);if(i=ja(v%o),v===m?(s=this._repeat,i=g):((s=~~(v/o))&&s===v/o&&(i=g,s--),g<i&&(i=g)),d=Tt(this._tTime,o),!_&&this._tTime&&d!==s&&this._tTime-d*o-this._dur<=0&&(d=s),c&&1&s&&(i=g-i,p=1),s!==d&&!this._lock){var T=c&&1&d,b=T===(c&&1&s);if(s<d&&(T=!T),_=T?0:v%g?g:v,this._lock=1,this.render(_||(p?0:ja(s*o)),e,!g)._lock=0,this._tTime=v,!e&&this.parent&&Ct(this,"onRepeat"),this.vars.repeatRefresh&&!p&&(this.invalidate()._lock=1),_&&_!==this._time||u!=!this._ts||this.vars.onRepeat&&!this.parent&&!this._act)return this;if(g=this._dur,m=this._tDur,b&&(this._lock=2,_=T?g:-1e-4,this.render(_,!0),this.vars.repeatRefresh&&!p&&this.invalidate()),this._lock=0,!this._ts&&!u)return this;Qb(this,p)}}if(this._hasPause&&!this._forcing&&this._lock<2&&(h=function _findNextPauseTween(t,e,r){var i;if(e<r)for(i=t._first;i&&i._start<=r;){if("isPause"===i.data&&i._start>e)return i;i=i._next}else for(i=t._last;i&&i._start>=r;){if("isPause"===i.data&&i._start<e)return i;i=i._prev}}(this,ja(_),ja(i)))&&(v-=i-(i=h._start)),this._tTime=v,this._time=i,this._act=!l,this._initted||(this._onUpdate=this.vars.onUpdate,this._initted=1,this._zTime=t,_=0),!_&&i&&!e&&!s&&(Ct(this,"onStart"),this._tTime!==v))return this;if(_<=i&&0<=t)for(n=this._first;n;){if(a=n._next,(n._act||i>=n._start)&&n._ts&&h!==n){if(n.parent!==this)return this.render(t,e,r);if(n.render(0<n._ts?(i-n._start)*n._ts:(n._dirty?n.totalDuration():n._tDur)+(i-n._start)*n._ts,e,r),i!==this._time||!this._ts&&!u){h=0,a&&(v+=this._zTime=-X);break}}n=a}else{n=this._last;for(var w=t<0?t:i;n;){if(a=n._prev,(n._act||w<=n._end)&&n._ts&&h!==n){if(n.parent!==this)return this.render(t,e,r);if(n.render(0<n._ts?(w-n._start)*n._ts:(n._dirty?n.totalDuration():n._tDur)+(w-n._start)*n._ts,e,r||L&&(n._initted||n._startAt)),i!==this._time||!this._ts&&!u){h=0,a&&(v+=this._zTime=w?-X:X);break}}n=a}}if(h&&!e&&(this.pause(),h.render(_<=i?0:-X)._zTime=_<=i?1:-1,this._ts))return this._start=f,Ha(this),this.render(t,e,r);this._onUpdate&&!e&&Ct(this,"onUpdate",!0),(v===m&&this._tTime>=this.totalDuration()||!v&&_)&&(f!==this._start&&Math.abs(l)===Math.abs(this._ts)||this._lock||(!t&&g||!(v===m&&0<this._ts||!v&&this._ts<0)||za(this,1),e||t<0&&!_||!v&&!_&&m||(Ct(this,v===m&&0<=t?"onComplete":"onReverseComplete",!0),!this._prom||v<m&&0<this.timeScale()||this._prom())))}return this},e.add=function add(e,i){var n=this;if(t(i)||(i=xt(this,i,e)),!(e instanceof Ut)){if(Z(e))return e.forEach(function(t){return n.add(t,i)}),this;if(r(e))return this.addLabel(e,i);if(!s(e))return this;e=$t.delayedCall(0,e)}return this!==e?Ka(this,e,i):this},e.getChildren=function getChildren(t,e,r,i){void 0===t&&(t=!0),void 0===e&&(e=!0),void 0===r&&(r=!0),void 0===i&&(i=-U);for(var n=[],a=this._first;a;)a._start>=i&&(a instanceof $t?e&&n.push(a):(r&&n.push(a),t&&n.push.apply(n,a.getChildren(!0,e,r)))),a=a._next;return n},e.getById=function getById(t){for(var e=this.getChildren(1,1,1),r=e.length;r--;)if(e[r].vars.id===t)return e[r]},e.remove=function remove(t){return r(t)?this.removeLabel(t):s(t)?this.killTweensOf(t):(ya(this,t),t===this._recent&&(this._recent=this._last),Aa(this))},e.totalTime=function totalTime(t,e){return arguments.length?(this._forcing=1,!this._dp&&this._ts&&(this._start=ja(Rt.time-(0<this._ts?t/this._ts:(this.totalDuration()-t)/-this._ts))),i.prototype.totalTime.call(this,t,e),this._forcing=0,this):this._tTime},e.addLabel=function addLabel(t,e){return this.labels[t]=xt(this,e),this},e.removeLabel=function removeLabel(t){return delete this.labels[t],this},e.addPause=function addPause(t,e,r){var i=$t.delayedCall(0,e||T,r);return i.data="isPause",this._hasPause=1,Ka(this,i,xt(this,t))},e.removePause=function removePause(t){var e=this._first;for(t=xt(this,t);e;)e._start===t&&"isPause"===e.data&&za(e),e=e._next},e.killTweensOf=function killTweensOf(t,e,r){for(var i=this.getTweensOf(t,r),n=i.length;n--;)Nt!==i[n]&&i[n].kill(t,e);return this},e.getTweensOf=function getTweensOf(e,r){for(var i,n=[],a=Mt(e),s=this._first,o=t(r);s;)s instanceof $t?la(s._targets,a)&&(o?(!Nt||s._initted&&s._ts)&&s.globalTime(0)<=r&&s.globalTime(s.totalDuration())>r:!r||s.isActive())&&n.push(s):(i=s.getTweensOf(a,r)).length&&n.push.apply(n,i),s=s._next;return n},e.tweenTo=function tweenTo(t,e){e=e||{};var r,i=this,n=xt(i,t),a=e.startAt,s=e.onStart,o=e.onStartParams,u=e.immediateRender,h=$t.to(i,qa({ease:e.ease||"none",lazy:!1,immediateRender:!1,time:n,overwrite:"auto",duration:e.duration||Math.abs((n-(a&&"time"in a?a.time:i._time))/i.timeScale())||X,onStart:function onStart(){if(i.pause(),!r){var t=e.duration||Math.abs((n-(a&&"time"in a?a.time:i._time))/i.timeScale());h._dur!==t&&Ra(h,t,0,1).render(h._time,!0,!0),r=1}s&&s.apply(h,o||[])}},e));return u?h.render(0):h},e.tweenFromTo=function tweenFromTo(t,e,r){return this.tweenTo(e,qa({startAt:{time:xt(this,t)}},r))},e.recent=function recent(){return this._recent},e.nextLabel=function nextLabel(t){return void 0===t&&(t=this._time),rb(this,xt(this,t))},e.previousLabel=function previousLabel(t){return void 0===t&&(t=this._time),rb(this,xt(this,t),1)},e.currentLabel=function currentLabel(t){return arguments.length?this.seek(t,!0):this.previousLabel(this._time+X)},e.shiftChildren=function shiftChildren(t,e,r){void 0===r&&(r=0);for(var i,n=this._first,a=this.labels;n;)n._start>=r&&(n._start+=t,n._end+=t),n=n._next;if(e)for(i in a)a[i]>=r&&(a[i]+=t);return Aa(this)},e.invalidate=function invalidate(t){var e=this._first;for(this._lock=0;e;)e.invalidate(t),e=e._next;return i.prototype.invalidate.call(this,t)},e.clear=function clear(t){void 0===t&&(t=!0);for(var e,r=this._first;r;)e=r._next,this.remove(r),r=e;return this._dp&&(this._time=this._tTime=this._pTime=0),t&&(this.labels={}),Aa(this)},e.totalDuration=function totalDuration(t){var e,r,i,n=0,a=this,s=a._last,o=U;if(arguments.length)return a.timeScale((a._repeat<0?a.duration():a.totalDuration())/(a.reversed()?-t:t));if(a._dirty){for(i=a.parent;s;)e=s._prev,s._dirty&&s.totalDuration(),o<(r=s._start)&&a._sort&&s._ts&&!a._lock?(a._lock=1,Ka(a,s,r-s._delay,1)._lock=0):o=r,r<0&&s._ts&&(n-=r,(!i&&!a._dp||i&&i.smoothChildTiming)&&(a._start+=r/a._ts,a._time-=r,a._tTime-=r),a.shiftChildren(-r,!1,-Infinity),o=0),s._end>n&&s._ts&&(n=s._end),s=e;Ra(a,a===I&&a._time>n?a._time:n,1,1),a._dirty=0}return a._tDur},Timeline.updateRoot=function updateRoot(t){if(I._ts&&(na(I,Ga(t,I)),f=Rt.frame),Rt.frame>=mt){mt+=q.autoSleep||120;var e=I._first;if((!e||!e._ts)&&q.autoSleep&&Rt._listeners.length<2){for(;e&&!e._ts;)e=e._next;e||Rt.sleep()}}},Timeline}(Ut);qa(Xt.prototype,{_lock:0,_hasPause:0,_forcing:0});function ac(t,e,i,n,a,o){var u,h,l,f;if(pt[t]&&!1!==(u=new pt[t]).init(a,u.rawVars?e[t]:function _processVars(t,e,i,n,a){if(s(t)&&(t=Kt(t,a,e,i,n)),!v(t)||t.style&&t.nodeType||Z(t)||$(t))return r(t)?Kt(t,a,e,i,n):t;var o,u={};for(o in t)u[o]=Kt(t[o],a,e,i,n);return u}(e[t],n,a,o,i),i,n,o)&&(i._pt=h=new _e(i._pt,a,t,0,1,u.render,u,0,u.priority),i!==d))for(l=i._ptLookup[i._targets.indexOf(a)],f=u._props.length;f--;)l[u._props[f]]=h;return u}function gc(t,r,e,i){var n,a,s=r.ease||i||"power1.inOut";if(Z(r))a=e[t]||(e[t]=[]),r.forEach(function(t,e){return a.push({t:e/(r.length-1)*100,v:t,e:s})});else for(n in r)a=e[n]||(e[n]=[]),"ease"===n||a.push({t:parseFloat(t),v:r[n],e:s})}var Nt,Gt,Wt=function _addPropTween(t,e,i,n,a,o,u,h,l,f){s(n)&&(n=n(a||0,t,o));var d,c=t[e],p="get"!==i?i:s(c)?l?t[e.indexOf("set")||!s(t["get"+e.substr(3)])?e:"get"+e.substr(3)](l):t[e]():c,_=s(c)?l?re:te:Zt;if(r(n)&&(~n.indexOf("random(")&&(n=ob(n)),"="===n.charAt(1)&&(!(d=ka(p,n)+(Ya(p)||0))&&0!==d||(n=d))),!f||p!==n||Gt)return isNaN(p*n)||""===n?(c||e in t||Q(e,n),function _addComplexStringPropTween(t,e,r,i,n,a,s){var o,u,h,l,f,d,c,p,_=new _e(this._pt,t,e,0,1,ue,null,n),m=0,g=0;for(_.b=r,_.e=i,r+="",(c=~(i+="").indexOf("random("))&&(i=ob(i)),a&&(a(p=[r,i],t,e),r=p[0],i=p[1]),u=r.match(it)||[];o=it.exec(i);)l=o[0],f=i.substring(m,o.index),h?h=(h+1)%5:"rgba("===f.substr(-5)&&(h=1),l!==u[g++]&&(d=parseFloat(u[g-1])||0,_._pt={_next:_._pt,p:f||1===g?f:",",s:d,c:"="===l.charAt(1)?ka(d,l)-d:parseFloat(l)-d,m:h&&h<4?Math.round:0},m=it.lastIndex);return _.c=m<i.length?i.substring(m,i.length):"",_.fp=s,(nt.test(i)||c)&&(_.e=0),this._pt=_}.call(this,t,e,p,n,_,h||q.stringFilter,l)):(d=new _e(this._pt,t,e,+p||0,n-(p||0),"boolean"==typeof c?se:ae,0,_),l&&(d.fp=l),u&&d.modifier(u,this,t),this._pt=d)},Qt=function _initTween(t,e,r){var i,n,a,s,o,u,h,l,f,d,c,p,_,m=t.vars,g=m.ease,v=m.startAt,y=m.immediateRender,T=m.lazy,b=m.onUpdate,x=m.runBackwards,O=m.yoyoEase,k=m.keyframes,M=m.autoRevert,P=t._dur,C=t._startAt,A=t._targets,S=t.parent,z=S&&"nested"===S.data?S.vars.targets:A,E="auto"===t._overwrite&&!F,D=t.timeline;if(!D||k&&g||(g="none"),t._ease=jt(g,V.ease),t._yEase=O?Yt(jt(!0===O?g:O,V.ease)):0,O&&t._yoyo&&!t._repeat&&(O=t._yEase,t._yEase=t._ease,t._ease=O),t._from=!D&&!!m.runBackwards,!D||k&&!m.stagger){if(p=(l=A[0]?fa(A[0]).harness:0)&&m[l.prop],i=ua(m,ft),C&&(C._zTime<0&&C.progress(1),e<0&&x&&y&&!M?C.render(-1,!0):C.revert(x&&P?ht:ut),C._lazy=0),v){if(za(t._startAt=$t.set(A,qa({data:"isStart",overwrite:!1,parent:S,immediateRender:!0,lazy:!C&&w(T),startAt:null,delay:0,onUpdate:b&&function(){return Ct(t,"onUpdate")},stagger:0},v))),t._startAt._dp=0,t._startAt._sat=t,e<0&&(L||!y&&!M)&&t._startAt.revert(ht),y&&P&&e<=0&&r<=0)return void(e&&(t._zTime=e))}else if(x&&P&&!C)if(e&&(y=!1),a=qa({overwrite:!1,data:"isFromStart",lazy:y&&!C&&w(T),immediateRender:y,stagger:0,parent:S},i),p&&(a[l.prop]=p),za(t._startAt=$t.set(A,a)),t._startAt._dp=0,t._startAt._sat=t,e<0&&(L?t._startAt.revert(ht):t._startAt.render(-1,!0)),t._zTime=e,y){if(!e)return}else _initTween(t._startAt,X,X);for(t._pt=t._ptCache=0,T=P&&w(T)||T&&!P,n=0;n<A.length;n++){if(h=(o=A[n])._gsap||ea(A)[n]._gsap,t._ptLookup[n]=d={},ct[h.id]&&dt.length&&ma(),c=z===A?n:z.indexOf(o),l&&!1!==(f=new l).init(o,p||i,t,c,z)&&(t._pt=s=new _e(t._pt,o,f.name,0,1,f.render,f,0,f.priority),f._props.forEach(function(t){d[t]=s}),f.priority&&(u=1)),!l||p)for(a in i)pt[a]&&(f=ac(a,i,t,c,o,z))?f.priority&&(u=1):d[a]=s=Wt.call(t,o,a,"get",i[a],c,z,0,m.stringFilter);t._op&&t._op[n]&&t.kill(o,t._op[n]),E&&t._pt&&(Nt=t,I.killTweensOf(o,d,t.globalTime(e)),_=!t.parent,Nt=0),t._pt&&T&&(ct[h.id]=1)}u&&pe(t),t._onInit&&t._onInit(t)}t._onUpdate=b,t._initted=(!t._op||t._pt)&&!_,k&&e<=0&&D.render(U,!0,!0)},Kt=function _parseFuncOrString(t,e,i,n,a){return s(t)?t.call(e,i,n,a):r(t)&&~t.indexOf("random(")?ob(t):t},Jt=vt+"repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert",Ht={};ha(Jt+",id,stagger,delay,duration,paused,scrollTrigger",function(t){return Ht[t]=1});var $t=function(D){function Tween(e,r,i,n){var a;"number"==typeof r&&(i.duration=r,r=i,i=null);var s,o,u,h,l,f,d,c,p=(a=D.call(this,n?r:va(r))||this).vars,_=p.duration,m=p.delay,g=p.immediateRender,T=p.stagger,b=p.overwrite,x=p.keyframes,O=p.defaults,k=p.scrollTrigger,M=p.yoyoEase,P=r.parent||I,C=(Z(e)||$(e)?t(e[0]):"length"in r)?[e]:Mt(e);if(a._targets=C.length?ea(C):R("GSAP target "+e+" not found. https://gsap.com",!q.nullTargetWarn)||[],a._ptLookup=[],a._overwrite=b,x||T||y(_)||y(m)){if(r=a.vars,(s=a.timeline=new Xt({data:"nested",defaults:O||{},targets:P&&"nested"===P.data?P.vars.targets:C})).kill(),s.parent=s._dp=_assertThisInitialized(a),s._start=0,T||y(_)||y(m)){if(h=C.length,d=T&&eb(T),v(T))for(l in T)~Jt.indexOf(l)&&((c=c||{})[l]=T[l]);for(o=0;o<h;o++)(u=ua(r,Ht)).stagger=0,M&&(u.yoyoEase=M),c&&yt(u,c),f=C[o],u.duration=+Kt(_,_assertThisInitialized(a),o,f,C),u.delay=(+Kt(m,_assertThisInitialized(a),o,f,C)||0)-a._delay,!T&&1===h&&u.delay&&(a._delay=m=u.delay,a._start+=m,u.delay=0),s.to(f,u,d?d(o,f,C):0),s._ease=Lt.none;s.duration()?_=m=0:a.timeline=0}else if(x){va(qa(s.vars.defaults,{ease:"none"})),s._ease=jt(x.ease||r.ease||"none");var A,S,z,E=0;if(Z(x))x.forEach(function(t){return s.to(C,t,">")}),s.duration();else{for(l in u={},x)"ease"===l||"easeEach"===l||gc(l,x[l],u,x.easeEach);for(l in u)for(A=u[l].sort(function(t,e){return t.t-e.t}),o=E=0;o<A.length;o++)(z={ease:(S=A[o]).e,duration:(S.t-(o?A[o-1].t:0))/100*_})[l]=S.v,s.to(C,z,E),E+=z.duration;s.duration()<_&&s.to({},{duration:_-s.duration()})}}_||a.duration(_=s.duration())}else a.timeline=0;return!0!==b||F||(Nt=_assertThisInitialized(a),I.killTweensOf(C),Nt=0),Ka(P,_assertThisInitialized(a),i),r.reversed&&a.reverse(),r.paused&&a.paused(!0),(g||!_&&!x&&a._start===ja(P._time)&&w(g)&&function _hasNoPausedAncestors(t){return!t||t._ts&&_hasNoPausedAncestors(t.parent)}(_assertThisInitialized(a))&&"nested"!==P.data)&&(a._tTime=-X,a.render(Math.max(0,-m)||0)),k&&La(_assertThisInitialized(a),k),a}_inheritsLoose(Tween,D);var e=Tween.prototype;return e.render=function render(t,e,r){var i,n,a,s,o,u,h,l,f,d=this._time,c=this._tDur,p=this._dur,_=t<0,m=c-X<t&&!_?c:t<X?0:t;if(p){if(m!==this._tTime||!t||r||!this._initted&&this._tTime||this._startAt&&this._zTime<0!=_){if(i=m,l=this.timeline,this._repeat){if(s=p+this._rDelay,this._repeat<-1&&_)return this.totalTime(100*s+t,e,r);if(i=ja(m%s),m===c?(a=this._repeat,i=p):((a=~~(m/s))&&a===ja(m/s)&&(i=p,a--),p<i&&(i=p)),(u=this._yoyo&&1&a)&&(f=this._yEase,i=p-i),o=Tt(this._tTime,s),i===d&&!r&&this._initted&&a===o)return this._tTime=m,this;a!==o&&(l&&this._yEase&&Qb(l,u),this.vars.repeatRefresh&&!u&&!this._lock&&this._time!==s&&this._initted&&(this._lock=r=1,this.render(ja(s*a),!0).invalidate()._lock=0))}if(!this._initted){if(Ma(this,_?t:i,r,e,m))return this._tTime=0,this;if(!(d===this._time||r&&this.vars.repeatRefresh&&a!==o))return this;if(p!==this._dur)return this.render(t,e,r)}if(this._tTime=m,this._time=i,!this._act&&this._ts&&(this._act=1,this._lazy=0),this.ratio=h=(f||this._ease)(i/p),this._from&&(this.ratio=h=1-h),i&&!d&&!e&&!a&&(Ct(this,"onStart"),this._tTime!==m))return this;for(n=this._pt;n;)n.r(h,n.d),n=n._next;l&&l.render(t<0?t:l._dur*l._ease(i/this._dur),e,r)||this._startAt&&(this._zTime=t),this._onUpdate&&!e&&(_&&Ca(this,t,0,r),Ct(this,"onUpdate")),this._repeat&&a!==o&&this.vars.onRepeat&&!e&&this.parent&&Ct(this,"onRepeat"),m!==this._tDur&&m||this._tTime!==m||(_&&!this._onUpdate&&Ca(this,t,0,!0),!t&&p||!(m===this._tDur&&0<this._ts||!m&&this._ts<0)||za(this,1),e||_&&!d||!(m||d||u)||(Ct(this,m===c?"onComplete":"onReverseComplete",!0),!this._prom||m<c&&0<this.timeScale()||this._prom()))}}else!function _renderZeroDurationTween(t,e,r,i){var n,a,s,o=t.ratio,u=e<0||!e&&(!t._start&&function _parentPlayheadIsBeforeStart(t){var e=t.parent;return e&&e._ts&&e._initted&&!e._lock&&(e.rawTime()<0||_parentPlayheadIsBeforeStart(e))}(t)&&(t._initted||!bt(t))||(t._ts<0||t._dp._ts<0)&&!bt(t))?0:1,h=t._rDelay,l=0;if(h&&t._repeat&&(l=Ot(0,t._tDur,e),a=Tt(l,h),t._yoyo&&1&a&&(u=1-u),a!==Tt(t._tTime,h)&&(o=1-u,t.vars.repeatRefresh&&t._initted&&t.invalidate())),u!==o||L||i||t._zTime===X||!e&&t._zTime){if(!t._initted&&Ma(t,e,i,r,l))return;for(s=t._zTime,t._zTime=e||(r?X:0),r=r||e&&!s,t.ratio=u,t._from&&(u=1-u),t._time=0,t._tTime=l,n=t._pt;n;)n.r(u,n.d),n=n._next;e<0&&Ca(t,e,0,!0),t._onUpdate&&!r&&Ct(t,"onUpdate"),l&&t._repeat&&!r&&t.parent&&Ct(t,"onRepeat"),(e>=t._tDur||e<0)&&t.ratio===u&&(u&&za(t,1),r||L||(Ct(t,u?"onComplete":"onReverseComplete",!0),t._prom&&t._prom()))}else t._zTime||(t._zTime=e)}(this,t,e,r);return this},e.targets=function targets(){return this._targets},e.invalidate=function invalidate(t){return t&&this.vars.runBackwards||(this._startAt=0),this._pt=this._op=this._onUpdate=this._lazy=this.ratio=0,this._ptLookup=[],this.timeline&&this.timeline.invalidate(t),D.prototype.invalidate.call(this,t)},e.resetTo=function resetTo(t,e,r,i,n){c||Rt.wake(),this._ts||this.play();var a,s=Math.min(this._dur,(this._dp._time-this._start)*this._ts);return this._initted||Qt(this,s),a=this._ease(s/this._dur),function _updatePropTweens(t,e,r,i,n,a,s,o){var u,h,l,f,d=(t._pt&&t._ptCache||(t._ptCache={}))[e];if(!d)for(d=t._ptCache[e]=[],l=t._ptLookup,f=t._targets.length;f--;){if((u=l[f][e])&&u.d&&u.d._pt)for(u=u.d._pt;u&&u.p!==e&&u.fp!==e;)u=u._next;if(!u)return Gt=1,t.vars[e]="+=0",Qt(t,s),Gt=0,o?R(e+" not eligible for reset"):1;d.push(u)}for(f=d.length;f--;)(u=(h=d[f])._pt||h).s=!i&&0!==i||n?u.s+(i||0)+a*u.c:i,u.c=r-u.s,h.e&&(h.e=ia(r)+Ya(h.e)),h.b&&(h.b=u.s+Ya(h.b))}(this,t,e,r,i,a,s,n)?this.resetTo(t,e,r,i,1):(Ia(this,0),this.parent||xa(this._dp,this,"_first","_last",this._dp._sort?"_start":0),this.render(0))},e.kill=function kill(t,e){if(void 0===e&&(e="all"),!(t||e&&"all"!==e))return this._lazy=this._pt=0,this.parent?tb(this):this;if(this.timeline){var i=this.timeline.totalDuration();return this.timeline.killTweensOf(t,e,Nt&&!0!==Nt.vars.overwrite)._first||tb(this),this.parent&&i!==this.timeline.totalDuration()&&Ra(this,this._dur*this.timeline._tDur/i,0,1),this}var n,a,s,o,u,h,l,f=this._targets,d=t?Mt(t):f,c=this._ptLookup,p=this._pt;if((!e||"all"===e)&&function _arraysMatch(t,e){for(var r=t.length,i=r===e.length;i&&r--&&t[r]===e[r];);return r<0}(f,d))return"all"===e&&(this._pt=0),tb(this);for(n=this._op=this._op||[],"all"!==e&&(r(e)&&(u={},ha(e,function(t){return u[t]=1}),e=u),e=function _addAliasesToVars(t,e){var r,i,n,a,s=t[0]?fa(t[0]).harness:0,o=s&&s.aliases;if(!o)return e;for(i in r=yt({},e),o)if(i in r)for(n=(a=o[i].split(",")).length;n--;)r[a[n]]=r[i];return r}(f,e)),l=f.length;l--;)if(~d.indexOf(f[l]))for(u in a=c[l],"all"===e?(n[l]=e,o=a,s={}):(s=n[l]=n[l]||{},o=e),o)(h=a&&a[u])&&("kill"in h.d&&!0!==h.d.kill(u)||ya(this,h,"_pt"),delete a[u]),"all"!==s&&(s[u]=1);return this._initted&&!this._pt&&p&&tb(this),this},Tween.to=function to(t,e,r){return new Tween(t,e,r)},Tween.from=function from(t,e){return Va(1,arguments)},Tween.delayedCall=function delayedCall(t,e,r,i){return new Tween(e,0,{immediateRender:!1,lazy:!1,overwrite:!1,delay:t,onComplete:e,onReverseComplete:e,onCompleteParams:r,onReverseCompleteParams:r,callbackScope:i})},Tween.fromTo=function fromTo(t,e,r){return Va(2,arguments)},Tween.set=function set(t,e){return e.duration=0,e.repeatDelay||(e.repeat=0),new Tween(t,e)},Tween.killTweensOf=function killTweensOf(t,e,r){return I.killTweensOf(t,e,r)},Tween}(Ut);qa($t.prototype,{_targets:[],_lazy:0,_startAt:0,_op:0,_onInit:0}),ha("staggerTo,staggerFrom,staggerFromTo",function(r){$t[r]=function(){var t=new Xt,e=kt.call(arguments,0);return e.splice("staggerFromTo"===r?5:4,0,0),t[r].apply(t,e)}});function oc(t,e,r){return t.setAttribute(e,r)}function wc(t,e,r,i){i.mSet(t,e,i.m.call(i.tween,r,i.mt),i)}var Zt=function _setterPlain(t,e,r){return t[e]=r},te=function _setterFunc(t,e,r){return t[e](r)},re=function _setterFuncWithParam(t,e,r,i){return t[e](i.fp,r)},ne=function _getSetter(t,e){return s(t[e])?te:u(t[e])&&t.setAttribute?oc:Zt},ae=function _renderPlain(t,e){return e.set(e.t,e.p,Math.round(1e6*(e.s+e.c*t))/1e6,e)},se=function _renderBoolean(t,e){return e.set(e.t,e.p,!!(e.s+e.c*t),e)},ue=function _renderComplexString(t,e){var r=e._pt,i="";if(!t&&e.b)i=e.b;else if(1===t&&e.e)i=e.e;else{for(;r;)i=r.p+(r.m?r.m(r.s+r.c*t):Math.round(1e4*(r.s+r.c*t))/1e4)+i,r=r._next;i+=e.c}e.set(e.t,e.p,i,e)},he=function _renderPropTweens(t,e){for(var r=e._pt;r;)r.r(t,r.d),r=r._next},fe=function _addPluginModifier(t,e,r,i){for(var n,a=this._pt;a;)n=a._next,a.p===i&&a.modifier(t,e,r),a=n},ce=function _killPropTweensOf(t){for(var e,r,i=this._pt;i;)r=i._next,i.p===t&&!i.op||i.op===t?ya(this,i,"_pt"):i.dep||(e=1),i=r;return!e},pe=function _sortPropTweensByPriority(t){for(var e,r,i,n,a=t._pt;a;){for(e=a._next,r=i;r&&r.pr>a.pr;)r=r._next;(a._prev=r?r._prev:n)?a._prev._next=a:i=a,(a._next=r)?r._prev=a:n=a,a=e}t._pt=i},_e=(PropTween.prototype.modifier=function modifier(t,e,r){this.mSet=this.mSet||this.set,this.set=wc,this.m=t,this.mt=r,this.tween=e},PropTween);function PropTween(t,e,r,i,n,a,s,o,u){this.t=e,this.s=i,this.c=n,this.p=r,this.r=a||ae,this.d=s||this,this.set=o||Zt,this.pr=u||0,(this._next=t)&&(t._prev=this)}ha(vt+"parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger",function(t){return ft[t]=1}),ot.TweenMax=ot.TweenLite=$t,ot.TimelineLite=ot.TimelineMax=Xt,I=new Xt({sortChildren:!1,defaults:V,autoRemoveChildren:!0,id:"root",smoothChildTiming:!0}),q.stringFilter=Fb;function Ec(t){return(ye[t]||Te).map(function(t){return t()})}function Fc(){var t=Date.now(),o=[];2<t-Oe&&(Ec("matchMediaInit"),ge.forEach(function(t){var e,r,i,n,a=t.queries,s=t.conditions;for(r in a)(e=h.matchMedia(a[r]).matches)&&(i=1),e!==s[r]&&(s[r]=e,n=1);n&&(t.revert(),i&&o.push(t))}),Ec("matchMediaRevert"),o.forEach(function(e){return e.onMatch(e,function(t){return e.add(null,t)})}),Oe=t,Ec("matchMedia"))}var me,ge=[],ye={},Te=[],Oe=0,Me=0,Pe=((me=Context.prototype).add=function add(t,i,n){function Gw(){var t,e=l,r=a.selector;return e&&e!==a&&e.data.push(a),n&&(a.selector=cb(n)),l=a,t=i.apply(a,arguments),s(t)&&a._r.push(t),l=e,a.selector=r,a.isReverted=!1,t}s(t)&&(n=i,i=t,t=s);var a=this;return a.last=Gw,t===s?Gw(a,function(t){return a.add(null,t)}):t?a[t]=Gw:Gw},me.ignore=function ignore(t){var e=l;l=null,t(this),l=e},me.getTweens=function getTweens(){var e=[];return this.data.forEach(function(t){return t instanceof Context?e.push.apply(e,t.getTweens()):t instanceof $t&&!(t.parent&&"nested"===t.parent.data)&&e.push(t)}),e},me.clear=function clear(){this._r.length=this.data.length=0},me.kill=function kill(i,t){var n=this;if(i?function(){for(var t,e=n.getTweens(),r=n.data.length;r--;)"isFlip"===(t=n.data[r]).data&&(t.revert(),t.getChildren(!0,!0,!1).forEach(function(t){return e.splice(e.indexOf(t),1)}));for(e.map(function(t){return{g:t._dur||t._delay||t._sat&&!t._sat.vars.immediateRender?t.globalTime(0):-1/0,t:t}}).sort(function(t,e){return e.g-t.g||-1/0}).forEach(function(t){return t.t.revert(i)}),r=n.data.length;r--;)(t=n.data[r])instanceof Xt?"nested"!==t.data&&(t.scrollTrigger&&t.scrollTrigger.revert(),t.kill()):t instanceof $t||!t.revert||t.revert(i);n._r.forEach(function(t){return t(i,n)}),n.isReverted=!0}():this.data.forEach(function(t){return t.kill&&t.kill()}),this.clear(),t)for(var e=ge.length;e--;)ge[e].id===this.id&&ge.splice(e,1)},me.revert=function revert(t){this.kill(t||{})},Context);function Context(t,e){this.selector=e&&cb(e),this.data=[],this._r=[],this.isReverted=!1,this.id=Me++,t&&this.add(t)}var Ce,Ae=((Ce=MatchMedia.prototype).add=function add(t,e,r){v(t)||(t={matches:t});var i,n,a,s=new Pe(0,r||this.scope),o=s.conditions={};for(n in l&&!s.selector&&(s.selector=l.selector),this.contexts.push(s),e=s.add("onMatch",e),s.queries=t)"all"===n?a=1:(i=h.matchMedia(t[n]))&&(ge.indexOf(s)<0&&ge.push(s),(o[n]=i.matches)&&(a=1),i.addListener?i.addListener(Fc):i.addEventListener("change",Fc));return a&&e(s,function(t){return s.add(null,t)}),this},Ce.revert=function revert(t){this.kill(t||{})},Ce.kill=function kill(e){this.contexts.forEach(function(t){return t.kill(e,!0)})},MatchMedia);function MatchMedia(t){this.contexts=[],this.scope=t,l&&l.data.push(this)}var Se={registerPlugin:function registerPlugin(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];e.forEach(function(t){return wb(t)})},timeline:function timeline(t){return new Xt(t)},getTweensOf:function getTweensOf(t,e){return I.getTweensOf(t,e)},getProperty:function getProperty(i,t,e,n){r(i)&&(i=Mt(i)[0]);var a=fa(i||{}).get,s=e?pa:oa;return"native"===e&&(e=""),i?t?s((pt[t]&&pt[t].get||a)(i,t,e,n)):function(t,e,r){return s((pt[t]&&pt[t].get||a)(i,t,e,r))}:i},quickSetter:function quickSetter(r,e,i){if(1<(r=Mt(r)).length){var n=r.map(function(t){return ze.quickSetter(t,e,i)}),a=n.length;return function(t){for(var e=a;e--;)n[e](t)}}r=r[0]||{};var s=pt[e],o=fa(r),u=o.harness&&(o.harness.aliases||{})[e]||e,h=s?function(t){var e=new s;d._pt=0,e.init(r,i?t+i:t,d,0,[r]),e.render(1,e),d._pt&&he(1,d)}:o.set(r,u);return s?h:function(t){return h(r,u,i?t+i:t,o,1)}},quickTo:function quickTo(t,i,e){function $x(t,e,r){return n.resetTo(i,t,e,r)}var r,n=ze.to(t,yt(((r={})[i]="+=0.1",r.paused=!0,r),e||{}));return $x.tween=n,$x},isTweening:function isTweening(t){return 0<I.getTweensOf(t,!0).length},defaults:function defaults(t){return t&&t.ease&&(t.ease=jt(t.ease,V.ease)),ta(V,t||{})},config:function config(t){return ta(q,t||{})},registerEffect:function registerEffect(t){var i=t.name,n=t.effect,e=t.plugins,a=t.defaults,r=t.extendTimeline;(e||"").split(",").forEach(function(t){return t&&!pt[t]&&!ot[t]&&R(i+" effect requires "+t+" plugin.")}),_t[i]=function(t,e,r){return n(Mt(t),qa(e||{},a),r)},r&&(Xt.prototype[i]=function(t,e,r){return this.add(_t[i](t,v(e)?e:(r=e)&&{},this),r)})},registerEase:function registerEase(t,e){Lt[t]=jt(e)},parseEase:function parseEase(t,e){return arguments.length?jt(t,e):Lt},getById:function getById(t){return I.getById(t)},exportRoot:function exportRoot(t,e){void 0===t&&(t={});var r,i,n=new Xt(t);for(n.smoothChildTiming=w(t.smoothChildTiming),I.remove(n),n._dp=0,n._time=n._tTime=I._time,r=I._first;r;)i=r._next,!e&&!r._dur&&r instanceof $t&&r.vars.onComplete===r._targets[0]||Ka(n,r,r._start-r._delay),r=i;return Ka(I,n,0),n},context:function context(t,e){return t?new Pe(t,e):l},matchMedia:function matchMedia(t){return new Ae(t)},matchMediaRefresh:function matchMediaRefresh(){return ge.forEach(function(t){var e,r,i=t.conditions;for(r in i)i[r]&&(i[r]=!1,e=1);e&&t.revert()})||Fc()},addEventListener:function addEventListener(t,e){var r=ye[t]||(ye[t]=[]);~r.indexOf(e)||r.push(e)},removeEventListener:function removeEventListener(t,e){var r=ye[t],i=r&&r.indexOf(e);0<=i&&r.splice(i,1)},utils:{wrap:function wrap(e,t,r){var i=t-e;return Z(e)?lb(e,wrap(0,e.length),t):Wa(r,function(t){return(i+(t-e)%i)%i+e})},wrapYoyo:function wrapYoyo(e,t,r){var i=t-e,n=2*i;return Z(e)?lb(e,wrapYoyo(0,e.length-1),t):Wa(r,function(t){return e+(i<(t=(n+(t-e)%n)%n||0)?n-t:t)})},distribute:eb,random:hb,snap:gb,normalize:function normalize(t,e,r){return Pt(t,e,0,1,r)},getUnit:Ya,clamp:function clamp(e,r,t){return Wa(t,function(t){return Ot(e,r,t)})},splitColor:Ab,toArray:Mt,selector:cb,mapRange:Pt,pipe:function pipe(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];return function(t){return e.reduce(function(t,e){return e(t)},t)}},unitize:function unitize(e,r){return function(t){return e(parseFloat(t))+(r||Ya(t))}},interpolate:function interpolate(e,i,t,n){var a=isNaN(e+i)?0:function(t){return(1-t)*e+t*i};if(!a){var s,o,u,h,l,f=r(e),d={};if(!0===t&&(n=1)&&(t=null),f)e={p:e},i={p:i};else if(Z(e)&&!Z(i)){for(u=[],h=e.length,l=h-2,o=1;o<h;o++)u.push(interpolate(e[o-1],e[o]));h--,a=function func(t){t*=h;var e=Math.min(l,~~t);return u[e](t-e)},t=i}else n||(e=yt(Z(e)?[]:{},e));if(!u){for(s in i)Wt.call(d,e,s,"get",i[s]);a=function func(t){return he(t,d)||(f?e.p:e)}}}return Wa(t,a)},shuffle:db},install:P,effects:_t,ticker:Rt,updateRoot:Xt.updateRoot,plugins:pt,globalTimeline:I,core:{PropTween:_e,globals:S,Tween:$t,Timeline:Xt,Animation:Ut,getCache:fa,_removeLinkedListItem:ya,reverting:function reverting(){return L},context:function context(t){return t&&l&&(l.data.push(t),t._ctx=l),l},suppressOverwrites:function suppressOverwrites(t){return F=t}}};ha("to,from,fromTo,delayedCall,set,killTweensOf",function(t){return Se[t]=$t[t]}),Rt.add(Xt.updateRoot),d=Se.to({},{duration:0});function Jc(t,e){for(var r=t._pt;r&&r.p!==e&&r.op!==e&&r.fp!==e;)r=r._next;return r}function Lc(t,a){return{name:t,rawVars:1,init:function init(t,n,e){e._onInit=function(t){var e,i;if(r(n)&&(e={},ha(n,function(t){return e[t]=1}),n=e),a){for(i in e={},n)e[i]=a(n[i]);n=e}!function _addModifiers(t,e){var r,i,n,a=t._targets;for(r in e)for(i=a.length;i--;)(n=(n=t._ptLookup[i][r])&&n.d)&&(n._pt&&(n=Jc(n,r)),n&&n.modifier&&n.modifier(e[r],t,a[i],r))}(t,n)}}}}var ze=Se.registerPlugin({name:"attr",init:function init(t,e,r,i,n){var a,s,o;for(a in this.tween=r,e)o=t.getAttribute(a)||"",(s=this.add(t,"setAttribute",(o||0)+"",e[a],i,n,0,0,a)).op=a,s.b=o,this._props.push(a)},render:function render(t,e){for(var r=e._pt;r;)L?r.set(r.t,r.p,r.b,r):r.r(t,r.d),r=r._next}},{name:"endArray",init:function init(t,e){for(var r=e.length;r--;)this.add(t,r,t[r]||0,e[r],0,0,0,0,0,1)}},Lc("roundProps",fb),Lc("modifiers"),Lc("snap",gb))||Se;$t.version=Xt.version=ze.version="3.12.5",o=1,x()&&Ft();function vd(t,e){return e.set(e.t,e.p,Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)}function wd(t,e){return e.set(e.t,e.p,1===t?e.e:Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)}function xd(t,e){return e.set(e.t,e.p,t?Math.round(1e4*(e.s+e.c*t))/1e4+e.u:e.b,e)}function yd(t,e){var r=e.s+e.c*t;e.set(e.t,e.p,~~(r+(r<0?-.5:.5))+e.u,e)}function zd(t,e){return e.set(e.t,e.p,t?e.e:e.b,e)}function Ad(t,e){return e.set(e.t,e.p,1!==t?e.b:e.e,e)}function Bd(t,e,r){return t.style[e]=r}function Cd(t,e,r){return t.style.setProperty(e,r)}function Dd(t,e,r){return t._gsap[e]=r}function Ed(t,e,r){return t._gsap.scaleX=t._gsap.scaleY=r}function Fd(t,e,r,i,n){var a=t._gsap;a.scaleX=a.scaleY=r,a.renderTransform(n,a)}function Gd(t,e,r,i,n){var a=t._gsap;a[e]=r,a.renderTransform(n,a)}function Jd(t,e){var r=this,i=this.target,n=i.style,a=i._gsap;if(t in ar&&n){if(this.tfm=this.tfm||{},"transform"===t)return dr.transform.split(",").forEach(function(t){return Jd.call(r,t,e)});if(~(t=dr[t]||t).indexOf(",")?t.split(",").forEach(function(t){return r.tfm[t]=yr(i,t)}):this.tfm[t]=a.x?a[t]:yr(i,t),t===pr&&(this.tfm.zOrigin=a.zOrigin),0<=this.props.indexOf(cr))return;a.svg&&(this.svgo=i.getAttribute("data-svg-origin"),this.props.push(pr,e,"")),t=cr}(n||e)&&this.props.push(t,e,n[t])}function Kd(t){t.translate&&(t.removeProperty("translate"),t.removeProperty("scale"),t.removeProperty("rotate"))}function Ld(){var t,e,r=this.props,i=this.target,n=i.style,a=i._gsap;for(t=0;t<r.length;t+=3)r[t+1]?i[r[t]]=r[t+2]:r[t+2]?n[r[t]]=r[t+2]:n.removeProperty("--"===r[t].substr(0,2)?r[t]:r[t].replace(hr,"-$1").toLowerCase());if(this.tfm){for(e in this.tfm)a[e]=this.tfm[e];a.svg&&(a.renderTransform(),i.setAttribute("data-svg-origin",this.svgo||"")),(t=Be())&&t.isStart||n[cr]||(Kd(n),a.zOrigin&&n[pr]&&(n[pr]+=" "+a.zOrigin+"px",a.zOrigin=0,a.renderTransform()),a.uncache=1)}}function Md(t,e){var r={target:t,props:[],revert:Ld,save:Jd};return t._gsap||ze.core.getCache(t),e&&e.split(",").forEach(function(t){return r.save(t)}),r}function Od(t,e){var r=De.createElementNS?De.createElementNS((e||"http://www.w3.org/1999/xhtml").replace(/^https/,"http"),t):De.createElement(t);return r&&r.style?r:De.createElement(t)}function Pd(t,e,r){var i=getComputedStyle(t);return i[e]||i.getPropertyValue(e.replace(hr,"-$1").toLowerCase())||i.getPropertyValue(e)||!r&&Pd(t,mr(e)||e,1)||""}function Sd(){(function _windowExists(){return"undefined"!=typeof window})()&&window.document&&(Ee=window,De=Ee.document,Re=De.documentElement,Le=Od("div")||{style:{}},Od("div"),cr=mr(cr),pr=cr+"Origin",Le.style.cssText="border-width:0;line-height:0;position:absolute;padding:0",Ye=!!mr("perspective"),Be=ze.core.reverting,Fe=1)}function Td(t){var e,r=Od("svg",this.ownerSVGElement&&this.ownerSVGElement.getAttribute("xmlns")||"http://www.w3.org/2000/svg"),i=this.parentNode,n=this.nextSibling,a=this.style.cssText;if(Re.appendChild(r),r.appendChild(this),this.style.display="block",t)try{e=this.getBBox(),this._gsapBBox=this.getBBox,this.getBBox=Td}catch(t){}else this._gsapBBox&&(e=this._gsapBBox());return i&&(n?i.insertBefore(this,n):i.appendChild(this)),Re.removeChild(r),this.style.cssText=a,e}function Ud(t,e){for(var r=e.length;r--;)if(t.hasAttribute(e[r]))return t.getAttribute(e[r])}function Vd(e){var r;try{r=e.getBBox()}catch(t){r=Td.call(e,!0)}return r&&(r.width||r.height)||e.getBBox===Td||(r=Td.call(e,!0)),!r||r.width||r.x||r.y?r:{x:+Ud(e,["x","cx","x1"])||0,y:+Ud(e,["y","cy","y1"])||0,width:0,height:0}}function Wd(t){return!(!t.getCTM||t.parentNode&&!t.ownerSVGElement||!Vd(t))}function Xd(t,e){if(e){var r,i=t.style;e in ar&&e!==pr&&(e=cr),i.removeProperty?("ms"!==(r=e.substr(0,2))&&"webkit"!==e.substr(0,6)||(e="-"+e),i.removeProperty("--"===r?e:e.replace(hr,"-$1").toLowerCase())):i.removeAttribute(e)}}function Yd(t,e,r,i,n,a){var s=new _e(t._pt,e,r,0,1,a?Ad:zd);return(t._pt=s).b=i,s.e=n,t._props.push(r),s}function _d(t,e,r,i){var n,a,s,o,u=parseFloat(r)||0,h=(r+"").trim().substr((u+"").length)||"px",l=Le.style,f=lr.test(e),d="svg"===t.tagName.toLowerCase(),c=(d?"client":"offset")+(f?"Width":"Height"),p="px"===i,_="%"===i;if(i===h||!u||gr[i]||gr[h])return u;if("px"===h||p||(u=_d(t,e,r,"px")),o=t.getCTM&&Wd(t),(_||"%"===h)&&(ar[e]||~e.indexOf("adius")))return n=o?t.getBBox()[f?"width":"height"]:t[c],ia(_?u/n*100:u/100*n);if(l[f?"width":"height"]=100+(p?h:i),a=~e.indexOf("adius")||"em"===i&&t.appendChild&&!d?t:t.parentNode,o&&(a=(t.ownerSVGElement||{}).parentNode),a&&a!==De&&a.appendChild||(a=De.body),(s=a._gsap)&&_&&s.width&&f&&s.time===Rt.time&&!s.uncache)return ia(u/s.width*100);if(!_||"height"!==e&&"width"!==e)!_&&"%"!==h||vr[Pd(a,"display")]||(l.position=Pd(t,"position")),a===t&&(l.position="static"),a.appendChild(Le),n=Le[c],a.removeChild(Le),l.position="absolute";else{var m=t.style[e];t.style[e]=100+i,n=t[c],m?t.style[e]=m:Xd(t,e)}return f&&_&&((s=fa(a)).time=Rt.time,s.width=a[c]),ia(p?n*u/100:n&&u?100/n*u:0)}function be(t,e,r,i){if(!r||"none"===r){var n=mr(e,t,1),a=n&&Pd(t,n,1);a&&a!==r?(e=n,r=a):"borderColor"===e&&(r=Pd(t,"borderTopColor"))}var s,o,u,h,l,f,d,c,p,_,m,g=new _e(this._pt,t.style,e,0,1,ue),v=0,y=0;if(g.b=r,g.e=i,r+="","auto"===(i+="")&&(f=t.style[e],t.style[e]=i,i=Pd(t,e)||i,f?t.style[e]=f:Xd(t,e)),Fb(s=[r,i]),i=s[1],u=(r=s[0]).match(rt)||[],(i.match(rt)||[]).length){for(;o=rt.exec(i);)d=o[0],p=i.substring(v,o.index),l?l=(l+1)%5:"rgba("!==p.substr(-5)&&"hsla("!==p.substr(-5)||(l=1),d!==(f=u[y++]||"")&&(h=parseFloat(f)||0,m=f.substr((h+"").length),"="===d.charAt(1)&&(d=ka(h,d)+m),c=parseFloat(d),_=d.substr((c+"").length),v=rt.lastIndex-_.length,_||(_=_||q.units[e]||m,v===i.length&&(i+=_,g.e+=_)),m!==_&&(h=_d(t,e,f,_)||0),g._pt={_next:g._pt,p:p||1===y?p:",",s:h,c:c-h,m:l&&l<4||"zIndex"===e?Math.round:0});g.c=v<i.length?i.substring(v,i.length):""}else g.r="display"===e&&"none"===i?Ad:zd;return nt.test(i)&&(g.e=0),this._pt=g}function de(t){var e=t.split(" "),r=e[0],i=e[1]||"50%";return"top"!==r&&"bottom"!==r&&"left"!==i&&"right"!==i||(t=r,r=i,i=t),e[0]=Tr[r]||r,e[1]=Tr[i]||i,e.join(" ")}function ee(t,e){if(e.tween&&e.tween._time===e.tween._dur){var r,i,n,a=e.t,s=a.style,o=e.u,u=a._gsap;if("all"===o||!0===o)s.cssText="",i=1;else for(n=(o=o.split(",")).length;-1<--n;)r=o[n],ar[r]&&(i=1,r="transformOrigin"===r?pr:cr),Xd(a,r);i&&(Xd(a,cr),u&&(u.svg&&a.removeAttribute("transform"),Or(a,1),u.uncache=1,Kd(s)))}}function ie(t){return"matrix(1, 0, 0, 1, 0, 0)"===t||"none"===t||!t}function je(t){var e=Pd(t,cr);return ie(e)?wr:e.substr(7).match(et).map(ia)}function ke(t,e){var r,i,n,a,s=t._gsap||fa(t),o=t.style,u=je(t);return s.svg&&t.getAttribute("transform")?"1,0,0,1,0,0"===(u=[(n=t.transform.baseVal.consolidate().matrix).a,n.b,n.c,n.d,n.e,n.f]).join(",")?wr:u:(u!==wr||t.offsetParent||t===Re||s.svg||(n=o.display,o.display="block",(r=t.parentNode)&&t.offsetParent||(a=1,i=t.nextElementSibling,Re.appendChild(t)),u=je(t),n?o.display=n:Xd(t,"display"),a&&(i?r.insertBefore(t,i):r?r.appendChild(t):Re.removeChild(t))),e&&6<u.length?[u[0],u[1],u[4],u[5],u[12],u[13]]:u)}function le(t,e,r,i,n,a){var s,o,u,h=t._gsap,l=n||ke(t,!0),f=h.xOrigin||0,d=h.yOrigin||0,c=h.xOffset||0,p=h.yOffset||0,_=l[0],m=l[1],g=l[2],v=l[3],y=l[4],T=l[5],b=e.split(" "),w=parseFloat(b[0])||0,x=parseFloat(b[1])||0;r?l!==wr&&(o=_*v-m*g)&&(u=w*(-m/o)+x*(_/o)-(_*T-m*y)/o,w=w*(v/o)+x*(-g/o)+(g*T-v*y)/o,x=u):(w=(s=Vd(t)).x+(~b[0].indexOf("%")?w/100*s.width:w),x=s.y+(~(b[1]||b[0]).indexOf("%")?x/100*s.height:x)),i||!1!==i&&h.smooth?(y=w-f,T=x-d,h.xOffset=c+(y*_+T*g)-y,h.yOffset=p+(y*m+T*v)-T):h.xOffset=h.yOffset=0,h.xOrigin=w,h.yOrigin=x,h.smooth=!!i,h.origin=e,h.originIsAbsolute=!!r,t.style[pr]="0px 0px",a&&(Yd(a,h,"xOrigin",f,w),Yd(a,h,"yOrigin",d,x),Yd(a,h,"xOffset",c,h.xOffset),Yd(a,h,"yOffset",p,h.yOffset)),t.setAttribute("data-svg-origin",w+" "+x)}function oe(t,e,r){var i=Ya(e);return ia(parseFloat(e)+parseFloat(_d(t,"x",r+"px",i)))+i}function ve(t,e,i,n,a){var s,o,u=360,h=r(a),l=parseFloat(a)*(h&&~a.indexOf("rad")?sr:1)-n,f=n+l+"deg";return h&&("short"===(s=a.split("_")[1])&&(l%=u)!==l%180&&(l+=l<0?u:-u),"cw"===s&&l<0?l=(l+36e9)%u-~~(l/u)*u:"ccw"===s&&0<l&&(l=(l-36e9)%u-~~(l/u)*u)),t._pt=o=new _e(t._pt,e,i,n,l,wd),o.e=f,o.u="deg",t._props.push(i),o}function we(t,e){for(var r in e)t[r]=e[r];return t}function xe(t,e,r){var i,n,a,s,o,u,h,l=we({},r._gsap),f=r.style;for(n in l.svg?(a=r.getAttribute("transform"),r.setAttribute("transform",""),f[cr]=e,i=Or(r,1),Xd(r,cr),r.setAttribute("transform",a)):(a=getComputedStyle(r)[cr],f[cr]=e,i=Or(r,1),f[cr]=a),ar)(a=l[n])!==(s=i[n])&&"perspective,force3D,transformOrigin,svgOrigin".indexOf(n)<0&&(o=Ya(a)!==(h=Ya(s))?_d(r,n,a,h):parseFloat(a),u=parseFloat(s),t._pt=new _e(t._pt,i,n,o,u-o,vd),t._pt.u=h||0,t._props.push(n));we(i,l)}var Ee,De,Re,Fe,Le,Ie,Be,Ye,qe=Lt.Power0,Ve=Lt.Power1,Ue=Lt.Power2,Xe=Lt.Power3,Ne=Lt.Power4,Ge=Lt.Linear,We=Lt.Quad,Qe=Lt.Cubic,Ke=Lt.Quart,Je=Lt.Quint,He=Lt.Strong,$e=Lt.Elastic,Ze=Lt.Back,tr=Lt.SteppedEase,er=Lt.Bounce,rr=Lt.Sine,ir=Lt.Expo,nr=Lt.Circ,ar={},sr=180/Math.PI,or=Math.PI/180,ur=Math.atan2,hr=/([A-Z])/g,lr=/(left|right|width|margin|padding|x)/i,fr=/[\\s,\\(]\\S/,dr={autoAlpha:"opacity,visibility",scale:"scaleX,scaleY",alpha:"opacity"},cr="transform",pr=cr+"Origin",_r="O,Moz,ms,Ms,Webkit".split(","),mr=function _checkPropPrefix(t,e,r){var i=(e||Le).style,n=5;if(t in i&&!r)return t;for(t=t.charAt(0).toUpperCase()+t.substr(1);n--&&!(_r[n]+t in i););return n<0?null:(3===n?"ms":0<=n?_r[n]:"")+t},gr={deg:1,rad:1,turn:1},vr={grid:1,flex:1},yr=function _get(t,e,r,i){var n;return Fe||Sd(),e in dr&&"transform"!==e&&~(e=dr[e]).indexOf(",")&&(e=e.split(",")[0]),ar[e]&&"transform"!==e?(n=Or(t,i),n="transformOrigin"!==e?n[e]:n.svg?n.origin:kr(Pd(t,pr))+" "+n.zOrigin+"px"):(n=t.style[e])&&"auto"!==n&&!i&&!~(n+"").indexOf("calc(")||(n=br[e]&&br[e](t,e,r)||Pd(t,e)||ga(t,e)||("opacity"===e?1:0)),r&&!~(n+"").trim().indexOf(" ")?_d(t,e,n,r)+r:n},Tr={top:"0%",bottom:"100%",left:"0%",right:"100%",center:"50%"},br={clearProps:function clearProps(t,e,r,i,n){if("isFromStart"!==n.data){var a=t._pt=new _e(t._pt,e,r,0,0,ee);return a.u=i,a.pr=-10,a.tween=n,t._props.push(r),1}}},wr=[1,0,0,1,0,0],xr={},Or=function _parseTransform(t,e){var r=t._gsap||new Vt(t);if("x"in r&&!e&&!r.uncache)return r;var i,n,a,s,o,u,h,l,f,d,c,p,_,m,g,v,y,T,b,w,x,O,k,M,P,C,A,S,z,E,D,R,F=t.style,L=r.scaleX<0,I="deg",B=getComputedStyle(t),Y=Pd(t,pr)||"0";return i=n=a=u=h=l=f=d=c=0,s=o=1,r.svg=!(!t.getCTM||!Wd(t)),B.translate&&("none"===B.translate&&"none"===B.scale&&"none"===B.rotate||(F[cr]=("none"!==B.translate?"translate3d("+(B.translate+" 0 0").split(" ").slice(0,3).join(", ")+") ":"")+("none"!==B.rotate?"rotate("+B.rotate+") ":"")+("none"!==B.scale?"scale("+B.scale.split(" ").join(",")+") ":"")+("none"!==B[cr]?B[cr]:"")),F.scale=F.rotate=F.translate="none"),m=ke(t,r.svg),r.svg&&(M=r.uncache?(P=t.getBBox(),Y=r.xOrigin-P.x+"px "+(r.yOrigin-P.y)+"px",""):!e&&t.getAttribute("data-svg-origin"),le(t,M||Y,!!M||r.originIsAbsolute,!1!==r.smooth,m)),p=r.xOrigin||0,_=r.yOrigin||0,m!==wr&&(T=m[0],b=m[1],w=m[2],x=m[3],i=O=m[4],n=k=m[5],6===m.length?(s=Math.sqrt(T*T+b*b),o=Math.sqrt(x*x+w*w),u=T||b?ur(b,T)*sr:0,(f=w||x?ur(w,x)*sr+u:0)&&(o*=Math.abs(Math.cos(f*or))),r.svg&&(i-=p-(p*T+_*w),n-=_-(p*b+_*x))):(R=m[6],E=m[7],A=m[8],S=m[9],z=m[10],D=m[11],i=m[12],n=m[13],a=m[14],h=(g=ur(R,z))*sr,g&&(M=O*(v=Math.cos(-g))+A*(y=Math.sin(-g)),P=k*v+S*y,C=R*v+z*y,A=O*-y+A*v,S=k*-y+S*v,z=R*-y+z*v,D=E*-y+D*v,O=M,k=P,R=C),l=(g=ur(-w,z))*sr,g&&(v=Math.cos(-g),D=x*(y=Math.sin(-g))+D*v,T=M=T*v-A*y,b=P=b*v-S*y,w=C=w*v-z*y),u=(g=ur(b,T))*sr,g&&(M=T*(v=Math.cos(g))+b*(y=Math.sin(g)),P=O*v+k*y,b=b*v-T*y,k=k*v-O*y,T=M,O=P),h&&359.9<Math.abs(h)+Math.abs(u)&&(h=u=0,l=180-l),s=ia(Math.sqrt(T*T+b*b+w*w)),o=ia(Math.sqrt(k*k+R*R)),g=ur(O,k),f=2e-4<Math.abs(g)?g*sr:0,c=D?1/(D<0?-D:D):0),r.svg&&(M=t.getAttribute("transform"),r.forceCSS=t.setAttribute("transform","")||!ie(Pd(t,cr)),M&&t.setAttribute("transform",M))),90<Math.abs(f)&&Math.abs(f)<270&&(L?(s*=-1,f+=u<=0?180:-180,u+=u<=0?180:-180):(o*=-1,f+=f<=0?180:-180)),e=e||r.uncache,r.x=i-((r.xPercent=i&&(!e&&r.xPercent||(Math.round(t.offsetWidth/2)===Math.round(-i)?-50:0)))?t.offsetWidth*r.xPercent/100:0)+"px",r.y=n-((r.yPercent=n&&(!e&&r.yPercent||(Math.round(t.offsetHeight/2)===Math.round(-n)?-50:0)))?t.offsetHeight*r.yPercent/100:0)+"px",r.z=a+"px",r.scaleX=ia(s),r.scaleY=ia(o),r.rotation=ia(u)+I,r.rotationX=ia(h)+I,r.rotationY=ia(l)+I,r.skewX=f+I,r.skewY=d+I,r.transformPerspective=c+"px",(r.zOrigin=parseFloat(Y.split(" ")[2])||!e&&r.zOrigin||0)&&(F[pr]=kr(Y)),r.xOffset=r.yOffset=0,r.force3D=q.force3D,r.renderTransform=r.svg?zr:Ye?Sr:Mr,r.uncache=0,r},kr=function _firstTwoOnly(t){return(t=t.split(" "))[0]+" "+t[1]},Mr=function _renderNon3DTransforms(t,e){e.z="0px",e.rotationY=e.rotationX="0deg",e.force3D=0,Sr(t,e)},Pr="0deg",Cr="0px",Ar=") ",Sr=function _renderCSSTransforms(t,e){var r=e||this,i=r.xPercent,n=r.yPercent,a=r.x,s=r.y,o=r.z,u=r.rotation,h=r.rotationY,l=r.rotationX,f=r.skewX,d=r.skewY,c=r.scaleX,p=r.scaleY,_=r.transformPerspective,m=r.force3D,g=r.target,v=r.zOrigin,y="",T="auto"===m&&t&&1!==t||!0===m;if(v&&(l!==Pr||h!==Pr)){var b,w=parseFloat(h)*or,x=Math.sin(w),O=Math.cos(w);w=parseFloat(l)*or,b=Math.cos(w),a=oe(g,a,x*b*-v),s=oe(g,s,-Math.sin(w)*-v),o=oe(g,o,O*b*-v+v)}_!==Cr&&(y+="perspective("+_+Ar),(i||n)&&(y+="translate("+i+"%, "+n+"%) "),!T&&a===Cr&&s===Cr&&o===Cr||(y+=o!==Cr||T?"translate3d("+a+", "+s+", "+o+") ":"translate("+a+", "+s+Ar),u!==Pr&&(y+="rotate("+u+Ar),h!==Pr&&(y+="rotateY("+h+Ar),l!==Pr&&(y+="rotateX("+l+Ar),f===Pr&&d===Pr||(y+="skew("+f+", "+d+Ar),1===c&&1===p||(y+="scale("+c+", "+p+Ar),g.style[cr]=y||"translate(0, 0)"},zr=function _renderSVGTransforms(t,e){var r,i,n,a,s,o=e||this,u=o.xPercent,h=o.yPercent,l=o.x,f=o.y,d=o.rotation,c=o.skewX,p=o.skewY,_=o.scaleX,m=o.scaleY,g=o.target,v=o.xOrigin,y=o.yOrigin,T=o.xOffset,b=o.yOffset,w=o.forceCSS,x=parseFloat(l),O=parseFloat(f);d=parseFloat(d),c=parseFloat(c),(p=parseFloat(p))&&(c+=p=parseFloat(p),d+=p),d||c?(d*=or,c*=or,r=Math.cos(d)*_,i=Math.sin(d)*_,n=Math.sin(d-c)*-m,a=Math.cos(d-c)*m,c&&(p*=or,s=Math.tan(c-p),n*=s=Math.sqrt(1+s*s),a*=s,p&&(s=Math.tan(p),r*=s=Math.sqrt(1+s*s),i*=s)),r=ia(r),i=ia(i),n=ia(n),a=ia(a)):(r=_,a=m,i=n=0),(x&&!~(l+"").indexOf("px")||O&&!~(f+"").indexOf("px"))&&(x=_d(g,"x",l,"px"),O=_d(g,"y",f,"px")),(v||y||T||b)&&(x=ia(x+v-(v*r+y*n)+T),O=ia(O+y-(v*i+y*a)+b)),(u||h)&&(s=g.getBBox(),x=ia(x+u/100*s.width),O=ia(O+h/100*s.height)),s="matrix("+r+","+i+","+n+","+a+","+x+","+O+")",g.setAttribute("transform",s),w&&(g.style[cr]=s)};ha("padding,margin,Width,Radius",function(e,r){var t="Right",i="Bottom",n="Left",o=(r<3?["Top",t,i,n]:["Top"+n,"Top"+t,i+t,i+n]).map(function(t){return r<2?e+t:"border"+t+e});br[1<r?"border"+e:e]=function(e,t,r,i,n){var a,s;if(arguments.length<4)return a=o.map(function(t){return yr(e,t,r)}),5===(s=a.join(" ")).split(a[0]).length?a[0]:s;a=(i+"").split(" "),s={},o.forEach(function(t,e){return s[t]=a[e]=a[e]||a[(e-1)/2|0]}),e.init(t,s,n)}});var Er,Dr,Rr,Fr={name:"css",register:Sd,targetTest:function targetTest(t){return t.style&&t.nodeType},init:function init(t,e,i,n,a){var s,o,u,h,l,f,d,c,p,_,m,g,v,y,T,b,w=this._props,x=t.style,O=i.vars.startAt;for(d in Fe||Sd(),this.styles=this.styles||Md(t),b=this.styles.props,this.tween=i,e)if("autoRound"!==d&&(o=e[d],!pt[d]||!ac(d,e,i,n,t,a)))if(l=typeof o,f=br[d],"function"===l&&(l=typeof(o=o.call(i,n,t,a))),"string"===l&&~o.indexOf("random(")&&(o=ob(o)),f)f(this,t,d,o,i)&&(T=1);else if("--"===d.substr(0,2))s=(getComputedStyle(t).getPropertyValue(d)+"").trim(),o+="",Et.lastIndex=0,Et.test(s)||(c=Ya(s),p=Ya(o)),p?c!==p&&(s=_d(t,d,s,p)+p):c&&(o+=c),this.add(x,"setProperty",s,o,n,a,0,0,d),w.push(d),b.push(d,0,x[d]);else if("undefined"!==l){if(O&&d in O?(s="function"==typeof O[d]?O[d].call(i,n,t,a):O[d],r(s)&&~s.indexOf("random(")&&(s=ob(s)),Ya(s+"")||"auto"===s||(s+=q.units[d]||Ya(yr(t,d))||""),"="===(s+"").charAt(1)&&(s=yr(t,d))):s=yr(t,d),h=parseFloat(s),(_="string"===l&&"="===o.charAt(1)&&o.substr(0,2))&&(o=o.substr(2)),u=parseFloat(o),d in dr&&("autoAlpha"===d&&(1===h&&"hidden"===yr(t,"visibility")&&u&&(h=0),b.push("visibility",0,x.visibility),Yd(this,x,"visibility",h?"inherit":"hidden",u?"inherit":"hidden",!u)),"scale"!==d&&"transform"!==d&&~(d=dr[d]).indexOf(",")&&(d=d.split(",")[0])),m=d in ar)if(this.styles.save(d),g||((v=t._gsap).renderTransform&&!e.parseTransform||Or(t,e.parseTransform),y=!1!==e.smoothOrigin&&v.smooth,(g=this._pt=new _e(this._pt,x,cr,0,1,v.renderTransform,v,0,-1)).dep=1),"scale"===d)this._pt=new _e(this._pt,v,"scaleY",v.scaleY,(_?ka(v.scaleY,_+u):u)-v.scaleY||0,vd),this._pt.u=0,w.push("scaleY",d),d+="X";else{if("transformOrigin"===d){b.push(pr,0,x[pr]),o=de(o),v.svg?le(t,o,0,y,0,this):((p=parseFloat(o.split(" ")[2])||0)!==v.zOrigin&&Yd(this,v,"zOrigin",v.zOrigin,p),Yd(this,x,d,kr(s),kr(o)));continue}if("svgOrigin"===d){le(t,o,1,y,0,this);continue}if(d in xr){ve(this,v,d,h,_?ka(h,_+o):o);continue}if("smoothOrigin"===d){Yd(this,v,"smooth",v.smooth,o);continue}if("force3D"===d){v[d]=o;continue}if("transform"===d){xe(this,o,t);continue}}else d in x||(d=mr(d)||d);if(m||(u||0===u)&&(h||0===h)&&!fr.test(o)&&d in x)u=u||0,(c=(s+"").substr((h+"").length))!==(p=Ya(o)||(d in q.units?q.units[d]:c))&&(h=_d(t,d,s,p)),this._pt=new _e(this._pt,m?v:x,d,h,(_?ka(h,_+u):u)-h,m||"px"!==p&&"zIndex"!==d||!1===e.autoRound?vd:yd),this._pt.u=p||0,c!==p&&"%"!==p&&(this._pt.b=s,this._pt.r=xd);else if(d in x)be.call(this,t,d,s,_?_+o:o);else if(d in t)this.add(t,d,s||t[d],_?_+o:o,n,a);else if("parseTransform"!==d){Q(d,o);continue}m||(d in x?b.push(d,0,x[d]):b.push(d,1,s||t[d])),w.push(d)}T&&pe(this)},render:function render(t,e){if(e.tween._time||!Be())for(var r=e._pt;r;)r.r(t,r.d),r=r._next;else e.styles.revert()},get:yr,aliases:dr,getSetter:function getSetter(t,e,r){var i=dr[e];return i&&i.indexOf(",")<0&&(e=i),e in ar&&e!==pr&&(t._gsap.x||yr(t,"x"))?r&&Ie===r?"scale"===e?Ed:Dd:(Ie=r||{})&&("scale"===e?Fd:Gd):t.style&&!u(t.style[e])?Bd:~e.indexOf("-")?Cd:ne(t,e)},core:{_removeProperty:Xd,_getMatrix:ke}};ze.utils.checkPrefix=mr,ze.core.getStyleSaver=Md,Rr=ha((Er="x,y,z,scale,scaleX,scaleY,xPercent,yPercent")+","+(Dr="rotation,rotationX,rotationY,skewX,skewY")+",transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective",function(t){ar[t]=1}),ha(Dr,function(t){q.units[t]="deg",xr[t]=1}),dr[Rr[13]]=Er+","+Dr,ha("0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY",function(t){var e=t.split(":");dr[e[1]]=Rr[e[0]]}),ha("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective",function(t){q.units[t]="px"}),ze.registerPlugin(Fr);var Lr=ze.registerPlugin(Fr)||ze,Ir=Lr.core.Tween;e.Back=Ze,e.Bounce=er,e.CSSPlugin=Fr,e.Circ=nr,e.Cubic=Qe,e.Elastic=$e,e.Expo=ir,e.Linear=Ge,e.Power0=qe,e.Power1=Ve,e.Power2=Ue,e.Power3=Xe,e.Power4=Ne,e.Quad=We,e.Quart=Ke,e.Quint=Je,e.Sine=rr,e.SteppedEase=tr,e.Strong=He,e.TimelineLite=Xt,e.TimelineMax=Xt,e.TweenLite=$t,e.TweenMax=Ir,e.default=Lr,e.gsap=Lr;if (typeof(window)==="undefined"||window!==e){Object.defineProperty(e,"__esModule",{value:!0})} else {delete e.default}});

`;

  // shared-svg-library.js
  var SHARED_SVG_COMPONENTS = {
    svg_persib_shield: {
      componentId: "svg_persib_shield",
      name: "Perisai Lambang Persib",
      category: "Club Logo",
      defaultProps: {
        width: 200,
        height: 240,
        colors: { primary: "#003da5", accent: "#f0a500", secondary: "#ffffff" }
      },
      render: (props = {}) => {
        const p = props.colors?.primary || "#003da5";
        const a = props.colors?.accent || "#f0a500";
        const s = props.colors?.secondary || "#ffffff";
        const w = props.width || 200;
        const h = props.height || 240;
        return `<svg viewBox="0 0 200 240" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${p}"/>
            <stop offset="100%" stop-color="#001844"/>
          </linearGradient>
        </defs>
        <polygon points="100,10 190,45 190,165 100,230 10,165 10,45" fill="url(#shieldGrad)" stroke="${s}" stroke-width="6"/>
        <polygon points="100,28 172,55 172,152 100,208 28,152 28,55" fill="none" stroke="${a}" stroke-width="4"/>
        <path d="M60,65 L140,65 L120,115 L80,115 Z" fill="${a}" opacity="0.9"/>
        <text x="100" y="150" font-family="'Bebas Neue', sans-serif" font-size="52" font-weight="900" fill="${s}" text-anchor="middle">PERSIB</text>
        <text x="100" y="180" font-family="'Inter', sans-serif" font-size="16" font-weight="800" fill="${a}" text-anchor="middle" letter-spacing="3">1933</text>
      </svg>`;
      }
    },
    svg_trophy_ladder: {
      componentId: "svg_trophy_ladder",
      name: "Piala Juara Emas (Trophy)",
      category: "Trophy",
      defaultProps: {
        width: 300,
        height: 380,
        colors: { primary: "#003da5", accent: "#f0a500", secondary: "#0a0a0a" }
      },
      render: (props = {}) => {
        const a = props.colors?.accent || "#f0a500";
        const p = props.colors?.primary || "#003da5";
        const w = props.width || 300;
        const h = props.height || 380;
        return `<svg viewBox="0 0 300 380" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldCupGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffe066"/>
            <stop offset="60%" stop-color="${a}"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <!-- Handles -->
        <path d="M50,80 C20,90 20,160 70,180" fill="none" stroke="${a}" stroke-width="12" stroke-linecap="round"/>
        <path d="M250,80 C280,90 280,160 230,180" fill="none" stroke="${a}" stroke-width="12" stroke-linecap="round"/>
        <!-- Main Cup Body -->
        <path d="M70,50 L230,50 L210,180 C190,230 110,230 90,180 Z" fill="url(#goldCupGrad)" stroke="#ffd700" stroke-width="4"/>
        <!-- Cup Rim & Crest -->
        <ellipse cx="150" cy="50" rx="80" ry="16" fill="#ffd700"/>
        <circle cx="150" cy="120" r="28" fill="${p}" stroke="#ffffff" stroke-width="3"/>
        <text x="150" y="130" font-family="'Bebas Neue', sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">\u2605</text>
        <!-- Stem & Base -->
        <path d="M135,225 L165,225 L175,290 L125,290 Z" fill="url(#goldCupGrad)"/>
        <rect x="90" y="290" width="120" height="25" rx="6" fill="#ffd700"/>
        <rect x="70" y="315" width="160" height="45" rx="8" fill="#1e293b" stroke="${a}" stroke-width="3"/>
        <text x="150" y="345" font-family="'Bebas Neue', sans-serif" font-size="22" font-weight="900" fill="${a}" text-anchor="middle" letter-spacing="2">CHAMPIONS 2026</text>
      </svg>`;
      }
    },
    svg_jersey_no10: {
      componentId: "svg_jersey_no10",
      name: "Jersey Pangeran Biru No. 10",
      category: "Jersey",
      defaultProps: {
        width: 320,
        height: 360,
        colors: { primary: "#003da5", accent: "#f0a500", text: "#ffffff" }
      },
      render: (props = {}) => {
        const p = props.colors?.primary || "#003da5";
        const a = props.colors?.accent || "#f0a500";
        const t = props.colors?.text || "#ffffff";
        const w = props.width || 320;
        const h = props.height || 360;
        return `<svg viewBox="0 0 320 360" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="jerseyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${p}"/>
            <stop offset="100%" stop-color="#001a4d"/>
          </linearGradient>
        </defs>
        <!-- Jersey Body & Sleeves -->
        <path d="M90,30 L130,45 C150,48 170,48 190,45 L230,30 L310,95 L270,145 L240,125 L240,340 L80,340 L80,125 L50,145 L10,95 Z" fill="url(#jerseyGrad)" stroke="${a}" stroke-width="4"/>
        <!-- Collar -->
        <path d="M125,43 C140,65 180,65 195,43 Z" fill="${a}"/>
        <!-- Shoulder Stripes -->
        <line x1="85" y1="35" x2="30" y2="100" stroke="${a}" stroke-width="5"/>
        <line x1="235" y1="35" x2="290" y2="100" stroke="${a}" stroke-width="5"/>
        <!-- Club Emblem on Chest -->
        <polygon points="110,90 125,97 125,115 110,125 95,115 95,97" fill="${a}"/>
        <!-- Big Number 10 -->
        <text id="tnJerseyNumber" x="160" y="240" font-family="'Bebas Neue', sans-serif" font-size="120" font-weight="900" fill="${t}" text-anchor="middle" letter-spacing="4">10</text>
        <text x="160" y="275" font-family="'Inter', sans-serif" font-size="20" font-weight="800" fill="${a}" text-anchor="middle" letter-spacing="5">MAUNG BANDUNG</text>
      </svg>`;
      }
    },
    svg_scoreboard_stadium: {
      componentId: "svg_scoreboard_stadium",
      name: "Papan Skor Stadion (Scoreboard)",
      category: "Stadium",
      defaultProps: {
        width: 740,
        height: 320,
        colors: { primary: "#003da5", accent: "#f0a500", text: "#ffffff" }
      },
      render: (props = {}) => {
        const p = props.colors?.primary || "#003da5";
        const a = props.colors?.accent || "#f0a500";
        const t = props.colors?.text || "#ffffff";
        const w = props.width || 740;
        const h = props.height || 320;
        return `<svg viewBox="0 0 740 320" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="720" height="300" rx="24" fill="#0c121e" stroke="${a}" stroke-width="4"/>
        <!-- Header Pill -->
        <rect x="280" y="0" width="180" height="38" rx="19" fill="${a}"/>
        <text x="370" y="26" font-family="'Bebas Neue', sans-serif" font-size="22" font-weight="900" fill="#0a0a0a" text-anchor="middle">FULL TIME</text>
        <!-- Home Team -->
        <g transform="translate(110, 60)">
          <polygon points="40,0 80,16 80,72 40,104 0,72 0,16" fill="${p}" stroke="${a}" stroke-width="3"/>
          <text x="40" y="60" font-family="'Bebas Neue', sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">P</text>
          <text x="40" y="140" font-family="'Bebas Neue', sans-serif" font-size="30" font-weight="900" fill="${t}" text-anchor="middle">PERSIB</text>
        </g>
        <!-- Center Scores -->
        <text x="310" y="170" font-family="'Bebas Neue', sans-serif" font-size="110" font-weight="900" fill="${t}" text-anchor="middle">3</text>
        <text x="370" y="155" font-family="'Bebas Neue', sans-serif" font-size="60" font-weight="900" fill="${a}" text-anchor="middle">\u2014</text>
        <text x="430" y="170" font-family="'Bebas Neue', sans-serif" font-size="110" font-weight="900" fill="#9ca3af" text-anchor="middle">1</text>
        <text x="370" y="215" font-family="'Inter', sans-serif" font-size="15" font-weight="700" fill="${a}" text-anchor="middle" letter-spacing="2">STADION SI JALAK HARUPAT</text>
        <!-- Away Team -->
        <g transform="translate(550, 60)">
          <polygon points="40,0 80,16 80,72 40,104 0,72 0,16" fill="#2d3748" stroke="#ffffff" stroke-width="3"/>
          <text x="40" y="60" font-family="'Bebas Neue', sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">R</text>
          <text x="40" y="140" font-family="'Bebas Neue', sans-serif" font-size="30" font-weight="900" fill="#9ca3af" text-anchor="middle">RIVAL</text>
        </g>
      </svg>`;
      }
    },
    svg_duel_radar: {
      componentId: "svg_duel_radar",
      name: "Radar Taktik & Duel (Radar)",
      category: "Radar",
      defaultProps: {
        width: 400,
        height: 400,
        colors: { primary: "#003da5", accent: "#f0a500", secondary: "#0070c0" }
      },
      render: (props = {}) => {
        const a = props.colors?.accent || "#f0a500";
        const p = props.colors?.primary || "#003da5";
        const w = props.width || 400;
        const h = props.height || 400;
        return `<svg viewBox="0 0 400 400" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="180" fill="#080e1a" stroke="${p}" stroke-width="4"/>
        <circle cx="200" cy="200" r="135" fill="none" stroke="${p}" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>
        <circle cx="200" cy="200" r="90" fill="none" stroke="${a}" stroke-width="2" opacity="0.7"/>
        <circle cx="200" cy="200" r="45" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="4,4"/>
        <!-- Crosshairs -->
        <line x1="20" y1="200" x2="380" y2="200" stroke="${p}" stroke-width="2" opacity="0.5"/>
        <line x1="200" y1="20" x2="200" y2="380" stroke="${p}" stroke-width="2" opacity="0.5"/>
        <!-- Radar Sweep Indicator -->
        <polygon id="bmRadarSweep" points="200,200 350,110 380,200" fill="${a}" opacity="0.25"/>
        <circle cx="200" cy="200" r="8" fill="${a}"/>
        <text x="200" y="360" font-family="'Inter', sans-serif" font-size="14" font-weight="800" fill="${a}" text-anchor="middle" letter-spacing="3">TACTICAL RADAR</text>
      </svg>`;
      }
    },
    svg_motm_badge: {
      componentId: "svg_motm_badge",
      name: "Lencana Bintang MOTM (Badge)",
      category: "Badge & Number",
      defaultProps: {
        width: 260,
        height: 260,
        colors: { accent: "#f0a500", primary: "#003da5", text: "#ffffff" }
      },
      render: (props = {}) => {
        const a = props.colors?.accent || "#f0a500";
        const p = props.colors?.primary || "#003da5";
        const t = props.colors?.text || "#ffffff";
        const w = props.width || 260;
        const h = props.height || 260;
        return `<svg viewBox="0 0 260 260" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="130,10 165,85 245,95 185,150 205,230 130,190 55,230 75,150 15,95 95,85" fill="#001844" stroke="${a}" stroke-width="6"/>
        <circle cx="130" cy="130" r="55" fill="${p}" stroke="#ffd700" stroke-width="3"/>
        <text x="130" y="125" font-family="'Bebas Neue', sans-serif" font-size="28" font-weight="900" fill="${a}" text-anchor="middle">MAN OF</text>
        <text x="130" y="152" font-family="'Bebas Neue', sans-serif" font-size="30" font-weight="900" fill="${t}" text-anchor="middle">MATCH</text>
      </svg>`;
      }
    },
    svg_wilujeng_stamp: {
      componentId: "svg_wilujeng_stamp",
      name: "Stempel Wilujeng Sumping",
      category: "Badge & Number",
      defaultProps: {
        width: 440,
        height: 160,
        colors: { accent: "#f0a500", text: "#ffffff" }
      },
      render: (props = {}) => {
        const a = props.colors?.accent || "#f0a500";
        const t = props.colors?.text || "#ffffff";
        const w = props.width || 440;
        const h = props.height || 160;
        return `<svg viewBox="0 0 440 160" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="420" height="140" rx="12" fill="none" stroke="${a}" stroke-width="6" stroke-dasharray="16,6"/>
        <rect x="22" y="22" width="396" height="116" rx="8" fill="rgba(240, 165, 0, 0.12)" stroke="${a}" stroke-width="2"/>
        <text x="220" y="70" font-family="'Bebas Neue', sans-serif" font-size="52" font-weight="900" fill="${a}" text-anchor="middle" letter-spacing="4">WILUJENG SUMPING</text>
        <text x="220" y="112" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="${t}" text-anchor="middle" letter-spacing="6">OFFICIAL PLAYER SIGNING</text>
      </svg>`;
      }
    },
    svg_vs_badge: {
      componentId: "svg_vs_badge",
      name: "Lencana Duel Panas (VS)",
      category: "Badge & Number",
      defaultProps: {
        width: 220,
        height: 220,
        colors: { accent: "#f0a500", primary: "#dc2626" }
      },
      render: (props = {}) => {
        const a = props.colors?.accent || "#f0a500";
        const p = props.colors?.primary || "#dc2626";
        const w = props.width || 220;
        const h = props.height || 220;
        return `<svg viewBox="0 0 220 220" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="110,10 140,80 215,80 155,125 180,195 110,150 40,195 65,125 5,80 80,80" fill="${p}" stroke="${a}" stroke-width="5"/>
        <circle cx="110" cy="110" r="48" fill="#0a0a0a" stroke="${a}" stroke-width="3"/>
        <text x="110" y="128" font-family="'Bebas Neue', sans-serif" font-size="54" font-weight="900" fill="${a}" text-anchor="middle" font-style="italic">VS</text>
      </svg>`;
      }
    },
    svg_gold_crown: {
      componentId: "svg_gold_crown",
      name: "Mahkota Raja Juara (Crown)",
      category: "Trophy",
      defaultProps: {
        width: 280,
        height: 200,
        colors: { accent: "#f0a500", primary: "#003da5" }
      },
      render: (props = {}) => {
        const a = props.colors?.accent || "#f0a500";
        const p = props.colors?.primary || "#003da5";
        const w = props.width || 280;
        const h = props.height || 200;
        return `<svg viewBox="0 0 280 200" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffe57f"/>
            <stop offset="100%" stop-color="${a}"/>
          </linearGradient>
        </defs>
        <path d="M20,160 L40,40 L95,110 L140,20 L185,110 L240,40 L260,160 Z" fill="url(#crownGrad)" stroke="#ffd700" stroke-width="4"/>
        <circle cx="40" cy="35" r="10" fill="#ffffff"/>
        <circle cx="140" cy="18" r="12" fill="#ffffff"/>
        <circle cx="240" cy="35" r="10" fill="#ffffff"/>
        <rect x="20" y="150" width="240" height="25" rx="6" fill="#1e293b" stroke="${a}" stroke-width="3"/>
        <circle cx="70" cy="162" r="6" fill="${p}"/>
        <circle cx="140" cy="162" r="6" fill="${a}"/>
        <circle cx="210" cy="162" r="6" fill="${p}"/>
      </svg>`;
      }
    },
    svg_decorative_speedlines: {
      componentId: "svg_decorative_speedlines",
      name: "Garis Kecepatan Diagonal (Speedlines)",
      category: "Decorative Graphics",
      defaultProps: {
        width: 400,
        height: 200,
        colors: { accent: "#f0a500" }
      },
      render: (props = {}) => {
        const a = props.colors?.accent || "#f0a500";
        const w = props.width || 400;
        const h = props.height || 200;
        return `<svg viewBox="0 0 400 200" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="190" x2="160" y2="10" stroke="${a}" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
        <line x1="60" y1="190" x2="210" y2="10" stroke="${a}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        <line x1="120" y1="190" x2="270" y2="10" stroke="${a}" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
        <line x1="180" y1="190" x2="330" y2="10" stroke="${a}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
        <line x1="240" y1="190" x2="390" y2="10" stroke="${a}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
      </svg>`;
      }
    }
  };
  function renderSvgComponent(componentId, props = {}) {
    const comp = SHARED_SVG_COMPONENTS[componentId];
    if (!comp) {
      return `<svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="12" fill="#1e293b" stroke="#f0a500" stroke-width="2"/>
      <text x="100" y="105" font-family="'Inter', sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">Komponen SVG: ${componentId}</text>
    </svg>`;
    }
    return comp.render({ ...comp.defaultProps, ...props });
  }

  // asset-library.js
  var ASSET_CATEGORIES = [
    "All",
    "Club Logo",
    "Opponent Logo",
    "Player Photo",
    "Team Photo",
    "Jersey",
    "Trophy",
    "Stadium",
    "Badge & Number",
    "Decorative Graphics",
    "Background",
    "Custom Upload"
  ];
  var BUILTIN_ASSETS = [
    {
      id: "ast_persib_logo",
      name: "Logo Resmi Persib Bandung",
      category: "Club Logo",
      fileType: "png",
      fileUrl: "/public/logos/brand/logo.png",
      thumbnail: "/public/logos/brand/logo.png",
      width: 240,
      height: 240,
      aspectRatio: "1:1",
      fileSize: 92646,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["persib", "logo", "official", "brand", "crest"]
    },
    {
      id: "ast_persib_shield",
      name: "Perisai Vektor Persib 1933",
      category: "Club Logo",
      fileType: "svg-component",
      componentId: "svg_persib_shield",
      fileUrl: "component:svg_persib_shield",
      thumbnail: "component:svg_persib_shield",
      width: 200,
      height: 240,
      aspectRatio: "1:1.2",
      fileSize: 1200,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["perisai", "shield", "crest", "vector", "persib"]
    },
    {
      id: "ast_trophy_ladder",
      name: "Piala Juara Emas (Trophy)",
      category: "Trophy",
      fileType: "svg-component",
      componentId: "svg_trophy_ladder",
      fileUrl: "component:svg_trophy_ladder",
      thumbnail: "component:svg_trophy_ladder",
      width: 300,
      height: 380,
      aspectRatio: "1:1.26",
      fileSize: 2400,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["trophy", "piala", "juara", "emas", "champions"]
    },
    {
      id: "ast_gold_crown",
      name: "Mahkota Raja Juara (Crown)",
      category: "Trophy",
      fileType: "svg-component",
      componentId: "svg_gold_crown",
      fileUrl: "component:svg_gold_crown",
      thumbnail: "component:svg_gold_crown",
      width: 280,
      height: 200,
      aspectRatio: "1.4:1",
      fileSize: 1500,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["crown", "mahkota", "gold", "king", "juara"]
    },
    {
      id: "ast_jersey_no10",
      name: "Jersey Pangeran Biru No. 10",
      category: "Jersey",
      fileType: "svg-component",
      componentId: "svg_jersey_no10",
      fileUrl: "component:svg_jersey_no10",
      thumbnail: "component:svg_jersey_no10",
      width: 320,
      height: 360,
      aspectRatio: "1:1.12",
      fileSize: 2800,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["jersey", "baju", "nomor10", "playmaker", "seragam"]
    },
    {
      id: "ast_scoreboard_stadium",
      name: "Papan Skor Stadion Si Jalak Harupat",
      category: "Stadium",
      fileType: "svg-component",
      componentId: "svg_scoreboard_stadium",
      fileUrl: "component:svg_scoreboard_stadium",
      thumbnail: "component:svg_scoreboard_stadium",
      width: 740,
      height: 320,
      aspectRatio: "2.3:1",
      fileSize: 3200,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["scoreboard", "skor", "papan", "stadion", "fulltime"]
    },
    {
      id: "ast_duel_radar",
      name: "Radar Taktik & Duel Antar Lini",
      category: "Radar",
      fileType: "svg-component",
      componentId: "svg_duel_radar",
      fileUrl: "component:svg_duel_radar",
      thumbnail: "component:svg_duel_radar",
      width: 400,
      height: 400,
      aspectRatio: "1:1",
      fileSize: 2100,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["radar", "taktik", "headtohead", "duel", "analisis"]
    },
    {
      id: "ast_motm_badge",
      name: "Lencana Bintang MOTM",
      category: "Badge & Number",
      fileType: "svg-component",
      componentId: "svg_motm_badge",
      fileUrl: "component:svg_motm_badge",
      thumbnail: "component:svg_motm_badge",
      width: 260,
      height: 260,
      aspectRatio: "1:1",
      fileSize: 1800,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["motm", "badge", "lencana", "star", "penghargaan"]
    },
    {
      id: "ast_wilujeng_stamp",
      name: "Stempel Wilujeng Sumping",
      category: "Badge & Number",
      fileType: "svg-component",
      componentId: "svg_wilujeng_stamp",
      fileUrl: "component:svg_wilujeng_stamp",
      thumbnail: "component:svg_wilujeng_stamp",
      width: 440,
      height: 160,
      aspectRatio: "2.75:1",
      fileSize: 1600,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["wilujeng", "sumping", "transfer", "stempel", "resmi"]
    },
    {
      id: "ast_vs_badge",
      name: "Lencana Duel Panas (VS)",
      category: "Badge & Number",
      fileType: "svg-component",
      componentId: "svg_vs_badge",
      fileUrl: "component:svg_vs_badge",
      thumbnail: "component:svg_vs_badge",
      width: 220,
      height: 220,
      aspectRatio: "1:1",
      fileSize: 1400,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["vs", "versus", "duel", "bigmatch", "api"]
    },
    {
      id: "ast_speedlines",
      name: "Garis Kecepatan Diagonal",
      category: "Decorative Graphics",
      fileType: "svg-component",
      componentId: "svg_decorative_speedlines",
      fileUrl: "component:svg_decorative_speedlines",
      thumbnail: "component:svg_decorative_speedlines",
      width: 400,
      height: 200,
      aspectRatio: "2:1",
      fileSize: 900,
      createdAt: "2026-11-08T00:00:00.000Z",
      tags: ["speedlines", "motion", "garis", "kecepatan", "overlay"]
    }
  ];
  var customAssetsRegistry = /* @__PURE__ */ new Map();
  function getAllAssets() {
    const customList = Array.from(customAssetsRegistry.values());
    return [...BUILTIN_ASSETS, ...customList];
  }
  function getAssetById(assetId) {
    if (!assetId) return null;
    return getAllAssets().find((a) => a.id === assetId) || null;
  }
  function filterAssets(category = "All", searchQuery = "") {
    let assets = getAllAssets();
    if (category && category !== "All") {
      assets = assets.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      assets = assets.filter(
        (a) => a.name.toLowerCase().includes(q) || a.tags && a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return assets;
  }
  function addUploadedAsset(assetData) {
    if (!assetData || !assetData.fileUrl) {
      throw new Error("Data asset tidak lengkap.");
    }
    const assetId = assetData.id || `ast_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const asset = {
      id: assetId,
      name: assetData.name || "Aset Kustom",
      category: assetData.category || "Custom Upload",
      fileType: assetData.fileType || "png",
      fileUrl: assetData.fileUrl,
      thumbnail: assetData.thumbnail || assetData.fileUrl,
      width: Number(assetData.width) || 300,
      height: Number(assetData.height) || 300,
      aspectRatio: assetData.aspectRatio || "1:1",
      fileSize: Number(assetData.fileSize) || 0,
      createdAt: assetData.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      tags: Array.isArray(assetData.tags) ? assetData.tags : ["upload", "custom"]
    };
    customAssetsRegistry.set(assetId, asset);
    return asset;
  }
  function checkAssetUsage(project, assetId) {
    if (!project || !project.scenes || !assetId) {
      return { inUse: false, count: 0, scenes: [] };
    }
    const matchingScenes = [];
    let usageCount = 0;
    project.scenes.forEach((scene) => {
      let usedInScene = false;
      (scene.elements || []).forEach((el) => {
        if (el.assetId === assetId || el.assetUrl === assetId || el.props?.componentId === assetId) {
          usageCount++;
          usedInScene = true;
        }
      });
      if (usedInScene) {
        matchingScenes.push(scene.title || scene.name || `Adegan ${scene.order}`);
      }
    });
    return {
      inUse: usageCount > 0,
      count: usageCount,
      scenes: matchingScenes
    };
  }
  function deleteAsset(project, assetId, force = false) {
    if (!customAssetsRegistry.has(assetId)) {
      if (BUILTIN_ASSETS.some((a) => a.id === assetId)) {
        return { success: false, reason: "Aset bawaan sistem tidak dapat dihapus." };
      }
      return { success: false, reason: "Aset tidak ditemukan." };
    }
    const usage = checkAssetUsage(project, assetId);
    if (usage.inUse && !force) {
      return {
        success: false,
        reason: `Aset masih digunakan pada ${usage.count} elemen di adegan: ${usage.scenes.join(", ")}`,
        usage
      };
    }
    customAssetsRegistry.delete(assetId);
    return { success: true };
  }
  function validateProjectAssets(project) {
    if (!project || !Array.isArray(project.scenes)) {
      return { valid: true, missing: [], warnings: [] };
    }
    const missing = [];
    const warnings = [];
    const checked = /* @__PURE__ */ new Set();
    project.scenes.forEach((scene) => {
      (scene.elements || []).forEach((el) => {
        if (el.assetId && !checked.has(el.assetId)) {
          checked.add(el.assetId);
          const asset = getAssetById(el.assetId);
          if (!asset) {
            missing.push(`Asset ID "${el.assetId}" (Elemen: "${el.name || el.type}", Adegan: "${scene.name || scene.title}")`);
          }
        }
      });
    });
    return {
      valid: missing.length === 0,
      missing,
      warnings
    };
  }

  // motion-engine.js
  function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, function(tag) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag;
    });
  }
  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return String(m).padStart(2, "0") + ":" + String(rem).padStart(2, "0");
  }
  function generateMotionGraphicHTML(input) {
    const project = input && input.version && input.canvas ? validateProject(input).project : migrateLegacyTemplateToProject(input);
    const canvasWidth = project.canvas?.width || 1080;
    const canvasHeight = project.canvas?.height || 1920;
    const fps = project.fps || 30;
    const tabId = project.metadata?.tabId || project.id || "post_match";
    const topic = project.videoTitle || project.name || "Persib Motion";
    const category = project.metadata?.category || "Hasil Pertandingan";
    const preset = project.metadata?.preset || "preset_b";
    const colors = project.theme?.colors || {
      primary: "#003da5",
      secondary: "#0a0a0a",
      text: "#ffffff",
      accent: "#f0a500"
    };
    const duration = project.totalDuration || 30;
    const scenes = project.scenes || [];
    let totalCalculatedDuration = 0;
    const computedScenes = scenes.map((s, idx) => {
      const sDuration = Number(s.duration) || Math.max(3, Math.round(duration / (scenes.length || 1)));
      const start = totalCalculatedDuration;
      const end = start + sDuration;
      totalCalculatedDuration = end;
      return {
        ...s,
        idx: idx + 1,
        start,
        end,
        duration: sDuration
      };
    });
    const finalDuration = totalCalculatedDuration > 0 ? totalCalculatedDuration : duration;
    const googleFontsUrl = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;900&family=Poppins:wght@700;800;900&display=swap";
    const fontTitle = "'Bebas Neue', 'Poppins', sans-serif";
    const fontBody = "'Inter', sans-serif";
    const serializedScenes = JSON.stringify(computedScenes);
    const serializedColors = JSON.stringify(colors);
    const activeTabId2 = String(tabId);
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(topic)} - Persib Motion Media 9:16</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">
  <script>${GSAP_INLINE}<\/script>
  <style>
    :root {
      --color-primary: ${colors.primary || "#003da5"};
      --color-secondary: ${colors.secondary || "#0a0a0a"};
      --color-text: ${colors.text || "#ffffff"};
      --color-accent: ${colors.accent || "#f0a500"};
      --color-gold: #f0a500;
      --color-blue: #003da5;
      --color-blue-light: #0070c0;
      --font-title: ${fontTitle};
      --font-body: ${fontBody};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    body {
      background-color: #05070b;
      color: #e5e7eb;
      font-family: var(--font-body);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      user-select: none;
    }

    #viewport-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #121824 0%, #05070b 100%);
      overflow: hidden;
    }

    /* ${canvasWidth}x${canvasHeight} Virtual Stage */
    #stage-wrapper {
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${canvasWidth}px;
      height: ${canvasHeight}px;
      transform-origin: center center;
      transform: translate(-50%, -50%) scale(0.2);
      box-shadow: 0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(240, 165, 0, 0.25);
      border-radius: 12px;
      overflow: hidden;
      background-color: var(--color-secondary);
    }

    #stage {
      position: absolute;
      top: 0;
      left: 0;
      width: ${canvasWidth}px;
      height: ${canvasHeight}px;
      overflow: hidden;
      background: ${getBackgroundCSS(activeTabId2, colors)};
    }

    /* Subtle Animated Floodlight Glow */
    .stadium-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background: radial-gradient(circle at 50% 15%, rgba(0, 61, 165, 0.35) 0%, transparent 60%);
      mix-blend-mode: screen;
    }

    /* Diagonal Speedlines Overlay (Matching User's Logo Angle) */
    .speedline-overlay {
      position: absolute;
      inset: -50%;
      width: 200%;
      height: 200%;
      pointer-events: none;
      background: repeating-linear-gradient(
        -25deg,
        transparent,
        transparent 60px,
        rgba(255, 255, 255, 0.012) 60px,
        rgba(255, 255, 255, 0.012) 62px
      );
    }

    /* Top Progress Bar */
    .progress-bar-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 10px;
      background: rgba(0, 0, 0, 0.4);
      z-index: 100;
    }

    .progress-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, var(--color-blue-light), var(--color-gold));
      box-shadow: 0 0 12px var(--color-gold);
      transform-origin: left center;
    }

    /* Safe Zones Header */
    .stage-header {
      position: absolute;
      top: 80px;
      left: 80px;
      right: 80px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 30;
      border-bottom: 2px solid rgba(240, 165, 0, 0.25);
      padding-bottom: 20px;
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      font-size: 26px;
      font-weight: 800;
      padding: 8px 24px;
      background: linear-gradient(135deg, var(--color-primary), #002266);
      color: #ffffff;
      border-radius: 8px;
      border: 1px solid var(--color-gold);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      box-shadow: 0 4px 15px rgba(0, 61, 165, 0.5);
    }

    .brand-tag {
      font-family: var(--font-title);
      font-size: 38px;
      color: var(--color-gold);
      letter-spacing: 3px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Breaking Ticker Ribbon (Only active in transfer_news) */
    .breaking-ticker {
      display: ${activeTabId2 === "transfer_news" ? "flex" : "none"};
      position: absolute;
      top: 170px;
      left: 0;
      width: 100%;
      background: linear-gradient(90deg, #b91c1c, #dc2626, #b91c1c);
      color: #ffffff;
      padding: 10px 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      overflow: hidden;
      white-space: nowrap;
      z-index: 35;
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);
      border-top: 1px solid rgba(255, 255, 255, 0.3);
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    }

    .breaking-ticker-inner {
      display: inline-block;
      animation: tickerRoll 18s linear infinite;
    }

    @keyframes tickerRoll {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }

    /* Kinetic Typography Area */
    .typography-box {
      position: absolute;
      top: ${activeTabId2 === "transfer_news" ? "250px" : "210px"};
      left: 80px;
      right: 80px;
      z-index: 25;
      min-height: 250px;
    }

    .scene-title-badge {
      font-family: var(--font-body);
      font-size: 26px;
      font-weight: 800;
      color: var(--color-gold);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .scene-title-badge .number-chip {
      background: var(--color-gold);
      color: #0a0a0a;
      padding: 4px 16px;
      border-radius: 6px;
      font-family: var(--font-title);
      font-size: 30px;
      font-weight: 900;
      line-height: 1;
    }

    .kinetic-headline {
      font-family: var(--font-title);
      font-size: 96px;
      line-height: 1.04;
      font-weight: 900;
      color: var(--color-text);
      letter-spacing: 0.02em;
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
    }

    .word-wrapper {
      display: inline-block;
      overflow: hidden;
      vertical-align: bottom;
      padding-bottom: 6px;
    }

    .word-inner {
      display: inline-block;
      transform: translateY(115%);
    }

    .word-inner.accented {
      color: var(--color-gold);
      position: relative;
      text-shadow: 0 0 25px rgba(240, 165, 0, 0.6);
    }

    /* Center Stage Visual Area (Unique per Tab) */
    .visual-stage {
      position: absolute;
      top: 560px;
      left: 60px;
      right: 60px;
      height: 840px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
    }

    .theme-stage-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .custom-scene-elements-stage {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 25;
    }

    .scene-custom-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .custom-scene-elem {
      pointer-events: auto;
    }

    /* Milestone Data Pill Card */
    .data-pill-card {
      position: absolute;
      bottom: 420px;
      left: 50%;
      transform: translateX(-50%) translateY(40px);
      opacity: 0;
      background: rgba(14, 20, 32, 0.94);
      border: 3px solid var(--color-gold);
      border-radius: 24px;
      padding: 22px 52px;
      display: flex;
      align-items: center;
      gap: 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(240, 165, 0, 0.25);
      z-index: 28;
      backdrop-filter: blur(12px);
    }

    .data-value {
      font-family: var(--font-title);
      font-size: 92px;
      font-weight: 900;
      color: var(--color-gold);
      line-height: 1;
      text-shadow: 0 0 20px rgba(240, 165, 0, 0.5);
    }

    .data-label {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
      max-width: 420px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Subtitle / Karaoke Banner */
    .stage-subtitle-box {
      position: absolute;
      bottom: 230px;
      left: 80px;
      right: 80px;
      min-height: 140px;
      background: rgba(10, 14, 24, 0.88);
      border: 2px solid rgba(240, 165, 0, 0.2);
      border-radius: 20px;
      padding: 24px 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 35;
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }

    .subtitle-text {
      font-size: 36px;
      font-weight: 600;
      line-height: 1.35;
      color: #f1f5f9;
      width: 100%;
    }

    .subtitle-text .kw-highlight {
      color: var(--color-gold);
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 6px;
    }

    /* Word-Level Karaoke Caption Styles (Phase 4B) */
    .caption-word {
      display: inline-block;
      transition: color 0.08s ease, transform 0.08s ease, text-shadow 0.08s ease;
      margin: 0 4px;
      color: var(--caption-normal-color, #f1f5f9);
    }

    .caption-word.caption-word-active {
      color: var(--caption-active-color, #f0a500) !important;
      font-weight: 800 !important;
      transform: scale(1.08);
      text-shadow: var(--caption-active-glow, 0 0 16px rgba(240, 165, 0, 0.75)) !important;
    }

    .caption-word.caption-word-spoken {
      color: var(--caption-spoken-color, rgba(241, 245, 249, 0.7));
    }

    /* Footer Safe Zone */
    .stage-footer {
      position: absolute;
      bottom: 85px;
      left: 80px;
      right: 80px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 30px;
      font-weight: 600;
      color: #9ca3af;
      z-index: 30;
      border-top: 2px solid rgba(240, 165, 0, 0.2);
      padding-top: 18px;
    }

    .footer-brand {
      color: var(--color-gold);
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    /* Standalone Player Controls */
    #player-controls {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid rgba(240, 165, 0, 0.3);
      border-radius: 12px;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 999;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.7);
    }

    .btn-ctrl {
      background: #1e293b;
      color: #f9fafb;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }

    .btn-ctrl:hover {
      background: #334155;
    }

    .btn-ctrl.btn-record {
      background: #dc2626;
      border-color: #b91c1c;
      color: #ffffff;
    }

    .time-scrubber {
      width: 240px;
      accent-color: var(--color-gold);
      cursor: pointer;
    }

    .time-display {
      font-family: monospace;
      font-size: 14px;
      color: #9ca3af;
      min-width: 90px;
      text-align: center;
    }

    #record-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: #ffffff;
    }

    #record-count {
      font-size: 140px;
      font-weight: 900;
      color: var(--color-gold);
      animation: pulse 1s infinite alternate;
    }

    @keyframes pulse {
      from { transform: scale(0.9); opacity: 0.8; }
      to { transform: scale(1.1); opacity: 1; }
    }
  </style>
</head>
<body>

  <div id="viewport-container">
    <div id="stage-wrapper">
      <div id="stage">
        <!-- Stadium Floodlight & Speedlines -->
        <div class="stadium-glow"></div>
        <div class="speedline-overlay"></div>

        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <div class="progress-bar-fill" id="progressFill"></div>
        </div>

        <!-- Safe Header -->
        <header class="stage-header">
          <div class="cat-pill">
            <span id="headerCategory">${escapeHTML(category || "PERSIB MEDIA")}</span>
          </div>
          <div class="brand-tag">
            <span>PERSIB MEDIA</span>
          </div>
        </header>

        <!-- Breaking Ticker (for transfer_news) -->
        <div class="breaking-ticker">
          <div class="breaking-ticker-inner">
            \u{1F525} BREAKING NEWS \u2022 WILUJENG SUMPING \u2022 RESMI AMUNISI BARU TIBA \u2022 OFFICIAL MEDIA PERSIB BANDUNG \u2022 KAWAL KEBANGGAAN \u2022 &nbsp;&nbsp;&nbsp;&nbsp; \u{1F525} BREAKING NEWS \u2022 WILUJENG SUMPING \u2022 RESMI AMUNISI BARU TIBA \u2022 OFFICIAL MEDIA PERSIB BANDUNG \u2022 KAWAL KEBANGGAAN \u2022
          </div>
        </div>

        <!-- Dynamic Scene Typography -->
        <section class="typography-box" id="typographyBox">
          <div class="scene-title-badge">
            <span class="number-chip" id="sceneBadgeNum">01</span>
            <span id="sceneBadgeTitle">PEMBUKA</span>
          </div>
          <h1 class="kinetic-headline" id="headlineContainer">
            <!-- Words injected dynamically by GSAP engine -->
          </h1>
        </section>

        <!-- Center Stage: Custom Vector Graphics per Theme -->
        <main class="visual-stage" id="visualStage">
          <div class="theme-stage-container">
            ${renderThemeVisualStage(activeTabId2, colors, preset)}
          </div>
          <!-- Dynamic Scene Custom Elements Layer -->
          <div class="custom-scene-elements-stage" id="customSceneElementsStage">
            ${renderProjectCustomElementsHTML(computedScenes, colors)}
          </div>
        </main>

        <!-- Data Value Milestone Card -->
        <div class="data-pill-card" id="dataPillCard" style="opacity: 0;">
          <div class="data-value" id="dataValText"></div>
          <div class="data-label" id="dataLblText"></div>
        </div>

        <!-- Subtitle Box -->
        <div class="stage-subtitle-box" id="subtitleBox">
          <p class="subtitle-text" id="subtitleText">
            ${escapeHTML(computedScenes[0]?.narration || "")}
          </p>
        </div>

        <!-- Safe Footer -->
        <footer class="stage-footer">
          <div class="footer-brand">#BanggaJadiBobotoh</div>
          <div id="footerSource">${escapeHTML(computedScenes[computedScenes.length - 1]?.dataLabel || "@persibmotion")}</div>
        </footer>
      </div>
    </div>

    <!-- Standalone Player Controls Outside Stage -->
    <div id="player-controls">
      <button class="btn-ctrl" id="btnPlayPause" aria-label="Putar atau jeda animasi">
        <span id="iconPlay">\u25B6 Putar</span>
      </button>
      <button class="btn-ctrl" id="btnRestart" aria-label="Mulai dari awal">
        \u21BA Ulang
      </button>
      <input type="range" class="time-scrubber" id="timeScrubber" min="0" max="${finalDuration}" step="0.01" value="0" aria-label="Slider waktu animasi">
      <span class="time-display" id="timeDisplay">00:00 / ${formatTime(finalDuration)}</span>
      <select class="btn-ctrl" id="selSpeed" aria-label="Kecepatan putar">
        <option value="0.5">0.5x</option>
        <option value="1.0" selected>1.0x</option>
        <option value="1.5">1.5x</option>
      </select>
      <button class="btn-ctrl btn-record" id="btnRecordMode" aria-label="Mode Rekam Layar">
        \u25CF Mode Rekam
      </button>
    </div>

    <!-- Record Mode Countdown Overlay -->
    <div id="record-overlay">
      <div id="record-count">3</div>
      <div style="font-size: 26px; margin-top: 16px; color: #d1d5db;">Mempersiapkan Rekaman Layar ${canvasWidth}x${canvasHeight}...</div>
    </div>
    ${project.audio?.enabled && project.audio?.bgmUrl ? `<audio id="bgmAudio" src="${escapeHTML(project.audio.bgmUrl)}" preload="auto" style="display:none;"></audio>` : ""}
    ${(project.scenes || []).map((s, sIdx) => {
      if (s.voiceover?.enabled && s.voiceover?.audioUrl) {
        return `<audio id="vo_audio_${sIdx}" class="vo-audio-elem" data-scene-idx="${sIdx}" data-start-time="${s.startTime || 0}" data-duration="${s.duration || 0}" src="${escapeHTML(s.voiceover.audioUrl)}" preload="auto" style="display:none;"></audio>`;
      }
      return "";
    }).filter(Boolean).join("\n    ")}
  </div>

  <script>
    // Unified Project JSON (Single source of truth)
    window.PROJECT = ${JSON.stringify(project)};

    // Master Config & Timing CUES
    const CUES = {
      tabId: "${activeTabId2}",
      duration: ${finalDuration},
      scenes: ${serializedScenes},
      colors: ${serializedColors},
      audio: ${JSON.stringify(project.audio || { enabled: false, bgmUrl: "", volume: 0.8, muted: false, startPosition: 0 })}
    };

    window.DURATION = CUES.duration;
    let masterTimeline = null;
    let isPlaying = false;
    let currentSpeed = 1.0;

    // Elements
    const stageWrapper = document.getElementById("stage-wrapper");
    const progressFill = document.getElementById("progressFill");
    const btnPlayPause = document.getElementById("btnPlayPause");
    const iconPlay = document.getElementById("iconPlay");
    const btnRestart = document.getElementById("btnRestart");
    const timeScrubber = document.getElementById("timeScrubber");
    const timeDisplay = document.getElementById("timeDisplay");
    const selSpeed = document.getElementById("selSpeed");
    const btnRecordMode = document.getElementById("btnRecordMode");
    const recordOverlay = document.getElementById("record-overlay");
    const recordCount = document.getElementById("record-count");

    // Dynamic Stage Elements
    const sceneBadgeNum = document.getElementById("sceneBadgeNum");
    const sceneBadgeTitle = document.getElementById("sceneBadgeTitle");
    const headlineContainer = document.getElementById("headlineContainer");
    const subtitleText = document.getElementById("subtitleText");
    const dataPillCard = document.getElementById("dataPillCard");
    const dataValText = document.getElementById("dataValText");
    const dataLblText = document.getElementById("dataLblText");

    // Auto-scale stage to fit screen
    function resizeStage() {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const stageW = ${canvasWidth};
      const stageH = ${canvasHeight};

      const isStandalone = (window.self === window.top);
      const paddingBottom = isStandalone ? 75 : 0;
      const paddingSide = isStandalone ? 20 : 0;

      const scale = Math.min(
        (containerWidth - paddingSide) / stageW,
        (containerHeight - paddingBottom) / stageH
      );

      const finalScale = Math.max(0.05, Math.min(2.0, scale));
      stageWrapper.style.transform = "translate(-50%, -50%) scale(" + finalScale + ")";
    }

    if (window.self !== window.top) {
      const internalControls = document.getElementById("player-controls");
      if (internalControls) internalControls.style.display = "none";
    }

    window.addEventListener("resize", resizeStage);
    resizeStage();

    // Word splitter for kinetic typography
    function setHeadlineText(text, highlightWord) {
      headlineContainer.innerHTML = "";
      if (!text) return;

      const words = text.split(" ");
      words.forEach(function(word) {
        const spanWrapper = document.createElement("span");
        spanWrapper.className = "word-wrapper";

        const spanInner = document.createElement("span");
        spanInner.className = "word-inner";
        spanInner.textContent = word;

        if (highlightWord && word.toUpperCase().includes(highlightWord.toUpperCase())) {
          spanInner.classList.add("accented");
        }

        spanWrapper.appendChild(spanInner);
        headlineContainer.appendChild(spanWrapper);
      });
    }

    // Build Master GSAP Timeline with Theme Choreography
    function buildTimeline() {
      if (masterTimeline) masterTimeline.kill();

      masterTimeline = gsap.timeline({
        paused: true,
        onUpdate: function() {
          const t = masterTimeline.time();
          timeScrubber.value = t;
          timeDisplay.textContent = formatTime(t) + " / " + formatTime(CUES.duration);
          progressFill.style.width = (t / CUES.duration * 100) + "%";

          if (typeof syncVoiceovers === "function") {
            syncVoiceovers(t, isPlaying);
          }

          if (typeof syncCaptions === "function") {
            syncCaptions(t);
          }

          if (window.parent && window.parent !== window) {
            try {
              window.parent.postMessage({
                type: "MG_TIMELINE_UPDATE",
                currentTime: t,
                duration: CUES.duration,
                isPlaying: isPlaying
              }, "*");
            } catch (err) {}
          }
        },
        onComplete: function() {
          isPlaying = false;
          if (bgmAudio) bgmAudio.pause();
          if (typeof syncVoiceovers === "function") {
            syncVoiceovers(CUES.duration, false);
          }
          iconPlay.textContent = "\u25B6 Putar";
          if (window.parent && window.parent !== window) {
            try {
              window.parent.postMessage({
                type: "MG_TIMELINE_UPDATE",
                currentTime: CUES.duration,
                duration: CUES.duration,
                isPlaying: false
              }, "*");
            } catch (err) {}
          }
        }
      });

      // Global subtle ambient movement for main center group
      const mainGroup = document.getElementById("themeMainGroup");
      if (mainGroup) {
        gsap.to(mainGroup, {
          y: -10,
          duration: 2.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      }

      // Populate scenes & orchestrate theme-specific elements
      CUES.scenes.forEach(function(sc, index) {
        const sceneTL = gsap.timeline();

        sceneTL.add(function() {
          sceneBadgeNum.textContent = String(sc.idx).padStart(2, "0");
          sceneBadgeTitle.textContent = sc.title || ("ADEGAN " + sc.idx);
          setHeadlineText(sc.screenText, sc.highlightWord);
          renderSceneCaptions(sc);

          if (sc.dataValue && sc.dataValue.trim() !== "") {
            dataValText.textContent = sc.dataValue;
            dataLblText.textContent = sc.dataLabel || "Data Terverifikasi";
            gsap.to(dataPillCard, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" });
          } else {
            gsap.to(dataPillCard, { opacity: 0, y: 40, duration: 0.3 });
          }
        }, 0);

        // Kinetic text reveal
        sceneTL.fromTo(
          ".word-inner",
          { y: "115%", opacity: 0, rotateZ: 3 },
          { y: "0%", opacity: 1, rotateZ: 0, duration: 0.45, stagger: 0.07, ease: "back.out(1.4)" },
          0.05
        );

        // Choreograph theme-specific graphics per scene
        choreographThemeScene(CUES.tabId, sceneTL, sc.idx, sc.duration);

        // Choreograph custom elements for this scene
        const customLayer = document.getElementById("scene_custom_" + sc.id);
        sceneTL.add(function() {
          document.querySelectorAll(".scene-custom-layer").forEach(function(l) {
            l.style.display = "none";
          });
          if (customLayer) customLayer.style.display = "block";
        }, 0);

        (sc.elements || []).forEach(function(el) {
          const elDom = document.getElementById("el_" + el.id);
          if (!elDom) return;
          const anim = el.animation || { type: "none" };
          const animDur = anim.duration || 0.5;
          const animDelay = anim.delay || 0;
          if (anim.type === "fade") {
            sceneTL.fromTo(elDom, { opacity: 0 }, { opacity: el.opacity !== undefined ? el.opacity : 1, duration: animDur, ease: anim.easing || "power2.out" }, animDelay);
          } else if (anim.type === "slide") {
            sceneTL.fromTo(elDom, { y: 60, opacity: 0 }, { y: 0, opacity: el.opacity !== undefined ? el.opacity : 1, duration: animDur, ease: anim.easing || "power2.out" }, animDelay);
          } else if (anim.type === "scale") {
            sceneTL.fromTo(elDom, { scale: 0.5, opacity: 0 }, { scale: el.scale || 1, opacity: el.opacity !== undefined ? el.opacity : 1, duration: animDur, ease: anim.easing || "back.out(1.5)" }, animDelay);
          } else if (anim.type === "rotate") {
            sceneTL.fromTo(elDom, { rotation: -30, opacity: 0 }, { rotation: el.rotation || 0, opacity: el.opacity !== undefined ? el.opacity : 1, duration: animDur, ease: anim.easing || "power2.out" }, animDelay);
          }
        });

        masterTimeline.add(sceneTL, sc.start);
      });

      masterTimeline.duration(CUES.duration);
    }

    // Choreograph theme visual actions
    function choreographThemeScene(tabId, tl, sceneIdx, sceneDur) {
      if (tabId === "post_match") {
        const scoreboard = document.getElementById("pmScoreboard");
        const statsBox = document.getElementById("pmStatsBox");
        const motmCard = document.getElementById("pmMotmCard");
        const trophyLadder = document.getElementById("pmTrophyLadder");

        if (sceneIdx === 1) {
          if (scoreboard) tl.fromTo(scoreboard, { scale: 0.7, opacity: 0, y: 100 }, { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.6)" }, 0);
        } else if (sceneIdx === 2) {
          const scoreText = document.getElementById("pmScoreText");
          if (scoreText) tl.fromTo(scoreText, { scale: 1.4, filter: "drop-shadow(0 0 40px #f0a500)" }, { scale: 1, filter: "none", duration: 0.5, ease: "elastic.out(1, 0.4)" }, 0.1);
        } else if (sceneIdx === 3) {
          if (scoreboard) tl.to(scoreboard, { scale: 0.85, y: -40, duration: 0.4 }, 0);
          if (statsBox) {
            tl.fromTo(statsBox, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.1);
            tl.fromTo(".pm-stat-bar-fill", { width: "0%" }, { width: "58%", duration: 0.8, ease: "power3.out" }, 0.3);
          }
        } else if (sceneIdx === 4) {
          if (statsBox) tl.to(statsBox, { opacity: 0, duration: 0.2 }, 0);
          if (motmCard) {
            tl.fromTo(motmCard, { scale: 0.5, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: "back.out(1.8)" }, 0.1);
            tl.fromTo(".motm-star", { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, stagger: 0.08, duration: 0.4, ease: "back.out(2)" }, 0.3);
          }
        } else if (sceneIdx >= 5) {
          if (motmCard) tl.to(motmCard, { opacity: 0, scale: 0.8, duration: 0.3 }, 0);
          if (trophyLadder) {
            tl.fromTo(trophyLadder, { opacity: 0, y: 100, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "bounce.out" }, 0.1);
          }
        }
      } else if (tabId === "weekly_recap") {
        const streakRow = document.getElementById("wrStreakRow");
        const chartMatrix = document.getElementById("wrChartMatrix");
        const miniTable = document.getElementById("wrMiniTable");

        if (sceneIdx === 1) {
          if (streakRow) tl.fromTo(streakRow, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)" }, 0);
          tl.fromTo(".wr-streak-badge", { scale: 0, y: 40 }, { scale: 1, y: 0, stagger: 0.09, duration: 0.4, ease: "back.out(2)" }, 0.2);
        } else if (sceneIdx === 2) {
          tl.to(".wr-streak-badge", { scale: 1.15, filter: "drop-shadow(0 0 15px #f0a500)", stagger: 0.05, duration: 0.3, yoyo: true, repeat: 1 }, 0);
        } else if (sceneIdx === 3) {
          if (chartMatrix) {
            tl.fromTo(chartMatrix, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.5 }, 0);
            tl.fromTo(".wr-bar-col", { scaleY: 0 }, { scaleY: 1, stagger: 0.08, duration: 0.7, ease: "power3.out", transformOrigin: "bottom center" }, 0.2);
          }
        } else if (sceneIdx >= 4) {
          if (miniTable) {
            tl.fromTo(miniTable, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, 0.1);
            tl.fromTo(".wr-table-row", { x: -60, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.4 }, 0.2);
          }
        }
      } else if (tabId === "trivia_facts") {
        const monumentNum = document.getElementById("tfMonumentNum");
        const rings = document.getElementById("tfShockRings");
        const laurelGroup = document.getElementById("tfLaurelGroup");

        if (sceneIdx === 1) {
          if (monumentNum) tl.fromTo(monumentNum, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 0);
        } else if (sceneIdx === 2) {
          if (rings) tl.fromTo(".tf-ring", { scale: 0.8, opacity: 0.8 }, { scale: 1.4, opacity: 0, stagger: 0.2, duration: 1.2, ease: "power1.out", repeat: 1 }, 0);
          tl.to(monumentNum, { scale: 1.1, duration: 0.4, yoyo: true, repeat: 1 }, 0.1);
        } else if (sceneIdx === 3) {
          if (laurelGroup) tl.fromTo(laurelGroup, { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.7, ease: "back.out(1.8)" }, 0.1);
        } else if (sceneIdx >= 4) {
          const goldCrown = document.getElementById("tfGoldCrown");
          if (goldCrown) tl.fromTo(goldCrown, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "bounce.out" }, 0.1);
        }
      } else if (tabId === "before_match") {
        const clashVs = document.getElementById("bmClashVs");
        const duelRadar = document.getElementById("bmDuelRadar");
        const kickoffClock = document.getElementById("bmKickoffClock");

        if (sceneIdx === 1) {
          tl.fromTo("#bmTeamHome", { x: -160, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0);
          tl.fromTo("#bmTeamAway", { x: 160, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0);
          tl.fromTo("#bmVsBadge", { scale: 2.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" }, 0.3);
        } else if (sceneIdx === 2) {
          tl.to("#stage", { x: 6, duration: 0.05, yoyo: true, repeat: 4 }, 0);
          tl.to("#bmVsBadge", { filter: "drop-shadow(0 0 35px #f0a500)", scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 }, 0.1);
        } else if (sceneIdx === 3) {
          if (duelRadar) {
            tl.fromTo(duelRadar, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, 0.1);
            tl.fromTo("#bmRadarSweep", { rotate: 0 }, { rotate: 360, duration: 1.5, ease: "linear", repeat: 1 }, 0.2);
          }
        } else if (sceneIdx >= 4) {
          if (kickoffClock) {
            tl.fromTo(kickoffClock, { scale: 0.7, opacity: 0, y: 80 }, { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.6)" }, 0.1);
            tl.fromTo(".bm-clock-glow", { opacity: 0.3 }, { opacity: 1, yoyo: true, repeat: 3, duration: 0.3 }, 0.3);
          }
        }
      } else if (tabId === "transfer_news") {
        const wilujengStamp = document.getElementById("tnWilujengStamp");
        const jerseyCard = document.getElementById("tnJerseyCard");
        const contractBadge = document.getElementById("tnContractBadge");

        if (sceneIdx === 1) {
          if (wilujengStamp) {
            tl.fromTo(wilujengStamp, { scale: 2.8, opacity: 0, rotate: -25 }, { scale: 1, opacity: 1, rotate: -8, duration: 0.35, ease: "power4.in" }, 0.1);
            tl.to("#stage", { y: 12, duration: 0.06, yoyo: true, repeat: 4 }, 0.45);
          }
        } else if (sceneIdx === 2) {
          if (jerseyCard) {
            tl.fromTo(jerseyCard, { scale: 0.5, rotateY: 90, opacity: 0 }, { scale: 1, rotateY: 0, opacity: 1, duration: 0.7, ease: "back.out(1.5)" }, 0.1);
          }
        } else if (sceneIdx === 3) {
          tl.to("#tnJerseyNumber", { scale: 1.25, color: "#f0a500", duration: 0.4, yoyo: true, repeat: 1 }, 0.1);
        } else if (sceneIdx >= 4) {
          if (contractBadge) {
            tl.fromTo(contractBadge, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" }, 0.1);
          }
        }
      }
    }

    function highlightSubtitle(narration, highlightWord) {
      if (!narration) return "";
      let safe = escapeHTML(narration);
      if (highlightWord && highlightWord.trim()) {
        const reg = new RegExp("(" + escapeRegex(highlightWord.trim()) + ")", "gi");
        safe = safe.replace(reg, '<span class="kw-highlight">$1</span>');
      }
      return safe;
    }

    const subtitleBox = document.getElementById("subtitleBox");

    function renderSceneCaptions(sc) {
      if (!subtitleText) return;
      const captions = sc.captions;

      if (captions && captions.enabled && Array.isArray(captions.segments) && captions.segments.length > 0) {
        if (subtitleBox) {
          subtitleBox.style.display = "flex";
          if (captions.style?.backgroundColor) subtitleBox.style.backgroundColor = captions.style.backgroundColor;
        }

        subtitleText.innerHTML = "";
        subtitleText.style.fontSize = (captions.style?.fontSize || 34) + "px";
        subtitleText.style.textAlign = captions.style?.textAlign || "center";
        subtitleText.style.color = captions.style?.textColor || "#ffffff";

        subtitleText.dataset.hasCaptions = "true";
        subtitleText.dataset.sceneStart = String(sc.start || 0);

        captions.segments.forEach(function(seg, segIdx) {
          const segSpan = document.createElement("span");
          segSpan.className = "caption-segment";
          segSpan.id = "caption_seg_" + sc.idx + "_" + segIdx;
          segSpan.dataset.start = String(seg.start);
          segSpan.dataset.end = String(seg.end);
          segSpan.style.display = segIdx === 0 ? "inline" : "none";

          (seg.words || []).forEach(function(w) {
            const wordSpan = document.createElement("span");
            wordSpan.className = "caption-word";
            wordSpan.dataset.start = String(w.start);
            wordSpan.dataset.end = String(w.end);
            wordSpan.dataset.word = w.word;
            wordSpan.textContent = w.word + " ";
            segSpan.appendChild(wordSpan);
          });

          subtitleText.appendChild(segSpan);
        });
      } else if (sc.narration && sc.narration.trim()) {
        if (subtitleBox) {
          subtitleBox.style.display = "flex";
          subtitleBox.style.backgroundColor = "rgba(10, 14, 24, 0.88)";
        }
        subtitleText.dataset.hasCaptions = "false";
        subtitleText.innerHTML = highlightSubtitle(sc.narration, sc.highlightWord);
      } else {
        if (subtitleBox) subtitleBox.style.display = "none";
        subtitleText.dataset.hasCaptions = "false";
        subtitleText.innerHTML = "";
      }
    }

    function syncCaptions(currentTime) {
      if (!subtitleText || subtitleText.dataset.hasCaptions !== "true") return;

      const scStart = parseFloat(subtitleText.dataset.sceneStart || 0);
      const relTime = Math.max(0, currentTime - scStart);

      const segments = subtitleText.querySelectorAll(".caption-segment");
      segments.forEach(function(seg) {
        const segStart = parseFloat(seg.dataset.start || 0);
        const segEnd = parseFloat(seg.dataset.end || 0);

        if (relTime >= segStart - 0.25 && relTime <= segEnd + 0.35) {
          seg.style.display = "inline";
        } else if (segments.length > 1) {
          seg.style.display = "none";
        }

        const words = seg.querySelectorAll(".caption-word");
        words.forEach(function(w) {
          const wStart = parseFloat(w.dataset.start || 0);
          const wEnd = parseFloat(w.dataset.end || 0);

          if (relTime >= wStart && relTime <= wEnd) {
            w.classList.add("caption-word-active");
            w.classList.remove("caption-word-spoken");
          } else if (relTime > wEnd) {
            w.classList.remove("caption-word-active");
            w.classList.add("caption-word-spoken");
          } else {
            w.classList.remove("caption-word-active");
            w.classList.remove("caption-word-spoken");
          }
        });
      });
    }

    function escapeHTML(str) {
      if (!str) return "";
      return String(str).replace(/[&<>'"]/g, function(tag) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag);
      });
    }

    function escapeRegex(str) {
      return str.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&');
    }

    function formatTime(sec) {
      const s = Math.max(0, Math.floor(sec));
      const m = Math.floor(s / 60);
      const rem = s % 60;
      return String(m).padStart(2, "0") + ":" + String(rem).padStart(2, "0");
    }

    // Playback APIs
    const bgmAudio = document.getElementById("bgmAudio");
    const voElements = Array.from(document.querySelectorAll(".vo-audio-elem"));

    if (bgmAudio) {
      bgmAudio.volume = CUES.audio.muted ? 0 : (CUES.audio.volume !== undefined ? CUES.audio.volume : 0.8);
      bgmAudio.muted = Boolean(CUES.audio.muted);
    }

    function syncVoiceovers(currentTime, shouldPlay) {
      voElements.forEach(function(vo) {
        const start = parseFloat(vo.getAttribute("data-start-time") || 0);
        const dur = parseFloat(vo.getAttribute("data-duration") || 0);
        const end = start + dur;

        if (currentTime >= start && currentTime < end) {
          const offset = Math.max(0, currentTime - start);
          if (Math.abs(vo.currentTime - offset) > 0.3) {
            try { vo.currentTime = offset; } catch (err) {}
          }
          vo.playbackRate = currentSpeed;
          if (shouldPlay) {
            vo.play().catch(function() {});
          } else {
            vo.pause();
          }
        } else {
          vo.pause();
          try { vo.currentTime = 0; } catch (err) {}
        }
      });
    }

    window.play = function() {
      if (!masterTimeline) return;
      masterTimeline.play();
      if (bgmAudio) bgmAudio.play().catch(function() {});
      isPlaying = true;
      syncVoiceovers(masterTimeline.time(), true);
      iconPlay.textContent = "\u275A\u275A Jeda";
    };

    window.pause = function() {
      if (!masterTimeline) return;
      masterTimeline.pause();
      if (bgmAudio) bgmAudio.pause();
      isPlaying = false;
      syncVoiceovers(masterTimeline.time(), false);
      iconPlay.textContent = "\u25B6 Putar";
    };

    window.restart = function() {
      if (!masterTimeline) return;
      masterTimeline.restart();
      if (bgmAudio) {
        bgmAudio.currentTime = CUES.audio.startPosition || 0;
        bgmAudio.play().catch(function() {});
      }
      isPlaying = true;
      syncVoiceovers(0, true);
      syncCaptions(0);
      iconPlay.textContent = "\u275A\u275A Jeda";
    };

    window.seek = function(seconds) {
      if (!masterTimeline) return;
      masterTimeline.seek(seconds);
      if (bgmAudio) {
        bgmAudio.currentTime = (CUES.audio.startPosition || 0) + seconds;
      }
      syncVoiceovers(seconds, isPlaying);
      syncCaptions(seconds);
    };

    // Cross-window postMessage listener from parent studio
    window.addEventListener("message", function(e) {
      if (!e.data) return;
      if (e.data.type === "MG_TOGGLE_PLAY") {
        if (isPlaying) window.pause(); else window.play();
      } else if (e.data.type === "MG_RESTART") {
        window.restart();
      } else if (e.data.type === "MG_PAUSE") {
        window.pause();
      } else if (e.data.type === "MG_SEEK") {
        window.seek(e.data.time);
      } else if (e.data.type === "MG_SET_SPEED") {
        currentSpeed = e.data.speed;
        if (masterTimeline) masterTimeline.timeScale(currentSpeed);
        if (bgmAudio) bgmAudio.playbackRate = currentSpeed;
        voElements.forEach(function(vo) { vo.playbackRate = currentSpeed; });
      } else if (e.data.type === "MG_START_RECORD") {
        btnRecordMode.click();
      } else if (e.data.type === "MG_SET_AUDIO_VOLUME" && bgmAudio) {
        bgmAudio.volume = Math.max(0, Math.min(1, Number(e.data.volume) || 0));
      } else if (e.data.type === "MG_SET_AUDIO_MUTED") {
        if (bgmAudio) bgmAudio.muted = Boolean(e.data.muted);
        voElements.forEach(function(vo) { vo.muted = Boolean(e.data.muted); });
      }
    });

    btnPlayPause.addEventListener("click", function() {
      if (isPlaying) window.pause(); else window.play();
    });

    btnRestart.addEventListener("click", function() {
      window.restart();
    });

    timeScrubber.addEventListener("input", function(e) {
      window.pause();
      window.seek(parseFloat(e.target.value));
    });

    selSpeed.addEventListener("change", function(e) {
      currentSpeed = parseFloat(e.target.value);
      if (masterTimeline) masterTimeline.timeScale(currentSpeed);
    });

    btnRecordMode.addEventListener("click", function() {
      const controls = document.getElementById("player-controls");
      controls.style.display = "none";
      recordOverlay.style.display = "flex";
      let count = 3;
      recordCount.textContent = count;

      const timer = setInterval(function() {
        count--;
        if (count > 0) {
          recordCount.textContent = count;
        } else {
          clearInterval(timer);
          recordOverlay.style.display = "none";
          window.seek(0);
          window.play();

          setTimeout(function() {
            controls.style.display = "flex";
          }, (CUES.duration / currentSpeed + 1) * 1000);
        }
      }, 1000);
    });

    window.addEventListener("keydown", function(e) {
      if (e.code === "Space") {
        e.preventDefault();
        btnPlayPause.click();
      } else if (e.code === "ArrowLeft") {
        window.seek(Math.max(0, masterTimeline.time() - 2));
      } else if (e.code === "ArrowRight") {
        window.seek(Math.min(CUES.duration, masterTimeline.time() + 2));
      }
    });

    document.fonts.ready.then(function() {
      buildTimeline();
      window.play();
    });
  <\/script>
</body>
</html>`;
  }
  function getBackgroundCSS(tabId, colors) {
    const blue = colors.primary || "#003da5";
    const dark = colors.secondary || "#0a0a0a";
    const gold = colors.accent || "#f0a500";
    switch (tabId) {
      case "post_match":
        return `radial-gradient(ellipse 95% 65% at 50% 18%, rgba(0, 61, 165, 0.45) 0%, #080d1a 60%, ${dark} 100%)`;
      case "weekly_recap":
        return `linear-gradient(165deg, #091325 0%, #001a44 40%, ${dark} 95%)`;
      case "trivia_facts":
        return `radial-gradient(circle at 50% 35%, #0d1e44 0%, #060914 65%, ${dark} 100%)`;
      case "before_match":
        return `linear-gradient(140deg, #002d7a 0%, #001233 46%, #1a0808 54%, #080202 100%)`;
      case "transfer_news":
        return `radial-gradient(circle at 50% 25%, #003da5 0%, #090e1a 55%, ${dark} 100%)`;
      default:
        return `linear-gradient(145deg, ${blue} 0%, ${dark} 100%)`;
    }
  }
  function renderProjectCustomElementsHTML(scenes, colors) {
    if (!Array.isArray(scenes)) return "";
    return scenes.map((sc, scIdx) => {
      const elements = sc.elements || [];
      if (elements.length === 0) return "";
      const items = elements.map((el) => {
        if (el.visible === false) return "";
        const x = el.position?.x || 0;
        const y = el.position?.y || 0;
        const w = typeof el.size?.width === "number" ? `${el.size.width}px` : el.size?.width || "auto";
        const h = typeof el.size?.height === "number" ? `${el.size.height}px` : el.size?.height || "auto";
        const z = el.zIndex || 1;
        const op = el.opacity !== void 0 ? el.opacity : 1;
        const rot = el.rotation || 0;
        const scale = el.scale || 1;
        let inner = "";
        if (el.type === "image") {
          if (!el.assetUrl) {
            inner = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed #ef4444;border-radius:8px;background:rgba(239,68,68,0.1);color:#ef4444;padding:8px;text-align:center;">
            <span style="font-size:24px;">\u26A0\uFE0F</span>
            <span style="font-size:12px;font-weight:700;">Aset Hilang</span>
            <span style="font-size:10px;opacity:0.8;word-break:break-all;">${escapeHTML(el.name || el.assetId || "Image")}</span>
          </div>`;
          } else {
            inner = `<img src="${escapeHTML(el.assetUrl)}" alt="${escapeHTML(el.name || "")}" style="width:100%;height:100%;object-fit:${el.fitMode || "contain"};border-radius:${el.styling?.borderRadius || 8}px;display:block;" />`;
          }
        } else if (el.type === "svg" || el.type === "component" && (el.props?.componentId || el.assetId)) {
          const compId = el.props?.componentId || el.assetId;
          if (compId) {
            inner = renderSvgComponent(compId, { ...el.styling, width: el.size?.width, height: el.size?.height });
          } else if (el.content && el.content.includes("<svg")) {
            inner = el.content;
          }
        } else if (el.type === "text" && el.content) {
          inner = `<div style="font-family:${el.styling?.fontFamily || "'Inter', sans-serif"};font-size:${el.styling?.fontSize || 24}px;font-weight:${el.styling?.fontWeight || 400};color:${el.styling?.color || "#ffffff"};line-height:1.3;">${escapeHTML(el.content)}</div>`;
        } else if (el.type === "logo") {
          inner = `<img src="/public/logos/brand/logo.png" alt="Persib" style="width:100%;height:100%;object-fit:contain;" />`;
        }
        return `<div id="el_${el.id}" class="custom-scene-elem" style="position:absolute;left:${x}px;top:${y}px;width:${w};height:${h};z-index:${z};opacity:${op};transform:rotate(${rot}deg) scale(${scale});transform-origin:center center;">${inner}</div>`;
      }).join("");
      return `<div id="scene_custom_${sc.id}" class="scene-custom-layer" style="position:absolute;inset:0;pointer-events:none;${scIdx === 0 ? "" : "display:none;"}">${items}</div>`;
    }).join("");
  }
  function renderThemeVisualStage(tabId, colors, preset) {
    const gold = colors.accent || "#f0a500";
    const blue = colors.primary || "#003da5";
    switch (tabId) {
      case "post_match":
        return `
        <!-- Theme 1: Post-Match Recap (Scoreboard, Stats Dual Bars, MOTM Card) -->
        <svg id="themeMainGroup" viewBox="0 0 900 800" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ffd700"/>
              <stop offset="100%" stop-color="#f0a500"/>
            </linearGradient>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0055ff"/>
              <stop offset="100%" stop-color="#002266"/>
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          <!-- 1. Giant Scoreboard Banner -->
          <g id="pmScoreboard">
            <!-- Scoreboard Outer Card -->
            <rect x="80" y="80" width="740" height="340" rx="28" fill="#0c121e" stroke="${gold}" stroke-width="4" filter="url(#neonGlow)"/>
            <rect x="90" y="90" width="720" height="320" rx="20" fill="url(#blueGrad)" opacity="0.35"/>

            <!-- "FULL TIME" Pill -->
            <g transform="translate(360, 56)">
              <rect x="0" y="0" width="180" height="48" rx="24" fill="${gold}"/>
              <text x="90" y="32" font-family="'Bebas Neue', sans-serif" font-size="28" font-weight="900" fill="#0a0a0a" text-anchor="middle" letter-spacing="2">FULL TIME</text>
            </g>

            <!-- Home Club: PERSIB -->
            <g transform="translate(140, 150)">
              <!-- Shield SVG -->
              <polygon points="50,0 100,20 100,90 50,130 0,90 0,20" fill="#003da5" stroke="#ffffff" stroke-width="4"/>
              <polygon points="50,15 85,30 85,82 50,115 15,82 15,30" fill="${gold}"/>
              <text x="50" y="75" font-family="'Bebas Neue', sans-serif" font-size="28" font-weight="900" fill="#002266" text-anchor="middle">P</text>
              <text x="50" y="170" font-family="'Bebas Neue', sans-serif" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">PERSIB</text>
            </g>

            <!-- Giant Score: 3 - 1 -->
            <g id="pmScoreText" transform="translate(450, 260)">
              <text x="-90" y="0" font-family="'Bebas Neue', sans-serif" font-size="140" font-weight="900" fill="#ffffff" text-anchor="middle">3</text>
              <text x="0" y="-15" font-family="'Bebas Neue', sans-serif" font-size="80" font-weight="900" fill="${gold}" text-anchor="middle">\u2014</text>
              <text x="90" y="0" font-family="'Bebas Neue', sans-serif" font-size="140" font-weight="900" fill="#9ca3af" text-anchor="middle">1</text>
              <text x="0" y="45" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="${gold}" text-anchor="middle" letter-spacing="4">STADION SI JALAK HARUPAT</text>
            </g>

            <!-- Away Club -->
            <g transform="translate(660, 150)">
              <polygon points="50,0 100,20 100,90 50,130 0,90 0,20" fill="#2d3748" stroke="#ffffff" stroke-width="4"/>
              <polygon points="50,15 85,30 85,82 50,115 15,82 15,30" fill="#4a5568"/>
              <text x="50" y="75" font-family="'Bebas Neue', sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">R</text>
              <text x="50" y="170" font-family="'Bebas Neue', sans-serif" font-size="36" font-weight="900" fill="#9ca3af" text-anchor="middle" letter-spacing="3">RIVAL</text>
            </g>
          </g>

          <!-- 2. Match Stats Duel Bars -->
          <g id="pmStatsBox" transform="translate(80, 460)">
            <rect x="0" y="0" width="740" height="260" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="3"/>
            <text x="370" y="40" font-family="'Bebas Neue', sans-serif" font-size="26" font-weight="900" fill="${gold}" text-anchor="middle" letter-spacing="4">MATCH STATISTICS</text>

            <!-- Stat 1: Possession -->
            <g transform="translate(40, 75)">
              <text x="0" y="22" font-family="'Bebas Neue', sans-serif" font-size="30" fill="#ffffff">58%</text>
              <text x="330" y="20" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="#94a3b8" text-anchor="middle">BALL POSSESSION</text>
              <text x="660" y="22" font-family="'Bebas Neue', sans-serif" font-size="30" fill="#9ca3af" text-anchor="end">42%</text>
              <rect x="0" y="32" width="660" height="12" rx="6" fill="#1e293b"/>
              <rect class="pm-stat-bar-fill" x="0" y="32" width="382" height="12" rx="6" fill="url(#goldGrad)"/>
            </g>

            <!-- Stat 2: Shots on Target -->
            <g transform="translate(40, 155)">
              <text x="0" y="22" font-family="'Bebas Neue', sans-serif" font-size="30" fill="#ffffff">14 (6)</text>
              <text x="330" y="20" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="#94a3b8" text-anchor="middle">TOTAL SHOTS (ON TARGET)</text>
              <text x="660" y="22" font-family="'Bebas Neue', sans-serif" font-size="30" fill="#9ca3af" text-anchor="end">8 (3)</text>
              <rect x="0" y="32" width="660" height="12" rx="6" fill="#1e293b"/>
              <rect x="0" y="32" width="420" height="12" rx="6" fill="${blue}"/>
            </g>
          </g>

          <!-- 3. MOTM Card (Toggled by scene) -->
          <g id="pmMotmCard" opacity="0" transform="translate(220, 450)">
            <rect x="0" y="0" width="460" height="280" rx="24" fill="#001844" stroke="${gold}" stroke-width="4" filter="url(#neonGlow)"/>
            <text x="230" y="45" font-family="'Bebas Neue', sans-serif" font-size="32" fill="${gold}" text-anchor="middle" letter-spacing="3">\u2605 MAN OF THE MATCH \u2605</text>
            <text x="230" y="115" font-family="'Bebas Neue', sans-serif" font-size="52" fill="#ffffff" text-anchor="middle">DAVID DA SILVA</text>
            <g transform="translate(230, 170)">
              <circle cx="-50" cy="0" r="14" fill="${gold}" class="motm-star"/>
              <circle cx="-25" cy="0" r="14" fill="${gold}" class="motm-star"/>
              <circle cx="0" cy="0" r="18" fill="#ffffff" class="motm-star"/>
              <circle cx="25" cy="0" r="14" fill="${gold}" class="motm-star"/>
              <circle cx="50" cy="0" r="14" fill="${gold}" class="motm-star"/>
            </g>
            <text x="230" y="235" font-family="'Bebas Neue', sans-serif" font-size="44" fill="${gold}" text-anchor="middle">RATING 8.9 \u2022 2 GOL</text>
          </g>

          <!-- 4. Trophy & Standings Rank -->
          <g id="pmTrophyLadder" opacity="0" transform="translate(250, 460)">
            <rect x="0" y="0" width="400" height="260" rx="20" fill="#001a4d" stroke="#ffffff" stroke-width="3"/>
            <text x="200" y="55" font-family="'Bebas Neue', sans-serif" font-size="36" fill="${gold}" text-anchor="middle">KLASEMEN SEMENTARA</text>
            <text x="200" y="150" font-family="'Bebas Neue', sans-serif" font-size="90" font-weight="900" fill="#ffffff" text-anchor="middle">#1</text>
            <text x="200" y="210" font-family="'Inter', sans-serif" font-size="24" font-weight="800" fill="${gold}" text-anchor="middle" letter-spacing="2">34 POIN \u2022 15 MATCHES</text>
          </g>
        </svg>
      `;
      case "weekly_recap":
        return `
        <!-- Theme 2: Rangkuman Mingguan (Streak Tracker, Performance Matrix, Mini Standings) -->
        <svg id="themeMainGroup" viewBox="0 0 900 800" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
          <!-- Dossier Header -->
          <g transform="translate(80, 60)">
            <rect x="0" y="0" width="740" height="80" rx="16" fill="#0f172a" stroke="#334155" stroke-width="2"/>
            <text x="40" y="50" font-family="'Bebas Neue', sans-serif" font-size="36" fill="${gold}" letter-spacing="2">WEEKLY REPORT: PEKAN KE-15</text>
            <text x="700" y="48" font-family="'Inter', sans-serif" font-size="20" font-weight="700" fill="#22c55e" text-anchor="end">\u25CF STATUS: ON FIRE</text>
          </g>

          <!-- 1. 5-Game Unbeaten Streak Row -->
          <g id="wrStreakRow" transform="translate(80, 170)">
            <rect x="0" y="0" width="740" height="150" rx="20" fill="#0c1322" stroke="${gold}" stroke-width="3"/>
            <text x="40" y="40" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="#94a3b8" letter-spacing="2">RENTETAN 5 LAGA TERAKHIR (UNBEATEN STREAK):</text>
            
            <!-- Badges W W W W W -->
            <g transform="translate(70, 60)">
              <g class="wr-streak-badge" transform="translate(0, 0)">
                <circle cx="45" cy="30" r="30" fill="#15803d" stroke="#ffffff" stroke-width="3"/>
                <text x="45" y="40" font-family="'Bebas Neue', sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">W</text>
              </g>
              <g class="wr-streak-badge" transform="translate(125, 0)">
                <circle cx="45" cy="30" r="30" fill="#15803d" stroke="#ffffff" stroke-width="3"/>
                <text x="45" y="40" font-family="'Bebas Neue', sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">W</text>
              </g>
              <g class="wr-streak-badge" transform="translate(250, 0)">
                <circle cx="45" cy="30" r="30" fill="#15803d" stroke="#ffffff" stroke-width="3"/>
                <text x="45" y="40" font-family="'Bebas Neue', sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">W</text>
              </g>
              <g class="wr-streak-badge" transform="translate(375, 0)">
                <circle cx="45" cy="30" r="30" fill="#ca8a04" stroke="#ffffff" stroke-width="3"/>
                <text x="45" y="40" font-family="'Bebas Neue', sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>
              </g>
              <g class="wr-streak-badge" transform="translate(500, 0)">
                <circle cx="45" cy="30" r="30" fill="#15803d" stroke="${gold}" stroke-width="4"/>
                <text x="45" y="40" font-family="'Bebas Neue', sans-serif" font-size="32" font-weight="900" fill="${gold}" text-anchor="middle">W</text>
              </g>
            </g>
          </g>

          <!-- 2. Weekly Goals Performance Matrix (Bar Graph) -->
          <g id="wrChartMatrix" transform="translate(80, 350)">
            <rect x="0" y="0" width="740" height="200" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
            <text x="40" y="38" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="${gold}">DISTRIBUSI GOL SEPEKAN: TOTAL 12 GOL</text>
            
            <g transform="translate(70, 50)">
              <!-- Bars -->
              <rect class="wr-bar-col" x="50" y="60" width="60" height="70" rx="8" fill="#1e3a8a"/>
              <text x="80" y="50" font-family="'Bebas Neue', sans-serif" font-size="22" fill="#93c5fd" text-anchor="middle">2 GOL</text>
              <text x="80" y="150" font-family="'Inter', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Babak 1</text>

              <rect class="wr-bar-col" x="230" y="20" width="60" height="110" rx="8" fill="${gold}"/>
              <text x="260" y="10" font-family="'Bebas Neue', sans-serif" font-size="22" fill="${gold}" text-anchor="middle">6 GOL</text>
              <text x="260" y="150" font-family="'Inter', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Babak 2</text>

              <rect class="wr-bar-col" x="410" y="40" width="60" height="90" rx="8" fill="#38bdf8"/>
              <text x="440" y="30" font-family="'Bebas Neue', sans-serif" font-size="22" fill="#38bdf8" text-anchor="middle">4 GOL</text>
              <text x="440" y="150" font-family="'Inter', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Menit Akhir</text>
            </g>
          </g>

          <!-- 3. Mini Top 3 Standings Table -->
          <g id="wrMiniTable" transform="translate(80, 570)">
            <rect x="0" y="0" width="740" height="180" rx="18" fill="#001844" stroke="${gold}" stroke-width="2"/>
            
            <!-- Row 1: Persib (Highlight) -->
            <g class="wr-table-row" transform="translate(20, 20)">
              <rect x="0" y="0" width="700" height="42" rx="8" fill="#003da5" stroke="${gold}" stroke-width="2"/>
              <text x="20" y="28" font-family="'Bebas Neue', sans-serif" font-size="26" fill="${gold}">1. PERSIB BANDUNG</text>
              <text x="400" y="28" font-family="'Inter', sans-serif" font-size="16" fill="#ffffff">15 Main \u2022 +18 SG</text>
              <text x="680" y="28" font-family="'Bebas Neue', sans-serif" font-size="28" fill="${gold}" text-anchor="end">34 PTS</text>
            </g>

            <!-- Row 2 -->
            <g class="wr-table-row" transform="translate(20, 70)">
              <rect x="0" y="0" width="700" height="38" rx="8" fill="#0f172a"/>
              <text x="20" y="26" font-family="'Bebas Neue', sans-serif" font-size="22" fill="#9ca3af">2. BORNEO FC</text>
              <text x="400" y="26" font-family="'Inter', sans-serif" font-size="14" fill="#64748b">15 Main \u2022 +12 SG</text>
              <text x="680" y="26" font-family="'Bebas Neue', sans-serif" font-size="24" fill="#cbd5e1" text-anchor="end">31 PTS</text>
            </g>

            <!-- Row 3 -->
            <g class="wr-table-row" transform="translate(20, 116)">
              <rect x="0" y="0" width="700" height="38" rx="8" fill="#0f172a"/>
              <text x="20" y="26" font-family="'Bebas Neue', sans-serif" font-size="22" fill="#9ca3af">3. PERSIJA JAKARTA</text>
              <text x="400" y="26" font-family="'Inter', sans-serif" font-size="14" fill="#64748b">15 Main \u2022 +9 SG</text>
              <text x="680" y="26" font-family="'Bebas Neue', sans-serif" font-size="24" fill="#cbd5e1" text-anchor="end">29 PTS</text>
            </g>
          </g>
        </svg>
      `;
      case "trivia_facts":
        return `
        <!-- Theme 3: Fakta & Trivia Unik (Golden Heritage Monument, Orbital Rings, Laurel) -->
        <svg id="themeMainGroup" viewBox="0 0 900 800" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
          <defs>
            <radialGradient id="triviaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#f0a500" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Golden Glow Background Field -->
          <circle cx="450" cy="400" r="320" fill="url(#triviaGlow)"/>

          <!-- Orbital Shockwave Rings -->
          <g id="tfShockRings">
            <circle class="tf-ring" cx="450" cy="400" r="180" fill="none" stroke="${gold}" stroke-width="2" stroke-dasharray="12 8" opacity="0.6"/>
            <circle class="tf-ring" cx="450" cy="400" r="260" fill="none" stroke="${gold}" stroke-width="1.5" opacity="0.4"/>
            <circle class="tf-ring" cx="450" cy="400" r="340" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="20 10" opacity="0.3"/>
          </g>

          <!-- Heritage Crown -->
          <g id="tfGoldCrown" transform="translate(450, 150)">
            <polygon points="0,-40 30,-10 60,-50 90,-10 120,-40 100,20 20,20" fill="${gold}" stroke="#ffffff" stroke-width="3" transform="translate(-60, 0)"/>
            <circle cx="-30" cy="-40" r="6" fill="#ffffff"/>
            <circle cx="0" cy="-50" r="8" fill="#ffffff"/>
            <circle cx="30" cy="-40" r="6" fill="#ffffff"/>
          </g>

          <!-- Giant Monumental Number -->
          <g id="tfMonumentNum" transform="translate(450, 420)">
            <!-- Golden Heritage Shield Backdrop -->
            <polygon points="0,-160 160,-80 160,110 0,190 -160,110 -160,-80" fill="#002266" stroke="${gold}" stroke-width="6"/>
            <polygon points="0,-140 140,-70 140,95 0,165 -140,95 -140,-70" fill="#001233"/>
            
            <text x="0" y="-70" font-family="'Bebas Neue', sans-serif" font-size="32" font-weight="900" fill="${gold}" text-anchor="middle" letter-spacing="4">REKOR SEJARAH</text>
            <text x="0" y="50" font-family="'Bebas Neue', sans-serif" font-size="140" font-weight="900" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 0 25px #f0a500)">14</text>
            <text x="0" y="110" font-family="'Inter', sans-serif" font-size="24" font-weight="800" fill="${gold}" text-anchor="middle" letter-spacing="2">LAGA UNBEATEN</text>
          </g>

          <!-- Golden Laurel Leaves -->
          <g id="tfLaurelGroup">
            <!-- Left Wreath -->
            <path d="M 230 460 Q 200 340 260 250" fill="none" stroke="${gold}" stroke-width="6" stroke-linecap="round"/>
            <circle cx="215" cy="400" r="10" fill="${gold}"/>
            <circle cx="210" cy="340" r="12" fill="${gold}"/>
            <circle cx="230" cy="285" r="10" fill="${gold}"/>

            <!-- Right Wreath -->
            <path d="M 670 460 Q 700 340 640 250" fill="none" stroke="${gold}" stroke-width="6" stroke-linecap="round"/>
            <circle cx="685" cy="400" r="10" fill="${gold}"/>
            <circle cx="690" cy="340" r="12" fill="${gold}"/>
            <circle cx="670" cy="285" r="10" fill="${gold}"/>
          </g>

          <!-- Certified Club Seal Stamp -->
          <g transform="translate(450, 680)">
            <rect x="-180" y="-30" width="360" height="60" rx="30" fill="#0f172a" stroke="${gold}" stroke-width="3"/>
            <text x="0" y="10" font-family="'Bebas Neue', sans-serif" font-size="30" fill="${gold}" text-anchor="middle" letter-spacing="3">\u2605 SINCE 1933 OFFICIAL DATA \u2605</text>
          </g>
        </svg>
      `;
      case "before_match":
        return `
        <!-- Theme 4: Before Match (Diagonal Versus Duel, Radar Sweep, Countdown Clock) -->
        <svg id="themeMainGroup" viewBox="0 0 900 800" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
          <!-- Electric Lightning Bolt Across Screen -->
          <line x1="80" y1="120" x2="820" y2="700" stroke="${gold}" stroke-width="4" stroke-dasharray="16 8" opacity="0.4"/>

          <!-- 1. Duel Clash Box -->
          <g transform="translate(80, 80)">
            <!-- Left Corner: PERSIB -->
            <g id="bmTeamHome" transform="translate(100, 100)">
              <polygon points="70,0 140,30 140,130 70,180 0,130 0,30" fill="#003da5" stroke="#ffffff" stroke-width="5"/>
              <text x="70" y="100" font-family="'Bebas Neue', sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">PERSIB</text>
              <text x="70" y="220" font-family="'Inter', sans-serif" font-size="22" font-weight="800" fill="${gold}" text-anchor="middle">TUAN RUMAH</text>
            </g>

            <!-- Giant VS Badge -->
            <g id="bmVsBadge" transform="translate(370, 170)">
              <circle cx="0" cy="0" r="65" fill="#dc2626" stroke="#ffffff" stroke-width="6"/>
              <text x="0" y="18" font-family="'Bebas Neue', sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">VS</text>
            </g>

            <!-- Right Corner: RIVAL -->
            <g id="bmTeamAway" transform="translate(500, 100)">
              <polygon points="70,0 140,30 140,130 70,180 0,130 0,30" fill="#1e293b" stroke="#ef4444" stroke-width="5"/>
              <text x="70" y="100" font-family="'Bebas Neue', sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">LAWAN</text>
              <text x="70" y="220" font-family="'Inter', sans-serif" font-size="22" font-weight="800" fill="#9ca3af" text-anchor="middle">TIM TAMU</text>
            </g>
          </g>

          <!-- 2. Tactical Radar & Readiness Indicator -->
          <g id="bmDuelRadar" transform="translate(160, 420)">
            <rect x="0" y="0" width="580" height="150" rx="20" fill="#0b1324" stroke="#1e293b" stroke-width="2"/>
            
            <!-- Radar Circle -->
            <g transform="translate(90, 75)">
              <circle cx="0" cy="0" r="50" fill="none" stroke="#1e3a8a" stroke-width="2"/>
              <circle cx="0" cy="0" r="30" fill="none" stroke="#1e3a8a" stroke-width="1.5"/>
              <line id="bmRadarSweep" x1="0" y1="0" x2="48" y2="0" stroke="${gold}" stroke-width="3"/>
              <circle cx="0" cy="0" r="6" fill="${gold}"/>
            </g>

            <text x="180" y="55" font-family="'Bebas Neue', sans-serif" font-size="34" fill="#ffffff">KESIAPAN SKUAD: 100%</text>
            <text x="180" y="90" font-family="'Inter', sans-serif" font-size="18" fill="#94a3b8">Kondisi Fisik Prima \u2022 Taktik Transisi Kilat</text>
            <text x="180" y="125" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="${gold}">HEAD TO HEAD: PERSIB UNGGUL 3 KALI</text>
          </g>

          <!-- 3. Digital Kickoff Clock Card -->
          <g id="bmKickoffClock" transform="translate(160, 600)">
            <rect x="0" y="0" width="580" height="150" rx="20" fill="#001844" stroke="${gold}" stroke-width="3"/>
            <text x="290" y="42" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="${gold}" text-anchor="middle" letter-spacing="3">JADWAL PERTANDINGAN RESMI</text>
            <text class="bm-clock-glow" x="290" y="102" font-family="'Bebas Neue', sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">SABTU \u2022 19:00 WIB</text>
            <text x="290" y="134" font-family="'Inter', sans-serif" font-size="16" fill="#93c5fd" text-anchor="middle">LIVE DARI STADION SI JALAK HARUPAT</text>
          </g>
        </svg>
      `;
      case "transfer_news":
        return `
        <!-- Theme 5: Transfer & Berita (Wilujeng Sumping Impact Stamp, Jersey No 10, Contract Dossier) -->
        <svg id="themeMainGroup" viewBox="0 0 900 800" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
          <!-- 1. Giant "WILUJENG SUMPING" Heavy Stamp -->
          <g id="tnWilujengStamp" transform="translate(450, 160)">
            <rect x="-350" y="-70" width="700" height="140" rx="16" fill="#b91c1c" stroke="#ffffff" stroke-width="8"/>
            <rect x="-340" y="-60" width="680" height="120" rx="10" fill="#dc2626"/>
            <text x="0" y="24" font-family="'Bebas Neue', sans-serif" font-size="94" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="6">WILUJENG SUMPING!</text>
            <text x="0" y="52" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="${gold}" text-anchor="middle" letter-spacing="4">RESMI MENJADI BAGIAN MAUNG BANDUNG</text>
          </g>

          <!-- 2. Jersey Display Card -->
          <g id="tnJerseyCard" transform="translate(240, 290)">
            <!-- Stylized Blue Persib Jersey -->
            <polygon points="120,40 180,0 240,40 360,90 320,160 280,140 280,360 80,360 80,140 40,160 0,90" fill="#003da5" stroke="#ffffff" stroke-width="5"/>
            <!-- Gold Jersey Trims -->
            <path d="M 80 140 L 80 360 L 280 360 L 280 140" fill="none" stroke="${gold}" stroke-width="4"/>
            <!-- Collar V-Neck -->
            <polygon points="140,20 180,60 220,20" fill="#ffffff"/>
            
            <!-- Jersey Number 10 -->
            <text id="tnJerseyNumber" x="180" y="230" font-family="'Bebas Neue', sans-serif" font-size="160" font-weight="900" fill="#ffffff" text-anchor="middle">10</text>
            <text x="180" y="280" font-family="'Bebas Neue', sans-serif" font-size="34" font-weight="900" fill="${gold}" text-anchor="middle" letter-spacing="3">AMUNISI BARU</text>
          </g>

          <!-- 3. Contract & Profile Dossier Badges -->
          <g id="tnContractBadge" transform="translate(100, 670)">
            <rect x="0" y="0" width="700" height="100" rx="18" fill="#0c1322" stroke="${gold}" stroke-width="3"/>
            
            <g transform="translate(40, 35)">
              <text x="0" y="0" font-family="'Inter', sans-serif" font-size="16" fill="#94a3b8">POSISI</text>
              <text x="0" y="32" font-family="'Bebas Neue', sans-serif" font-size="34" fill="#ffffff">PLAYMAKER</text>
            </g>

            <g transform="translate(260, 35)">
              <text x="0" y="0" font-family="'Inter', sans-serif" font-size="16" fill="#94a3b8">DURASI KONTRAK</text>
              <text x="0" y="32" font-family="'Bebas Neue', sans-serif" font-size="34" fill="${gold}">2 TAHUN (2028)</text>
            </g>

            <g transform="translate(500, 35)">
              <text x="0" y="0" font-family="'Inter', sans-serif" font-size="16" fill="#94a3b8">STATISTIK LALU</text>
              <text x="0" y="32" font-family="'Bebas Neue', sans-serif" font-size="34" fill="#38bdf8">8 ASSISTS</text>
            </g>
          </g>
        </svg>
      `;
      default:
        return `<svg viewBox="0 0 800 800"><text x="400" y="400" fill="#fff" text-anchor="middle">PERSIB MEDIA</text></svg>`;
    }
  }

  // export-helper.js
  function downloadHTMLFile(config) {
    const project = config && config.version && config.canvas ? validateProject(config).project : migrateLegacyTemplateToProject(config);
    const assetCheck = validateProjectAssets(project);
    if (!assetCheck.valid && typeof window !== "undefined") {
      const proceed = window.confirm(
        `Peringatan: Terdapat ${assetCheck.missing.length} aset yang hilang:
- ` + assetCheck.missing.join("\n- ") + "\n\nTetap lanjutkan ekspor HTML?"
      );
      if (!proceed) return { success: false, missing: assetCheck.missing };
    }
    const htmlContent = generateMotionGraphicHTML(project);
    const safeFilename = (project.videoTitle || project.name || "motion-graphic").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const w = project.canvas?.width || 1080;
    const h = project.canvas?.height || 1920;
    a.href = url;
    a.download = `${safeFilename || "motion-graphic"}-${w}x${h}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function downloadProjectJSON(config) {
    const project = config && config.version && config.canvas ? validateProject(config).project : migrateLegacyTemplateToProject(config);
    const assetCheck = validateProjectAssets(project);
    if (!assetCheck.valid && typeof window !== "undefined") {
      const proceed = window.confirm(
        `Peringatan: Terdapat ${assetCheck.missing.length} aset yang hilang:
- ` + assetCheck.missing.join("\n- ") + "\n\nTetap simpan file JSON proyek?"
      );
      if (!proceed) return { success: false, missing: assetCheck.missing };
    }
    const jsonContent = JSON.stringify(project, null, 2);
    const safeFilename = (project.videoTitle || project.name || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFilename || "project"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function generateStructuredPrompt(config) {
    const project = config && config.version && config.canvas ? validateProject(config).project : migrateLegacyTemplateToProject(config);
    const topic = project.videoTitle || project.name || "Topik Video";
    const category = project.metadata?.category || "Edukasi";
    const angle = project.metadata?.angle || "Sudut pandang cerita utama";
    const audience = project.metadata?.audience || "Masyarakat Umum";
    const goal = project.metadata?.goal || "Edukasi";
    const tone = project.metadata?.tone || "Informatif";
    const preset = project.metadata?.preset || "preset_b";
    const colors = project.theme?.colors || { primary: "#1e3a8a", secondary: "#f8fafc", text: "#0f172a", accent: "#2563eb" };
    const duration = project.totalDuration || 30;
    const metaphor = project.metadata?.metaphor || "card";
    const scenes = project.scenes || [];
    const presetNames = {
      preset_a: "A (Editorial Hangat: Kertas krem, Playfair Display Italic, aksen terracotta)",
      preset_b: "B (Bold Flat: Latar solid motif geometris, Poppins 800, kartu rounded-24px)",
      preset_c: "C (Playful Edukasi: Latar gradasi gelap partikel, Nunito 800, aksen cerah, karaoke subtitle)"
    };
    const sceneRows = scenes.map((s, idx) => {
      return `| Adegan ${idx + 1}: ${s.name || s.title || ""} | ${s.duration}s | Narasi: "${s.narration || ""}" | Teks Layar: "${s.screenText || ""}" | Visual: ${s.visualAction || ""} |`;
    }).join("\n");
    return `### BRIEF MOTION GRAPHIC VERTIKAL (9:16)
Topik: ${topic}
Kategori: ${category}
Sudut Cerita: ${angle}
Target Penonton: ${audience}
Tujuan: ${goal}
Durasi: ${duration} Detik (30 FPS, Resolusi ${project.canvas?.width || 1080}x${project.canvas?.height || 1920})
Preset Gaya: ${presetNames[preset] || preset}
Palet Warna: Utama 1 (${colors.primary}), Utama 2 (${colors.secondary}), Teks (${colors.text}), Aksen (${colors.accent})
Objek Utama (Persistent Metaphor): ${metaphor}
Gaya Bicara: ${tone}

### STRUKTUR ADEGAN & NASKAH:
${sceneRows}

### INSTRUKSI OUTPUT:
1. Buat file HTML mandiri dengan panggung ${project.canvas?.width || 1080}x${project.canvas?.height || 1920} terskala otomatis.
2. Gunakan GSAP 3 timeline deterministik dengan kendali global window.seek(detik) dan window.DURATION = ${duration}.
3. Terapkan kinetic typography per kata dan kontinuitas objek utama (${metaphor}) di setiap adegan.
4. Jaga batas aman teks (250px atas, 420px bawah) dan kontras minimal 4.5:1.`;
  }
  function downloadRenderPackage(config) {
    const project = config && config.version && config.canvas ? validateProject(config).project : migrateLegacyTemplateToProject(config);
    const assetCheck = validateProjectAssets(project);
    if (!assetCheck.valid && typeof window !== "undefined") {
      const proceed = window.confirm(
        `Peringatan: Terdapat ${assetCheck.missing.length} aset yang hilang:
- ` + assetCheck.missing.join("\n- ") + "\n\nTetap unduh skrip render MP4?"
      );
      if (!proceed) return { success: false, missing: assetCheck.missing };
    }
    const safeFilename = (project.videoTitle || project.name || "motion-graphic").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const canvasWidth = project.canvas?.width || 1080;
    const canvasHeight = project.canvas?.height || 1920;
    const fps = project.fps || 30;
    const renderScript = `// render.js: Ekspor otomatis Frame-by-Frame ke MP4 ${canvasWidth}x${canvasHeight} (${fps}fps)
// Prasyarat:
// 1. npm i playwright
// 2. npx playwright install chromium
// 3. Pastikan ffmpeg terpasang di sistem PATH

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renderVideo() {
  const htmlFile = path.resolve(__dirname, "${safeFilename || "video"}-${canvasWidth}x${canvasHeight}.html");
  const framesDir = path.resolve(__dirname, "frames");

  if (!fs.existsSync(htmlFile)) {
    console.error(\`[Error] File HTML tidak ditemukan: \${htmlFile}\`);
    console.error("Pastikan file HTML hasil unduhan berada di direktori yang sama dengan render.js.");
    process.exit(1);
  }

  // Verifikasi ffmpeg di PATH
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch (e) {
    console.error("[Error] FFmpeg tidak terdeteksi di PATH sistem.");
    console.error("Silakan instal FFmpeg terlebih dahulu agar dapat menggabungkan frame menjadi video MP4.");
    process.exit(1);
  }

  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  console.log("Memulai browser Chromium untuk render...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error("[Error] Gagal meluncurkan Chromium. Jalankan: npx playwright install chromium", err);
    process.exit(1);
  }

  const page = await browser.newPage({ viewport: { width: ${canvasWidth}, height: ${canvasHeight} } });

  console.log(\`Membuka file: file://\${htmlFile}\`);
  await page.goto("file://" + htmlFile, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const duration = await page.evaluate(() => window.DURATION || 30);
  const videoFps = ${fps};
  const totalFrames = Math.round(duration * videoFps);

  console.log(\`Merender \${totalFrames} frame (\${duration} detik @ \${videoFps}fps)...\`);

  for (let i = 0; i <= totalFrames; i++) {
    const time = i / videoFps;
    await page.evaluate((t) => window.seek(t), time);

    const stage = await page.$("#stage");
    if (!stage) {
      console.error("[Error] Elemen #stage tidak ditemukan pada file HTML.");
      break;
    }
    const framePath = path.join(framesDir, \`frame_\${String(i).padStart(5, "0")}.png\`);
    await stage.screenshot({ path: framePath });

    if (i % videoFps === 0 || i === totalFrames) {
      const pct = Math.round((i / totalFrames) * 100);
      console.log(\`Progres Render: \${pct}% (\${Math.round(time)}s / \${duration}s)\`);
    }
  }

  await browser.close();
  console.log("Frame screenshot selesai. Menggabungkan video dengan FFmpeg...");

  const outputFile = path.resolve(__dirname, "${safeFilename || "video"}-output.mp4");
  const ffmpegCmd = \`ffmpeg -y -framerate \${videoFps} -i frames/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 "\${outputFile}"\`;

  try {
    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log(\`\\n\u{1F389} Berhasil! Video tersimpan di: \${outputFile}\`);
  } catch (err) {
    console.error("[Error] Gagal menjalankan FFmpeg saat menggabungkan frame:", err);
  }
}

renderVideo().catch((err) => {
  console.error("Terjadi kesalahan fatal selama rendering:", err);
  process.exit(1);
});
`;
    const blob = new Blob([renderScript], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "render.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // audio-library.js
  var AUDIO_CATEGORIES = [
    "All",
    "Voiceover",
    "Background Music",
    "Stadium Atmosphere",
    "Crowd Chant",
    "Whoosh",
    "Impact",
    "Transition Sound",
    "Celebration Sound",
    "Other Sound Effects"
  ];
  var BUILTIN_AUDIO_ASSETS = [
    {
      id: "aud_persib_anthem",
      name: "Persib Juara Rock Anthem (BGM)",
      category: "Background Music",
      fileType: "mp3",
      fileUrl: "/public/audio/bgm/persib_rock_anthem.mp3",
      duration: 32.5,
      volume: 0.85,
      tags: ["anthem", "rock", "semangat", "juara", "bgm"],
      license: "Royalty-Free Persib Media Production"
    },
    {
      id: "aud_stadium_roar",
      name: "Gemuruh Bobotoh Si Jalak Harupat",
      category: "Stadium Atmosphere",
      fileType: "mp3",
      fileUrl: "/public/audio/sfx/stadium_roar.mp3",
      duration: 28,
      volume: 0.7,
      tags: ["stadion", "bobotoh", "chant", "tribun", "atmosphere"],
      license: "Royalty-Free Audio"
    },
    {
      id: "aud_crowd_celebration",
      name: "Sorak Sorai Gol Kemenangan",
      category: "Celebration Sound",
      fileType: "mp3",
      fileUrl: "/public/audio/sfx/crowd_goal_cheer.mp3",
      duration: 8.4,
      volume: 0.9,
      tags: ["gol", "selebrasi", "juara", "menang"],
      license: "Royalty-Free Audio"
    },
    {
      id: "aud_cinematic_impact",
      name: "Sub Bass Hit & Cinematic Impact",
      category: "Impact",
      fileType: "wav",
      fileUrl: "/public/audio/sfx/cinematic_impact.wav",
      duration: 3.2,
      volume: 0.95,
      tags: ["impact", "bass", "dramatis", "hit", "trailer"],
      license: "Royalty-Free Audio"
    },
    {
      id: "aud_whoosh_transition",
      name: "Fast Energy Whoosh Swipe",
      category: "Whoosh",
      fileType: "mp3",
      fileUrl: "/public/audio/sfx/whoosh_fast.mp3",
      duration: 1.5,
      volume: 0.8,
      tags: ["whoosh", "swipe", "transisi", "cepat"],
      license: "Royalty-Free Audio"
    },
    {
      id: "aud_breaking_alert",
      name: "Breaking News Ticker Chime",
      category: "Transition Sound",
      fileType: "mp3",
      fileUrl: "/public/audio/sfx/breaking_alert.mp3",
      duration: 2.1,
      volume: 0.8,
      tags: ["breaking", "news", "transfer", "alert", "chime"],
      license: "Royalty-Free Audio"
    }
  ];
  var customAudioRegistry = /* @__PURE__ */ new Map();
  function getAllAudioAssets() {
    const customList = Array.from(customAudioRegistry.values());
    return [...BUILTIN_AUDIO_ASSETS, ...customList];
  }
  function getAudioAssetById(assetId) {
    if (!assetId) return null;
    return getAllAudioAssets().find((a) => a.id === assetId) || null;
  }
  function filterAudioAssets(category = "All", searchQuery = "") {
    let assets = getAllAudioAssets();
    if (category && category !== "All") {
      assets = assets.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      assets = assets.filter(
        (a) => a.name.toLowerCase().includes(q) || a.tags && a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return assets;
  }
  function addUploadedAudio(audioData) {
    if (!audioData || !audioData.fileUrl) {
      throw new Error("Data audio tidak lengkap.");
    }
    const assetId = audioData.id || `aud_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const asset = {
      id: assetId,
      name: audioData.name || "Audio Kustom",
      category: audioData.category || "Background Music",
      fileType: audioData.fileType || "mp3",
      fileUrl: audioData.fileUrl,
      duration: Number(audioData.duration) || 30,
      volume: Number(audioData.volume) || 0.8,
      fileSize: Number(audioData.fileSize) || 0,
      createdAt: audioData.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      tags: Array.isArray(audioData.tags) ? audioData.tags : ["upload", "audio"],
      license: "User Uploaded Audio"
    };
    customAudioRegistry.set(assetId, asset);
    return asset;
  }
  function recommendAudioForConcept(concept = {}) {
    const topic = (concept.topic || concept.name || "").toLowerCase();
    const category = (concept.category || "").toLowerCase();
    if (topic.includes("transfer") || category.includes("transfer")) {
      return getAudioAssetById("aud_breaking_alert") || getAudioAssetById("aud_cinematic_impact");
    }
    if (topic.includes("menang") || topic.includes("skor") || topic.includes("recap") || category.includes("hasil")) {
      return getAudioAssetById("aud_crowd_celebration") || getAudioAssetById("aud_persib_anthem");
    }
    if (topic.includes("duel") || topic.includes("versus") || category.includes("preview")) {
      return getAudioAssetById("aud_cinematic_impact") || getAudioAssetById("aud_stadium_roar");
    }
    return getAudioAssetById("aud_persib_anthem") || BUILTIN_AUDIO_ASSETS[0];
  }

  // ai-director.js
  function sanitizeUserPrompt(rawPrompt) {
    if (!rawPrompt || typeof rawPrompt !== "string") return "";
    const trimmed = rawPrompt.trim();
    const capped = trimmed.slice(0, 2e3);
    return capped.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
  }
  function generateProjectWithHeuristic(prompt, options = {}) {
    const cleanPrompt = sanitizeUserPrompt(prompt);
    const pLower = cleanPrompt.toLowerCase();
    const aspectRatio = options.aspectRatio || (pLower.includes("landscape") || pLower.includes("16:9") ? "16:9" : pLower.includes("square") || pLower.includes("1:1") ? "1:1" : "9:16");
    const totalDuration = Number(options.duration) || 30;
    const fps = 30;
    let width = 1080;
    let height = 1920;
    if (aspectRatio === "16:9") {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    }
    let topic = "Persib Bandung Juara";
    let preset = options.preset || "preset_b";
    let category = "Hasil Pertandingan";
    const scoreMatch = cleanPrompt.match(/(\d+)\s*[-–:]\s*(\d+)/);
    const detectedScore = scoreMatch ? `${scoreMatch[1]}-${scoreMatch[2]}` : "2-1";
    if (pLower.includes("transfer") || pLower.includes("pemain baru")) {
      topic = "Wilujeng Sumping Amunisi Baru";
      category = "Kabar Transfer & Skuad";
    } else if (pLower.includes("recap") || pLower.includes("pekan") || pLower.includes("mingguan")) {
      topic = "Rangkuman Klasemen Pekan Ini";
      category = "Rangkuman Mingguan";
    } else if (pLower.includes("trivia") || pLower.includes("sejarah") || pLower.includes("rekor")) {
      topic = "Fakta Menarik Pangeran Biru";
      category = "Fakta & Trivia Unik";
    } else if (pLower.includes("duel") || pLower.includes("preview") || pLower.includes("versus")) {
      topic = "Big Match El Clasico Indonesia";
      category = "Preview Pertandingan";
    }
    const recAudio = recommendAudioForConcept({ topic, category });
    const scenes = [];
    scenes.push({
      id: "sc_ai_1",
      name: "Intro Identitas",
      order: 1,
      duration: 6,
      title: "PEMBUKA",
      screenText: topic.toUpperCase(),
      highlightWord: "PERSIB",
      narration: `Halo Bobotoh! Inilah tayangan resmi kabar terkini kebanggaan Jawa Barat, Persib Bandung.`,
      transition: { type: "slash", direction: "right", duration: 0.5 },
      elements: [
        {
          id: "el_ai_1_logo",
          type: "svg",
          name: "Perisai Lambang Persib",
          assetId: "ast_persib_shield",
          position: { x: Math.round(width / 2 - 100), y: Math.round(height * 0.28) },
          size: { width: 200, height: 240 },
          props: { componentId: "svg_persib_shield" },
          animation: { type: "scale", delay: 0.2, duration: 0.6 }
        },
        {
          id: "el_ai_1_title",
          type: "text",
          name: "Judul Pembuka",
          content: topic,
          position: { x: 80, y: Math.round(height * 0.55) },
          size: { width: width - 160, height: 160 },
          styling: { fontSize: aspectRatio === "16:9" ? 54 : 64, fontWeight: 900, color: "#ffffff" },
          animation: { type: "slide", delay: 0.3, duration: 0.5 }
        }
      ]
    });
    if (category === "Kabar Transfer & Skuad") {
      scenes.push({
        id: "sc_ai_2",
        name: "Pengumuman Transfer",
        order: 2,
        duration: 6,
        title: "AMUNISI BARU",
        screenText: "WILUJENG SUMPING BINTANG BARU",
        highlightWord: "SUMPING",
        narration: "Manajemen resmi memperkenalkan penggawa anyar yang siap memperkuat kedalaman skuat Maung Bandung.",
        transition: { type: "fade", duration: 0.4 },
        elements: [
          {
            id: "el_ai_2_stamp",
            type: "svg",
            name: "Stempel Wilujeng Sumping",
            assetId: "ast_wilujeng_stamp",
            position: { x: Math.round(width / 2 - 220), y: Math.round(height * 0.32) },
            size: { width: 440, height: 160 },
            props: { componentId: "svg_wilujeng_stamp" },
            animation: { type: "scale", delay: 0.1, duration: 0.5 }
          },
          {
            id: "el_ai_2_jersey",
            type: "svg",
            name: "Jersey Nomor 10",
            assetId: "ast_jersey_no10",
            position: { x: Math.round(width / 2 - 160), y: Math.round(height * 0.5) },
            size: { width: 320, height: 360 },
            props: { componentId: "svg_jersey_no10" },
            animation: { type: "slide", delay: 0.3, duration: 0.6 }
          }
        ]
      });
    } else {
      scenes.push({
        id: "sc_ai_2",
        name: "Hasil Skor Akhir",
        order: 2,
        duration: 6,
        title: "SKOR AKHIR",
        screenText: `PERSIB UNGGUL ${detectedScore} DI KANDANG`,
        highlightWord: detectedScore,
        narration: `Pertandingan sengit berakhir manis. Pangeran Biru sukses mengunci poin penuh dengan skor akhir ${detectedScore}.`,
        transition: { type: "slash", direction: "left", duration: 0.4 },
        elements: [
          {
            id: "el_ai_2_board",
            type: "svg",
            name: "Papan Skor Stadion",
            assetId: "ast_scoreboard_stadium",
            position: { x: Math.round(width / 2 - 370), y: Math.round(height * 0.3) },
            size: { width: 740, height: 320 },
            props: { componentId: "svg_scoreboard_stadium" },
            animation: { type: "scale", delay: 0.1, duration: 0.6 }
          }
        ]
      });
    }
    scenes.push({
      id: "sc_ai_3",
      name: "Sorotan Data & Taktik",
      order: 3,
      duration: 6,
      title: "STATISTIK DUEL",
      screenText: "DOMINASI PENGUASAAN BOLA & SERANGAN",
      highlightWord: "DOMINASI",
      narration: "Statistik pertandingan membuktikan keunggulan lini tengah dan agresivitas serangan sayap sepanjang 90 menit.",
      transition: { type: "fade", duration: 0.4 },
      elements: [
        {
          id: "el_ai_3_radar",
          type: "svg",
          name: "Radar Taktik Antar Lini",
          assetId: "ast_duel_radar",
          position: { x: Math.round(width / 2 - 200), y: Math.round(height * 0.32) },
          size: { width: 400, height: 400 },
          props: { componentId: "svg_duel_radar" },
          animation: { type: "rotate", delay: 0.1, duration: 0.7 }
        }
      ]
    });
    scenes.push({
      id: "sc_ai_4",
      name: "Penghargaan Terbaik",
      order: 4,
      duration: 6,
      title: "MAN OF THE MATCH",
      screenText: "KONTRIBUSI NYATA PEMAIN TERBAIK",
      highlightWord: "TERBAIK",
      narration: "Aksi gemilang di atas lapangan membuahkan gelar pemain terbaik dengan kontribusi gol dan umpan kunci.",
      transition: { type: "slide", direction: "up", duration: 0.4 },
      elements: [
        {
          id: "el_ai_4_badge",
          type: "svg",
          name: "Bintang MOTM",
          assetId: "ast_motm_badge",
          position: { x: Math.round(width / 2 - 130), y: Math.round(height * 0.34) },
          size: { width: 260, height: 260 },
          props: { componentId: "svg_motm_badge" },
          animation: { type: "scale", delay: 0.1, duration: 0.6 }
        }
      ]
    });
    scenes.push({
      id: "sc_ai_5",
      name: "Penutup Kemenangan",
      order: 5,
      duration: 6,
      title: "JUARA SEJATI",
      screenText: "LANGKAH MANTAP MENUJU TANGGA JUARA",
      highlightWord: "JUARA",
      narration: "Tiga poin berharga untuk menjaga asa di papan atas klasemen. Kawal terus perjuangan Pangeran Biru sampai tuntas!",
      transition: { type: "slash", direction: "right", duration: 0.5 },
      elements: [
        {
          id: "el_ai_5_trophy",
          type: "svg",
          name: "Piala Juara Emas",
          assetId: "ast_trophy_ladder",
          position: { x: Math.round(width / 2 - 150), y: Math.round(height * 0.32) },
          size: { width: 300, height: 380 },
          props: { componentId: "svg_trophy_ladder" },
          animation: { type: "scale", delay: 0.1, duration: 0.6 }
        }
      ]
    });
    const project = createDefaultProject({
      name: topic,
      videoTitle: topic,
      aspectRatio,
      canvas: { width, height },
      fps,
      totalDuration,
      metadata: {
        category,
        preset,
        source: "gemini_creative_director",
        originalPrompt: cleanPrompt
      },
      audio: {
        enabled: true,
        assetId: recAudio ? recAudio.id : "aud_persib_anthem",
        bgmUrl: recAudio ? recAudio.fileUrl : "/public/audio/bgm/persib_rock_anthem.mp3",
        volume: 0.85,
        muted: false
      },
      scenes
    });
    recalculateSceneTimings(project);
    return project;
  }
  async function reviseProjectWithAI(currentProject, revisionPrompt, targetSceneId = null) {
    if (!currentProject || !Array.isArray(currentProject.scenes)) {
      throw new Error("Project aktif tidak valid.");
    }
    const cleanPrompt = sanitizeUserPrompt(revisionPrompt);
    if (!cleanPrompt) {
      throw new Error("Instruksi revisi tidak boleh kosong.");
    }
    const pLower = cleanPrompt.toLowerCase();
    const revised = JSON.parse(JSON.stringify(currentProject));
    let targetScene = null;
    if (targetSceneId) {
      targetScene = revised.scenes.find((s) => String(s.id) === String(targetSceneId));
    }
    if (!targetScene) {
      if (pLower.includes("scene 1") || pLower.includes("scene pertama") || pLower.includes("adegan 1") || pLower.includes("intro")) {
        targetScene = revised.scenes[0];
      } else if (pLower.includes("scene 2") || pLower.includes("scene kedua") || pLower.includes("adegan 2")) {
        targetScene = revised.scenes[1];
      } else if (pLower.includes("scene 3") || pLower.includes("scene ketiga") || pLower.includes("adegan 3")) {
        targetScene = revised.scenes[2];
      } else if (pLower.includes("scene 4") || pLower.includes("scene keempat") || pLower.includes("adegan 4")) {
        targetScene = revised.scenes[3];
      } else if (pLower.includes("scene 5") || pLower.includes("scene kelima") || pLower.includes("adegan 5") || pLower.includes("penutup")) {
        targetScene = revised.scenes[revised.scenes.length - 1];
      } else {
        targetScene = revised.scenes[0];
      }
    }
    let summary = "Revisi diterapkan.";
    if (pLower.includes("landscape") || pLower.includes("16:9")) {
      revised.aspectRatio = "16:9";
      revised.canvas.width = 1920;
      revised.canvas.height = 1080;
      summary = "Format kanvas diubah menjadi Landscape 16:9 (1920\xD71080).";
    } else if (pLower.includes("square") || pLower.includes("persegi") || pLower.includes("1:1")) {
      revised.aspectRatio = "1:1";
      revised.canvas.width = 1080;
      revised.canvas.height = 1080;
      summary = "Format kanvas diubah menjadi Persegi 1:1 (1080\xD71080).";
    } else if (pLower.includes("portrait") || pLower.includes("vertikal") || pLower.includes("9:16")) {
      revised.aspectRatio = "9:16";
      revised.canvas.width = 1080;
      revised.canvas.height = 1920;
      summary = "Format kanvas diubah menjadi Vertikal 9:16 (1080\xD71920).";
    }
    const durMatch = cleanPrompt.match(/(\d+)\s*(?:detik|s|second)/i);
    if (durMatch && (pLower.includes("durasi") || pLower.includes("detik"))) {
      const newDur = Math.max(1, Math.min(60, Number(durMatch[1])));
      if (targetScene) {
        targetScene.duration = newDur;
        summary = `Durasi ${targetScene.title || targetScene.name} diubah menjadi ${newDur} detik.`;
      }
    }
    if (pLower.includes("background") || pLower.includes("latar")) {
      if (targetScene) {
        targetScene.background = "radial-gradient(ellipse at 50% 20%, #003da5 0%, #05070e 80%)";
        summary = `Latar belakang ${targetScene.title || targetScene.name} diperbarui lebih dramatis.`;
      }
    }
    if (pLower.includes("lebih besar") || pLower.includes("perbesar") || pLower.includes("font")) {
      if (targetScene && Array.isArray(targetScene.elements)) {
        const textElem = targetScene.elements.find((e) => e.type === "text");
        if (textElem) {
          if (!textElem.styling) textElem.styling = {};
          textElem.styling.fontSize = Math.min(120, (Number(textElem.styling.fontSize) || 48) + 16);
          summary = `Ukuran teks pada ${targetScene.title || targetScene.name} diperbesar.`;
        }
      }
    }
    if (pLower.includes("animasi") || pLower.includes("smooth")) {
      if (targetScene && Array.isArray(targetScene.elements)) {
        targetScene.elements.forEach((el) => {
          if (!el.animation) el.animation = {};
          el.animation.type = pLower.includes("scale") ? "scale" : "fade";
          el.animation.duration = 0.8;
          el.animation.easing = "power2.out";
        });
        summary = `Animasi elemen pada ${targetScene.title || targetScene.name} diubah menjadi lebih halus.`;
      }
    }
    if (pLower.includes("trophy") || pLower.includes("piala")) {
      if (targetScene && Array.isArray(targetScene.elements)) {
        const visualElem = targetScene.elements.find((e) => ["image", "svg", "component"].includes(e.type));
        if (visualElem) {
          visualElem.type = "svg";
          visualElem.assetId = "ast_trophy_ladder";
          visualElem.props = { componentId: "svg_trophy_ladder" };
          summary = `Aset visual pada ${targetScene.title || targetScene.name} diganti dengan Piala Juara Emas.`;
        }
      }
    } else if (pLower.includes("jersey") || pLower.includes("baju")) {
      if (targetScene && Array.isArray(targetScene.elements)) {
        const visualElem = targetScene.elements.find((e) => ["image", "svg", "component"].includes(e.type));
        if (visualElem) {
          visualElem.type = "svg";
          visualElem.assetId = "ast_jersey_no10";
          visualElem.props = { componentId: "svg_jersey_no10" };
          summary = `Aset visual pada ${targetScene.title || targetScene.name} diganti dengan Jersey No. 10.`;
        }
      }
    }
    recalculateSceneTimings(revised);
    const validated = validateProject(revised);
    return {
      success: true,
      project: validated.project,
      summary
    };
  }

  // app.js
  var HistoryManager = class {
    constructor(maxStates = 40) {
      this.undoStack = [];
      this.redoStack = [];
      this.maxStates = maxStates;
    }
    push(project) {
      if (!project) return;
      this.undoStack.push(JSON.parse(JSON.stringify(project)));
      if (this.undoStack.length > this.maxStates) {
        this.undoStack.shift();
      }
      this.redoStack = [];
      updateUndoRedoUI();
    }
    undo(currentProject) {
      if (this.undoStack.length === 0) return null;
      this.redoStack.push(JSON.parse(JSON.stringify(currentProject)));
      const previous = this.undoStack.pop();
      updateUndoRedoUI();
      return previous;
    }
    redo(currentProject) {
      if (this.redoStack.length === 0) return null;
      this.undoStack.push(JSON.parse(JSON.stringify(currentProject)));
      const next = this.redoStack.pop();
      updateUndoRedoUI();
      return next;
    }
    canUndo() {
      return this.undoStack.length > 0;
    }
    canRedo() {
      return this.redoStack.length > 0;
    }
  };
  var history = new HistoryManager(40);
  var activeTabId = DEFAULT_TAB;
  var tabProjectCache = {};
  Object.keys(PERSIB_TABS).forEach((tabKey) => {
    tabProjectCache[tabKey] = migrateLegacyTemplateToProject(PERSIB_TABS[tabKey]);
  });
  var appProject = tabProjectCache[activeTabId];
  var selectedSceneId = appProject.scenes[0]?.id || "sc_1";
  var selectedElementId = null;
  var currentPlayheadTime = 0;
  var isPlaying = false;
  var currentStageScale = 0.24;
  var timelinePxPerSec = 40;
  var inputDebounceTimer = null;
  function debouncedHistoryPush() {
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = setTimeout(() => {
      history.push(appProject);
    }, 400);
  }
  var btnUndo = document.getElementById("btnUndo");
  var btnRedo = document.getElementById("btnRedo");
  var tabButtons = document.querySelectorAll("[data-tab-id]");
  var themeToggleBtn = document.getElementById("themeToggleBtn");
  var btnImportJson = document.getElementById("btnImportJson");
  var fileImportJson = document.getElementById("fileImportJson");
  var btnDownloadJson = document.getElementById("btnDownloadJson");
  var btnDownloadHtml = document.getElementById("btnDownloadHtml");
  var btnDownloadRenderPkg = document.getElementById("btnDownloadRenderPkg");
  var btnExportPrompt = document.getElementById("btnExportPrompt");
  var panelTabButtons = document.querySelectorAll("[data-panel-tab]");
  var tabContentScenes = document.getElementById("tabContentScenes");
  var tabContentLayers = document.getElementById("tabContentLayers");
  var tabContentConcept = document.getElementById("tabContentConcept");
  var sceneCountBadge = document.getElementById("sceneCountBadge");
  var layerCountBadge = document.getElementById("layerCountBadge");
  var btnAddScene = document.getElementById("btnAddScene");
  var sceneCardList = document.getElementById("sceneCardList");
  var activeSceneLayerTitle = document.getElementById("activeSceneLayerTitle");
  var selNewElementType = document.getElementById("selNewElementType");
  var btnAddElement = document.getElementById("btnAddElement");
  var layerTreeList = document.getElementById("layerTreeList");
  var formTopic = document.getElementById("formTopic");
  var formCategory = document.getElementById("formCategory");
  var formAngle = document.getElementById("formAngle");
  var formAudience = document.getElementById("formAudience");
  var formGoal = document.getElementById("formGoal");
  var formTone = document.getElementById("formTone");
  var formDuration = document.getElementById("formDuration");
  var formMetaphor = document.getElementById("formMetaphor");
  var presetButtons = document.querySelectorAll("[data-preset-val]");
  var colorPrimary = document.getElementById("colorPrimary");
  var colorSecondary = document.getElementById("colorSecondary");
  var colorText = document.getElementById("colorText");
  var colorAccent = document.getElementById("colorAccent");
  var hexPrimary = document.getElementById("hexPrimary");
  var hexSecondary = document.getElementById("hexSecondary");
  var hexText = document.getElementById("hexText");
  var hexAccent = document.getElementById("hexAccent");
  var btnResetFramework = document.getElementById("btnResetFramework");
  var canvasViewport = document.getElementById("canvasViewport");
  var canvasStageWrapper = document.getElementById("canvasStageWrapper");
  var stageIframe = document.getElementById("stageIframe");
  var canvasOverlay = document.getElementById("canvasOverlay");
  var canvasActiveInfo = document.getElementById("canvasActiveInfo");
  var btnGenerate = document.getElementById("btnGenerate");
  var btnParentPlayPause = document.getElementById("btnParentPlayPause");
  var parentIconPlay = document.getElementById("parentIconPlay");
  var btnParentRestart = document.getElementById("btnParentRestart");
  var parentTimeScrubber = document.getElementById("parentTimeScrubber");
  var parentTimeDisplay = document.getElementById("parentTimeDisplay");
  var parentSpeedSelect = document.getElementById("parentSpeedSelect");
  var btnParentRecordMode = document.getElementById("btnParentRecordMode");
  var inspectorEmptyNotice = document.getElementById("inspectorEmptyNotice");
  var elementInspector = document.getElementById("elementInspector");
  var sceneInspector = document.getElementById("sceneInspector");
  var elemInspectorTitle = document.getElementById("elemInspectorTitle");
  var elemTypeBadge = document.getElementById("elemTypeBadge");
  var btnInspectorLock = document.getElementById("btnInspectorLock");
  var btnInspectorVisible = document.getElementById("btnInspectorVisible");
  var btnInspectorDuplicate = document.getElementById("btnInspectorDuplicate");
  var btnInspectorDelete = document.getElementById("btnInspectorDelete");
  var propElemName = document.getElementById("propElemName");
  var propElemX = document.getElementById("propElemX");
  var propElemY = document.getElementById("propElemY");
  var propElemW = document.getElementById("propElemW");
  var propElemH = document.getElementById("propElemH");
  var propElemRot = document.getElementById("propElemRot");
  var propElemOpacity = document.getElementById("propElemOpacity");
  var inspectorTextGroup = document.getElementById("inspectorTextGroup");
  var propElemContent = document.getElementById("propElemContent");
  var propElemHighlight = document.getElementById("propElemHighlight");
  var propElemFontSize = document.getElementById("propElemFontSize");
  var propElemColor = document.getElementById("propElemColor");
  var propElemBgColor = document.getElementById("propElemBgColor");
  var propElemRadius = document.getElementById("propElemRadius");
  var propElemAnimType = document.getElementById("propElemAnimType");
  var propElemAnimDelay = document.getElementById("propElemAnimDelay");
  var propElemAnimDur = document.getElementById("propElemAnimDur");
  var propSceneTitle = document.getElementById("propSceneTitle");
  var propSceneDuration = document.getElementById("propSceneDuration");
  var propSceneTransitionType = document.getElementById("propSceneTransitionType");
  var propSceneTransitionDir = document.getElementById("propSceneTransitionDir");
  var propSceneNarration = document.getElementById("propSceneNarration");
  var propSceneVisualAction = document.getElementById("propSceneVisualAction");
  var sceneVoiceoverControlBox = document.getElementById("sceneVoiceoverControlBox");
  var voStatusBadge = document.getElementById("voStatusBadge");
  var chkVoEnabled = document.getElementById("chkVoEnabled");
  var voConfigControls = document.getElementById("voConfigControls");
  var selVoProvider = document.getElementById("selVoProvider");
  var voProviderNotice = document.getElementById("voProviderNotice");
  var selVoLanguage = document.getElementById("selVoLanguage");
  var selVoVoice = document.getElementById("selVoVoice");
  var rangeVoSpeed = document.getElementById("rangeVoSpeed");
  var valVoSpeed = document.getElementById("valVoSpeed");
  var rangeVoPitch = document.getElementById("rangeVoPitch");
  var valVoPitch = document.getElementById("valVoPitch");
  var lblVoParamSecond = document.getElementById("lblVoParamSecond");
  var voAudioPlayerContainer = document.getElementById("voAudioPlayerContainer");
  var voPreviewAudioElement = document.getElementById("voPreviewAudioElement");
  var voAudioMetaDuration = document.getElementById("voAudioMetaDuration");
  var btnDeleteVoAudio = document.getElementById("btnDeleteVoAudio");
  var btnPreviewVoSpeech = document.getElementById("btnPreviewVoSpeech");
  var btnGenerateVoAudio = document.getElementById("btnGenerateVoAudio");
  var voGenerateProgress = document.getElementById("voGenerateProgress");
  var btnOpenCloneModal = document.getElementById("btnOpenCloneModal");
  var voiceCloneModal = document.getElementById("voiceCloneModal");
  var btnCloseCloneModal = document.getElementById("btnCloseCloneModal");
  var btnCancelCloneModal = document.getElementById("btnCancelCloneModal");
  var inpCloneVoiceName = document.getElementById("inpCloneVoiceName");
  var inpCloneVoiceDesc = document.getElementById("inpCloneVoiceDesc");
  var inpCloneSpeakerName = document.getElementById("inpCloneSpeakerName");
  var dropZoneCloneAudio = document.getElementById("dropZoneCloneAudio");
  var fileCloneAudioSample = document.getElementById("fileCloneAudioSample");
  var lblCloneAudioFile = document.getElementById("lblCloneAudioFile");
  var chkCloneConsent = document.getElementById("chkCloneConsent");
  var cloneProgressNotice = document.getElementById("cloneProgressNotice");
  var customVoiceListContainer = document.getElementById("customVoiceListContainer");
  var btnSubmitVoiceClone = document.getElementById("btnSubmitVoiceClone");
  var cloneAudioSampleBase64 = null;
  var cloneAudioSampleMimeType = "audio/mpeg";
  var chkAudioEnabled = document.getElementById("chkAudioEnabled");
  var selAudioPreset = document.getElementById("selAudioPreset");
  var inpAudioUrl = document.getElementById("inpAudioUrl");
  var rngAudioVolume = document.getElementById("rngAudioVolume");
  var lblAudioVolume = document.getElementById("lblAudioVolume");
  var btnAudioMute = document.getElementById("btnAudioMute");
  var selectCanvasRatio = document.getElementById("selectCanvasRatio");
  var btnOpenAssetLibrary = document.getElementById("btnOpenAssetLibrary");
  var btnOpenAssetModalFromLayers = document.getElementById("btnOpenAssetModalFromLayers");
  var assetBrowserModal = document.getElementById("assetBrowserModal");
  var btnCloseAssetModal = document.getElementById("btnCloseAssetModal");
  var btnCancelAssetModal = document.getElementById("btnCancelAssetModal");
  var btnApplySelectedAsset = document.getElementById("btnApplySelectedAsset");
  var assetSearchInput = document.getElementById("assetSearchInput");
  var assetCategoryChips = document.getElementById("assetCategoryChips");
  var assetGalleryGrid = document.getElementById("assetGalleryGrid");
  var assetSelectedInfo = document.getElementById("assetSelectedInfo");
  var assetDropzone = document.getElementById("assetDropzone");
  var assetFileInput = document.getElementById("assetFileInput");
  var btnTriggerUpload = document.getElementById("btnTriggerUpload");
  var uploadProgress = document.getElementById("uploadProgress");
  var inspectorAssetGroup = document.getElementById("inspectorAssetGroup");
  var propElemAssetId = document.getElementById("propElemAssetId");
  var propElemFitMode = document.getElementById("propElemFitMode");
  var btnInspectChangeAsset = document.getElementById("btnInspectChangeAsset");
  var btnInspectRemoveAsset = document.getElementById("btnInspectRemoveAsset");
  var btnOpenAiDirector = document.getElementById("btnOpenAiDirector");
  var aiDirectorModal = document.getElementById("aiDirectorModal");
  var btnCloseAiModal = document.getElementById("btnCloseAiModal");
  var btnCancelAiModal = document.getElementById("btnCancelAiModal");
  var btnRunAiGenerate = document.getElementById("btnRunAiGenerate");
  var btnApplyAiProject = document.getElementById("btnApplyAiProject");
  var aiPromptInput = document.getElementById("aiPromptInput");
  var aiAspectRatio = document.getElementById("aiAspectRatio");
  var aiDuration = document.getElementById("aiDuration");
  var aiPreset = document.getElementById("aiPreset");
  var aiInputSection = document.getElementById("aiInputSection");
  var aiLoadingSection = document.getElementById("aiLoadingSection");
  var aiLoadingStatusText = document.getElementById("aiLoadingStatusText");
  var aiLoadingSubtext = document.getElementById("aiLoadingSubtext");
  var aiResultSection = document.getElementById("aiResultSection");
  var aiResultTitle = document.getElementById("aiResultTitle");
  var aiResultMeta = document.getElementById("aiResultMeta");
  var aiResultAudioBadge = document.getElementById("aiResultAudioBadge");
  var aiStoryboardCards = document.getElementById("aiStoryboardCards");
  var btnOpenAiRevision = document.getElementById("btnOpenAiRevision");
  var aiRevisionModal = document.getElementById("aiRevisionModal");
  var btnCloseAiRevModal = document.getElementById("btnCloseAiRevModal");
  var btnCancelAiRevModal = document.getElementById("btnCancelAiRevModal");
  var btnApplyAiRevision = document.getElementById("btnApplyAiRevision");
  var aiRevTargetScene = document.getElementById("aiRevTargetScene");
  var aiRevPromptInput = document.getElementById("aiRevPromptInput");
  var tabBtnVisualAssets = document.getElementById("tabBtnVisualAssets");
  var tabBtnAudioAssets = document.getElementById("tabBtnAudioAssets");
  var visualAssetsView = document.getElementById("visualAssetsView");
  var audioAssetsView = document.getElementById("audioAssetsView");
  var audioSearchInput = document.getElementById("audioSearchInput");
  var audioFileInput = document.getElementById("audioFileInput");
  var btnTriggerAudioUpload = document.getElementById("btnTriggerAudioUpload");
  var audioDropzone = document.getElementById("audioDropzone");
  var audioUploadProgress = document.getElementById("audioUploadProgress");
  var audioCategoryChips = document.getElementById("audioCategoryChips");
  var audioListContainer = document.getElementById("audioListContainer");
  var tlTimeDisplay = document.getElementById("tlTimeDisplay");
  var tlFrameDisplay = document.getElementById("tlFrameDisplay");
  var tlZoomSlider = document.getElementById("tlZoomSlider");
  var btnTlFit = document.getElementById("btnTlFit");
  var tlTracksScroll = document.getElementById("tlTracksScroll");
  var tlTracksInner = document.getElementById("tlTracksInner");
  var tlRuler = document.getElementById("tlRuler");
  var tlSceneBlocksContainer = document.getElementById("tlSceneBlocksContainer");
  var tlElementBlocksContainer = document.getElementById("tlElementBlocksContainer");
  var tlAudioBlockContainer = document.getElementById("tlAudioBlockContainer");
  var tlPlayheadLine = document.getElementById("tlPlayheadLine");
  var tlPlayheadHandle = document.getElementById("tlPlayheadHandle");
  var promptModal = document.getElementById("promptModal");
  var promptCodeArea = document.getElementById("promptCodeArea");
  var btnCopyModalPrompt = document.getElementById("btnCopyModalPrompt");
  var btnCloseModal = document.getElementById("btnCloseModal");
  var toastNotice = document.getElementById("toastNotice");
  function showToast(message) {
    if (!toastNotice) return;
    toastNotice.textContent = message;
    toastNotice.classList.add("show");
    setTimeout(() => {
      toastNotice.classList.remove("show");
    }, 2200);
  }
  function updateUndoRedoUI() {
    if (btnUndo) btnUndo.disabled = !history.canUndo();
    if (btnRedo) btnRedo.disabled = !history.canRedo();
  }
  function formatTime2(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return String(m).padStart(2, "0") + ":" + String(rem).padStart(2, "0");
  }
  function formatTimeWithFrames(sec, fps = 30) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec - Math.floor(sec)) * fps);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(f).padStart(2, "0")}`;
  }
  function escapeHTML2(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, (tag) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[tag] || tag);
  }
  function getActiveScene() {
    return appProject.scenes.find((s) => String(s.id) === String(selectedSceneId)) || appProject.scenes[0];
  }
  function getActiveElement() {
    const scene = getActiveScene();
    if (!scene || !selectedElementId) return null;
    return scene.elements.find((el) => String(el.id) === String(selectedElementId)) || null;
  }
  function updateStageScale() {
    if (!canvasViewport || !canvasStageWrapper) return;
    const vpWidth = canvasViewport.clientWidth;
    const vpHeight = canvasViewport.clientHeight;
    const stageW = appProject.canvas?.width || 1080;
    const stageH = appProject.canvas?.height || 1920;
    const rawScale = Math.min((vpWidth - 20) / stageW, (vpHeight - 20) / stageH);
    const safeScale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 0.22;
    currentStageScale = Math.max(0.1, Math.min(1.5, safeScale));
    canvasStageWrapper.style.width = `${stageW}px`;
    canvasStageWrapper.style.height = `${stageH}px`;
    canvasStageWrapper.style.transform = `translate(-50%, -50%) scale(${currentStageScale})`;
    if (canvasOverlay) {
      canvasOverlay.style.width = `${stageW}px`;
      canvasOverlay.style.height = `${stageH}px`;
    }
    renderCanvasSelection();
  }
  window.addEventListener("resize", () => {
    updateStageScale();
    renderTimeline();
  });
  if (typeof ResizeObserver !== "undefined" && canvasViewport) {
    const ro = new ResizeObserver(() => {
      updateStageScale();
    });
    ro.observe(canvasViewport);
  }
  function renderSceneList() {
    if (!sceneCardList) return;
    sceneCardList.innerHTML = "";
    if (sceneCountBadge) sceneCountBadge.textContent = appProject.scenes.length;
    appProject.scenes.forEach((scene, index) => {
      const isSelected = String(scene.id) === String(selectedSceneId);
      const card = document.createElement("div");
      card.className = `scene-card-item ${isSelected ? "active" : ""}`;
      card.innerHTML = `
      <div class="scene-card-header">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span class="scene-pill">#${String(index + 1).padStart(2, "0")}</span>
          <span class="scene-card-title">${escapeHTML2(scene.title || scene.name || "Adegan " + (index + 1))}</span>
        </div>
        <span class="scene-card-meta">${scene.duration}s</span>
      </div>
      <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${escapeHTML2(scene.screenText || scene.narration || "Tidak ada teks layar")}
      </div>
      <div class="scene-card-actions" style="margin-top: 4px; justify-content: flex-end;">
        <button type="button" class="btn-mini" data-action="up" title="Geser ke atas" ${index === 0 ? "disabled" : ""}>\u25B2</button>
        <button type="button" class="btn-mini" data-action="down" title="Geser ke bawah" ${index === appProject.scenes.length - 1 ? "disabled" : ""}>\u25BC</button>
        <button type="button" class="btn-mini" data-action="duplicate" title="Duplikasi adegan">\u29C9</button>
        <button type="button" class="btn-mini danger" data-action="delete" title="Hapus adegan" ${appProject.scenes.length <= 1 ? "disabled" : ""}>\u2715</button>
      </div>
    `;
      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        selectScene(scene.id);
      });
      const btnUp = card.querySelector('[data-action="up"]');
      const btnDown = card.querySelector('[data-action="down"]');
      const btnDup = card.querySelector('[data-action="duplicate"]');
      const btnDel = card.querySelector('[data-action="delete"]');
      if (btnUp) btnUp.addEventListener("click", () => {
        history.push(appProject);
        reorderScenes(appProject, index, index - 1);
        renderAll();
        showToast("Urutan adegan dipindahkan.");
      });
      if (btnDown) btnDown.addEventListener("click", () => {
        history.push(appProject);
        reorderScenes(appProject, index, index + 1);
        renderAll();
        showToast("Urutan adegan dipindahkan.");
      });
      if (btnDup) btnDup.addEventListener("click", () => {
        history.push(appProject);
        const cloned = duplicateScene(appProject, scene.id);
        if (cloned) {
          selectScene(cloned.id);
          renderAll();
          showToast("Adegan berhasil diduplikasi.");
        }
      });
      if (btnDel) btnDel.addEventListener("click", () => {
        history.push(appProject);
        const success = deleteScene(appProject, scene.id);
        if (success) {
          selectedSceneId = appProject.scenes[Math.max(0, index - 1)]?.id || appProject.scenes[0]?.id;
          renderAll();
          showToast("Adegan dihapus.");
        }
      });
      sceneCardList.appendChild(card);
    });
  }
  function selectScene(sceneId) {
    selectedSceneId = sceneId;
    selectedElementId = null;
    const scene = getActiveScene();
    if (scene) {
      currentPlayheadTime = scene.startTime || 0;
      sendToStage({ type: "MG_SEEK", time: currentPlayheadTime });
    }
    renderSceneList();
    renderLayerTree();
    syncInspector();
    renderCanvasSelection();
    renderTimeline();
  }
  btnAddScene.addEventListener("click", () => {
    history.push(appProject);
    const newScene = addScene(appProject);
    selectScene(newScene.id);
    renderAll();
    showToast("Adegan baru ditambahkan.");
  });
  function renderLayerTree() {
    if (!layerTreeList) return;
    layerTreeList.innerHTML = "";
    const scene = getActiveScene();
    if (!scene) {
      layerTreeList.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px;">Pilih adegan terlebih dahulu.</div>`;
      return;
    }
    if (activeSceneLayerTitle) {
      activeSceneLayerTitle.textContent = `Layer: ${scene.title || scene.name || "Adegan"}`;
    }
    if (layerCountBadge) {
      layerCountBadge.textContent = (scene.elements || []).length;
    }
    const elements = [...scene.elements || []].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    elements.forEach((el, index) => {
      const isSelected = String(el.id) === String(selectedElementId);
      const item = document.createElement("div");
      item.className = `layer-item ${isSelected ? "active" : ""} ${el.visible === false ? "hidden-layer" : ""}`;
      item.innerHTML = `
      <div class="layer-left">
        <span class="layer-badge">${escapeHTML2(el.type)}</span>
        <span class="layer-name" title="${escapeHTML2(el.name || el.type)}">${escapeHTML2(el.name || el.type)}</span>
      </div>
      <div class="layer-controls">
        <button type="button" class="btn-layer-icon ${el.visible !== false ? "active" : ""}" data-action="toggle-visible" title="Tampilkan/Sembunyikan">
          ${el.visible !== false ? "\u{1F441}\uFE0F" : "\u{1F6AB}"}
        </button>
        <button type="button" class="btn-layer-icon ${el.locked ? "active" : ""}" data-action="toggle-lock" title="Kunci Layer">
          ${el.locked ? "\u{1F512}" : "\u{1F513}"}
        </button>
        <button type="button" class="btn-layer-icon" data-action="dup" title="Duplikasi">\u29C9</button>
        <button type="button" class="btn-layer-icon" data-action="del" title="Hapus" style="color: var(--danger);">\u2715</button>
      </div>
    `;
      item.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        selectElement(el.id);
      });
      const btnVis = item.querySelector('[data-action="toggle-visible"]');
      const btnLock = item.querySelector('[data-action="toggle-lock"]');
      const btnDup = item.querySelector('[data-action="dup"]');
      const btnDel = item.querySelector('[data-action="del"]');
      if (btnVis) btnVis.addEventListener("click", () => {
        history.push(appProject);
        setElementVisibility(appProject, scene.id, el.id, el.visible === false);
        renderAll();
      });
      if (btnLock) btnLock.addEventListener("click", () => {
        history.push(appProject);
        setElementLock(appProject, scene.id, el.id, !el.locked);
        renderAll();
      });
      if (btnDup) btnDup.addEventListener("click", () => {
        history.push(appProject);
        const cloned = duplicateElement(appProject, scene.id, el.id);
        if (cloned) {
          selectElement(cloned.id);
          renderAll();
          showToast("Layer diduplikasi.");
        }
      });
      if (btnDel) btnDel.addEventListener("click", () => {
        history.push(appProject);
        deleteElement(appProject, scene.id, el.id);
        selectedElementId = null;
        renderAll();
        showToast("Layer dihapus.");
      });
      layerTreeList.appendChild(item);
    });
  }
  function selectElement(elementId) {
    selectedElementId = elementId;
    renderLayerTree();
    syncInspector();
    renderCanvasSelection();
    renderTimeline();
  }
  btnAddElement.addEventListener("click", () => {
    const scene = getActiveScene();
    if (!scene) return;
    const type = selNewElementType ? selNewElementType.value : "text";
    const elCount = (scene.elements || []).length + 1;
    let newElementData = {
      type,
      name: `${type.toUpperCase()} ${elCount}`,
      position: { x: 120, y: 300 + elCount * 40 % 600 },
      size: { width: 400, height: 120 },
      zIndex: elCount,
      visible: true,
      locked: false
    };
    if (type === "text") {
      newElementData.content = "Teks Baru Layer";
      newElementData.size = { width: 700, height: 140 };
      newElementData.styling = {
        fontSize: 64,
        fontWeight: 800,
        color: appProject.theme?.colors?.text || "#ffffff"
      };
      newElementData.animation = { type: "slide", delay: 0.1, duration: 0.5 };
    } else if (type === "shape") {
      newElementData.size = { width: 500, height: 250 };
      newElementData.styling = {
        backgroundColor: "rgba(0, 61, 165, 0.4)",
        borderColor: appProject.theme?.colors?.accent || "#f0a500",
        borderWidth: 2,
        borderRadius: 16
      };
      newElementData.animation = { type: "fade", delay: 0.1, duration: 0.4 };
    } else if (type === "logo") {
      newElementData.size = { width: 160, height: 160 };
      newElementData.animation = { type: "scale", delay: 0.1, duration: 0.6 };
    } else if (type === "svg") {
      newElementData.name = "Perisai Persib";
      newElementData.size = { width: 240, height: 280 };
      newElementData.props = { componentId: "svg_persib_shield" };
      newElementData.assetId = "ast_persib_shield";
      newElementData.animation = { type: "scale", delay: 0.1, duration: 0.5 };
    } else if (type === "image") {
      newElementData.name = "Logo Resmi Persib";
      newElementData.assetUrl = "/public/logos/brand/logo.png";
      newElementData.assetId = "ast_persib_logo";
      newElementData.size = { width: 240, height: 240 };
      newElementData.fitMode = "contain";
      newElementData.animation = { type: "fade", delay: 0.1, duration: 0.5 };
    } else if (type === "component") {
      newElementData.name = "Milestone Data";
      newElementData.content = "100%";
      newElementData.size = { width: 600, height: 150 };
      newElementData.props = { value: "100%", label: "Target Tercapai" };
      newElementData.styling = {
        backgroundColor: "rgba(10, 15, 26, 0.95)",
        borderColor: "#f0a500",
        borderWidth: 2,
        borderRadius: 20
      };
    }
    history.push(appProject);
    const created = addElement(appProject, scene.id, newElementData);
    if (created) {
      selectElement(created.id);
      renderAll();
      showToast(`Layer ${type} berhasil ditambahkan.`);
    }
  });
  function renderCanvasSelection() {
    if (!canvasOverlay) return;
    canvasOverlay.innerHTML = "";
    const scene = getActiveScene();
    const element = getActiveElement();
    if (canvasActiveInfo) {
      const sName = scene ? scene.title || scene.name || "Adegan" : "";
      const eName = element ? ` \u2022 ${element.name || element.type}` : "";
      canvasActiveInfo.textContent = `${sName}${eName}`;
    }
    if (!element || element.visible === false) return;
    const w = parseFloat(element.size?.width) || 200;
    const h = parseFloat(element.size?.height) || 100;
    const x = element.position?.x || 0;
    const y = element.position?.y || 0;
    const box = document.createElement("div");
    box.className = "canvas-selection-box";
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.width = `${w}px`;
    box.style.height = `${h}px`;
    const badge = document.createElement("div");
    badge.className = "canvas-selection-badge";
    const isMissing = element.assetId && !getAssetById(element.assetId) && !element.assetUrl;
    const missingBadge = isMissing ? ' <span style="color:#ef4444;font-weight:bold;">\u26A0\uFE0F Hilang</span>' : "";
    badge.innerHTML = `<span>${escapeHTML2(element.name || element.type)}</span> <span style="font-size: 12px; opacity: 0.85;">${Math.round(w)}\xD7${Math.round(h)}</span>${element.locked ? " \u{1F512}" : ""}${missingBadge}`;
    box.appendChild(badge);
    if (element.locked) {
      box.style.cursor = "not-allowed";
      box.style.borderColor = "#9ca3af";
      badge.style.background = "#4b5563";
      canvasOverlay.appendChild(box);
      return;
    }
    const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    handles.forEach((handleType) => {
      const handle = document.createElement("div");
      handle.className = `canvas-resize-handle handle-${handleType}`;
      handle.dataset.handle = handleType;
      handle.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        initResize(e, handleType, element, box);
      });
      box.appendChild(handle);
    });
    box.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      initMove(e, element, box);
    });
    canvasOverlay.appendChild(box);
  }
  function initMove(e, element, box) {
    e.preventDefault();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startPosX = element.position.x;
    const startPosY = element.position.y;
    let hasMoved = false;
    function onPointerMove(moveEvent) {
      const dx = (moveEvent.clientX - startClientX) / currentStageScale;
      const dy = (moveEvent.clientY - startClientY) / currentStageScale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved = true;
      const newX = Math.round(startPosX + dx);
      const newY = Math.round(startPosY + dy);
      element.position.x = newX;
      element.position.y = newY;
      box.style.left = `${newX}px`;
      box.style.top = `${newY}px`;
      if (propElemX) propElemX.value = newX;
      if (propElemY) propElemY.value = newY;
    }
    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (hasMoved) {
        history.push(appProject);
        compileAndRender();
        sendToStage({ type: "MG_SEEK", time: currentPlayheadTime });
      }
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }
  function initResize(e, handleType, element, box) {
    e.preventDefault();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = element.position.x;
    const startY = element.position.y;
    const startW = parseFloat(element.size.width) || 200;
    const startH = parseFloat(element.size.height) || 100;
    let hasResized = false;
    function onPointerMove(moveEvent) {
      const dx = (moveEvent.clientX - startClientX) / currentStageScale;
      const dy = (moveEvent.clientY - startClientY) / currentStageScale;
      hasResized = true;
      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;
      if (handleType.includes("e")) newW = Math.max(30, startW + dx);
      if (handleType.includes("s")) newH = Math.max(20, startH + dy);
      if (handleType.includes("w")) {
        const allowedW = Math.max(30, startW - dx);
        newX = startX + (startW - allowedW);
        newW = allowedW;
      }
      if (handleType.includes("n")) {
        const allowedH = Math.max(20, startH - dy);
        newY = startY + (startH - allowedH);
        newH = allowedH;
      }
      element.position.x = Math.round(newX);
      element.position.y = Math.round(newY);
      element.size.width = Math.round(newW);
      element.size.height = Math.round(newH);
      box.style.left = `${element.position.x}px`;
      box.style.top = `${element.position.y}px`;
      box.style.width = `${element.size.width}px`;
      box.style.height = `${element.size.height}px`;
      if (propElemX) propElemX.value = element.position.x;
      if (propElemY) propElemY.value = element.position.y;
      if (propElemW) propElemW.value = element.size.width;
      if (propElemH) propElemH.value = element.size.height;
    }
    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (hasResized) {
        history.push(appProject);
        compileAndRender();
        sendToStage({ type: "MG_SEEK", time: currentPlayheadTime });
      }
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }
  if (canvasViewport) {
    canvasViewport.addEventListener("pointerdown", (e) => {
      if (e.target === canvasViewport || e.target === canvasOverlay) {
        selectedElementId = null;
        renderLayerTree();
        syncInspector();
        renderCanvasSelection();
        renderTimeline();
      }
    });
  }
  function syncInspector() {
    const scene = getActiveScene();
    const element = getActiveElement();
    if (element) {
      if (inspectorEmptyNotice) inspectorEmptyNotice.style.display = "none";
      if (sceneInspector) sceneInspector.style.display = "none";
      if (elementInspector) elementInspector.style.display = "flex";
      if (elemInspectorTitle) elemInspectorTitle.textContent = element.name || "Elemen";
      if (elemTypeBadge) elemTypeBadge.textContent = element.type.toUpperCase();
      if (btnInspectorLock) btnInspectorLock.textContent = element.locked ? "\u{1F512}" : "\u{1F513}";
      if (btnInspectorVisible) btnInspectorVisible.textContent = element.visible !== false ? "\u{1F441}\uFE0F" : "\u{1F6AB}";
      if (propElemName) propElemName.value = element.name || "";
      if (propElemX) propElemX.value = element.position?.x || 0;
      if (propElemY) propElemY.value = element.position?.y || 0;
      if (propElemW) propElemW.value = element.size?.width || "auto";
      if (propElemH) propElemH.value = element.size?.height || "auto";
      if (propElemRot) propElemRot.value = element.rotation || 0;
      if (propElemOpacity) propElemOpacity.value = element.opacity !== void 0 ? element.opacity : 1;
      if (inspectorTextGroup) {
        inspectorTextGroup.style.display = element.type === "text" ? "flex" : "none";
      }
      if (propElemContent) propElemContent.value = element.content || "";
      if (propElemHighlight) propElemHighlight.value = element.props?.highlightWord || "";
      if (propElemFontSize) propElemFontSize.value = element.styling?.fontSize || 48;
      if (propElemColor) propElemColor.value = element.styling?.color || "#ffffff";
      const isAssetType = ["image", "svg", "logo", "component"].includes(element.type);
      if (inspectorAssetGroup) {
        inspectorAssetGroup.style.display = isAssetType ? "block" : "none";
      }
      if (propElemAssetId) {
        propElemAssetId.value = element.assetId || element.props?.componentId || element.assetUrl || "";
      }
      if (propElemFitMode) {
        propElemFitMode.value = element.fitMode || "contain";
      }
      if (propElemBgColor) propElemBgColor.value = element.styling?.backgroundColor || "";
      if (propElemRadius) propElemRadius.value = element.styling?.borderRadius || 0;
      if (propElemAnimType) propElemAnimType.value = element.animation?.type || "none";
      if (propElemAnimDelay) propElemAnimDelay.value = element.animation?.delay || 0;
      if (propElemAnimDur) propElemAnimDur.value = element.animation?.duration || 0.5;
    } else if (scene) {
      if (inspectorEmptyNotice) inspectorEmptyNotice.style.display = "none";
      if (elementInspector) elementInspector.style.display = "none";
      if (sceneInspector) sceneInspector.style.display = "flex";
      if (propSceneTitle) propSceneTitle.value = scene.title || scene.name || "";
      if (propSceneDuration) propSceneDuration.value = scene.duration || 5;
      if (propSceneTransitionType) propSceneTransitionType.value = scene.transition?.type || "none";
      if (propSceneTransitionDir) propSceneTransitionDir.value = scene.transition?.direction || "right";
      if (propSceneNarration) propSceneNarration.value = scene.narration || "";
      if (propSceneVisualAction) propSceneVisualAction.value = scene.visualAction || "";
      syncVoiceoverInspector(scene);
    } else {
      if (inspectorEmptyNotice) inspectorEmptyNotice.style.display = "block";
      if (elementInspector) elementInspector.style.display = "none";
      if (sceneInspector) sceneInspector.style.display = "none";
    }
    const audio = appProject.audio || { enabled: false, bgmUrl: "", volume: 0.8, muted: false };
    if (chkAudioEnabled) chkAudioEnabled.checked = Boolean(audio.enabled);
    if (inpAudioUrl) inpAudioUrl.value = audio.bgmUrl || "";
    if (rngAudioVolume) rngAudioVolume.value = audio.volume !== void 0 ? audio.volume : 0.8;
    if (lblAudioVolume) lblAudioVolume.textContent = `${Math.round((audio.volume !== void 0 ? audio.volume : 0.8) * 100)}%`;
    if (btnAudioMute) btnAudioMute.textContent = audio.muted ? "Unmute" : "Mute";
  }
  function bindInspectorEvents() {
    if (propElemName) propElemName.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        el.name = e.target.value;
        renderLayerTree();
        renderCanvasSelection();
        debouncedHistoryPush();
      }
    });
    const bindPosSize = (input, field, subfield) => {
      if (!input) return;
      input.addEventListener("input", (e) => {
        const el = getActiveElement();
        if (!el) return;
        if (subfield) {
          el[field][subfield] = Number(e.target.value) || 0;
        } else {
          el[field] = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
        }
        renderCanvasSelection();
        debouncedHistoryPush();
      });
    };
    bindPosSize(propElemX, "position", "x");
    bindPosSize(propElemY, "position", "y");
    bindPosSize(propElemW, "size", "width");
    bindPosSize(propElemH, "size", "height");
    if (propElemRot) propElemRot.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        el.rotation = Number(e.target.value) || 0;
        debouncedHistoryPush();
      }
    });
    if (propElemOpacity) propElemOpacity.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        el.opacity = Math.max(0, Math.min(1, Number(e.target.value)));
        debouncedHistoryPush();
      }
    });
    if (propElemContent) propElemContent.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        el.content = e.target.value;
        debouncedHistoryPush();
      }
    });
    if (propElemHighlight) propElemHighlight.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.props) el.props = {};
        el.props.highlightWord = e.target.value;
        debouncedHistoryPush();
      }
    });
    if (propElemFontSize) propElemFontSize.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.styling) el.styling = {};
        el.styling.fontSize = Number(e.target.value) || 24;
        debouncedHistoryPush();
      }
    });
    if (propElemColor) propElemColor.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.styling) el.styling = {};
        el.styling.color = e.target.value;
        debouncedHistoryPush();
      }
    });
    if (propElemBgColor) propElemBgColor.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.styling) el.styling = {};
        el.styling.backgroundColor = e.target.value;
        debouncedHistoryPush();
      }
    });
    if (propElemRadius) propElemRadius.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.styling) el.styling = {};
        el.styling.borderRadius = Number(e.target.value) || 0;
        debouncedHistoryPush();
      }
    });
    if (propElemAnimType) propElemAnimType.addEventListener("change", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.animation) el.animation = {};
        el.animation.type = e.target.value;
        history.push(appProject);
      }
    });
    if (propElemAnimDelay) propElemAnimDelay.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.animation) el.animation = {};
        el.animation.delay = Number(e.target.value) || 0;
        debouncedHistoryPush();
      }
    });
    if (propElemAnimDur) propElemAnimDur.addEventListener("input", (e) => {
      const el = getActiveElement();
      if (el) {
        if (!el.animation) el.animation = {};
        el.animation.duration = Number(e.target.value) || 0.5;
        debouncedHistoryPush();
      }
    });
    if (propElemFitMode) propElemFitMode.addEventListener("change", (e) => {
      const el = getActiveElement();
      if (el) {
        el.fitMode = e.target.value;
        renderStagePreview();
        history.push(appProject);
      }
    });
    if (btnInspectChangeAsset) btnInspectChangeAsset.addEventListener("click", () => {
      openAssetBrowserModal("replace");
    });
    if (btnInspectRemoveAsset) btnInspectRemoveAsset.addEventListener("click", () => {
      const el = getActiveElement();
      if (el) {
        history.push(appProject);
        el.assetId = "";
        el.assetUrl = "";
        if (el.props) delete el.props.componentId;
        syncInspector();
        renderCanvasSelection();
        renderStagePreview();
        showToast("Aset dilepas dari elemen.");
      }
    });
    if (btnInspectorLock) btnInspectorLock.addEventListener("click", () => {
      const el = getActiveElement();
      const sc = getActiveScene();
      if (el && sc) {
        history.push(appProject);
        setElementLock(appProject, sc.id, el.id, !el.locked);
        renderAll();
      }
    });
    if (btnInspectorVisible) btnInspectorVisible.addEventListener("click", () => {
      const el = getActiveElement();
      const sc = getActiveScene();
      if (el && sc) {
        history.push(appProject);
        setElementVisibility(appProject, sc.id, el.id, el.visible === false);
        renderAll();
      }
    });
    if (btnInspectorDuplicate) btnInspectorDuplicate.addEventListener("click", () => {
      const el = getActiveElement();
      const sc = getActiveScene();
      if (el && sc) {
        history.push(appProject);
        const cloned = duplicateElement(appProject, sc.id, el.id);
        if (cloned) {
          selectElement(cloned.id);
          renderAll();
        }
      }
    });
    if (btnInspectorDelete) btnInspectorDelete.addEventListener("click", () => {
      const el = getActiveElement();
      const sc = getActiveScene();
      if (el && sc) {
        history.push(appProject);
        deleteElement(appProject, sc.id, el.id);
        selectedElementId = null;
        renderAll();
      }
    });
    if (propSceneTitle) propSceneTitle.addEventListener("input", (e) => {
      const sc = getActiveScene();
      if (sc) {
        sc.title = e.target.value;
        sc.name = e.target.value;
        renderSceneList();
        debouncedHistoryPush();
      }
    });
    if (propSceneDuration) propSceneDuration.addEventListener("change", (e) => {
      const sc = getActiveScene();
      if (sc) {
        history.push(appProject);
        updateSceneProperties(appProject, sc.id, { duration: Number(e.target.value) });
        renderAll();
      }
    });
    if (propSceneTransitionType) propSceneTransitionType.addEventListener("change", (e) => {
      const sc = getActiveScene();
      if (sc) {
        if (!sc.transition) sc.transition = { type: "slash", direction: "right", duration: 0.4 };
        sc.transition.type = e.target.value;
        history.push(appProject);
      }
    });
    if (propSceneTransitionDir) propSceneTransitionDir.addEventListener("change", (e) => {
      const sc = getActiveScene();
      if (sc) {
        if (!sc.transition) sc.transition = { type: "slash", direction: "right", duration: 0.4 };
        sc.transition.direction = e.target.value;
        history.push(appProject);
      }
    });
    if (propSceneNarration) propSceneNarration.addEventListener("input", (e) => {
      const sc = getActiveScene();
      if (sc) {
        sc.narration = e.target.value;
        if (sc.voiceover && sc.voiceover.audioUrl) {
          if (sc.voiceover.sourceText && sc.voiceover.sourceText.trim() !== sc.narration.trim()) {
            sc.voiceover.status = "outdated";
          } else {
            sc.voiceover.status = "ready";
          }
          syncVoiceoverInspector(sc);
        }
        debouncedHistoryPush();
      }
    });
    if (propSceneVisualAction) propSceneVisualAction.addEventListener("input", (e) => {
      const sc = getActiveScene();
      if (sc) {
        sc.visualAction = e.target.value;
        debouncedHistoryPush();
      }
    });
    if (chkAudioEnabled) chkAudioEnabled.addEventListener("change", (e) => {
      history.push(appProject);
      updateAudioProperties(appProject, { enabled: e.target.checked });
      compileAndRender();
      renderTimeline();
    });
    if (selAudioPreset) selAudioPreset.addEventListener("change", (e) => {
      if (e.target.value) {
        history.push(appProject);
        updateAudioProperties(appProject, { bgmUrl: e.target.value, enabled: true });
        if (inpAudioUrl) inpAudioUrl.value = e.target.value;
        if (chkAudioEnabled) chkAudioEnabled.checked = true;
        compileAndRender();
        renderTimeline();
      }
    });
    if (inpAudioUrl) inpAudioUrl.addEventListener("change", (e) => {
      history.push(appProject);
      updateAudioProperties(appProject, { bgmUrl: e.target.value });
      compileAndRender();
      renderTimeline();
    });
    if (rngAudioVolume) rngAudioVolume.addEventListener("input", (e) => {
      const vol = parseFloat(e.target.value);
      updateAudioProperties(appProject, { volume: vol });
      if (lblAudioVolume) lblAudioVolume.textContent = `${Math.round(vol * 100)}%`;
      sendToStage({ type: "MG_SET_AUDIO_VOLUME", volume: vol });
      debouncedHistoryPush();
    });
    if (btnAudioMute) btnAudioMute.addEventListener("click", () => {
      const currentMute = appProject.audio?.muted || false;
      history.push(appProject);
      updateAudioProperties(appProject, { muted: !currentMute });
      if (btnAudioMute) btnAudioMute.textContent = !currentMute ? "Unmute" : "Mute";
      sendToStage({ type: "MG_SET_AUDIO_MUTED", muted: !currentMute });
      renderTimeline();
    });
    bindVoiceoverEvents();
    bindVoiceCloneEvents();
  }
  function renderTimeline() {
    if (!tlRuler || !tlSceneBlocksContainer) return;
    const totalDur = appProject.totalDuration || 30;
    const fps = appProject.fps || 30;
    const laneLabelWidth = 90;
    const trackWidth = Math.max(1e3, totalDur * timelinePxPerSec + 120);
    if (tlTracksInner) tlTracksInner.style.width = `${trackWidth}px`;
    tlRuler.innerHTML = "";
    for (let s = 0; s <= Math.ceil(totalDur); s++) {
      const leftPx = laneLabelWidth + s * timelinePxPerSec;
      if (s % 5 === 0 || s === 0) {
        const label = document.createElement("div");
        label.className = "timeline-tick-label";
        label.style.left = `${leftPx}px`;
        label.textContent = `${s}s`;
        tlRuler.appendChild(label);
      }
    }
    tlSceneBlocksContainer.innerHTML = "";
    appProject.scenes.forEach((scene) => {
      const isSelected = String(scene.id) === String(selectedSceneId);
      const leftPx = (scene.startTime || 0) * timelinePxPerSec;
      const widthPx = Math.max(30, (scene.duration || 5) * timelinePxPerSec - 2);
      const block = document.createElement("div");
      block.className = `timeline-scene-block ${isSelected ? "active" : ""}`;
      block.style.left = `${leftPx}px`;
      block.style.width = `${widthPx}px`;
      block.textContent = `${scene.order}. ${scene.name || "Adegan"} (${scene.duration}s)`;
      block.addEventListener("click", (e) => {
        e.stopPropagation();
        selectScene(scene.id);
      });
      tlSceneBlocksContainer.appendChild(block);
    });
    if (tlElementBlocksContainer) {
      tlElementBlocksContainer.innerHTML = "";
      const activeScene = getActiveScene();
      if (activeScene && Array.isArray(activeScene.elements)) {
        const sceneStartPx = (activeScene.startTime || 0) * timelinePxPerSec;
        activeScene.elements.forEach((el) => {
          const isSelected = String(el.id) === String(selectedElementId);
          const animDelay = el.animation?.delay || 0;
          const animDur = el.animation?.duration || 1;
          const elLeftPx = sceneStartPx + animDelay * timelinePxPerSec;
          const elWidthPx = Math.max(40, animDur * timelinePxPerSec);
          const elBlock = document.createElement("div");
          elBlock.className = `timeline-element-block ${isSelected ? "active" : ""}`;
          elBlock.style.left = `${elLeftPx}px`;
          elBlock.style.width = `${elWidthPx}px`;
          elBlock.textContent = el.name || el.type;
          elBlock.addEventListener("click", (e) => {
            e.stopPropagation();
            selectElement(el.id);
          });
          tlElementBlocksContainer.appendChild(elBlock);
        });
      }
    }
    if (tlAudioBlockContainer) {
      tlAudioBlockContainer.innerHTML = "";
      if (appProject.audio?.enabled) {
        const audioBlock = document.createElement("div");
        audioBlock.className = "timeline-audio-block";
        audioBlock.style.left = "0px";
        audioBlock.style.width = `${totalDur * timelinePxPerSec}px`;
        audioBlock.innerHTML = `<span>\u{1F3B5} BGM: ${appProject.audio.muted ? "(Muted)" : "Active"} \u2022 Vol ${Math.round((appProject.audio.volume ?? 0.8) * 100)}%</span>`;
        tlAudioBlockContainer.appendChild(audioBlock);
      }
    }
    updatePlayheadUI(currentPlayheadTime);
  }
  function updatePlayheadUI(time) {
    const laneLabelWidth = 90;
    const leftPx = laneLabelWidth + time * timelinePxPerSec;
    if (tlPlayheadLine) tlPlayheadLine.style.left = `${leftPx}px`;
    const totalDur = appProject.totalDuration || 30;
    const fps = appProject.fps || 30;
    if (tlTimeDisplay) {
      tlTimeDisplay.textContent = `${formatTimeWithFrames(time, fps)} / ${formatTimeWithFrames(totalDur, fps)}`;
    }
    if (tlFrameDisplay) {
      const curFrame = Math.round(time * fps);
      const totalFrames = Math.round(totalDur * fps);
      tlFrameDisplay.textContent = `(Frame ${curFrame} / ${totalFrames} @ ${fps} FPS)`;
    }
    if (parentTimeScrubber) {
      parentTimeScrubber.value = time;
      parentTimeScrubber.max = totalDur;
    }
    if (parentTimeDisplay) {
      parentTimeDisplay.textContent = `${formatTime2(time)} / ${formatTime2(totalDur)}`;
    }
  }
  if (tlTracksScroll) {
    let isScrubbing = false;
    const seekFromClientX = (clientX) => {
      const rect = tlTracksInner.getBoundingClientRect();
      const laneLabelWidth = 90;
      const xInTracks = clientX - rect.left - laneLabelWidth;
      const newTime = Math.max(0, Math.min(appProject.totalDuration, xInTracks / timelinePxPerSec));
      currentPlayheadTime = newTime;
      updatePlayheadUI(newTime);
      sendToStage({ type: "MG_SEEK", time: newTime });
    };
    tlTracksScroll.addEventListener("pointerdown", (e) => {
      isScrubbing = true;
      seekFromClientX(e.clientX);
    });
    window.addEventListener("pointermove", (e) => {
      if (isScrubbing) {
        seekFromClientX(e.clientX);
      }
    });
    window.addEventListener("pointerup", () => {
      isScrubbing = false;
    });
  }
  if (tlZoomSlider) {
    tlZoomSlider.addEventListener("input", (e) => {
      timelinePxPerSec = parseInt(e.target.value, 10);
      renderTimeline();
    });
  }
  if (btnTlFit) {
    btnTlFit.addEventListener("click", () => {
      const scrollW = tlTracksScroll ? tlTracksScroll.clientWidth - 140 : 800;
      const dur = appProject.totalDuration || 30;
      timelinePxPerSec = Math.max(20, Math.min(100, Math.floor(scrollW / dur)));
      if (tlZoomSlider) tlZoomSlider.value = timelinePxPerSec;
      renderTimeline();
    });
  }
  var btnToggleTimeline = document.getElementById("btnToggleTimeline");
  var studioTimelineWorkspace = document.querySelector(".studio-timeline-workspace");
  var studioLayout = document.querySelector(".studio-layout");
  if (btnToggleTimeline && studioTimelineWorkspace) {
    btnToggleTimeline.addEventListener("click", () => {
      const isCollapsed = studioTimelineWorkspace.classList.toggle("collapsed");
      if (studioLayout) studioLayout.classList.toggle("timeline-collapsed", isCollapsed);
      btnToggleTimeline.textContent = isCollapsed ? "\u25B2" : "\u25BC";
      btnToggleTimeline.title = isCollapsed ? "Bentangkan linimasa" : "Ciutkan linimasa";
      setTimeout(() => {
        updateStageScale();
        renderTimeline();
      }, 220);
    });
  }
  function syncConceptToForm() {
    if (formTopic) formTopic.value = appProject.videoTitle || appProject.name;
    if (formCategory) formCategory.value = appProject.metadata?.category || "Hasil Pertandingan";
    if (formAngle) formAngle.value = appProject.metadata?.angle || "";
    if (formAudience) formAudience.value = appProject.metadata?.audience || "";
    if (formGoal) formGoal.value = appProject.metadata?.goal || "";
    if (formTone) formTone.value = appProject.metadata?.tone || "";
    if (formDuration) formDuration.value = Math.round(appProject.totalDuration || 30);
    if (formMetaphor) formMetaphor.value = appProject.metadata?.metaphor || "card";
    const activePreset = appProject.metadata?.preset || "preset_b";
    presetButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.presetVal === activePreset);
    });
    const colors = appProject.theme?.colors || {
      primary: "#003da5",
      secondary: "#0a0a0a",
      text: "#ffffff",
      accent: "#f0a500"
    };
    if (colorPrimary) colorPrimary.value = colors.primary;
    if (colorSecondary) colorSecondary.value = colors.secondary;
    if (colorText) colorText.value = colors.text;
    if (colorAccent) colorAccent.value = colors.accent;
    if (hexPrimary) hexPrimary.textContent = colors.primary;
    if (hexSecondary) hexSecondary.textContent = colors.secondary;
    if (hexText) hexText.textContent = colors.text;
    if (hexAccent) hexAccent.textContent = colors.accent;
  }
  function bindConceptFormEvents() {
    if (formTopic) formTopic.addEventListener("input", (e) => {
      appProject.videoTitle = e.target.value;
      appProject.name = e.target.value;
      debouncedHistoryPush();
    });
    if (formCategory) formCategory.addEventListener("change", (e) => {
      if (!appProject.metadata) appProject.metadata = {};
      appProject.metadata.category = e.target.value;
      history.push(appProject);
      compileAndRender();
    });
    if (formAngle) formAngle.addEventListener("input", (e) => {
      if (!appProject.metadata) appProject.metadata = {};
      appProject.metadata.angle = e.target.value;
      debouncedHistoryPush();
    });
    if (formAudience) formAudience.addEventListener("change", (e) => {
      if (!appProject.metadata) appProject.metadata = {};
      appProject.metadata.audience = e.target.value;
      history.push(appProject);
    });
    if (formGoal) formGoal.addEventListener("change", (e) => {
      if (!appProject.metadata) appProject.metadata = {};
      appProject.metadata.goal = e.target.value;
      history.push(appProject);
    });
    if (formTone) formTone.addEventListener("change", (e) => {
      if (!appProject.metadata) appProject.metadata = {};
      appProject.metadata.tone = e.target.value;
      history.push(appProject);
    });
    if (formDuration) formDuration.addEventListener("change", (e) => {
      const newDur = Math.max(5, parseInt(e.target.value, 10));
      history.push(appProject);
      scaleDuration(newDur);
    });
    if (formMetaphor) formMetaphor.addEventListener("change", (e) => {
      if (!appProject.metadata) appProject.metadata = {};
      appProject.metadata.metaphor = e.target.value;
      history.push(appProject);
      compileAndRender();
    });
    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const presetVal = btn.dataset.presetVal;
        history.push(appProject);
        if (!appProject.metadata) appProject.metadata = {};
        appProject.metadata.preset = presetVal;
        if (presetVal === "preset_a") {
          appProject.theme.colors = { primary: "#003da5", secondary: "#fef3c7", text: "#0f172a", accent: "#d97706" };
          appProject.metadata.metaphor = "chart";
        } else if (presetVal === "preset_c") {
          appProject.theme.colors = { primary: "#003da5", secondary: "#090d16", text: "#ffffff", accent: "#f0a500" };
          appProject.metadata.metaphor = "meter";
        } else {
          appProject.theme.colors = { primary: "#003da5", secondary: "#0a0a0a", text: "#ffffff", accent: "#f0a500" };
          appProject.metadata.metaphor = "card";
        }
        syncConceptToForm();
        compileAndRender();
      });
    });
    const bindColor = (input, hex, key) => {
      if (!input) return;
      input.addEventListener("input", (e) => {
        const val = e.target.value;
        if (hex) hex.textContent = val;
        if (!appProject.theme.colors) appProject.theme.colors = {};
        appProject.theme.colors[key] = val;
        debouncedHistoryPush();
      });
    };
    bindColor(colorPrimary, hexPrimary, "primary");
    bindColor(colorSecondary, hexSecondary, "secondary");
    bindColor(colorText, hexText, "text");
    bindColor(colorAccent, hexAccent, "accent");
    if (btnResetFramework) {
      btnResetFramework.addEventListener("click", () => {
        if (PERSIB_TABS[activeTabId]) {
          history.push(appProject);
          tabProjectCache[activeTabId] = migrateLegacyTemplateToProject(PERSIB_TABS[activeTabId]);
          appProject = tabProjectCache[activeTabId];
          selectedSceneId = appProject.scenes[0]?.id || "sc_1";
          selectedElementId = null;
          renderAll();
          showToast("Format direset ke bawaan!");
        }
      });
    }
  }
  function scaleDuration(dur) {
    const currentTotal = appProject.scenes.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    if (currentTotal > 0) {
      appProject.scenes.forEach((s) => {
        s.duration = Math.max(1, Math.round(s.duration / currentTotal * dur));
      });
    }
    recalculateSceneTimings(appProject);
    renderAll();
  }
  panelTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.panelTab;
      panelTabButtons.forEach((b) => {
        const isActive = b.dataset.panelTab === tabName;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      if (tabContentScenes) tabContentScenes.style.display = tabName === "scenes" ? "flex" : "none";
      if (tabContentLayers) tabContentLayers.style.display = tabName === "layers" ? "flex" : "none";
      if (tabContentConcept) tabContentConcept.style.display = tabName === "concept" ? "flex" : "none";
    });
  });
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tabId;
      if (tabProjectCache[tabId]) {
        tabProjectCache[activeTabId] = JSON.parse(JSON.stringify(appProject));
        activeTabId = tabId;
        tabButtons.forEach((b) => {
          b.classList.toggle("active", b.dataset.tabId === tabId);
        });
        appProject = tabProjectCache[tabId];
        selectedSceneId = appProject.scenes[0]?.id || "sc_1";
        selectedElementId = null;
        renderAll();
        showToast(`Format "${PERSIB_TABS[tabId]?.name || tabId}" aktif!`);
      }
    });
  });
  function compileAndRender() {
    if (btnGenerate) {
      btnGenerate.disabled = true;
      btnGenerate.textContent = "Mengompilasi...";
    }
    try {
      const compiledHTML = generateMotionGraphicHTML(appProject);
      stageIframe.srcdoc = compiledHTML;
      showToast("Pratinjau visual berhasil diperbarui!");
    } catch (err) {
      console.error("Compilation error:", err);
      showToast("Terjadi kesalahan saat kompilasi visual.");
    } finally {
      if (btnGenerate) {
        setTimeout(() => {
          btnGenerate.disabled = false;
          btnGenerate.textContent = "Kompilasi Preview";
        }, 350);
      }
    }
  }
  if (btnGenerate) btnGenerate.addEventListener("click", compileAndRender);
  function renderAll() {
    if (selectCanvasRatio) {
      selectCanvasRatio.value = appProject.aspectRatio || "9:16";
    }
    syncConceptToForm();
    renderSceneList();
    renderLayerTree();
    syncInspector();
    updateStageScale();
    renderTimeline();
    compileAndRender();
  }
  function sendToStage(message) {
    if (stageIframe && stageIframe.contentWindow) {
      try {
        stageIframe.contentWindow.postMessage(message, "*");
      } catch (e) {
      }
    }
  }
  if (btnParentPlayPause) {
    btnParentPlayPause.addEventListener("click", () => {
      sendToStage({ type: "MG_TOGGLE_PLAY" });
    });
  }
  if (btnParentRestart) {
    btnParentRestart.addEventListener("click", () => {
      sendToStage({ type: "MG_RESTART" });
    });
  }
  if (parentTimeScrubber) {
    parentTimeScrubber.addEventListener("input", (e) => {
      const seekTime = parseFloat(e.target.value);
      currentPlayheadTime = seekTime;
      sendToStage({ type: "MG_PAUSE" });
      sendToStage({ type: "MG_SEEK", time: seekTime });
      updatePlayheadUI(seekTime);
    });
  }
  if (parentSpeedSelect) {
    parentSpeedSelect.addEventListener("change", (e) => {
      sendToStage({ type: "MG_SET_SPEED", speed: parseFloat(e.target.value) });
    });
  }
  if (btnParentRecordMode) {
    btnParentRecordMode.addEventListener("click", () => {
      sendToStage({ type: "MG_START_RECORD" });
    });
  }
  window.addEventListener("message", (e) => {
    if (!e.data || e.data.type !== "MG_TIMELINE_UPDATE") return;
    const { currentTime, duration, isPlaying: stagePlaying } = e.data;
    isPlaying = stagePlaying;
    currentPlayheadTime = currentTime;
    updatePlayheadUI(currentTime);
    if (parentIconPlay) {
      parentIconPlay.textContent = isPlaying ? "\u275A\u275A Jeda" : "\u25B6 Putar";
    }
  });
  function performUndo() {
    const previous = history.undo(appProject);
    if (previous) {
      appProject = previous;
      tabProjectCache[activeTabId] = appProject;
      selectedSceneId = appProject.scenes[0]?.id || "sc_1";
      selectedElementId = null;
      renderAll();
      showToast("Undo berhasil.");
    }
  }
  function performRedo() {
    const next = history.redo(appProject);
    if (next) {
      appProject = next;
      tabProjectCache[activeTabId] = appProject;
      selectedSceneId = appProject.scenes[0]?.id || "sc_1";
      selectedElementId = null;
      renderAll();
      showToast("Redo berhasil.");
    }
  }
  if (btnUndo) btnUndo.addEventListener("click", performUndo);
  if (btnRedo) btnRedo.addEventListener("click", performRedo);
  window.addEventListener("keydown", (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      performUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      performRedo();
    } else if (e.code === "Space" && !isInput) {
      e.preventDefault();
      sendToStage({ type: "MG_TOGGLE_PLAY" });
    } else if ((e.key === "Delete" || e.key === "Backspace") && !isInput && selectedElementId) {
      const sc = getActiveScene();
      if (sc) {
        history.push(appProject);
        deleteElement(appProject, sc.id, selectedElementId);
        selectedElementId = null;
        renderAll();
        showToast("Element dihapus.");
      }
    }
  });
  var currentAssetCategory = "All";
  var assetSearchQuery = "";
  var selectedModalAssetId = null;
  var assetModalTargetMode = "add";
  if (selectCanvasRatio) {
    selectCanvasRatio.addEventListener("change", (e) => {
      const val = e.target.value;
      let width = 1080;
      let height = 1920;
      if (val === "16:9") {
        width = 1920;
        height = 1080;
      } else if (val === "1:1") {
        width = 1080;
        height = 1080;
      }
      history.push(appProject);
      appProject.canvas.width = width;
      appProject.canvas.height = height;
      appProject.aspectRatio = val;
      updateStageScale();
      renderStagePreview();
      renderCanvasSelection();
      showToast(`Rasio kanvas diubah ke ${val} (${width}\xD7${height})`);
    });
  }
  function openAssetBrowserModal(mode = "add") {
    assetModalTargetMode = mode;
    selectedModalAssetId = null;
    if (assetBrowserModal) assetBrowserModal.style.display = "flex";
    renderAssetCategories();
    renderAssetGallery();
    updateModalSelectionUI();
  }
  function closeAssetBrowserModal() {
    if (assetBrowserModal) assetBrowserModal.style.display = "none";
  }
  function renderAssetCategories() {
    if (!assetCategoryChips) return;
    assetCategoryChips.innerHTML = "";
    ASSET_CATEGORIES.forEach((cat) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `asset-chip ${currentAssetCategory.toLowerCase() === cat.toLowerCase() ? "active" : ""}`;
      chip.textContent = cat;
      chip.addEventListener("click", () => {
        currentAssetCategory = cat;
        renderAssetCategories();
        renderAssetGallery();
      });
      assetCategoryChips.appendChild(chip);
    });
  }
  function renderAssetGallery() {
    if (!assetGalleryGrid) return;
    assetGalleryGrid.innerHTML = "";
    const assets = filterAssets(currentAssetCategory, assetSearchQuery);
    if (assets.length === 0) {
      assetGalleryGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px;">Tidak ada aset yang cocok dengan filter atau pencarian.</div>`;
      return;
    }
    assets.forEach((asset) => {
      const card = document.createElement("div");
      card.className = `asset-card ${selectedModalAssetId === asset.id ? "selected" : ""}`;
      card.dataset.assetId = asset.id;
      let thumbHtml = "";
      if (asset.fileType === "svg-component" && asset.componentId) {
        thumbHtml = renderSvgComponent(asset.componentId, { width: 120, height: 90 });
      } else if (asset.fileUrl) {
        thumbHtml = `<img src="${asset.fileUrl}" alt="${escapeHTML2(asset.name)}" loading="lazy" />`;
      } else {
        thumbHtml = `<span style="font-size: 28px;">\u{1F4C1}</span>`;
      }
      const isCustom = asset.category === "Custom Upload" || asset.id.startsWith("ast_up_");
      card.innerHTML = `
      <div class="asset-card-thumb">${thumbHtml}</div>
      <div class="asset-card-info">
        <div class="asset-card-name" title="${escapeHTML2(asset.name)}">${escapeHTML2(asset.name)}</div>
        <div class="asset-card-meta">
          <span>${asset.fileType.toUpperCase()}</span>
          <span>${asset.width}\xD7${asset.height}</span>
        </div>
      </div>
      <div class="asset-card-actions">
        <span class="asset-card-badge">${escapeHTML2(asset.category)}</span>
        ${isCustom ? `<button type="button" class="asset-delete-btn" title="Hapus aset kustom" data-del-id="${asset.id}">\u{1F5D1}\uFE0F</button>` : ""}
      </div>
    `;
      card.addEventListener("click", (e) => {
        if (e.target.closest(".asset-delete-btn")) return;
        selectedModalAssetId = asset.id;
        document.querySelectorAll(".asset-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        updateModalSelectionUI();
      });
      card.addEventListener("dblclick", () => {
        selectedModalAssetId = asset.id;
        applySelectedAssetToProject();
      });
      if (isCustom) {
        const delBtn = card.querySelector(".asset-delete-btn");
        if (delBtn) {
          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleDeleteCustomAsset(asset.id);
          });
        }
      }
      assetGalleryGrid.appendChild(card);
    });
  }
  function updateModalSelectionUI() {
    const asset = getAssetById(selectedModalAssetId);
    if (!asset) {
      if (assetSelectedInfo) assetSelectedInfo.textContent = "Pilih salah satu aset untuk digunakan.";
      if (btnApplySelectedAsset) btnApplySelectedAsset.disabled = true;
      return;
    }
    if (assetSelectedInfo) {
      assetSelectedInfo.innerHTML = `<strong>${escapeHTML2(asset.name)}</strong> (${asset.category}) \u2022 ${asset.width}\xD7${asset.height}px \u2022 ${asset.fileType.toUpperCase()}`;
    }
    if (btnApplySelectedAsset) {
      btnApplySelectedAsset.disabled = false;
      btnApplySelectedAsset.textContent = assetModalTargetMode === "replace" ? "Ganti Aset pada Elemen" : "Tambahkan ke Adegan";
    }
  }
  function applySelectedAssetToProject() {
    const asset = getAssetById(selectedModalAssetId);
    if (!asset) return;
    const scene = getActiveScene();
    if (!scene) {
      showToast("Pilih adegan terlebih dahulu.");
      return;
    }
    if (assetModalTargetMode === "replace") {
      const element = getActiveElement();
      if (!element) {
        showToast("Pilih elemen terlebih dahulu untuk diganti.");
        return;
      }
      history.push(appProject);
      element.assetId = asset.id;
      if (asset.fileType === "svg-component") {
        element.type = "svg";
        if (!element.props) element.props = {};
        element.props.componentId = asset.componentId;
        element.assetUrl = "";
      } else {
        element.type = "image";
        element.assetUrl = asset.fileUrl;
        if (element.props) delete element.props.componentId;
      }
      element.size.width = asset.width || 300;
      element.size.height = asset.height || 300;
      renderCanvasSelection();
      syncInspector();
      renderStagePreview();
      showToast(`Aset "${asset.name}" diterapkan pada elemen.`);
    } else {
      history.push(appProject);
      const isSvg = asset.fileType === "svg-component";
      const w = asset.width || 300;
      const h = asset.height || 300;
      const canvasW = appProject.canvas?.width || 1080;
      const canvasH = appProject.canvas?.height || 1920;
      const newEl = {
        type: isSvg ? "svg" : "image",
        name: asset.name,
        assetId: asset.id,
        assetUrl: isSvg ? "" : asset.fileUrl,
        fitMode: "contain",
        position: {
          x: Math.round((canvasW - w) / 2),
          y: Math.round((canvasH - h) / 2)
        },
        size: { width: w, height: h },
        props: isSvg ? { componentId: asset.componentId } : {},
        visible: true,
        locked: false,
        zIndex: (scene.elements || []).length + 1
      };
      const created = addElement(appProject, scene.id, newEl);
      if (created) {
        selectElement(created.id);
        renderAll();
        showToast(`Aset "${asset.name}" ditambahkan ke ${scene.title || scene.name}.`);
      }
    }
    closeAssetBrowserModal();
  }
  function handleDeleteCustomAsset(assetId) {
    const asset = getAssetById(assetId);
    if (!asset) return;
    const usage = checkAssetUsage(appProject, assetId);
    if (usage.inUse) {
      alert(`Tidak dapat menghapus aset!
Aset ini masih digunakan pada ${usage.count} elemen di adegan: ${usage.scenes.join(", ")}.
Hapus atau ganti elemen tersebut terlebih dahulu.`);
      return;
    }
    if (!confirm(`Hapus aset "${asset.name}" secara permanen?`)) return;
    deleteAsset(appProject, assetId, true);
    fetch("/api/assets/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId })
    }).catch(() => {
    });
    if (selectedModalAssetId === assetId) {
      selectedModalAssetId = null;
      updateModalSelectionUI();
    }
    renderAssetGallery();
    showToast(`Aset "${asset.name}" berhasil dihapus.`);
  }
  async function uploadAssetFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file melebihi batas maksimal 5MB.");
      return;
    }
    const validExts = [".png", ".jpg", ".jpeg", ".svg"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!validExts.includes(ext)) {
      alert(`Format file "${ext}" tidak didukung. Harap gunakan format PNG, JPG, atau SVG.`);
      return;
    }
    if (uploadProgress) {
      uploadProgress.style.display = "block";
      uploadProgress.textContent = `Mengunggah ${file.name}...`;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "Custom Upload");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Gagal mengunggah file." }));
        throw new Error(errData.error || `Upload gagal (${res.status})`);
      }
      const data = await res.json();
      if (data.success && data.asset) {
        addUploadedAsset(data.asset);
        selectedModalAssetId = data.asset.id;
        currentAssetCategory = "Custom Upload";
        renderAssetCategories();
        renderAssetGallery();
        updateModalSelectionUI();
        showToast(`File "${file.name}" berhasil diunggah.`);
      }
    } catch (err) {
      alert(`Gagal mengunggah file: ${err.message}`);
    } finally {
      if (uploadProgress) uploadProgress.style.display = "none";
    }
  }
  if (btnOpenAssetLibrary) {
    btnOpenAssetLibrary.addEventListener("click", () => openAssetBrowserModal("add"));
  }
  if (btnOpenAssetModalFromLayers) {
    btnOpenAssetModalFromLayers.addEventListener("click", () => openAssetBrowserModal("add"));
  }
  if (btnCloseAssetModal) {
    btnCloseAssetModal.addEventListener("click", closeAssetBrowserModal);
  }
  if (btnCancelAssetModal) {
    btnCancelAssetModal.addEventListener("click", closeAssetBrowserModal);
  }
  if (btnApplySelectedAsset) {
    btnApplySelectedAsset.addEventListener("click", applySelectedAssetToProject);
  }
  if (assetSearchInput) {
    assetSearchInput.addEventListener("input", (e) => {
      assetSearchQuery = e.target.value;
      renderAssetGallery();
    });
  }
  if (btnTriggerUpload && assetFileInput) {
    btnTriggerUpload.addEventListener("click", () => assetFileInput.click());
    assetFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadAssetFile(e.target.files[0]);
        e.target.value = "";
      }
    });
  }
  if (assetDropzone) {
    assetDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      assetDropzone.classList.add("dragover");
    });
    assetDropzone.addEventListener("dragleave", () => {
      assetDropzone.classList.remove("dragover");
    });
    assetDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      assetDropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadAssetFile(e.dataTransfer.files[0]);
      }
    });
    assetDropzone.addEventListener("click", () => {
      if (assetFileInput) assetFileInput.click();
    });
  }
  if (typeof fetch === "function") {
    fetch("/api/assets").then((r) => r.json()).then((assets) => {
      if (Array.isArray(assets)) {
        assets.forEach((a) => {
          if (a.category === "Custom Upload" || a.id.startsWith("ast_up_")) {
            try {
              addUploadedAsset(a);
            } catch (e) {
            }
          }
        });
      }
    }).catch(() => {
    });
  }
  var currentAudioCategory = "All";
  var audioSearchQuery = "";
  var previewAudioElement = null;
  if (tabBtnVisualAssets && tabBtnAudioAssets) {
    tabBtnVisualAssets.addEventListener("click", () => {
      tabBtnVisualAssets.classList.add("active");
      tabBtnAudioAssets.classList.remove("active");
      if (visualAssetsView) visualAssetsView.style.display = "flex";
      if (audioAssetsView) audioAssetsView.style.display = "none";
    });
    tabBtnAudioAssets.addEventListener("click", () => {
      tabBtnAudioAssets.classList.add("active");
      tabBtnVisualAssets.classList.remove("active");
      if (visualAssetsView) visualAssetsView.style.display = "none";
      if (audioAssetsView) audioAssetsView.style.display = "flex";
      renderAudioCategories();
      renderAudioList();
    });
  }
  function renderAudioCategories() {
    if (!audioCategoryChips) return;
    audioCategoryChips.innerHTML = "";
    AUDIO_CATEGORIES.forEach((cat) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `asset-chip ${currentAudioCategory.toLowerCase() === cat.toLowerCase() ? "active" : ""}`;
      chip.textContent = cat;
      chip.addEventListener("click", () => {
        currentAudioCategory = cat;
        renderAudioCategories();
        renderAudioList();
      });
      audioCategoryChips.appendChild(chip);
    });
  }
  function renderAudioList() {
    if (!audioListContainer) return;
    audioListContainer.innerHTML = "";
    const audioTracks = filterAudioAssets(currentAudioCategory, audioSearchQuery);
    const activeBgmUrl = appProject.audio?.bgmUrl || "";
    if (audioTracks.length === 0) {
      audioListContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;">Tidak ada trek audio yang cocok.</div>`;
      return;
    }
    audioTracks.forEach((track) => {
      const card = document.createElement("div");
      const isCurrentBgm = activeBgmUrl === track.fileUrl || appProject.audio?.assetId === track.id;
      card.className = `audio-card ${isCurrentBgm ? "active-bgm" : ""}`;
      card.innerHTML = `
      <div class="audio-card-left">
        <button type="button" class="audio-play-btn" title="Dengarkan preview audio">\u25B6</button>
        <div class="audio-meta">
          <div class="audio-title">${escapeHTML2(track.name)} ${isCurrentBgm ? ' <span style="color:#22c55e;font-size:11px;">(Aktif)</span>' : ""}</div>
          <div class="audio-sub">${escapeHTML2(track.category)} \u2022 ${track.duration || 30}s \u2022 ${track.fileType.toUpperCase()}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button type="button" class="btn btn-secondary btn-mini btn-select-bgm" data-track-id="${track.id}">Pilih BGM</button>
      </div>
    `;
      const playBtn = card.querySelector(".audio-play-btn");
      playBtn.addEventListener("click", () => {
        if (previewAudioElement && previewAudioElement.src.includes(track.fileUrl)) {
          if (!previewAudioElement.paused) {
            previewAudioElement.pause();
            playBtn.textContent = "\u25B6";
            return;
          }
        }
        if (previewAudioElement) {
          previewAudioElement.pause();
          document.querySelectorAll(".audio-play-btn").forEach((b) => b.textContent = "\u25B6");
        }
        previewAudioElement = new Audio(track.fileUrl);
        previewAudioElement.volume = track.volume || 0.8;
        previewAudioElement.play().then(() => {
          playBtn.textContent = "\u23F8";
        }).catch(() => {
          playBtn.textContent = "\u25B6";
        });
        previewAudioElement.onended = () => {
          playBtn.textContent = "\u25B6";
        };
      });
      const selectBtn = card.querySelector(".btn-select-bgm");
      selectBtn.addEventListener("click", () => {
        history.push(appProject);
        if (!appProject.audio) appProject.audio = { enabled: true };
        appProject.audio.enabled = true;
        appProject.audio.assetId = track.id;
        appProject.audio.bgmUrl = track.fileUrl;
        appProject.audio.volume = track.volume || 0.85;
        syncInspector();
        renderAudioList();
        compileAndRender();
        showToast(`Audio "${track.name}" dipilih sebagai musik latar proyek.`);
      });
      audioListContainer.appendChild(card);
    });
  }
  if (audioSearchInput) {
    audioSearchInput.addEventListener("input", (e) => {
      audioSearchQuery = e.target.value;
      renderAudioList();
    });
  }
  if (btnTriggerAudioUpload && audioFileInput) {
    btnTriggerAudioUpload.addEventListener("click", () => audioFileInput.click());
    audioFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadAudioFile(e.target.files[0]);
        e.target.value = "";
      }
    });
  }
  if (audioDropzone) {
    audioDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      audioDropzone.classList.add("dragover");
    });
    audioDropzone.addEventListener("dragleave", () => {
      audioDropzone.classList.remove("dragover");
    });
    audioDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      audioDropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadAudioFile(e.dataTransfer.files[0]);
      }
    });
    audioDropzone.addEventListener("click", () => {
      if (audioFileInput) audioFileInput.click();
    });
  }
  async function uploadAudioFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran audio melebihi batas 10MB.");
      return;
    }
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (![".mp3", ".wav"].includes(ext)) {
      alert("Format audio tidak didukung. Harap unggah berkas MP3 atau WAV.");
      return;
    }
    if (audioUploadProgress) {
      audioUploadProgress.style.display = "block";
      audioUploadProgress.textContent = `Mengunggah audio ${file.name}...`;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "Background Music");
      const res = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        throw new Error(`Upload gagal (${res.status})`);
      }
      const data = await res.json();
      if (data.success && data.audio) {
        addUploadedAudio(data.audio);
        renderAudioList();
        showToast(`Audio "${file.name}" berhasil diunggah.`);
      }
    } catch (err) {
      alert(`Gagal upload audio: ${err.message}`);
    } finally {
      if (audioUploadProgress) audioUploadProgress.style.display = "none";
    }
  }
  if (typeof fetch === "function") {
    fetch("/api/audio").then((r) => r.json()).then((tracks) => {
      if (Array.isArray(tracks)) {
        tracks.forEach((t) => {
          if (t.id.startsWith("aud_up_")) {
            try {
              addUploadedAudio(t);
            } catch (e) {
            }
          }
        });
      }
    }).catch(() => {
    });
  }
  var availableTtsProviders = [];
  async function loadTtsProviders() {
    if (typeof fetch !== "function") return;
    try {
      const res = await fetch("/api/tts/providers");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.providers)) {
          availableTtsProviders = data.providers;
          updateTtsVoiceOptions();
        }
      }
    } catch (err) {
      console.error("Gagal memuat provider TTS:", err.message);
    }
  }
  function updateTtsVoiceOptions() {
    if (!selVoProvider || !selVoVoice) return;
    const currentProviderId = selVoProvider.value || "google";
    const currentLang = selVoLanguage ? selVoLanguage.value : "id-ID";
    const provider = availableTtsProviders.find((p) => p.id === currentProviderId);
    if (btnOpenCloneModal) {
      btnOpenCloneModal.style.display = provider?.supportsCustomVoices ? "inline-flex" : "none";
    }
    if (voProviderNotice) {
      if (provider && !provider.configured) {
        voProviderNotice.textContent = `\u26A0\uFE0F ${provider.name} belum dikonfigurasi API Key di .env.`;
      } else {
        const extraNotice = provider?.supportsCustomVoices ? " (Mendukung Voice Cloning)" : "";
        voProviderNotice.textContent = `\u2713 ${provider ? provider.name : "Provider"} aktif.${extraNotice}`;
      }
    }
    if (lblVoParamSecond) {
      if (currentProviderId === "elevenlabs") {
        lblVoParamSecond.innerHTML = `Stabilitas (<span id="valVoPitch">${rangeVoPitch ? rangeVoPitch.value : "0.75"}</span>)`;
        if (rangeVoPitch) {
          rangeVoPitch.min = "0.1";
          rangeVoPitch.max = "1.0";
          rangeVoPitch.step = "0.05";
        }
      } else {
        lblVoParamSecond.innerHTML = `Pitch (<span id="valVoPitch">${rangeVoPitch ? rangeVoPitch.value : "0.0"}</span>)`;
        if (rangeVoPitch) {
          rangeVoPitch.min = "-5.0";
          rangeVoPitch.max = "5.0";
          rangeVoPitch.step = "0.5";
        }
      }
    }
    const prevVoiceVal = selVoVoice.value;
    selVoVoice.innerHTML = "";
    const voices = provider?.voices || [];
    const filtered = voices.filter((v) => !currentLang || v.language && v.language.toLowerCase().startsWith(currentLang.toLowerCase().split("-")[0]));
    const listToRender = filtered.length > 0 ? filtered : voices;
    const customVoices = listToRender.filter((v) => Boolean(v.isCustom));
    const presetVoices = listToRender.filter((v) => !v.isCustom);
    if (customVoices.length > 0) {
      const optGroupCustom = document.createElement("optgroup");
      optGroupCustom.label = "\u2B50 Suara Kustom (Voice Cloning)";
      customVoices.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `\u{1F464} ${v.name}`;
        optGroupCustom.appendChild(opt);
      });
      selVoVoice.appendChild(optGroupCustom);
      const optGroupPreset = document.createElement("optgroup");
      optGroupPreset.label = "\u{1F399}\uFE0F Suara Bawaan (Preset)";
      presetVoices.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = v.name;
        optGroupPreset.appendChild(opt);
      });
      selVoVoice.appendChild(optGroupPreset);
    } else {
      presetVoices.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = v.name;
        selVoVoice.appendChild(opt);
      });
    }
    if (prevVoiceVal && listToRender.some((v) => v.id === prevVoiceVal)) {
      selVoVoice.value = prevVoiceVal;
    }
  }
  function syncVoiceoverInspector(scene) {
    if (!scene || !sceneVoiceoverControlBox) return;
    const vo = scene.voiceover || {
      enabled: true,
      provider: "google",
      voiceId: "id-ID-Standard-A",
      language: "id-ID",
      parameters: { speakingRate: 1, pitch: 0, stability: 0.75 },
      status: "idle"
    };
    if (chkVoEnabled) chkVoEnabled.checked = vo.enabled !== false;
    if (voConfigControls) voConfigControls.style.opacity = vo.enabled !== false ? "1" : "0.45";
    if (selVoProvider) selVoProvider.value = vo.provider || "google";
    if (selVoLanguage) selVoLanguage.value = vo.language || "id-ID";
    updateTtsVoiceOptions();
    if (selVoVoice && vo.voiceId) {
      selVoVoice.value = vo.voiceId;
    }
    const speed = vo.parameters?.speakingRate !== void 0 ? vo.parameters.speakingRate : 1;
    if (rangeVoSpeed) rangeVoSpeed.value = speed;
    if (valVoSpeed) valVoSpeed.textContent = `${Number(speed).toFixed(2)}x`;
    const secondVal = vo.provider === "elevenlabs" ? vo.parameters?.stability !== void 0 ? vo.parameters.stability : 0.75 : vo.parameters?.pitch !== void 0 ? vo.parameters.pitch : 0;
    if (rangeVoPitch) rangeVoPitch.value = secondVal;
    if (valVoPitch) valVoPitch.textContent = vo.provider === "elevenlabs" ? Number(secondVal).toFixed(2) : Number(secondVal) > 0 ? `+${secondVal}` : `${secondVal}`;
    if (voStatusBadge) {
      if (vo.audioUrl && vo.sourceText && scene.narration && vo.sourceText.trim() !== scene.narration.trim()) {
        vo.status = "outdated";
      }
      if (vo.status === "ready") {
        voStatusBadge.className = "badge-vo-ready";
        voStatusBadge.textContent = "\u2713 Tersedia";
      } else if (vo.status === "outdated") {
        voStatusBadge.className = "badge-vo-outdated";
        voStatusBadge.textContent = "\u26A0\uFE0F Teks Berubah";
      } else if (vo.status === "generating") {
        voStatusBadge.className = "badge-vo-generating";
        voStatusBadge.textContent = "Memproses...";
      } else if (vo.status === "error") {
        voStatusBadge.className = "badge-vo-error";
        voStatusBadge.textContent = "Gagal";
      } else {
        voStatusBadge.className = "badge-vo-idle";
        voStatusBadge.textContent = "Belum Dibuat";
      }
    }
    if (voAudioPlayerContainer && voPreviewAudioElement) {
      if (vo.audioUrl && (vo.status === "ready" || vo.status === "outdated")) {
        voAudioPlayerContainer.style.display = "block";
        voPreviewAudioElement.src = vo.audioUrl;
        if (voAudioMetaDuration) {
          voAudioMetaDuration.textContent = `Durasi: ${vo.duration ? Number(vo.duration).toFixed(1) + "s" : "-"}`;
        }
      } else {
        voAudioPlayerContainer.style.display = "none";
        voPreviewAudioElement.removeAttribute("src");
      }
    }
  }
  function bindVoiceoverEvents() {
    if (chkVoEnabled) {
      chkVoEnabled.addEventListener("change", (e) => {
        const scene = getActiveScene();
        if (!scene) return;
        if (!scene.voiceover) {
          scene.voiceover = {
            enabled: e.target.checked,
            provider: selVoProvider ? selVoProvider.value : "google",
            voiceId: selVoVoice ? selVoVoice.value : "id-ID-Standard-A",
            language: selVoLanguage ? selVoLanguage.value : "id-ID",
            parameters: { speakingRate: 1, pitch: 0, stability: 0.75 },
            status: "idle"
          };
        } else {
          scene.voiceover.enabled = e.target.checked;
        }
        if (voConfigControls) voConfigControls.style.opacity = e.target.checked ? "1" : "0.45";
        compileAndRender();
        debouncedHistoryPush();
      });
    }
    if (selVoProvider) {
      selVoProvider.addEventListener("change", (e) => {
        const scene = getActiveScene();
        updateTtsVoiceOptions();
        if (scene) {
          if (!scene.voiceover) scene.voiceover = { enabled: true };
          scene.voiceover.provider = e.target.value;
          if (selVoVoice) scene.voiceover.voiceId = selVoVoice.value;
          debouncedHistoryPush();
        }
      });
    }
    if (selVoLanguage) {
      selVoLanguage.addEventListener("change", (e) => {
        const scene = getActiveScene();
        updateTtsVoiceOptions();
        if (scene) {
          if (!scene.voiceover) scene.voiceover = { enabled: true };
          scene.voiceover.language = e.target.value;
          if (selVoVoice) scene.voiceover.voiceId = selVoVoice.value;
          debouncedHistoryPush();
        }
      });
    }
    if (selVoVoice) {
      selVoVoice.addEventListener("change", (e) => {
        const scene = getActiveScene();
        if (scene) {
          if (!scene.voiceover) scene.voiceover = { enabled: true };
          scene.voiceover.voiceId = e.target.value;
          debouncedHistoryPush();
        }
      });
    }
    if (rangeVoSpeed) {
      rangeVoSpeed.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        if (valVoSpeed) valVoSpeed.textContent = `${val.toFixed(2)}x`;
        const scene = getActiveScene();
        if (scene) {
          if (!scene.voiceover) scene.voiceover = { enabled: true };
          if (!scene.voiceover.parameters) scene.voiceover.parameters = {};
          scene.voiceover.parameters.speakingRate = val;
          debouncedHistoryPush();
        }
      });
    }
    if (rangeVoPitch) {
      rangeVoPitch.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        const isEleven = selVoProvider && selVoProvider.value === "elevenlabs";
        if (valVoPitch) valVoPitch.textContent = isEleven ? val.toFixed(2) : val > 0 ? `+${val}` : `${val}`;
        const scene = getActiveScene();
        if (scene) {
          if (!scene.voiceover) scene.voiceover = { enabled: true };
          if (!scene.voiceover.parameters) scene.voiceover.parameters = {};
          if (isEleven) {
            scene.voiceover.parameters.stability = val;
          } else {
            scene.voiceover.parameters.pitch = val;
          }
          debouncedHistoryPush();
        }
      });
    }
    if (btnPreviewVoSpeech) {
      btnPreviewVoSpeech.addEventListener("click", async () => {
        const scene = getActiveScene();
        const textToSpeak = scene && scene.narration && scene.narration.trim() ? scene.narration.trim() : "Halo Bobotoh, selamat datang di Persib Motion Studio!";
        const providerId = selVoProvider ? selVoProvider.value : "google";
        const voiceId = selVoVoice ? selVoVoice.value : "";
        const language = selVoLanguage ? selVoLanguage.value : "id-ID";
        const speakingRate = rangeVoSpeed ? parseFloat(rangeVoSpeed.value) : 1;
        const secondVal = rangeVoPitch ? parseFloat(rangeVoPitch.value) : 0;
        const parameters = { speakingRate };
        if (providerId === "elevenlabs") {
          parameters.stability = secondVal;
        } else {
          parameters.pitch = secondVal;
        }
        btnPreviewVoSpeech.disabled = true;
        btnPreviewVoSpeech.textContent = "\u{1F50A} Memuat...";
        try {
          const res = await fetch("/api/tts/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: textToSpeak,
              providerId,
              voiceId,
              language,
              parameters,
              forceMock: false
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Gagal memutar sampel suara.");
          }
          if (voPreviewAudioElement) {
            voPreviewAudioElement.src = data.preview.audioUrl;
            if (voAudioPlayerContainer) voAudioPlayerContainer.style.display = "block";
            voPreviewAudioElement.play().catch(() => {
            });
          }
        } catch (err) {
          alert(err.message);
        } finally {
          btnPreviewVoSpeech.disabled = false;
          btnPreviewVoSpeech.textContent = "\u{1F50A} Tes Suara";
        }
      });
    }
    if (btnGenerateVoAudio) {
      btnGenerateVoAudio.addEventListener("click", async () => {
        const scene = getActiveScene();
        if (!scene) return;
        const narrationText = scene.narration || (propSceneNarration ? propSceneNarration.value : "");
        if (!narrationText || !narrationText.trim()) {
          alert("Harap isi teks naskah narasi terlebih dahulu.");
          if (propSceneNarration) propSceneNarration.focus();
          return;
        }
        const providerId = selVoProvider ? selVoProvider.value : "google";
        const voiceId = selVoVoice ? selVoVoice.value : "";
        const language = selVoLanguage ? selVoLanguage.value : "id-ID";
        const speakingRate = rangeVoSpeed ? parseFloat(rangeVoSpeed.value) : 1;
        const secondVal = rangeVoPitch ? parseFloat(rangeVoPitch.value) : 0;
        const parameters = { speakingRate };
        if (providerId === "elevenlabs") {
          parameters.stability = secondVal;
        } else {
          parameters.pitch = secondVal;
        }
        btnGenerateVoAudio.disabled = true;
        if (voGenerateProgress) voGenerateProgress.style.display = "block";
        if (voStatusBadge) {
          voStatusBadge.className = "badge-vo-generating";
          voStatusBadge.textContent = "Memproses...";
        }
        try {
          const oldAudioUrl = scene.voiceover?.audioUrl || null;
          const sceneIdx = appProject.scenes.findIndex((s) => String(s.id) === String(scene.id)) + 1;
          const res = await fetch("/api/tts/synthesize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sceneId: scene.id,
              sceneIndex: sceneIdx,
              text: narrationText.trim(),
              providerId,
              voiceId,
              language,
              parameters,
              oldAudioUrl,
              forceMock: false
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Gagal membuat audio voiceover.");
          }
          history.push(appProject);
          scene.voiceover = data.voiceover;
          if (scene.captions) {
            scene.captions.status = "outdated";
            showToast(`Voiceover diperbarui! Timing subtitle ditandai perlu disinkronkan ulang.`);
          } else {
            showToast(`Voiceover untuk "${scene.name || "Adegan"}" berhasil dibuat!`);
          }
          syncVoiceoverInspector(scene);
          compileAndRender();
          renderTimeline();
        } catch (err) {
          if (voStatusBadge) {
            voStatusBadge.className = "badge-vo-error";
            voStatusBadge.textContent = "Gagal";
          }
          alert(`Gagal membuat voiceover: ${err.message}`);
        } finally {
          btnGenerateVoAudio.disabled = false;
          if (voGenerateProgress) voGenerateProgress.style.display = "none";
        }
      });
    }
    if (btnDeleteVoAudio) {
      btnDeleteVoAudio.addEventListener("click", () => {
        const scene = getActiveScene();
        if (!scene || !scene.voiceover) return;
        if (!confirm("Hapus voiceover untuk adegan ini?")) return;
        history.push(appProject);
        scene.voiceover.audioUrl = "";
        scene.voiceover.assetId = "";
        scene.voiceover.status = "idle";
        scene.voiceover.sourceText = "";
        syncVoiceoverInspector(scene);
        compileAndRender();
        renderTimeline();
        showToast("Voiceover berhasil dihapus.");
      });
    }
  }
  function openVoiceCloneModal() {
    if (voiceCloneModal) voiceCloneModal.style.display = "flex";
    loadCustomVoiceList();
  }
  function closeVoiceCloneModal() {
    if (voiceCloneModal) voiceCloneModal.style.display = "none";
    if (inpCloneVoiceName) inpCloneVoiceName.value = "";
    if (inpCloneVoiceDesc) inpCloneVoiceDesc.value = "";
    if (inpCloneSpeakerName) inpCloneSpeakerName.value = "";
    if (chkCloneConsent) chkCloneConsent.checked = false;
    if (lblCloneAudioFile) lblCloneAudioFile.textContent = "Klik atau seret file rekaman sampel suara ke sini";
    if (fileCloneAudioSample) fileCloneAudioSample.value = "";
    cloneAudioSampleBase64 = null;
    if (cloneProgressNotice) cloneProgressNotice.style.display = "none";
  }
  async function loadCustomVoiceList() {
    if (!customVoiceListContainer) return;
    customVoiceListContainer.innerHTML = '<div style="font-size: 11px; color: var(--text-dim); text-align: center;">Memuat daftar custom voice...</div>';
    try {
      const res = await fetch("/api/tts/custom-voices?provider=elevenlabs");
      const data = await res.json();
      const voices = data.voices || [];
      if (voices.length === 0) {
        customVoiceListContainer.innerHTML = '<div style="font-size: 11px; color: var(--text-dim); padding: 6px 0;">Belum ada custom voice tersimpan.</div>';
        return;
      }
      customVoiceListContainer.innerHTML = "";
      voices.forEach((v) => {
        const item = document.createElement("div");
        item.className = "custom-voice-item";
        item.innerHTML = `
        <div class="custom-voice-info">
          <div class="custom-voice-title">${v.name}</div>
          <div class="custom-voice-meta">
            <span class="badge-custom-voice">CLONED</span>
            <span>\u{1F464} ${v.speakerName || "Pemilik Sah"}</span>
            <span>\u2022 ${v.createdAt ? new Date(v.createdAt).toLocaleDateString("id-ID") : "-"}</span>
          </div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn btn-secondary btn-mini btn-test-clone-voice" data-voice-id="${v.id}" title="Tes suara kustom">
            \u{1F50A} Tes
          </button>
          <button type="button" class="btn btn-secondary btn-mini danger btn-del-clone-voice" data-voice-id="${v.id}" title="Hapus referensi custom voice">
            \u{1F5D1}\uFE0F
          </button>
        </div>
      `;
        customVoiceListContainer.appendChild(item);
      });
      customVoiceListContainer.querySelectorAll(".btn-test-clone-voice").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const voiceId = btn.getAttribute("data-voice-id");
          btn.disabled = true;
          btn.textContent = "\u23F3";
          try {
            const prevRes = await fetch("/api/tts/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: "Halo Bobotoh, ini adalah pratinjau karakter suara kustom saya!",
                providerId: "elevenlabs",
                voiceId,
                forceMock: false
              })
            });
            const prevData = await prevRes.json();
            if (prevData.success && prevData.preview?.audioUrl) {
              const audio = new Audio(prevData.preview.audioUrl);
              audio.play();
            }
          } catch (e) {
            alert(`Gagal memutar sampel: ${e.message}`);
          } finally {
            btn.disabled = false;
            btn.textContent = "\u{1F50A} Tes";
          }
        });
      });
      customVoiceListContainer.querySelectorAll(".btn-del-clone-voice").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const voiceId = btn.getAttribute("data-voice-id");
          if (!confirm("Hapus custom voice ini dari studio?")) return;
          btn.disabled = true;
          try {
            const delRes = await fetch(`/api/tts/custom-voice/${encodeURIComponent(voiceId)}?provider=elevenlabs`, {
              method: "DELETE"
            });
            const delData = await delRes.json();
            if (!delRes.ok || !delData.success) {
              throw new Error(delData.error || "Gagal menghapus custom voice.");
            }
            showToast("Custom voice berhasil dihapus.");
            await loadAvailableTtsProviders();
            loadCustomVoiceList();
          } catch (e) {
            alert(e.message);
          } finally {
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      customVoiceListContainer.innerHTML = `<div style="font-size: 11px; color: #ef4444;">Gagal memuat: ${err.message}</div>`;
    }
  }
  function handleCloneSampleFile(file) {
    if (!file) return;
    const allowed = [".mp3", ".wav", ".ogg", ".m4a"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      alert("Format audio tidak didukung. Harap gunakan file MP3, WAV, OGG, atau M4A.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file audio melebihi batas 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64Index = dataUrl.indexOf(";base64,");
      if (base64Index !== -1) {
        cloneAudioSampleBase64 = dataUrl.substring(base64Index + 8);
        cloneAudioSampleMimeType = file.type || "audio/mpeg";
        if (lblCloneAudioFile) {
          lblCloneAudioFile.textContent = `\u2713 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        }
      }
    };
    reader.readAsDataURL(file);
  }
  function bindVoiceCloneEvents() {
    if (btnOpenCloneModal) {
      btnOpenCloneModal.addEventListener("click", () => openVoiceCloneModal());
    }
    if (btnCloseCloneModal) {
      btnCloseCloneModal.addEventListener("click", () => closeVoiceCloneModal());
    }
    if (btnCancelCloneModal) {
      btnCancelCloneModal.addEventListener("click", () => closeVoiceCloneModal());
    }
    if (dropZoneCloneAudio && fileCloneAudioSample) {
      dropZoneCloneAudio.addEventListener("click", () => fileCloneAudioSample.click());
      fileCloneAudioSample.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleCloneSampleFile(e.target.files[0]);
        }
      });
      dropZoneCloneAudio.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZoneCloneAudio.style.borderColor = "#f0a500";
      });
      dropZoneCloneAudio.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropZoneCloneAudio.style.borderColor = "var(--border-color)";
      });
      dropZoneCloneAudio.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZoneCloneAudio.style.borderColor = "var(--border-color)";
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleCloneSampleFile(e.dataTransfer.files[0]);
        }
      });
    }
    if (btnSubmitVoiceClone) {
      btnSubmitVoiceClone.addEventListener("click", async () => {
        const name = inpCloneVoiceName ? inpCloneVoiceName.value.trim() : "";
        const description = inpCloneVoiceDesc ? inpCloneVoiceDesc.value.trim() : "";
        const speakerName = inpCloneSpeakerName ? inpCloneSpeakerName.value.trim() : "";
        const consentAgreed = chkCloneConsent ? chkCloneConsent.checked : false;
        if (!name) {
          alert("Nama karakter custom voice wajib diisi.");
          if (inpCloneVoiceName) inpCloneVoiceName.focus();
          return;
        }
        if (!speakerName) {
          alert("Nama pemilik suara asli wajib diisi untuk kepatuhan dan audit hak cipta.");
          if (inpCloneSpeakerName) inpCloneSpeakerName.focus();
          return;
        }
        if (!consentAgreed) {
          alert("Deklarasi persetujuan hak cipta dan izin pemilik suara wajib dicentang sebelum melanjutkan.");
          if (chkCloneConsent) chkCloneConsent.focus();
          return;
        }
        if (!cloneAudioSampleBase64) {
          alert("Harap pilih atau seret file sampel rekaman suara terlebih dahulu.");
          return;
        }
        btnSubmitVoiceClone.disabled = true;
        if (cloneProgressNotice) cloneProgressNotice.style.display = "block";
        try {
          const res = await fetch("/api/tts/custom-voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              description,
              speakerName,
              consentAgreed: true,
              rightsConfirmed: true,
              audioBase64: cloneAudioSampleBase64,
              audioMimeType: cloneAudioSampleMimeType,
              providerId: "elevenlabs"
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Gagal membuat custom voice.");
          }
          showToast(`Custom voice "${data.voice.name}" berhasil dibuat!`);
          await loadAvailableTtsProviders();
          if (selVoVoice && data.voice?.id) {
            selVoVoice.value = data.voice.id;
            const scene = getActiveScene();
            if (scene) {
              if (!scene.voiceover) scene.voiceover = { enabled: true };
              scene.voiceover.voiceId = data.voice.id;
              scene.voiceover.isCustomVoice = true;
              scene.voiceover.speakerName = speakerName;
              debouncedHistoryPush();
            }
          }
          closeVoiceCloneModal();
        } catch (err) {
          alert(err.message);
        } finally {
          btnSubmitVoiceClone.disabled = false;
          if (cloneProgressNotice) cloneProgressNotice.style.display = "none";
        }
      });
    }
  }
  var generatedAiProject = null;
  function openAiDirectorModal() {
    if (aiDirectorModal) aiDirectorModal.style.display = "flex";
    if (aiInputSection) aiInputSection.style.display = "flex";
    if (aiLoadingSection) aiLoadingSection.style.display = "none";
    if (aiResultSection) aiResultSection.style.display = "none";
    if (btnRunAiGenerate) btnRunAiGenerate.style.display = "inline-flex";
    if (btnApplyAiProject) btnApplyAiProject.style.display = "none";
  }
  function closeAiDirectorModal() {
    if (aiDirectorModal) aiDirectorModal.style.display = "none";
  }
  if (btnOpenAiDirector) {
    btnOpenAiDirector.addEventListener("click", openAiDirectorModal);
  }
  if (btnCloseAiModal) {
    btnCloseAiModal.addEventListener("click", closeAiDirectorModal);
  }
  if (btnCancelAiModal) {
    btnCancelAiModal.addEventListener("click", closeAiDirectorModal);
  }
  document.querySelectorAll(".ai-chip-prompt").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (aiPromptInput) {
        aiPromptInput.value = chip.dataset.prompt || chip.textContent;
      }
    });
  });
  if (btnRunAiGenerate) {
    btnRunAiGenerate.addEventListener("click", async () => {
      const prompt = (aiPromptInput?.value || "").trim();
      if (!prompt) {
        alert("Silakan ketik instruksi atau pilih contoh prompt video terlebih dahulu.");
        return;
      }
      const aspectRatio = aiAspectRatio?.value || "9:16";
      const duration = Number(aiDuration?.value) || 30;
      const preset = aiPreset?.value || "preset_b";
      if (aiInputSection) aiInputSection.style.display = "none";
      if (aiLoadingSection) aiLoadingSection.style.display = "flex";
      if (btnRunAiGenerate) btnRunAiGenerate.style.display = "none";
      try {
        let result = null;
        if (typeof fetch === "function") {
          try {
            const res = await fetch("/api/ai/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt, aspectRatio, duration, preset })
            });
            if (res.ok) {
              result = await res.json();
            }
          } catch (fetchErr) {
          }
        }
        if (!result || !result.project) {
          const fallbackProj = generateProjectWithHeuristic(prompt, { aspectRatio, duration, preset });
          result = { success: true, project: fallbackProj };
        }
        generatedAiProject = result.project;
        renderAiStoryboard(generatedAiProject);
        if (aiLoadingSection) aiLoadingSection.style.display = "none";
        if (aiResultSection) aiResultSection.style.display = "flex";
        if (btnApplyAiProject) btnApplyAiProject.style.display = "inline-flex";
      } catch (err) {
        alert(`Gagal merancang proyek AI: ${err.message}`);
        if (aiLoadingSection) aiLoadingSection.style.display = "none";
        if (aiInputSection) aiInputSection.style.display = "flex";
        if (btnRunAiGenerate) btnRunAiGenerate.style.display = "inline-flex";
      }
    });
  }
  function renderAiStoryboard(project) {
    if (!project) return;
    if (aiResultTitle) aiResultTitle.textContent = project.videoTitle || project.name || "Draft AI";
    if (aiResultMeta) {
      aiResultMeta.textContent = `${project.scenes.length} Adegan \u2022 Total ${project.totalDuration}s \u2022 Rasio ${project.aspectRatio} (${project.canvas.width}\xD7${project.canvas.height})`;
    }
    if (aiResultAudioBadge) {
      const bgmName = getAudioAssetById(project.audio?.assetId)?.name || "Rock Anthem BGM";
      aiResultAudioBadge.textContent = `\u{1F3B5} ${bgmName}`;
    }
    if (aiStoryboardCards) {
      aiStoryboardCards.innerHTML = "";
      project.scenes.forEach((sc) => {
        const card = document.createElement("div");
        card.className = "storyboard-card";
        const assetTags = (sc.elements || []).map((el) => {
          const aId = el.assetId || el.props?.componentId;
          const name = getAssetById(aId)?.name || el.name || el.type;
          return `<span class="storyboard-asset-tag">\u{1F3F7}\uFE0F ${escapeHTML2(name)}</span>`;
        }).join("");
        card.innerHTML = `
        <div class="storyboard-header">
          <span class="storyboard-title">Adegan ${sc.order}: ${escapeHTML2(sc.title || sc.name)}</span>
          <span class="storyboard-duration">\u23F1\uFE0F ${sc.duration} detik</span>
        </div>
        <div class="storyboard-text">"${escapeHTML2(sc.screenText || "")}"</div>
        <div class="storyboard-narration">${escapeHTML2(sc.narration || "")}</div>
        <div class="storyboard-assets">${assetTags || '<span style="font-size: 10px; color: var(--text-muted);">Tipografi & Grafis Standar</span>'}</div>
      `;
        aiStoryboardCards.appendChild(card);
      });
    }
  }
  if (btnApplyAiProject) {
    btnApplyAiProject.addEventListener("click", () => {
      if (!generatedAiProject) return;
      history.push(appProject);
      appProject = generatedAiProject;
      selectedSceneId = appProject.scenes[0]?.id || "sc_1";
      selectedElementId = null;
      closeAiDirectorModal();
      renderAll();
      showToast(`Proyek AI "${appProject.videoTitle}" berhasil dimuat ke editor!`);
    });
  }
  function openAiRevisionModal() {
    if (aiRevisionModal) aiRevisionModal.style.display = "flex";
    if (aiRevTargetScene) {
      aiRevTargetScene.innerHTML = `<option value="auto">Deteksi Otomatis dari Instruksi</option>`;
      appProject.scenes.forEach((sc) => {
        const opt = document.createElement("option");
        opt.value = sc.id;
        opt.textContent = `Adegan ${sc.order}: ${sc.title || sc.name}`;
        if (sc.id === selectedSceneId) opt.selected = true;
        aiRevTargetScene.appendChild(opt);
      });
    }
  }
  function closeAiRevisionModal() {
    if (aiRevisionModal) aiRevisionModal.style.display = "none";
  }
  if (btnOpenAiRevision) {
    btnOpenAiRevision.addEventListener("click", openAiRevisionModal);
  }
  if (btnCloseAiRevModal) {
    btnCloseAiRevModal.addEventListener("click", closeAiRevisionModal);
  }
  if (btnCancelAiRevModal) {
    btnCancelAiRevModal.addEventListener("click", closeAiRevisionModal);
  }
  document.querySelectorAll(".ai-rev-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (aiRevPromptInput) {
        aiRevPromptInput.value = chip.dataset.prompt || chip.textContent;
      }
    });
  });
  if (btnApplyAiRevision) {
    btnApplyAiRevision.addEventListener("click", async () => {
      const revisionPrompt = (aiRevPromptInput?.value || "").trim();
      if (!revisionPrompt) {
        alert("Ketik instruksi revisi terlebih dahulu.");
        return;
      }
      const targetSceneVal = aiRevTargetScene?.value === "auto" ? null : aiRevTargetScene?.value;
      try {
        let result = null;
        if (typeof fetch === "function") {
          try {
            const res = await fetch("/api/ai/revise", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                project: appProject,
                revisionPrompt,
                targetSceneId: targetSceneVal
              })
            });
            if (res.ok) {
              result = await res.json();
            }
          } catch (fetchErr) {
          }
        }
        if (!result || !result.project) {
          result = await reviseProjectWithAI(appProject, revisionPrompt, targetSceneVal);
        }
        if (result.success && result.project) {
          history.push(appProject);
          appProject = result.project;
          renderAll();
          closeAiRevisionModal();
          showToast(result.summary || "Revisi AI berhasil diterapkan!");
        }
      } catch (err) {
        alert(`Gagal merevisi adegan: ${err.message}`);
      }
    });
  }
  if (btnDownloadJson) {
    btnDownloadJson.addEventListener("click", () => {
      downloadProjectJSON(appProject);
      showToast("Unified Project JSON berhasil diunduh!");
    });
  }
  if (btnDownloadHtml) {
    btnDownloadHtml.addEventListener("click", () => {
      downloadHTMLFile(appProject);
      showToast("File HTML standalone berhasil diunduh!");
    });
  }
  if (btnDownloadRenderPkg) {
    btnDownloadRenderPkg.addEventListener("click", () => {
      downloadRenderPackage(appProject);
      showToast("Script render video MP4 berhasil diunduh!");
    });
  }
  if (btnExportPrompt) {
    btnExportPrompt.addEventListener("click", () => {
      const promptText = generateStructuredPrompt(appProject);
      if (promptCodeArea) promptCodeArea.value = promptText;
      if (promptModal) promptModal.style.display = "flex";
    });
  }
  if (btnCopyModalPrompt) {
    btnCopyModalPrompt.addEventListener("click", () => {
      if (promptCodeArea) {
        navigator.clipboard.writeText(promptCodeArea.value).then(() => {
          showToast("Prompt berhasil disalin ke clipboard!");
          if (promptModal) promptModal.style.display = "none";
        });
      }
    });
  }
  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", () => {
      if (promptModal) promptModal.style.display = "none";
    });
  }
  if (btnImportJson && fileImportJson) {
    btnImportJson.addEventListener("click", () => {
      fileImportJson.click();
    });
    fileImportJson.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const validated = validateProject(parsed);
          if (validated.valid) {
            history.push(appProject);
            appProject = validated.project;
            selectedSceneId = appProject.scenes[0]?.id || "sc_1";
            selectedElementId = null;
            renderAll();
            showToast(`Project "${appProject.name || appProject.videoTitle}" berhasil dimuat!`);
          } else {
            showToast(`File JSON tidak valid: ${validated.errors.join(", ")}`);
          }
        } catch (err) {
          showToast("Gagal membaca file JSON: Format tidak valid.");
        }
      };
      reader.readAsText(file);
      fileImportJson.value = "";
    });
  }
  function initTheme() {
    const savedTheme = localStorage.getItem("mg_studio_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeButtonUI(savedTheme);
  }
  function updateThemeButtonUI(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.textContent = theme === "light" ? "\u263E Gelap" : "\u263C Terang";
  }
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const target = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", target);
      localStorage.setItem("mg_studio_theme", target);
      updateThemeButtonUI(target);
    });
  }
  initTheme();
  loadTtsProviders();
  bindConceptFormEvents();
  bindInspectorEvents();
  renderAll();
})();
