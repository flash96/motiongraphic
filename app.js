import { PERSIB_TABS, DEFAULT_TAB } from "./templates.js";
import { generateMotionGraphicHTML } from "./motion-engine.js";
import { downloadHTMLFile, downloadProjectJSON, generateStructuredPrompt, downloadRenderPackage } from "./export-helper.js";
import {
  migrateLegacyTemplateToProject,
  validateProject,
  recalculateSceneTimings,
  addScene,
  deleteScene,
  duplicateScene,
  reorderScenes,
  addElement,
  deleteElement,
  duplicateElement,
  reorderElements,
  setElementVisibility,
  setElementLock,
  updateElementProperties,
  updateSceneProperties,
  updateAudioProperties
} from "./project-schema.js";
import {
  getAllAssets,
  getAssetById,
  filterAssets,
  addUploadedAsset,
  deleteAsset,
  checkAssetUsage,
  validateProjectAssets,
  ASSET_CATEGORIES
} from "./asset-library.js";
import { SHARED_SVG_COMPONENTS, renderSvgComponent } from "./shared-svg-library.js";
import {
  getAllAudioAssets,
  getAudioAssetById,
  filterAudioAssets,
  addUploadedAudio,
  deleteAudioAsset,
  AUDIO_CATEGORIES
} from "./audio-library.js";
import { generateProjectWithHeuristic, reviseProjectWithAI } from "./ai-director.js";

// ========================================================
// 1. UNDO / REDO HISTORY MANAGER
// ========================================================
class HistoryManager {
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
}

const history = new HistoryManager(40);

// ========================================================
// 2. ACTIVE APPLICATION STATE & PROJECT CACHE
// ========================================================
let activeTabId = DEFAULT_TAB;
const tabProjectCache = {};
Object.keys(PERSIB_TABS).forEach(tabKey => {
  tabProjectCache[tabKey] = migrateLegacyTemplateToProject(PERSIB_TABS[tabKey]);
});

let appProject = tabProjectCache[activeTabId];
let selectedSceneId = appProject.scenes[0]?.id || "sc_1";
let selectedElementId = null;

let currentPlayheadTime = 0;
let isPlaying = false;
let currentStageScale = 0.24;
let timelinePxPerSec = 40;

// Debounce helper for inputs
let inputDebounceTimer = null;
function debouncedHistoryPush() {
  clearTimeout(inputDebounceTimer);
  inputDebounceTimer = setTimeout(() => {
    history.push(appProject);
  }, 400);
}

// ========================================================
// 3. DOM ELEMENT REFERENCES
// ========================================================
// Header
const btnUndo = document.getElementById("btnUndo");
const btnRedo = document.getElementById("btnRedo");
const tabButtons = document.querySelectorAll("[data-tab-id]");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const btnImportJson = document.getElementById("btnImportJson");
const fileImportJson = document.getElementById("fileImportJson");
const btnDownloadJson = document.getElementById("btnDownloadJson");
const btnDownloadHtml = document.getElementById("btnDownloadHtml");
const btnDownloadRenderPkg = document.getElementById("btnDownloadRenderPkg");
const btnExportPrompt = document.getElementById("btnExportPrompt");

// Left Panel Tabs
const panelTabButtons = document.querySelectorAll("[data-panel-tab]");
const tabContentScenes = document.getElementById("tabContentScenes");
const tabContentLayers = document.getElementById("tabContentLayers");
const tabContentConcept = document.getElementById("tabContentConcept");
const sceneCountBadge = document.getElementById("sceneCountBadge");
const layerCountBadge = document.getElementById("layerCountBadge");

// Scene Management
const btnAddScene = document.getElementById("btnAddScene");
const sceneCardList = document.getElementById("sceneCardList");

// Layer Management
const activeSceneLayerTitle = document.getElementById("activeSceneLayerTitle");
const selNewElementType = document.getElementById("selNewElementType");
const btnAddElement = document.getElementById("btnAddElement");
const layerTreeList = document.getElementById("layerTreeList");

// Concept Form Fields
const formTopic = document.getElementById("formTopic");
const formCategory = document.getElementById("formCategory");
const formAngle = document.getElementById("formAngle");
const formAudience = document.getElementById("formAudience");
const formGoal = document.getElementById("formGoal");
const formTone = document.getElementById("formTone");
const formDuration = document.getElementById("formDuration");
const formMetaphor = document.getElementById("formMetaphor");
const presetButtons = document.querySelectorAll("[data-preset-val]");
const colorPrimary = document.getElementById("colorPrimary");
const colorSecondary = document.getElementById("colorSecondary");
const colorText = document.getElementById("colorText");
const colorAccent = document.getElementById("colorAccent");
const hexPrimary = document.getElementById("hexPrimary");
const hexSecondary = document.getElementById("hexSecondary");
const hexText = document.getElementById("hexText");
const hexAccent = document.getElementById("hexAccent");
const btnResetFramework = document.getElementById("btnResetFramework");

// Canvas Stage & Overlay
const canvasViewport = document.getElementById("canvasViewport");
const canvasStageWrapper = document.getElementById("canvasStageWrapper");
const stageIframe = document.getElementById("stageIframe");
const canvasOverlay = document.getElementById("canvasOverlay");
const canvasActiveInfo = document.getElementById("canvasActiveInfo");
const btnGenerate = document.getElementById("btnGenerate");

// Transport Bar
const btnParentPlayPause = document.getElementById("btnParentPlayPause");
const parentIconPlay = document.getElementById("parentIconPlay");
const btnParentRestart = document.getElementById("btnParentRestart");
const parentTimeScrubber = document.getElementById("parentTimeScrubber");
const parentTimeDisplay = document.getElementById("parentTimeDisplay");
const parentSpeedSelect = document.getElementById("parentSpeedSelect");
const btnParentRecordMode = document.getElementById("btnParentRecordMode");

// Properties Inspector
const inspectorEmptyNotice = document.getElementById("inspectorEmptyNotice");
const elementInspector = document.getElementById("elementInspector");
const sceneInspector = document.getElementById("sceneInspector");
const elemInspectorTitle = document.getElementById("elemInspectorTitle");
const elemTypeBadge = document.getElementById("elemTypeBadge");
const btnInspectorLock = document.getElementById("btnInspectorLock");
const btnInspectorVisible = document.getElementById("btnInspectorVisible");
const btnInspectorDuplicate = document.getElementById("btnInspectorDuplicate");
const btnInspectorDelete = document.getElementById("btnInspectorDelete");

const propElemName = document.getElementById("propElemName");
const propElemX = document.getElementById("propElemX");
const propElemY = document.getElementById("propElemY");
const propElemW = document.getElementById("propElemW");
const propElemH = document.getElementById("propElemH");
const propElemRot = document.getElementById("propElemRot");
const propElemOpacity = document.getElementById("propElemOpacity");
const inspectorTextGroup = document.getElementById("inspectorTextGroup");
const propElemContent = document.getElementById("propElemContent");
const propElemHighlight = document.getElementById("propElemHighlight");
const propElemFontSize = document.getElementById("propElemFontSize");
const propElemColor = document.getElementById("propElemColor");
const propElemBgColor = document.getElementById("propElemBgColor");
const propElemRadius = document.getElementById("propElemRadius");
const propElemAnimType = document.getElementById("propElemAnimType");
const propElemAnimDelay = document.getElementById("propElemAnimDelay");
const propElemAnimDur = document.getElementById("propElemAnimDur");

const propSceneTitle = document.getElementById("propSceneTitle");
const propSceneDuration = document.getElementById("propSceneDuration");
const propSceneTransitionType = document.getElementById("propSceneTransitionType");
const propSceneTransitionDir = document.getElementById("propSceneTransitionDir");
const propSceneNarration = document.getElementById("propSceneNarration");
const propSceneVisualAction = document.getElementById("propSceneVisualAction");

// Voiceover Elements (Phase 4A)
const sceneVoiceoverControlBox = document.getElementById("sceneVoiceoverControlBox");
const voStatusBadge = document.getElementById("voStatusBadge");
const chkVoEnabled = document.getElementById("chkVoEnabled");
const voConfigControls = document.getElementById("voConfigControls");
const selVoProvider = document.getElementById("selVoProvider");
const voProviderNotice = document.getElementById("voProviderNotice");
const selVoLanguage = document.getElementById("selVoLanguage");
const selVoVoice = document.getElementById("selVoVoice");
const rangeVoSpeed = document.getElementById("rangeVoSpeed");
const valVoSpeed = document.getElementById("valVoSpeed");
const rangeVoPitch = document.getElementById("rangeVoPitch");
const valVoPitch = document.getElementById("valVoPitch");
const lblVoParamSecond = document.getElementById("lblVoParamSecond");
const voAudioPlayerContainer = document.getElementById("voAudioPlayerContainer");
const voPreviewAudioElement = document.getElementById("voPreviewAudioElement");
const voAudioMetaDuration = document.getElementById("voAudioMetaDuration");
const btnDeleteVoAudio = document.getElementById("btnDeleteVoAudio");
const btnPreviewVoSpeech = document.getElementById("btnPreviewVoSpeech");
const btnGenerateVoAudio = document.getElementById("btnGenerateVoAudio");
const voGenerateProgress = document.getElementById("voGenerateProgress");

// Custom Voice Cloning Elements (Phase 4C)
const btnOpenCloneModal = document.getElementById("btnOpenCloneModal");
const voiceCloneModal = document.getElementById("voiceCloneModal");
const btnCloseCloneModal = document.getElementById("btnCloseCloneModal");
const btnCancelCloneModal = document.getElementById("btnCancelCloneModal");
const inpCloneVoiceName = document.getElementById("inpCloneVoiceName");
const inpCloneVoiceDesc = document.getElementById("inpCloneVoiceDesc");
const inpCloneSpeakerName = document.getElementById("inpCloneSpeakerName");
const dropZoneCloneAudio = document.getElementById("dropZoneCloneAudio");
const fileCloneAudioSample = document.getElementById("fileCloneAudioSample");
const lblCloneAudioFile = document.getElementById("lblCloneAudioFile");
const chkCloneConsent = document.getElementById("chkCloneConsent");
const cloneProgressNotice = document.getElementById("cloneProgressNotice");
const customVoiceListContainer = document.getElementById("customVoiceListContainer");
const btnSubmitVoiceClone = document.getElementById("btnSubmitVoiceClone");

let cloneAudioSampleBase64 = null;
let cloneAudioSampleMimeType = "audio/mpeg";

// Audio Controls
const chkAudioEnabled = document.getElementById("chkAudioEnabled");
const selAudioPreset = document.getElementById("selAudioPreset");
const inpAudioUrl = document.getElementById("inpAudioUrl");
const rngAudioVolume = document.getElementById("rngAudioVolume");
const lblAudioVolume = document.getElementById("lblAudioVolume");
const btnAudioMute = document.getElementById("btnAudioMute");

// Canvas Aspect Ratio
const selectCanvasRatio = document.getElementById("selectCanvasRatio");

// Asset Library Modal & Uploader Elements
const btnOpenAssetLibrary = document.getElementById("btnOpenAssetLibrary");
const btnOpenAssetModalFromLayers = document.getElementById("btnOpenAssetModalFromLayers");
const assetBrowserModal = document.getElementById("assetBrowserModal");
const btnCloseAssetModal = document.getElementById("btnCloseAssetModal");
const btnCancelAssetModal = document.getElementById("btnCancelAssetModal");
const btnApplySelectedAsset = document.getElementById("btnApplySelectedAsset");
const assetSearchInput = document.getElementById("assetSearchInput");
const assetCategoryChips = document.getElementById("assetCategoryChips");
const assetGalleryGrid = document.getElementById("assetGalleryGrid");
const assetSelectedInfo = document.getElementById("assetSelectedInfo");
const assetDropzone = document.getElementById("assetDropzone");
const assetFileInput = document.getElementById("assetFileInput");
const btnTriggerUpload = document.getElementById("btnTriggerUpload");
const uploadProgress = document.getElementById("uploadProgress");

// Asset Inspector Elements
const inspectorAssetGroup = document.getElementById("inspectorAssetGroup");
const propElemAssetId = document.getElementById("propElemAssetId");
const propElemFitMode = document.getElementById("propElemFitMode");
const btnInspectChangeAsset = document.getElementById("btnInspectChangeAsset");
const btnInspectRemoveAsset = document.getElementById("btnInspectRemoveAsset");

// AI Creative Director Elements (Phase 3)
const btnOpenAiDirector = document.getElementById("btnOpenAiDirector");
const aiDirectorModal = document.getElementById("aiDirectorModal");
const btnCloseAiModal = document.getElementById("btnCloseAiModal");
const btnCancelAiModal = document.getElementById("btnCancelAiModal");
const btnRunAiGenerate = document.getElementById("btnRunAiGenerate");
const btnApplyAiProject = document.getElementById("btnApplyAiProject");
const aiPromptInput = document.getElementById("aiPromptInput");
const aiAspectRatio = document.getElementById("aiAspectRatio");
const aiDuration = document.getElementById("aiDuration");
const aiPreset = document.getElementById("aiPreset");
const aiInputSection = document.getElementById("aiInputSection");
const aiLoadingSection = document.getElementById("aiLoadingSection");
const aiLoadingStatusText = document.getElementById("aiLoadingStatusText");
const aiLoadingSubtext = document.getElementById("aiLoadingSubtext");
const aiResultSection = document.getElementById("aiResultSection");
const aiResultTitle = document.getElementById("aiResultTitle");
const aiResultMeta = document.getElementById("aiResultMeta");
const aiResultAudioBadge = document.getElementById("aiResultAudioBadge");
const aiStoryboardCards = document.getElementById("aiStoryboardCards");

// AI Revision Elements
const btnOpenAiRevision = document.getElementById("btnOpenAiRevision");
const aiRevisionModal = document.getElementById("aiRevisionModal");
const btnCloseAiRevModal = document.getElementById("btnCloseAiRevModal");
const btnCancelAiRevModal = document.getElementById("btnCancelAiRevModal");
const btnApplyAiRevision = document.getElementById("btnApplyAiRevision");
const aiRevTargetScene = document.getElementById("aiRevTargetScene");
const aiRevPromptInput = document.getElementById("aiRevPromptInput");

// Audio Asset Browser Elements
const tabBtnVisualAssets = document.getElementById("tabBtnVisualAssets");
const tabBtnAudioAssets = document.getElementById("tabBtnAudioAssets");
const visualAssetsView = document.getElementById("visualAssetsView");
const audioAssetsView = document.getElementById("audioAssetsView");
const audioSearchInput = document.getElementById("audioSearchInput");
const audioFileInput = document.getElementById("audioFileInput");
const btnTriggerAudioUpload = document.getElementById("btnTriggerAudioUpload");
const audioDropzone = document.getElementById("audioDropzone");
const audioUploadProgress = document.getElementById("audioUploadProgress");
const audioCategoryChips = document.getElementById("audioCategoryChips");
const audioListContainer = document.getElementById("audioListContainer");

// Timeline Controls
const tlTimeDisplay = document.getElementById("tlTimeDisplay");
const tlFrameDisplay = document.getElementById("tlFrameDisplay");
const tlZoomSlider = document.getElementById("tlZoomSlider");
const btnTlFit = document.getElementById("btnTlFit");
const tlTracksScroll = document.getElementById("tlTracksScroll");
const tlTracksInner = document.getElementById("tlTracksInner");
const tlRuler = document.getElementById("tlRuler");
const tlSceneBlocksContainer = document.getElementById("tlSceneBlocksContainer");
const tlElementBlocksContainer = document.getElementById("tlElementBlocksContainer");
const tlAudioBlockContainer = document.getElementById("tlAudioBlockContainer");
const tlPlayheadLine = document.getElementById("tlPlayheadLine");
const tlPlayheadHandle = document.getElementById("tlPlayheadHandle");

// Modals & Toast
const promptModal = document.getElementById("promptModal");
const promptCodeArea = document.getElementById("promptCodeArea");
const btnCopyModalPrompt = document.getElementById("btnCopyModalPrompt");
const btnCloseModal = document.getElementById("btnCloseModal");
const toastNotice = document.getElementById("toastNotice");

// ========================================================
// 4. UI HELPER FUNCTIONS
// ========================================================
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

function formatTime(sec) {
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

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function getActiveScene() {
  return appProject.scenes.find(s => String(s.id) === String(selectedSceneId)) || appProject.scenes[0];
}

function getActiveElement() {
  const scene = getActiveScene();
  if (!scene || !selectedElementId) return null;
  return scene.elements.find(el => String(el.id) === String(selectedElementId)) || null;
}

// ========================================================
// 5. STAGE SCALE & RESIZE MANAGEMENT
// ========================================================
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

// ========================================================
// 6. SCENE MANAGEMENT CONTROLLER
// ========================================================
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
          <span class="scene-card-title">${escapeHTML(scene.title || scene.name || "Adegan " + (index + 1))}</span>
        </div>
        <span class="scene-card-meta">${scene.duration}s</span>
      </div>
      <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${escapeHTML(scene.screenText || scene.narration || "Tidak ada teks layar")}
      </div>
      <div class="scene-card-actions" style="margin-top: 4px; justify-content: flex-end;">
        <button type="button" class="btn-mini" data-action="up" title="Geser ke atas" ${index === 0 ? "disabled" : ""}>▲</button>
        <button type="button" class="btn-mini" data-action="down" title="Geser ke bawah" ${index === appProject.scenes.length - 1 ? "disabled" : ""}>▼</button>
        <button type="button" class="btn-mini" data-action="duplicate" title="Duplikasi adegan">⧉</button>
        <button type="button" class="btn-mini danger" data-action="delete" title="Hapus adegan" ${appProject.scenes.length <= 1 ? "disabled" : ""}>✕</button>
      </div>
    `;

    // Select scene on card click
    card.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      selectScene(scene.id);
    });

    // Action button listeners
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

// Add new scene button
btnAddScene.addEventListener("click", () => {
  history.push(appProject);
  const newScene = addScene(appProject);
  selectScene(newScene.id);
  renderAll();
  showToast("Adegan baru ditambahkan.");
});

// ========================================================
// 7. ELEMENT & LAYER TREE CONTROLLER
// ========================================================
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

  // Display elements top z-index first
  const elements = [...(scene.elements || [])].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  elements.forEach((el, index) => {
    const isSelected = String(el.id) === String(selectedElementId);
    const item = document.createElement("div");
    item.className = `layer-item ${isSelected ? "active" : ""} ${el.visible === false ? "hidden-layer" : ""}`;
    item.innerHTML = `
      <div class="layer-left">
        <span class="layer-badge">${escapeHTML(el.type)}</span>
        <span class="layer-name" title="${escapeHTML(el.name || el.type)}">${escapeHTML(el.name || el.type)}</span>
      </div>
      <div class="layer-controls">
        <button type="button" class="btn-layer-icon ${el.visible !== false ? "active" : ""}" data-action="toggle-visible" title="Tampilkan/Sembunyikan">
          ${el.visible !== false ? "👁️" : "🚫"}
        </button>
        <button type="button" class="btn-layer-icon ${el.locked ? "active" : ""}" data-action="toggle-lock" title="Kunci Layer">
          ${el.locked ? "🔒" : "🔓"}
        </button>
        <button type="button" class="btn-layer-icon" data-action="dup" title="Duplikasi">⧉</button>
        <button type="button" class="btn-layer-icon" data-action="del" title="Hapus" style="color: var(--danger);">✕</button>
      </div>
    `;

    item.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      selectElement(el.id);
    });

    // Layer buttons
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

// Add element button
btnAddElement.addEventListener("click", () => {
  const scene = getActiveScene();
  if (!scene) return;

  const type = selNewElementType ? selNewElementType.value : "text";
  const elCount = (scene.elements || []).length + 1;

  let newElementData = {
    type,
    name: `${type.toUpperCase()} ${elCount}`,
    position: { x: 120, y: 300 + (elCount * 40) % 600 },
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

// ========================================================
// 8. VISUAL CANVAS INTERACTION CONTROLLER
// ========================================================
function renderCanvasSelection() {
  if (!canvasOverlay) return;
  canvasOverlay.innerHTML = "";

  const scene = getActiveScene();
  const element = getActiveElement();

  if (canvasActiveInfo) {
    const sName = scene ? (scene.title || scene.name || "Adegan") : "";
    const eName = element ? ` • ${element.name || element.type}` : "";
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

  // Badge with dimension info
  const badge = document.createElement("div");
  badge.className = "canvas-selection-badge";
  const isMissing = element.assetId && !getAssetById(element.assetId) && !element.assetUrl;
  const missingBadge = isMissing ? ' <span style="color:#ef4444;font-weight:bold;">⚠️ Hilang</span>' : '';
  badge.innerHTML = `<span>${escapeHTML(element.name || element.type)}</span> <span style="font-size: 12px; opacity: 0.85;">${Math.round(w)}×${Math.round(h)}</span>${element.locked ? " 🔒" : ""}${missingBadge}`;
  box.appendChild(badge);

  // If locked, disable drag and resize handles
  if (element.locked) {
    box.style.cursor = "not-allowed";
    box.style.borderColor = "#9ca3af";
    badge.style.background = "#4b5563";
    canvasOverlay.appendChild(box);
    return;
  }

  // 8 Resize Handles
  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  handles.forEach(handleType => {
    const handle = document.createElement("div");
    handle.className = `canvas-resize-handle handle-${handleType}`;
    handle.dataset.handle = handleType;

    // Attach resize interaction
    handle.addEventListener("pointerdown", e => {
      e.stopPropagation();
      initResize(e, handleType, element, box);
    });

    box.appendChild(handle);
  });

  // Attach move interaction to selection box
  box.addEventListener("pointerdown", e => {
    e.stopPropagation();
    initMove(e, element, box);
  });

  canvasOverlay.appendChild(box);
}

// Move element on canvas with exact scale-aware math
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

// Resize element on canvas with 8-direction handles
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

// Click outside deselects element
if (canvasViewport) {
  canvasViewport.addEventListener("pointerdown", e => {
    if (e.target === canvasViewport || e.target === canvasOverlay) {
      selectedElementId = null;
      renderLayerTree();
      syncInspector();
      renderCanvasSelection();
      renderTimeline();
    }
  });
}

// ========================================================
// 9. PROPERTIES INSPECTOR CONTROLLER
// ========================================================
function syncInspector() {
  const scene = getActiveScene();
  const element = getActiveElement();

  if (element) {
    if (inspectorEmptyNotice) inspectorEmptyNotice.style.display = "none";
    if (sceneInspector) sceneInspector.style.display = "none";
    if (elementInspector) elementInspector.style.display = "flex";

    if (elemInspectorTitle) elemInspectorTitle.textContent = element.name || "Elemen";
    if (elemTypeBadge) elemTypeBadge.textContent = element.type.toUpperCase();

    if (btnInspectorLock) btnInspectorLock.textContent = element.locked ? "🔒" : "🔓";
    if (btnInspectorVisible) btnInspectorVisible.textContent = element.visible !== false ? "👁️" : "🚫";

    if (propElemName) propElemName.value = element.name || "";
    if (propElemX) propElemX.value = element.position?.x || 0;
    if (propElemY) propElemY.value = element.position?.y || 0;
    if (propElemW) propElemW.value = element.size?.width || "auto";
    if (propElemH) propElemH.value = element.size?.height || "auto";
    if (propElemRot) propElemRot.value = element.rotation || 0;
    if (propElemOpacity) propElemOpacity.value = element.opacity !== undefined ? element.opacity : 1;

    // Text fields
    if (inspectorTextGroup) {
      inspectorTextGroup.style.display = element.type === "text" ? "flex" : "none";
    }
    if (propElemContent) propElemContent.value = element.content || "";
    if (propElemHighlight) propElemHighlight.value = element.props?.highlightWord || "";
    if (propElemFontSize) propElemFontSize.value = element.styling?.fontSize || 48;
    if (propElemColor) propElemColor.value = element.styling?.color || "#ffffff";

    // Asset fields
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

    // Animation
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

  // Audio Inspector
  const audio = appProject.audio || { enabled: false, bgmUrl: "", volume: 0.8, muted: false };
  if (chkAudioEnabled) chkAudioEnabled.checked = Boolean(audio.enabled);
  if (inpAudioUrl) inpAudioUrl.value = audio.bgmUrl || "";
  if (rngAudioVolume) rngAudioVolume.value = audio.volume !== undefined ? audio.volume : 0.8;
  if (lblAudioVolume) lblAudioVolume.textContent = `${Math.round((audio.volume !== undefined ? audio.volume : 0.8) * 100)}%`;
  if (btnAudioMute) btnAudioMute.textContent = audio.muted ? "Unmute" : "Mute";
}

// Bind Element Inspector input listeners
function bindInspectorEvents() {
  if (propElemName) propElemName.addEventListener("input", e => {
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
    input.addEventListener("input", e => {
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

  if (propElemRot) propElemRot.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) { el.rotation = Number(e.target.value) || 0; debouncedHistoryPush(); }
  });

  if (propElemOpacity) propElemOpacity.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) { el.opacity = Math.max(0, Math.min(1, Number(e.target.value))); debouncedHistoryPush(); }
  });

  if (propElemContent) propElemContent.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) { el.content = e.target.value; debouncedHistoryPush(); }
  });

  if (propElemHighlight) propElemHighlight.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.props) el.props = {};
      el.props.highlightWord = e.target.value;
      debouncedHistoryPush();
    }
  });

  if (propElemFontSize) propElemFontSize.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.styling) el.styling = {};
      el.styling.fontSize = Number(e.target.value) || 24;
      debouncedHistoryPush();
    }
  });

  if (propElemColor) propElemColor.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.styling) el.styling = {};
      el.styling.color = e.target.value;
      debouncedHistoryPush();
    }
  });

  if (propElemBgColor) propElemBgColor.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.styling) el.styling = {};
      el.styling.backgroundColor = e.target.value;
      debouncedHistoryPush();
    }
  });

  if (propElemRadius) propElemRadius.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.styling) el.styling = {};
      el.styling.borderRadius = Number(e.target.value) || 0;
      debouncedHistoryPush();
    }
  });

  if (propElemAnimType) propElemAnimType.addEventListener("change", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.animation) el.animation = {};
      el.animation.type = e.target.value;
      history.push(appProject);
    }
  });

  if (propElemAnimDelay) propElemAnimDelay.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.animation) el.animation = {};
      el.animation.delay = Number(e.target.value) || 0;
      debouncedHistoryPush();
    }
  });

  if (propElemAnimDur) propElemAnimDur.addEventListener("input", e => {
    const el = getActiveElement();
    if (el) {
      if (!el.animation) el.animation = {};
      el.animation.duration = Number(e.target.value) || 0.5;
      debouncedHistoryPush();
    }
  });

  // Asset Properties binding
  if (propElemFitMode) propElemFitMode.addEventListener("change", e => {
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

  // Action buttons in inspector
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

  // Scene Inspector listeners
  if (propSceneTitle) propSceneTitle.addEventListener("input", e => {
    const sc = getActiveScene();
    if (sc) {
      sc.title = e.target.value;
      sc.name = e.target.value;
      renderSceneList();
      debouncedHistoryPush();
    }
  });

  if (propSceneDuration) propSceneDuration.addEventListener("change", e => {
    const sc = getActiveScene();
    if (sc) {
      history.push(appProject);
      updateSceneProperties(appProject, sc.id, { duration: Number(e.target.value) });
      renderAll();
    }
  });

  if (propSceneTransitionType) propSceneTransitionType.addEventListener("change", e => {
    const sc = getActiveScene();
    if (sc) {
      if (!sc.transition) sc.transition = { type: "slash", direction: "right", duration: 0.4 };
      sc.transition.type = e.target.value;
      history.push(appProject);
    }
  });

  if (propSceneTransitionDir) propSceneTransitionDir.addEventListener("change", e => {
    const sc = getActiveScene();
    if (sc) {
      if (!sc.transition) sc.transition = { type: "slash", direction: "right", duration: 0.4 };
      sc.transition.direction = e.target.value;
      history.push(appProject);
    }
  });

  if (propSceneNarration) propSceneNarration.addEventListener("input", e => {
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

  if (propSceneVisualAction) propSceneVisualAction.addEventListener("input", e => {
    const sc = getActiveScene();
    if (sc) { sc.visualAction = e.target.value; debouncedHistoryPush(); }
  });

  // Audio Inspector listeners
  if (chkAudioEnabled) chkAudioEnabled.addEventListener("change", e => {
    history.push(appProject);
    updateAudioProperties(appProject, { enabled: e.target.checked });
    compileAndRender();
    renderTimeline();
  });

  if (selAudioPreset) selAudioPreset.addEventListener("change", e => {
    if (e.target.value) {
      history.push(appProject);
      updateAudioProperties(appProject, { bgmUrl: e.target.value, enabled: true });
      if (inpAudioUrl) inpAudioUrl.value = e.target.value;
      if (chkAudioEnabled) chkAudioEnabled.checked = true;
      compileAndRender();
      renderTimeline();
    }
  });

  if (inpAudioUrl) inpAudioUrl.addEventListener("change", e => {
    history.push(appProject);
    updateAudioProperties(appProject, { bgmUrl: e.target.value });
    compileAndRender();
    renderTimeline();
  });

  if (rngAudioVolume) rngAudioVolume.addEventListener("input", e => {
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

// ========================================================
// 10. TIMELINE EDITOR CONTROLLER
// ========================================================
function renderTimeline() {
  if (!tlRuler || !tlSceneBlocksContainer) return;
  const totalDur = appProject.totalDuration || 30;
  const fps = appProject.fps || 30;
  const laneLabelWidth = 90;
  const trackWidth = Math.max(1000, totalDur * timelinePxPerSec + 120);

  if (tlTracksInner) tlTracksInner.style.width = `${trackWidth}px`;

  // 1. Render Ruler
  tlRuler.innerHTML = "";
  for (let s = 0; s <= Math.ceil(totalDur); s++) {
    const leftPx = laneLabelWidth + (s * timelinePxPerSec);
    if (s % 5 === 0 || s === 0) {
      const label = document.createElement("div");
      label.className = "timeline-tick-label";
      label.style.left = `${leftPx}px`;
      label.textContent = `${s}s`;
      tlRuler.appendChild(label);
    }
  }

  // 2. Render Scene Blocks
  tlSceneBlocksContainer.innerHTML = "";
  appProject.scenes.forEach(scene => {
    const isSelected = String(scene.id) === String(selectedSceneId);
    const leftPx = (scene.startTime || 0) * timelinePxPerSec;
    const widthPx = Math.max(30, (scene.duration || 5) * timelinePxPerSec - 2);

    const block = document.createElement("div");
    block.className = `timeline-scene-block ${isSelected ? "active" : ""}`;
    block.style.left = `${leftPx}px`;
    block.style.width = `${widthPx}px`;
    block.textContent = `${scene.order}. ${scene.name || "Adegan"} (${scene.duration}s)`;

    block.addEventListener("click", e => {
      e.stopPropagation();
      selectScene(scene.id);
    });

    tlSceneBlocksContainer.appendChild(block);
  });

  // 3. Render Element Blocks (for active scene)
  if (tlElementBlocksContainer) {
    tlElementBlocksContainer.innerHTML = "";
    const activeScene = getActiveScene();
    if (activeScene && Array.isArray(activeScene.elements)) {
      const sceneStartPx = (activeScene.startTime || 0) * timelinePxPerSec;
      activeScene.elements.forEach(el => {
        const isSelected = String(el.id) === String(selectedElementId);
        const animDelay = el.animation?.delay || 0;
        const animDur = el.animation?.duration || 1;
        const elLeftPx = sceneStartPx + (animDelay * timelinePxPerSec);
        const elWidthPx = Math.max(40, animDur * timelinePxPerSec);

        const elBlock = document.createElement("div");
        elBlock.className = `timeline-element-block ${isSelected ? "active" : ""}`;
        elBlock.style.left = `${elLeftPx}px`;
        elBlock.style.width = `${elWidthPx}px`;
        elBlock.textContent = el.name || el.type;

        elBlock.addEventListener("click", e => {
          e.stopPropagation();
          selectElement(el.id);
        });

        tlElementBlocksContainer.appendChild(elBlock);
      });
    }
  }

  // 4. Render Audio Block
  if (tlAudioBlockContainer) {
    tlAudioBlockContainer.innerHTML = "";
    if (appProject.audio?.enabled) {
      const audioBlock = document.createElement("div");
      audioBlock.className = "timeline-audio-block";
      audioBlock.style.left = "0px";
      audioBlock.style.width = `${totalDur * timelinePxPerSec}px`;
      audioBlock.innerHTML = `<span>🎵 BGM: ${appProject.audio.muted ? "(Muted)" : "Active"} • Vol ${Math.round((appProject.audio.volume ?? 0.8) * 100)}%</span>`;
      tlAudioBlockContainer.appendChild(audioBlock);
    }
  }

  // 5. Update Playhead
  updatePlayheadUI(currentPlayheadTime);
}

function updatePlayheadUI(time) {
  const laneLabelWidth = 90;
  const leftPx = laneLabelWidth + (time * timelinePxPerSec);
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
    parentTimeDisplay.textContent = `${formatTime(time)} / ${formatTime(totalDur)}`;
  }
}

// Drag / click playhead scrubber
if (tlTracksScroll) {
  let isScrubbing = false;

  const seekFromClientX = clientX => {
    const rect = tlTracksInner.getBoundingClientRect();
    const laneLabelWidth = 90;
    const xInTracks = clientX - rect.left - laneLabelWidth;
    const newTime = Math.max(0, Math.min(appProject.totalDuration, xInTracks / timelinePxPerSec));
    currentPlayheadTime = newTime;
    updatePlayheadUI(newTime);
    sendToStage({ type: "MG_SEEK", time: newTime });
  };

  tlTracksScroll.addEventListener("pointerdown", e => {
    isScrubbing = true;
    seekFromClientX(e.clientX);
  });

  window.addEventListener("pointermove", e => {
    if (isScrubbing) {
      seekFromClientX(e.clientX);
    }
  });

  window.addEventListener("pointerup", () => {
    isScrubbing = false;
  });
}

// Timeline zoom slider
if (tlZoomSlider) {
  tlZoomSlider.addEventListener("input", e => {
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

const btnToggleTimeline = document.getElementById("btnToggleTimeline");
const studioTimelineWorkspace = document.querySelector(".studio-timeline-workspace");
const studioLayout = document.querySelector(".studio-layout");

if (btnToggleTimeline && studioTimelineWorkspace) {
  btnToggleTimeline.addEventListener("click", () => {
    const isCollapsed = studioTimelineWorkspace.classList.toggle("collapsed");
    if (studioLayout) studioLayout.classList.toggle("timeline-collapsed", isCollapsed);
    btnToggleTimeline.textContent = isCollapsed ? "▲" : "▼";
    btnToggleTimeline.title = isCollapsed ? "Bentangkan linimasa" : "Ciutkan linimasa";
    setTimeout(() => {
      updateStageScale();
      renderTimeline();
    }, 220);
  });
}

// ========================================================
// 11. CONCEPT & GLOBAL METADATA FORM
// ========================================================
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
  presetButtons.forEach(btn => {
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
  if (formTopic) formTopic.addEventListener("input", e => {
    appProject.videoTitle = e.target.value;
    appProject.name = e.target.value;
    debouncedHistoryPush();
  });

  if (formCategory) formCategory.addEventListener("change", e => {
    if (!appProject.metadata) appProject.metadata = {};
    appProject.metadata.category = e.target.value;
    history.push(appProject);
    compileAndRender();
  });

  if (formAngle) formAngle.addEventListener("input", e => {
    if (!appProject.metadata) appProject.metadata = {};
    appProject.metadata.angle = e.target.value;
    debouncedHistoryPush();
  });

  if (formAudience) formAudience.addEventListener("change", e => {
    if (!appProject.metadata) appProject.metadata = {};
    appProject.metadata.audience = e.target.value;
    history.push(appProject);
  });

  if (formGoal) formGoal.addEventListener("change", e => {
    if (!appProject.metadata) appProject.metadata = {};
    appProject.metadata.goal = e.target.value;
    history.push(appProject);
  });

  if (formTone) formTone.addEventListener("change", e => {
    if (!appProject.metadata) appProject.metadata = {};
    appProject.metadata.tone = e.target.value;
    history.push(appProject);
  });

  if (formDuration) formDuration.addEventListener("change", e => {
    const newDur = Math.max(5, parseInt(e.target.value, 10));
    history.push(appProject);
    scaleDuration(newDur);
  });

  if (formMetaphor) formMetaphor.addEventListener("change", e => {
    if (!appProject.metadata) appProject.metadata = {};
    appProject.metadata.metaphor = e.target.value;
    history.push(appProject);
    compileAndRender();
  });

  // Preset buttons
  presetButtons.forEach(btn => {
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

  // Color inputs
  const bindColor = (input, hex, key) => {
    if (!input) return;
    input.addEventListener("input", e => {
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
    appProject.scenes.forEach(s => {
      s.duration = Math.max(1, Math.round((s.duration / currentTotal) * dur));
    });
  }
  recalculateSceneTimings(appProject);
  renderAll();
}

// ========================================================
// 12. TAB SWITCHING (LEFT PANEL & FORMAT PICKER)
// ========================================================
// Left panel internal tabs (Scenes, Layers, Concept)
panelTabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.panelTab;
    panelTabButtons.forEach(b => {
      const isActive = b.dataset.panelTab === tabName;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (tabContentScenes) tabContentScenes.style.display = tabName === "scenes" ? "flex" : "none";
    if (tabContentLayers) tabContentLayers.style.display = tabName === "layers" ? "flex" : "none";
    if (tabContentConcept) tabContentConcept.style.display = tabName === "concept" ? "flex" : "none";
  });
});

// Format tab buttons in header (Post-Match, Weekly, etc.)
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.dataset.tabId;
    if (tabProjectCache[tabId]) {
      tabProjectCache[activeTabId] = JSON.parse(JSON.stringify(appProject));
      activeTabId = tabId;

      tabButtons.forEach(b => {
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

// ========================================================
// 13. MASTER COMPILATION & LIVE RENDER
// ========================================================
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

// ========================================================
// 14. TRANSPORT & IFRAME CONTROLS
// ========================================================
function sendToStage(message) {
  if (stageIframe && stageIframe.contentWindow) {
    try {
      stageIframe.contentWindow.postMessage(message, "*");
    } catch (e) {}
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
  parentTimeScrubber.addEventListener("input", e => {
    const seekTime = parseFloat(e.target.value);
    currentPlayheadTime = seekTime;
    sendToStage({ type: "MG_PAUSE" });
    sendToStage({ type: "MG_SEEK", time: seekTime });
    updatePlayheadUI(seekTime);
  });
}

if (parentSpeedSelect) {
  parentSpeedSelect.addEventListener("change", e => {
    sendToStage({ type: "MG_SET_SPEED", speed: parseFloat(e.target.value) });
  });
}

if (btnParentRecordMode) {
  btnParentRecordMode.addEventListener("click", () => {
    sendToStage({ type: "MG_START_RECORD" });
  });
}

// Listen to timeline updates from iframe
window.addEventListener("message", e => {
  if (!e.data || e.data.type !== "MG_TIMELINE_UPDATE") return;
  const { currentTime, duration, isPlaying: stagePlaying } = e.data;
  isPlaying = stagePlaying;
  currentPlayheadTime = currentTime;

  updatePlayheadUI(currentTime);

  if (parentIconPlay) {
    parentIconPlay.textContent = isPlaying ? "❚❚ Jeda" : "▶ Putar";
  }
});

// ========================================================
// 15. UNDO / REDO & SHORTCUTS
// ========================================================
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

window.addEventListener("keydown", e => {
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
  const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

  // Undo (Ctrl+Z)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    performUndo();
  }
  // Redo (Ctrl+Y or Ctrl+Shift+Z)
  else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
    e.preventDefault();
    performRedo();
  }
  // Play / Pause shortcut (Space)
  else if (e.code === "Space" && !isInput) {
    e.preventDefault();
    sendToStage({ type: "MG_TOGGLE_PLAY" });
  }
  // Delete active element (Delete / Backspace)
  else if ((e.key === "Delete" || e.key === "Backspace") && !isInput && selectedElementId) {
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

// ========================================================
// 16. ASSET BROWSER & ASPECT RATIO CONTROLLER (PHASE 2B)
// ========================================================
let currentAssetCategory = "All";
let assetSearchQuery = "";
let selectedModalAssetId = null;
let assetModalTargetMode = "add"; // "add" to scene or "replace" element

// Canvas Aspect Ratio Switcher
if (selectCanvasRatio) {
  selectCanvasRatio.addEventListener("change", e => {
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
    showToast(`Rasio kanvas diubah ke ${val} (${width}×${height})`);
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
  ASSET_CATEGORIES.forEach(cat => {
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

  assets.forEach(asset => {
    const card = document.createElement("div");
    card.className = `asset-card ${selectedModalAssetId === asset.id ? "selected" : ""}`;
    card.dataset.assetId = asset.id;

    let thumbHtml = "";
    if (asset.fileType === "svg-component" && asset.componentId) {
      thumbHtml = renderSvgComponent(asset.componentId, { width: 120, height: 90 });
    } else if (asset.fileUrl) {
      thumbHtml = `<img src="${asset.fileUrl}" alt="${escapeHTML(asset.name)}" loading="lazy" />`;
    } else {
      thumbHtml = `<span style="font-size: 28px;">📁</span>`;
    }

    const isCustom = asset.category === "Custom Upload" || asset.id.startsWith("ast_up_");

    card.innerHTML = `
      <div class="asset-card-thumb">${thumbHtml}</div>
      <div class="asset-card-info">
        <div class="asset-card-name" title="${escapeHTML(asset.name)}">${escapeHTML(asset.name)}</div>
        <div class="asset-card-meta">
          <span>${asset.fileType.toUpperCase()}</span>
          <span>${asset.width}×${asset.height}</span>
        </div>
      </div>
      <div class="asset-card-actions">
        <span class="asset-card-badge">${escapeHTML(asset.category)}</span>
        ${isCustom ? `<button type="button" class="asset-delete-btn" title="Hapus aset kustom" data-del-id="${asset.id}">🗑️</button>` : ""}
      </div>
    `;

    card.addEventListener("click", e => {
      if (e.target.closest(".asset-delete-btn")) return;
      selectedModalAssetId = asset.id;
      document.querySelectorAll(".asset-card").forEach(c => c.classList.remove("selected"));
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
        delBtn.addEventListener("click", e => {
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
    assetSelectedInfo.innerHTML = `<strong>${escapeHTML(asset.name)}</strong> (${asset.category}) • ${asset.width}×${asset.height}px • ${asset.fileType.toUpperCase()}`;
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
    // Mode "add"
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
    alert(`Tidak dapat menghapus aset!\nAset ini masih digunakan pada ${usage.count} elemen di adegan: ${usage.scenes.join(", ")}.\nHapus atau ganti elemen tersebut terlebih dahulu.`);
    return;
  }

  if (!confirm(`Hapus aset "${asset.name}" secara permanen?`)) return;

  deleteAsset(appProject, assetId, true);

  fetch("/api/assets/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId })
  }).catch(() => {});

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

// Modal UI triggers
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
  assetSearchInput.addEventListener("input", e => {
    assetSearchQuery = e.target.value;
    renderAssetGallery();
  });
}

if (btnTriggerUpload && assetFileInput) {
  btnTriggerUpload.addEventListener("click", () => assetFileInput.click());
  assetFileInput.addEventListener("change", e => {
    if (e.target.files && e.target.files[0]) {
      uploadAssetFile(e.target.files[0]);
      e.target.value = "";
    }
  });
}

if (assetDropzone) {
  assetDropzone.addEventListener("dragover", e => {
    e.preventDefault();
    assetDropzone.classList.add("dragover");
  });

  assetDropzone.addEventListener("dragleave", () => {
    assetDropzone.classList.remove("dragover");
  });

  assetDropzone.addEventListener("drop", e => {
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

// Fetch assets on boot
if (typeof fetch === "function") {
  fetch("/api/assets")
    .then(r => r.json())
    .then(assets => {
      if (Array.isArray(assets)) {
        assets.forEach(a => {
          if (a.category === "Custom Upload" || a.id.startsWith("ast_up_")) {
            try { addUploadedAsset(a); } catch (e) {}
          }
        });
      }
    })
    .catch(() => {});
}

// ========================================================
// 17. AUDIO ASSET BROWSER (PHASE 3)
// ========================================================
let currentAudioCategory = "All";
let audioSearchQuery = "";
let previewAudioElement = null;

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
  AUDIO_CATEGORIES.forEach(cat => {
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

  audioTracks.forEach(track => {
    const card = document.createElement("div");
    const isCurrentBgm = activeBgmUrl === track.fileUrl || appProject.audio?.assetId === track.id;
    card.className = `audio-card ${isCurrentBgm ? "active-bgm" : ""}`;

    card.innerHTML = `
      <div class="audio-card-left">
        <button type="button" class="audio-play-btn" title="Dengarkan preview audio">▶</button>
        <div class="audio-meta">
          <div class="audio-title">${escapeHTML(track.name)} ${isCurrentBgm ? ' <span style="color:#22c55e;font-size:11px;">(Aktif)</span>' : ''}</div>
          <div class="audio-sub">${escapeHTML(track.category)} • ${track.duration || 30}s • ${track.fileType.toUpperCase()}</div>
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
          playBtn.textContent = "▶";
          return;
        }
      }
      if (previewAudioElement) {
        previewAudioElement.pause();
        document.querySelectorAll(".audio-play-btn").forEach(b => b.textContent = "▶");
      }
      previewAudioElement = new Audio(track.fileUrl);
      previewAudioElement.volume = track.volume || 0.8;
      previewAudioElement.play().then(() => {
        playBtn.textContent = "⏸";
      }).catch(() => {
        playBtn.textContent = "▶";
      });
      previewAudioElement.onended = () => {
        playBtn.textContent = "▶";
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
  audioSearchInput.addEventListener("input", e => {
    audioSearchQuery = e.target.value;
    renderAudioList();
  });
}

if (btnTriggerAudioUpload && audioFileInput) {
  btnTriggerAudioUpload.addEventListener("click", () => audioFileInput.click());
  audioFileInput.addEventListener("change", e => {
    if (e.target.files && e.target.files[0]) {
      uploadAudioFile(e.target.files[0]);
      e.target.value = "";
    }
  });
}

if (audioDropzone) {
  audioDropzone.addEventListener("dragover", e => {
    e.preventDefault();
    audioDropzone.classList.add("dragover");
  });
  audioDropzone.addEventListener("dragleave", () => {
    audioDropzone.classList.remove("dragover");
  });
  audioDropzone.addEventListener("drop", e => {
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

// Fetch audio on boot
if (typeof fetch === "function") {
  fetch("/api/audio")
    .then(r => r.json())
    .then(tracks => {
      if (Array.isArray(tracks)) {
        tracks.forEach(t => {
          if (t.id.startsWith("aud_up_")) {
            try { addUploadedAudio(t); } catch (e) {}
          }
        });
      }
    })
    .catch(() => {});
}

// ========================================================
// 17B. AI VOICEOVER / TTS CONTROLLER (PHASE 4A)
// ========================================================
let availableTtsProviders = [];

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
  const provider = availableTtsProviders.find(p => p.id === currentProviderId);

  // Toggle Custom Voice button based on provider support
  if (btnOpenCloneModal) {
    btnOpenCloneModal.style.display = provider?.supportsCustomVoices ? "inline-flex" : "none";
  }

  if (voProviderNotice) {
    if (provider && !provider.configured) {
      voProviderNotice.textContent = `⚠️ ${provider.name} belum dikonfigurasi API Key di .env.`;
    } else {
      const extraNotice = provider?.supportsCustomVoices ? " (Mendukung Voice Cloning)" : "";
      voProviderNotice.textContent = `✓ ${provider ? provider.name : "Provider"} aktif.${extraNotice}`;
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
  const filtered = voices.filter(v => !currentLang || (v.language && v.language.toLowerCase().startsWith(currentLang.toLowerCase().split("-")[0])));
  const listToRender = filtered.length > 0 ? filtered : voices;

  const customVoices = listToRender.filter(v => Boolean(v.isCustom));
  const presetVoices = listToRender.filter(v => !v.isCustom);

  if (customVoices.length > 0) {
    const optGroupCustom = document.createElement("optgroup");
    optGroupCustom.label = "⭐ Suara Kustom (Voice Cloning)";
    customVoices.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = `👤 ${v.name}`;
      optGroupCustom.appendChild(opt);
    });
    selVoVoice.appendChild(optGroupCustom);

    const optGroupPreset = document.createElement("optgroup");
    optGroupPreset.label = "🎙️ Suara Bawaan (Preset)";
    presetVoices.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.name;
      optGroupPreset.appendChild(opt);
    });
    selVoVoice.appendChild(optGroupPreset);
  } else {
    presetVoices.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.name;
      selVoVoice.appendChild(opt);
    });
  }

  if (prevVoiceVal && listToRender.some(v => v.id === prevVoiceVal)) {
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
    parameters: { speakingRate: 1.0, pitch: 0.0, stability: 0.75 },
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

  const speed = vo.parameters?.speakingRate !== undefined ? vo.parameters.speakingRate : 1.0;
  if (rangeVoSpeed) rangeVoSpeed.value = speed;
  if (valVoSpeed) valVoSpeed.textContent = `${Number(speed).toFixed(2)}x`;

  const secondVal = vo.provider === "elevenlabs"
    ? (vo.parameters?.stability !== undefined ? vo.parameters.stability : 0.75)
    : (vo.parameters?.pitch !== undefined ? vo.parameters.pitch : 0.0);

  if (rangeVoPitch) rangeVoPitch.value = secondVal;
  if (valVoPitch) valVoPitch.textContent = vo.provider === "elevenlabs" ? Number(secondVal).toFixed(2) : (Number(secondVal) > 0 ? `+${secondVal}` : `${secondVal}`);

  // Status badge & Audio player
  if (voStatusBadge) {
    if (vo.audioUrl && vo.sourceText && scene.narration && vo.sourceText.trim() !== scene.narration.trim()) {
      vo.status = "outdated";
    }

    if (vo.status === "ready") {
      voStatusBadge.className = "badge-vo-ready";
      voStatusBadge.textContent = "✓ Tersedia";
    } else if (vo.status === "outdated") {
      voStatusBadge.className = "badge-vo-outdated";
      voStatusBadge.textContent = "⚠️ Teks Berubah";
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
    chkVoEnabled.addEventListener("change", e => {
      const scene = getActiveScene();
      if (!scene) return;
      if (!scene.voiceover) {
        scene.voiceover = {
          enabled: e.target.checked,
          provider: selVoProvider ? selVoProvider.value : "google",
          voiceId: selVoVoice ? selVoVoice.value : "id-ID-Standard-A",
          language: selVoLanguage ? selVoLanguage.value : "id-ID",
          parameters: { speakingRate: 1.0, pitch: 0.0, stability: 0.75 },
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
    selVoProvider.addEventListener("change", e => {
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
    selVoLanguage.addEventListener("change", e => {
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
    selVoVoice.addEventListener("change", e => {
      const scene = getActiveScene();
      if (scene) {
        if (!scene.voiceover) scene.voiceover = { enabled: true };
        scene.voiceover.voiceId = e.target.value;
        debouncedHistoryPush();
      }
    });
  }

  if (rangeVoSpeed) {
    rangeVoSpeed.addEventListener("input", e => {
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
    rangeVoPitch.addEventListener("input", e => {
      const val = parseFloat(e.target.value);
      const isEleven = selVoProvider && selVoProvider.value === "elevenlabs";
      if (valVoPitch) valVoPitch.textContent = isEleven ? val.toFixed(2) : (val > 0 ? `+${val}` : `${val}`);
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
      const textToSpeak = (scene && scene.narration && scene.narration.trim())
        ? scene.narration.trim()
        : "Halo Bobotoh, selamat datang di Persib Motion Studio!";

      const providerId = selVoProvider ? selVoProvider.value : "google";
      const voiceId = selVoVoice ? selVoVoice.value : "";
      const language = selVoLanguage ? selVoLanguage.value : "id-ID";
      const speakingRate = rangeVoSpeed ? parseFloat(rangeVoSpeed.value) : 1.0;
      const secondVal = rangeVoPitch ? parseFloat(rangeVoPitch.value) : 0.0;
      const parameters = { speakingRate };
      if (providerId === "elevenlabs") {
        parameters.stability = secondVal;
      } else {
        parameters.pitch = secondVal;
      }

      btnPreviewVoSpeech.disabled = true;
      btnPreviewVoSpeech.textContent = "🔊 Memuat...";

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
          voPreviewAudioElement.play().catch(() => {});
        }
      } catch (err) {
        alert(err.message);
      } finally {
        btnPreviewVoSpeech.disabled = false;
        btnPreviewVoSpeech.textContent = "🔊 Tes Suara";
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
      const speakingRate = rangeVoSpeed ? parseFloat(rangeVoSpeed.value) : 1.0;
      const secondVal = rangeVoPitch ? parseFloat(rangeVoPitch.value) : 0.0;
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
        const sceneIdx = appProject.scenes.findIndex(s => String(s.id) === String(scene.id)) + 1;

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
          showToast(`Voiceover untuk "${scene.name || 'Adegan'}" berhasil dibuat!`);
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

// ========================================================
// 17B. CUSTOM VOICE & VOICE CLONING (PHASE 4C)
// ========================================================
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
    voices.forEach(v => {
      const item = document.createElement("div");
      item.className = "custom-voice-item";
      item.innerHTML = `
        <div class="custom-voice-info">
          <div class="custom-voice-title">${v.name}</div>
          <div class="custom-voice-meta">
            <span class="badge-custom-voice">CLONED</span>
            <span>👤 ${v.speakerName || "Pemilik Sah"}</span>
            <span>• ${v.createdAt ? new Date(v.createdAt).toLocaleDateString("id-ID") : "-"}</span>
          </div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn btn-secondary btn-mini btn-test-clone-voice" data-voice-id="${v.id}" title="Tes suara kustom">
            🔊 Tes
          </button>
          <button type="button" class="btn btn-secondary btn-mini danger btn-del-clone-voice" data-voice-id="${v.id}" title="Hapus referensi custom voice">
            🗑️
          </button>
        </div>
      `;
      customVoiceListContainer.appendChild(item);
    });

    // Bind Test Preview Buttons
    customVoiceListContainer.querySelectorAll(".btn-test-clone-voice").forEach(btn => {
      btn.addEventListener("click", async () => {
        const voiceId = btn.getAttribute("data-voice-id");
        btn.disabled = true;
        btn.textContent = "⏳";
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
          btn.textContent = "🔊 Tes";
        }
      });
    });

    // Bind Delete Buttons
    customVoiceListContainer.querySelectorAll(".btn-del-clone-voice").forEach(btn => {
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
        lblCloneAudioFile.textContent = `✓ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
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
    fileCloneAudioSample.addEventListener("change", e => {
      if (e.target.files && e.target.files[0]) {
        handleCloneSampleFile(e.target.files[0]);
      }
    });

    dropZoneCloneAudio.addEventListener("dragover", e => {
      e.preventDefault();
      dropZoneCloneAudio.style.borderColor = "#f0a500";
    });
    dropZoneCloneAudio.addEventListener("dragleave", e => {
      e.preventDefault();
      dropZoneCloneAudio.style.borderColor = "var(--border-color)";
    });
    dropZoneCloneAudio.addEventListener("drop", e => {
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

        // Auto-select newly created voice in Scene Inspector
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

// ========================================================
// 18. AI CREATIVE DIRECTOR CONTROLLER (PHASE 3)
// ========================================================
let generatedAiProject = null;

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

// Quick prompt chips
document.querySelectorAll(".ai-chip-prompt").forEach(chip => {
  chip.addEventListener("click", () => {
    if (aiPromptInput) {
      aiPromptInput.value = chip.dataset.prompt || chip.textContent;
    }
  });
});

// Run AI Generation
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

    // Show loading indicator
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
        } catch (fetchErr) {}
      }

      if (!result || !result.project) {
        // Run intelligent fallback engine directly
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
    aiResultMeta.textContent = `${project.scenes.length} Adegan • Total ${project.totalDuration}s • Rasio ${project.aspectRatio} (${project.canvas.width}×${project.canvas.height})`;
  }
  if (aiResultAudioBadge) {
    const bgmName = getAudioAssetById(project.audio?.assetId)?.name || "Rock Anthem BGM";
    aiResultAudioBadge.textContent = `🎵 ${bgmName}`;
  }

  if (aiStoryboardCards) {
    aiStoryboardCards.innerHTML = "";
    project.scenes.forEach(sc => {
      const card = document.createElement("div");
      card.className = "storyboard-card";

      const assetTags = (sc.elements || [])
        .map(el => {
          const aId = el.assetId || el.props?.componentId;
          const name = getAssetById(aId)?.name || el.name || el.type;
          return `<span class="storyboard-asset-tag">🏷️ ${escapeHTML(name)}</span>`;
        })
        .join("");

      card.innerHTML = `
        <div class="storyboard-header">
          <span class="storyboard-title">Adegan ${sc.order}: ${escapeHTML(sc.title || sc.name)}</span>
          <span class="storyboard-duration">⏱️ ${sc.duration} detik</span>
        </div>
        <div class="storyboard-text">"${escapeHTML(sc.screenText || '')}"</div>
        <div class="storyboard-narration">${escapeHTML(sc.narration || '')}</div>
        <div class="storyboard-assets">${assetTags || '<span style="font-size: 10px; color: var(--text-muted);">Tipografi & Grafis Standar</span>'}</div>
      `;
      aiStoryboardCards.appendChild(card);
    });
  }
}

// Apply Generated AI Project to Editor
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

// ========================================================
// 19. AI SCENE REVISION CONTROLLER (PHASE 3)
// ========================================================
function openAiRevisionModal() {
  if (aiRevisionModal) aiRevisionModal.style.display = "flex";
  if (aiRevTargetScene) {
    aiRevTargetScene.innerHTML = `<option value="auto">Deteksi Otomatis dari Instruksi</option>`;
    appProject.scenes.forEach(sc => {
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

document.querySelectorAll(".ai-rev-chip").forEach(chip => {
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
        } catch (fetchErr) {}
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

// ========================================================
// 20. EXPORT & IMPORT ACTIONS
// ========================================================
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

// Import JSON file
if (btnImportJson && fileImportJson) {
  btnImportJson.addEventListener("click", () => {
    fileImportJson.click();
  });

  fileImportJson.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
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

// ========================================================
// 17. INITIALIZATION
// ========================================================
function initTheme() {
  const savedTheme = localStorage.getItem("mg_studio_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonUI(savedTheme);
}

function updateThemeButtonUI(theme) {
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = theme === "light" ? "☾ Gelap" : "☼ Terang";
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

// Initial boot
initTheme();
loadTtsProviders();
bindConceptFormEvents();
bindInspectorEvents();
renderAll();
