import { GSAP_INLINE } from "./gsap-lib.js";
import { validateProject, migrateLegacyTemplateToProject } from "./project-schema.js";
import { renderSvgComponent } from "./shared-svg-library.js";
import { getAssetById } from "./asset-library.js";

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, function(tag) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag);
  });
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return String(m).padStart(2, "0") + ":" + String(rem).padStart(2, "0");
}

// Motion Graphic Compiler: Generates self-contained 1080x1920 9:16 Persib Media Motion Graphics
// Supports both Unified Project JSON and legacy template configuration objects
export function generateMotionGraphicHTML(input) {
  // Normalize into Unified Project format
  const project = (input && input.version && input.canvas)
    ? validateProject(input).project
    : migrateLegacyTemplateToProject(input);

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

  // Compute timing cues
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

  // Typography selection: Bebas Neue for sporty headers, Inter for crisp body
  const googleFontsUrl = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;900&family=Poppins:wght@700;800;900&display=swap";
  const fontTitle = "'Bebas Neue', 'Poppins', sans-serif";
  const fontBody = "'Inter', sans-serif";

  // Pre-serialize config data for the embedded script
  const serializedScenes = JSON.stringify(computedScenes);
  const serializedColors = JSON.stringify(colors);
  const activeTabId = String(tabId);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(topic)} - Persib Motion Media 9:16</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">
  <script>${GSAP_INLINE}</script>
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
      background: ${getBackgroundCSS(activeTabId, colors)};
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
      display: ${activeTabId === "transfer_news" ? "flex" : "none"};
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
      top: ${activeTabId === "transfer_news" ? "250px" : "210px"};
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
            🔥 BREAKING NEWS • WILUJENG SUMPING • RESMI AMUNISI BARU TIBA • OFFICIAL MEDIA PERSIB BANDUNG • KAWAL KEBANGGAAN • &nbsp;&nbsp;&nbsp;&nbsp; 🔥 BREAKING NEWS • WILUJENG SUMPING • RESMI AMUNISI BARU TIBA • OFFICIAL MEDIA PERSIB BANDUNG • KAWAL KEBANGGAAN •
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
            ${renderThemeVisualStage(activeTabId, colors, preset)}
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
        <span id="iconPlay">▶ Putar</span>
      </button>
      <button class="btn-ctrl" id="btnRestart" aria-label="Mulai dari awal">
        ↺ Ulang
      </button>
      <input type="range" class="time-scrubber" id="timeScrubber" min="0" max="${finalDuration}" step="0.01" value="0" aria-label="Slider waktu animasi">
      <span class="time-display" id="timeDisplay">00:00 / ${formatTime(finalDuration)}</span>
      <select class="btn-ctrl" id="selSpeed" aria-label="Kecepatan putar">
        <option value="0.5">0.5x</option>
        <option value="1.0" selected>1.0x</option>
        <option value="1.5">1.5x</option>
      </select>
      <button class="btn-ctrl btn-record" id="btnRecordMode" aria-label="Mode Rekam Layar">
        ● Mode Rekam
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
      tabId: "${activeTabId}",
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
          iconPlay.textContent = "▶ Putar";
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
        const wordInners = document.querySelectorAll(".word-inner");
        if (wordInners.length > 0) {
          sceneTL.fromTo(
            wordInners,
            { y: "115%", opacity: 0, rotateZ: 3 },
            { y: "0%", opacity: 1, rotateZ: 0, duration: 0.45, stagger: 0.07, ease: "back.out(1.4)" },
            0.05
          );
        }

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
      iconPlay.textContent = "❚❚ Jeda";
    };

    window.pause = function() {
      if (!masterTimeline) return;
      masterTimeline.pause();
      if (bgmAudio) bgmAudio.pause();
      isPlaying = false;
      syncVoiceovers(masterTimeline.time(), false);
      iconPlay.textContent = "▶ Putar";
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
      iconPlay.textContent = "❚❚ Jeda";
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
  </script>
</body>
</html>`;
}

// Background styling specifically adapted for each of the 5 themes
function getBackgroundCSS(tabId, colors) {
  const blue = colors.primary || "#003da5";
  const dark = colors.secondary || "#0a0a0a";
  const gold = colors.accent || "#f0a500";

  switch (tabId) {
    case "post_match":
      // Dramatic Stadium floodlight at night with gold stadium accents
      return `radial-gradient(ellipse 95% 65% at 50% 18%, rgba(0, 61, 165, 0.45) 0%, #080d1a 60%, ${dark} 100%)`;

    case "weekly_recap":
      // Modern Sports Broadcast studio grid
      return `linear-gradient(165deg, #091325 0%, #001a44 40%, ${dark} 95%)`;

    case "trivia_facts":
      // Royal Heritage blue with golden vintage aura
      return `radial-gradient(circle at 50% 35%, #0d1e44 0%, #060914 65%, ${dark} 100%)`;

    case "before_match":
      // Aggressive duel clash: diagonal split screen (Persib blue vs dark adversary)
      return `linear-gradient(140deg, #002d7a 0%, #001233 46%, #1a0808 54%, #080202 100%)`;

    case "transfer_news":
      // High-energy breaking news press conference atmosphere
      return `radial-gradient(circle at 50% 25%, #003da5 0%, #090e1a 55%, ${dark} 100%)`;

    default:
      return `linear-gradient(145deg, ${blue} 0%, ${dark} 100%)`;
  }
}

// Render custom elements defined in Unified Project JSON
function renderProjectCustomElementsHTML(scenes, colors) {
  if (!Array.isArray(scenes)) return "";
  return scenes.map((sc, scIdx) => {
    const elements = sc.elements || [];
    if (elements.length === 0) return "";
    const items = elements.map(el => {
      if (el.visible === false) return "";
      const x = el.position?.x || 0;
      const y = el.position?.y || 0;
      const w = typeof el.size?.width === "number" ? `${el.size.width}px` : (el.size?.width || "auto");
      const h = typeof el.size?.height === "number" ? `${el.size.height}px` : (el.size?.height || "auto");
      const z = el.zIndex || 1;
      const op = el.opacity !== undefined ? el.opacity : 1;
      const rot = el.rotation || 0;
      const scale = el.scale || 1;

      let inner = "";
      if (el.type === "image") {
        if (!el.assetUrl) {
          inner = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed #ef4444;border-radius:8px;background:rgba(239,68,68,0.1);color:#ef4444;padding:8px;text-align:center;">
            <span style="font-size:24px;">⚠️</span>
            <span style="font-size:12px;font-weight:700;">Aset Hilang</span>
            <span style="font-size:10px;opacity:0.8;word-break:break-all;">${escapeHTML(el.name || el.assetId || "Image")}</span>
          </div>`;
        } else {
          inner = `<img src="${escapeHTML(el.assetUrl)}" alt="${escapeHTML(el.name || '')}" style="width:100%;height:100%;object-fit:${el.fitMode || 'contain'};border-radius:${el.styling?.borderRadius || 8}px;display:block;" />`;
        }
      } else if (el.type === "svg" || (el.type === "component" && (el.props?.componentId || el.assetId))) {
        const compId = el.props?.componentId || el.assetId;
        if (compId) {
          inner = renderSvgComponent(compId, { ...el.styling, width: el.size?.width, height: el.size?.height });
        } else if (el.content && el.content.includes("<svg")) {
          inner = el.content;
        }
      } else if (el.type === "text" && el.content) {
        inner = `<div style="font-family:${el.styling?.fontFamily || "'Inter', sans-serif"};font-size:${el.styling?.fontSize || 24}px;font-weight:${el.styling?.fontWeight || 400};color:${el.styling?.color || '#ffffff'};line-height:1.3;">${escapeHTML(el.content)}</div>`;
      } else if (el.type === "logo") {
        inner = `<img src="/public/logos/brand/logo.png" alt="Persib" style="width:100%;height:100%;object-fit:contain;" />`;
      }

      return `<div id="el_${el.id}" class="custom-scene-elem" style="position:absolute;left:${x}px;top:${y}px;width:${w};height:${h};z-index:${z};opacity:${op};transform:rotate(${rot}deg) scale(${scale});transform-origin:center center;">${inner}</div>`;
    }).join("");

    return `<div id="scene_custom_${sc.id}" class="scene-custom-layer" style="position:absolute;inset:0;pointer-events:none;${scIdx === 0 ? '' : 'display:none;'}">${items}</div>`;
  }).join("");
}

// Render bespoke vector graphic layouts for each of the 5 tabs
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
              <text x="0" y="-15" font-family="'Bebas Neue', sans-serif" font-size="80" font-weight="900" fill="${gold}" text-anchor="middle">—</text>
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
            <text x="230" y="45" font-family="'Bebas Neue', sans-serif" font-size="32" fill="${gold}" text-anchor="middle" letter-spacing="3">★ MAN OF THE MATCH ★</text>
            <text x="230" y="115" font-family="'Bebas Neue', sans-serif" font-size="52" fill="#ffffff" text-anchor="middle">DAVID DA SILVA</text>
            <g transform="translate(230, 170)">
              <circle cx="-50" cy="0" r="14" fill="${gold}" class="motm-star"/>
              <circle cx="-25" cy="0" r="14" fill="${gold}" class="motm-star"/>
              <circle cx="0" cy="0" r="18" fill="#ffffff" class="motm-star"/>
              <circle cx="25" cy="0" r="14" fill="${gold}" class="motm-star"/>
              <circle cx="50" cy="0" r="14" fill="${gold}" class="motm-star"/>
            </g>
            <text x="230" y="235" font-family="'Bebas Neue', sans-serif" font-size="44" fill="${gold}" text-anchor="middle">RATING 8.9 • 2 GOL</text>
          </g>

          <!-- 4. Trophy & Standings Rank -->
          <g id="pmTrophyLadder" opacity="0" transform="translate(250, 460)">
            <rect x="0" y="0" width="400" height="260" rx="20" fill="#001a4d" stroke="#ffffff" stroke-width="3"/>
            <text x="200" y="55" font-family="'Bebas Neue', sans-serif" font-size="36" fill="${gold}" text-anchor="middle">KLASEMEN SEMENTARA</text>
            <text x="200" y="150" font-family="'Bebas Neue', sans-serif" font-size="90" font-weight="900" fill="#ffffff" text-anchor="middle">#1</text>
            <text x="200" y="210" font-family="'Inter', sans-serif" font-size="24" font-weight="800" fill="${gold}" text-anchor="middle" letter-spacing="2">34 POIN • 15 MATCHES</text>
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
            <text x="700" y="48" font-family="'Inter', sans-serif" font-size="20" font-weight="700" fill="#22c55e" text-anchor="end">● STATUS: ON FIRE</text>
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
              <text x="400" y="28" font-family="'Inter', sans-serif" font-size="16" fill="#ffffff">15 Main • +18 SG</text>
              <text x="680" y="28" font-family="'Bebas Neue', sans-serif" font-size="28" fill="${gold}" text-anchor="end">34 PTS</text>
            </g>

            <!-- Row 2 -->
            <g class="wr-table-row" transform="translate(20, 70)">
              <rect x="0" y="0" width="700" height="38" rx="8" fill="#0f172a"/>
              <text x="20" y="26" font-family="'Bebas Neue', sans-serif" font-size="22" fill="#9ca3af">2. BORNEO FC</text>
              <text x="400" y="26" font-family="'Inter', sans-serif" font-size="14" fill="#64748b">15 Main • +12 SG</text>
              <text x="680" y="26" font-family="'Bebas Neue', sans-serif" font-size="24" fill="#cbd5e1" text-anchor="end">31 PTS</text>
            </g>

            <!-- Row 3 -->
            <g class="wr-table-row" transform="translate(20, 116)">
              <rect x="0" y="0" width="700" height="38" rx="8" fill="#0f172a"/>
              <text x="20" y="26" font-family="'Bebas Neue', sans-serif" font-size="22" fill="#9ca3af">3. PERSIJA JAKARTA</text>
              <text x="400" y="26" font-family="'Inter', sans-serif" font-size="14" fill="#64748b">15 Main • +9 SG</text>
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
            <text x="0" y="10" font-family="'Bebas Neue', sans-serif" font-size="30" fill="${gold}" text-anchor="middle" letter-spacing="3">★ SINCE 1933 OFFICIAL DATA ★</text>
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
            <text x="180" y="90" font-family="'Inter', sans-serif" font-size="18" fill="#94a3b8">Kondisi Fisik Prima • Taktik Transisi Kilat</text>
            <text x="180" y="125" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="${gold}">HEAD TO HEAD: PERSIB UNGGUL 3 KALI</text>
          </g>

          <!-- 3. Digital Kickoff Clock Card -->
          <g id="bmKickoffClock" transform="translate(160, 600)">
            <rect x="0" y="0" width="580" height="150" rx="20" fill="#001844" stroke="${gold}" stroke-width="3"/>
            <text x="290" y="42" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="${gold}" text-anchor="middle" letter-spacing="3">JADWAL PERTANDINGAN RESMI</text>
            <text class="bm-clock-glow" x="290" y="102" font-family="'Bebas Neue', sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">SABTU • 19:00 WIB</text>
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
