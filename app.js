import { PERSIB_TABS, DEFAULT_TAB, DEFAULT_FRAMEWORK, FRAMEWORKS } from "./templates.js";
import { generateMotionGraphicHTML } from "./motion-engine.js";
import { downloadHTMLFile, generateStructuredPrompt, downloadRenderPackage } from "./export-helper.js";

// Active Tab & In-Memory State Cache per Tab
let activeTabId = DEFAULT_TAB;
const tabStateCache = {};
Object.keys(PERSIB_TABS).forEach(tabKey => {
  tabStateCache[tabKey] = JSON.parse(JSON.stringify(PERSIB_TABS[tabKey]));
});

let appState = tabStateCache[activeTabId];

// DOM References
const themeToggleBtn = document.getElementById("themeToggleBtn");
const tabButtons = document.querySelectorAll("[data-tab-id]");
const quickDurButtons = document.querySelectorAll("[data-quick-dur]");
const btnResetFramework = document.getElementById("btnResetFramework");
const formTopic = document.getElementById("formTopic");
const formCategory = document.getElementById("formCategory");
const formAngle = document.getElementById("formAngle");
const formAudience = document.getElementById("formAudience");
const formGoal = document.getElementById("formGoal");
const formTone = document.getElementById("formTone");
const formDuration = document.getElementById("formDuration");
const formMetaphor = document.getElementById("formMetaphor");
const presetButtons = document.querySelectorAll("[data-preset-val]");
const scenesContainer = document.getElementById("scenesContainer");
const btnAddScene = document.getElementById("btnAddScene");
const btnGenerate = document.getElementById("btnGenerate");
const stageIframe = document.getElementById("stageIframe");

// Colors
const colorPrimary = document.getElementById("colorPrimary");
const colorSecondary = document.getElementById("colorSecondary");
const colorText = document.getElementById("colorText");
const colorAccent = document.getElementById("colorAccent");
const hexPrimary = document.getElementById("hexPrimary");
const hexSecondary = document.getElementById("hexSecondary");
const hexText = document.getElementById("hexText");
const hexAccent = document.getElementById("hexAccent");

// Export Actions & Modal
const btnDownloadHtml = document.getElementById("btnDownloadHtml");
const btnExportPrompt = document.getElementById("btnExportPrompt");
const btnDownloadRenderPkg = document.getElementById("btnDownloadRenderPkg");
const promptModal = document.getElementById("promptModal");
const promptCodeArea = document.getElementById("promptCodeArea");
const btnCopyModalPrompt = document.getElementById("btnCopyModalPrompt");
const btnCloseModal = document.getElementById("btnCloseModal");
const toastNotice = document.getElementById("toastNotice");

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem("mg_studio_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonUI(savedTheme);
}

function updateThemeButtonUI(theme) {
  if (theme === "light") {
    themeToggleBtn.textContent = "☾ Gelap";
    themeToggleBtn.setAttribute("aria-label", "Ganti ke mode gelap");
  } else {
    themeToggleBtn.textContent = "☼ Terang";
    themeToggleBtn.setAttribute("aria-label", "Ganti ke mode terang");
  }
}

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const target = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", target);
  localStorage.setItem("mg_studio_theme", target);
  updateThemeButtonUI(target);
});

// Toast notification helper
function showToast(message) {
  toastNotice.textContent = message;
  toastNotice.classList.add("show");
  setTimeout(() => {
    toastNotice.classList.remove("show");
  }, 2500);
}

// Populate UI with current state values
function syncStateToForm() {
  formTopic.value = appState.topic;
  formCategory.value = appState.category;
  formAngle.value = appState.angle;
  formAudience.value = appState.audience;
  formGoal.value = appState.goal;
  formTone.value = appState.tone;
  formDuration.value = appState.duration;
  formMetaphor.value = appState.metaphor;

  // Preset buttons
  presetButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.presetVal === appState.preset);
  });

  // Quick duration buttons
  quickDurButtons.forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.quickDur, 10) === appState.duration);
  });

  // Colors
  colorPrimary.value = appState.colors.primary;
  colorSecondary.value = appState.colors.secondary;
  colorText.value = appState.colors.text;
  colorAccent.value = appState.colors.accent;

  hexPrimary.textContent = appState.colors.primary;
  hexSecondary.textContent = appState.colors.secondary;
  hexText.textContent = appState.colors.text;
  hexAccent.textContent = appState.colors.accent;

  // Render scenes
  renderScenesEditor();
}

// Render dynamic scenes builder list
function renderScenesEditor() {
  scenesContainer.innerHTML = "";

  appState.scenes.forEach((scene, index) => {
    const sceneEl = document.createElement("div");
    sceneEl.className = "scene-block";
    sceneEl.innerHTML = `
      <div class="scene-block-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="scene-pill">Adegan ${index + 1}</span>
          <span style="font-size: 13px; font-weight: 600;">${escapeHTML(scene.title || "Bagian " + (index + 1))}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; color: var(--text-muted);">${scene.duration}s</span>
          ${appState.scenes.length > 2 ? `<button type="button" class="btn btn-secondary" data-del-scene="${index}" style="min-height: 28px; padding: 2px 8px; font-size: 11px;">Hapus</button>` : ""}
        </div>
      </div>
      <div class="scene-block-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Judul Adegan</label>
            <input type="text" class="form-input scene-input" data-scene-idx="${index}" data-field="title" value="${escapeHTML(scene.title)}">
          </div>
          <div class="form-group">
            <label class="form-label">Durasi (detik)</label>
            <input type="number" min="2" max="30" class="form-input scene-input" data-scene-idx="${index}" data-field="duration" value="${scene.duration}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Teks Layar (Maksimal 4 kata kunci)</label>
          <input type="text" class="form-input scene-input" data-scene-idx="${index}" data-field="screenText" value="${escapeHTML(scene.screenText)}">
        </div>

        <div class="form-group">
          <label class="form-label">Kata Aksen (Highlight Warna Emas)</label>
          <input type="text" class="form-input scene-input" data-scene-idx="${index}" data-field="highlightWord" value="${escapeHTML(scene.highlightWord || "")}">
        </div>

        <div class="form-group">
          <label class="form-label">Naskah Narasi Bobotoh</label>
          <textarea class="form-textarea scene-input" data-scene-idx="${index}" data-field="narration">${escapeHTML(scene.narration)}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Angka / Milestone (Opsional)</label>
            <input type="text" placeholder="misal: 3 - 1 atau 58%" class="form-input scene-input" data-scene-idx="${index}" data-field="dataValue" value="${escapeHTML(scene.dataValue || "")}">
          </div>
          <div class="form-group">
            <label class="form-label">Label Data</label>
            <input type="text" placeholder="misal: Skor Akhir / Possession" class="form-input scene-input" data-scene-idx="${index}" data-field="dataLabel" value="${escapeHTML(scene.dataLabel || "")}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Aksi Visual (Referensi Gerakan)</label>
          <input type="text" class="form-input scene-input" data-scene-idx="${index}" data-field="visualAction" value="${escapeHTML(scene.visualAction || "")}">
        </div>
      </div>
    `;
    scenesContainer.appendChild(sceneEl);
  });

  // Bind scene inputs
  const sceneInputs = scenesContainer.querySelectorAll(".scene-input");
  sceneInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      const idx = parseInt(e.target.dataset.sceneIdx, 10);
      const field = e.target.dataset.field;
      if (appState.scenes[idx]) {
        if (field === "duration") {
          appState.scenes[idx][field] = parseInt(e.target.value, 10) || 3;
        } else {
          appState.scenes[idx][field] = e.target.value;
        }
      }
    });
  });

  // Bind delete scene buttons
  const delButtons = scenesContainer.querySelectorAll("[data-del-scene]");
  delButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.delScene, 10);
      if (appState.scenes.length > 2) {
        appState.scenes.splice(idx, 1);
        renderScenesEditor();
        showToast("Adegan dihapus.");
      }
    });
  });
}

// Add new scene
btnAddScene.addEventListener("click", () => {
  const newId = appState.scenes.length + 1;
  appState.scenes.push({
    id: newId,
    title: `Adegan Baru ${newId}`,
    duration: 5,
    narration: "Tuliskan narasi suara untuk adegan baru ini...",
    screenText: "POIN PENTING BARU",
    highlightWord: "PENTING",
    dataValue: "",
    dataLabel: "",
    visualAction: "Elemen grafis masuk rapi di panggung."
  });
  renderScenesEditor();
  showToast("Adegan baru ditambahkan.");
});

// Setup color pickers
function bindColorInput(inputEl, hexEl, key) {
  inputEl.addEventListener("input", (e) => {
    const val = e.target.value;
    hexEl.textContent = val;
    appState.colors[key] = val;
  });
}

bindColorInput(colorPrimary, hexPrimary, "primary");
bindColorInput(colorSecondary, hexSecondary, "secondary");
bindColorInput(colorText, hexText, "text");
bindColorInput(colorAccent, hexAccent, "accent");

// Setup preset buttons
presetButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const presetVal = btn.dataset.presetVal;
    appState.preset = presetVal;

    if (presetVal === "preset_a") {
      appState.colors = { primary: "#003da5", secondary: "#fef3c7", text: "#0f172a", accent: "#d97706" };
      appState.metaphor = "chart";
    } else if (presetVal === "preset_c") {
      appState.colors = { primary: "#003da5", secondary: "#090d16", text: "#ffffff", accent: "#f0a500" };
      appState.metaphor = "meter";
    } else {
      appState.colors = { primary: "#003da5", secondary: "#0a0a0a", text: "#ffffff", accent: "#f0a500" };
      appState.metaphor = "card";
    }

    syncStateToForm();
    compileAndRender();
  });
});

// Setup basic form field listeners
formTopic.addEventListener("input", (e) => { appState.topic = e.target.value; });
formCategory.addEventListener("change", (e) => { appState.category = e.target.value; });
formAngle.addEventListener("input", (e) => { appState.angle = e.target.value; });
formAudience.addEventListener("change", (e) => { appState.audience = e.target.value; });
formGoal.addEventListener("change", (e) => { appState.goal = e.target.value; });
formTone.addEventListener("change", (e) => { appState.tone = e.target.value; });
formDuration.addEventListener("change", (e) => { appState.duration = parseInt(e.target.value, 10); });
formMetaphor.addEventListener("change", (e) => { appState.metaphor = e.target.value; });

// Tab Switching Listener (5 Kategori Format Media Persib)
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.dataset.tabId;
    if (PERSIB_TABS[tabId]) {
      // Simpan perubahan form saat ini ke cache tab yang sedang aktif
      tabStateCache[activeTabId] = JSON.parse(JSON.stringify(appState));

      // Pindah ke tab yang dipilih
      activeTabId = tabId;
      tabButtons.forEach(b => {
        const isActive = b.dataset.tabId === tabId;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      // Muat konfigurasi state dari tab yang dipilih
      appState = tabStateCache[tabId];
      syncStateToForm();
      compileAndRender();
      showToast(`Format "${PERSIB_TABS[tabId].name}" aktif!`);
    }
  });
});

// Quick Duration Buttons
quickDurButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const dur = parseInt(btn.dataset.quickDur, 10);
    appState.duration = dur;
    formDuration.value = String(dur);
    quickDurButtons.forEach(b => b.classList.toggle("active", b === btn));

    // Skala proporsional durasi tiap adegan
    const currentTotal = appState.scenes.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    if (currentTotal > 0) {
      appState.scenes.forEach(s => {
        s.duration = Math.max(2, Math.round((s.duration / currentTotal) * dur));
      });
    }
    renderScenesEditor();
    compileAndRender();
    showToast(`Durasi disetel ke ${dur} detik`);
  });
});

// Reset Tab Format Button
if (btnResetFramework) {
  btnResetFramework.addEventListener("click", () => {
    if (PERSIB_TABS[activeTabId]) {
      tabStateCache[activeTabId] = JSON.parse(JSON.stringify(PERSIB_TABS[activeTabId]));
      appState = tabStateCache[activeTabId];
      syncStateToForm();
      compileAndRender();
      showToast(`Format "${PERSIB_TABS[activeTabId].name}" direset ke bawaan!`);
    }
  });
}

// Master Compilation and Live Render
function compileAndRender() {
  btnGenerate.disabled = true;
  btnGenerate.textContent = "Mengompilasi Animasi...";

  try {
    const compiledHTML = generateMotionGraphicHTML(appState);
    stageIframe.srcdoc = compiledHTML;
    parentTimeScrubber.max = appState.duration || 30;
    parentTimeDisplay.textContent = "00:00 / " + formatTime(appState.duration || 30);
    showToast("Motion Graphic berhasil digenerate!");
  } catch (err) {
    console.error("Compilation error:", err);
    showToast("Terjadi kesalahan saat kompilasi.");
  } finally {
    setTimeout(() => {
      btnGenerate.disabled = false;
      btnGenerate.textContent = "GENERATE MOTION GRAPHIC";
    }, 400);
  }
}

btnGenerate.addEventListener("click", compileAndRender);

// Dedicated Parent Studio Player Controls
const btnParentPlayPause = document.getElementById("btnParentPlayPause");
const parentIconPlay = document.getElementById("parentIconPlay");
const btnParentRestart = document.getElementById("btnParentRestart");
const parentTimeScrubber = document.getElementById("parentTimeScrubber");
const parentTimeDisplay = document.getElementById("parentTimeDisplay");
const parentSpeedSelect = document.getElementById("parentSpeedSelect");
const btnParentRecordMode = document.getElementById("btnParentRecordMode");

let isStudioPlaying = false;

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
  parentTimeScrubber.addEventListener("input", (e) => {
    sendToStage({ type: "MG_PAUSE" });
    sendToStage({ type: "MG_SEEK", time: parseFloat(e.target.value) });
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

// Format mm:ss helper
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return String(m).padStart(2, "0") + ":" + String(rem).padStart(2, "0");
}

// Receive timeline update messages from iframe
window.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "MG_TIMELINE_UPDATE") return;
  const { currentTime, duration, isPlaying } = e.data;
  isStudioPlaying = isPlaying;
  if (parentTimeScrubber) {
    parentTimeScrubber.value = currentTime;
    parentTimeScrubber.max = duration;
  }
  if (parentTimeDisplay) {
    parentTimeDisplay.textContent = formatTime(currentTime) + " / " + formatTime(duration);
  }
  if (parentIconPlay) {
    parentIconPlay.textContent = isPlaying ? "❚❚ Jeda" : "▶ Putar";
  }
});

// Export Actions
btnDownloadHtml.addEventListener("click", () => {
  downloadHTMLFile(appState);
  showToast("File HTML 1080x1920 mandiri berhasil diunduh!");
});

btnExportPrompt.addEventListener("click", () => {
  const promptText = generateStructuredPrompt(appState);
  promptCodeArea.value = promptText;
  promptModal.style.display = "flex";
});

btnCopyModalPrompt.addEventListener("click", () => {
  navigator.clipboard.writeText(promptCodeArea.value).then(() => {
    showToast("Prompt berhasil disalin ke clipboard!");
    promptModal.style.display = "none";
  });
});

btnCloseModal.addEventListener("click", () => {
  promptModal.style.display = "none";
});

btnDownloadRenderPkg.addEventListener("click", () => {
  downloadRenderPackage(appState);
  showToast("Script render otomatis (render.js) berhasil diunduh!");
});

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
  const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    compileAndRender();
  } else if (e.key === "Escape") {
    promptModal.style.display = "none";
  } else if (e.code === "Space" && !isInput) {
    e.preventDefault();
    sendToStage({ type: "MG_TOGGLE_PLAY" });
  }
});

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, (tag) => {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag);
  });
}

// Initial Run
initTheme();
syncStateToForm();
compileAndRender();
