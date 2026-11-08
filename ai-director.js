/**
 * Gemini AI Creative Director Engine
 * Generates and revises Unified Project JSON based on user prompt instructions,
 * intelligent scene planning, and strict asset selection from Shared Asset Library.
 */

import { getAllAssets, getAssetById } from "./asset-library.js";
import { getAllAudioAssets, recommendAudioForConcept } from "./audio-library.js";
import {
  createDefaultProject,
  validateProject,
  recalculateSceneTimings,
  CURRENT_SCHEMA_VERSION
} from "./project-schema.js";

// Load environment variables if .env file exists
function getApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return "";
}

/**
 * Strips dangerous injection patterns and limits length.
 */
export function sanitizeUserPrompt(rawPrompt) {
  if (!rawPrompt || typeof rawPrompt !== "string") return "";
  const trimmed = rawPrompt.trim();
  // Limit to 2000 chars
  const capped = trimmed.slice(0, 2000);
  return capped.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
}

/**
 * Builds system prompt catalog context describing available assets and audio.
 */
function buildAssetCatalogContext() {
  const assets = getAllAssets().map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    fileType: a.fileType,
    componentId: a.componentId || null,
    tags: a.tags || []
  }));

  const audioList = getAllAudioAssets().map(aud => ({
    id: aud.id,
    name: aud.name,
    category: aud.category,
    fileUrl: aud.fileUrl
  }));

  return { assets, audioList };
}

/**
 * Intelligent Heuristic Generator (Offline & Fallback Creative Director)
 * Produces full structured Unified Project JSON matching user prompt semantics.
 */
export function generateProjectWithHeuristic(prompt, options = {}) {
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

  // Detect topic & context
  let topic = "Persib Bandung Juara";
  let preset = options.preset || "preset_b";
  let category = "Hasil Pertandingan";

  // Score extraction (e.g. "2-1", "3-0")
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

  // Select recommended audio
  const recAudio = recommendAudioForConcept({ topic, category });

  // Plan 5 Narrative Scenes
  const scenes = [];

  // Scene 1: Intro / Identity
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

  // Scene 2: Match Result / Core Action
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
          position: { x: Math.round(width / 2 - 160), y: Math.round(height * 0.50) },
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

  // Scene 3: Key Highlights & Data / Tactical Radar
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

  // Scene 4: Man of the Match / Trophy Glory
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

  // Scene 5: Closing / Trophy Ladder
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

/**
 * Generates a full project from prompt by contacting Gemini API or falling back cleanly.
 */
export async function generateProjectFromPrompt(prompt, options = {}) {
  const cleanPrompt = sanitizeUserPrompt(prompt);
  if (!cleanPrompt) {
    throw new Error("Instruksi prompt pengguna tidak boleh kosong.");
  }

  const apiKey = getApiKey();
  const { assets, audioList } = buildAssetCatalogContext();
  let providerError = null;

  // If Gemini API Key is configured, attempt real Gemini REST API call
  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemInstruction = `You are the Lead Creative Director and Motion Designer for Persib Bandung Motion Graphic Studio.
Your role: Transform user instructions into a completely valid Unified Project JSON format (version 1.0.0).

STRICT ASSET USAGE RULES:
1. You may ONLY reference visual assets that exist in the provided Available Asset Catalog by their exact id.
2. NEVER invent non-existent asset IDs.
3. Available Visual Assets: ${JSON.stringify(assets)}
4. Available Audio Tracks: ${JSON.stringify(audioList)}
5. The output must be pure, parseable JSON representing a single UnifiedProject object matching the schema.`;

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\nUSER INSTRUCTION:\n"${cleanPrompt}"\nTarget Aspect Ratio: ${options.aspectRatio || "9:16"}\nTarget Duration: ${options.duration || 30} seconds`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const geminiRes = await res.json();
        const rawJsonText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          const validated = validateProject(parsed);
          if (validated.valid) {
            // Verify all asset IDs exist in catalog; fallback unknown IDs to default
            const knownAssetIds = new Set(assets.map(a => a.id));
            validated.project.scenes.forEach(sc => {
              (sc.elements || []).forEach(el => {
                if (el.assetId && !knownAssetIds.has(el.assetId)) {
                  el.assetId = "ast_logo_persib";
                }
              });
            });

            recalculateSceneTimings(validated.project);
            return {
              success: true,
              project: validated.project,
              source: "gemini_api",
              summary: `Proyek "${validated.project.videoTitle}" berhasil dirancang oleh Gemini AI (${validated.project.scenes.length} adegan).`
            };
          } else {
            providerError = `Skema tidak valid: ${validated.errors.join(", ")}`;
          }
        } else {
          providerError = "Respons Gemini tidak memuat teks JSON";
        }
      } else {
        providerError = `Gemini API error HTTP ${res.status}`;
      }
    } catch (err) {
      providerError = err.message || "Timeout / koneksi ke Gemini API gagal";
    }
  }

  // Reliable, high-precision Creative Director Heuristic Engine
  const project = generateProjectWithHeuristic(cleanPrompt, options);
  const validated = validateProject(project);

  return {
    success: true,
    project: validated.project,
    source: apiKey ? "heuristic_fallback" : "heuristic_offline",
    providerError: providerError || null,
    summary: apiKey
      ? `[Fallback Heuristik] Proyek "${project.videoTitle}" dirancang dengan mesin heuristik internal (${providerError || 'Gemini tidak merespons'}).`
      : `Proyek "${project.videoTitle}" berhasil dirancang dengan mesin Creative Director lokal (${project.scenes.length} adegan).`
  };
}

/**
 * Revises an existing project based on incremental prompt instructions using heuristic rules.
 */
export function reviseProjectWithHeuristic(currentProject, revisionPrompt, targetSceneId = null) {
  const cleanPrompt = sanitizeUserPrompt(revisionPrompt);
  const pLower = cleanPrompt.toLowerCase();
  const revised = JSON.parse(JSON.stringify(currentProject));

  // Determine target scene
  let targetScene = null;
  if (targetSceneId) {
    targetScene = revised.scenes.find(s => String(s.id) === String(targetSceneId));
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

  // Revision Type 1: Aspect Ratio change
  if (pLower.includes("landscape") || pLower.includes("16:9")) {
    revised.aspectRatio = "16:9";
    revised.canvas.width = 1920;
    revised.canvas.height = 1080;
    summary = "Format kanvas diubah menjadi Landscape 16:9 (1920×1080).";
  } else if (pLower.includes("square") || pLower.includes("persegi") || pLower.includes("1:1")) {
    revised.aspectRatio = "1:1";
    revised.canvas.width = 1080;
    revised.canvas.height = 1080;
    summary = "Format kanvas diubah menjadi Persegi 1:1 (1080×1080).";
  } else if (pLower.includes("portrait") || pLower.includes("vertikal") || pLower.includes("9:16")) {
    revised.aspectRatio = "9:16";
    revised.canvas.width = 1080;
    revised.canvas.height = 1920;
    summary = "Format kanvas diubah menjadi Vertikal 9:16 (1080×1920).";
  }

  // Revision Type 2: Duration adjustment
  const durMatch = cleanPrompt.match(/(\d+)\s*(?:detik|s|second)/i);
  if (durMatch && (pLower.includes("durasi") || pLower.includes("detik"))) {
    const newDur = Math.max(1, Math.min(60, Number(durMatch[1])));
    if (targetScene) {
      targetScene.duration = newDur;
      summary = `Durasi ${targetScene.title || targetScene.name} diubah menjadi ${newDur} detik.`;
    }
  }

  // Revision Type 3: Change background
  if (pLower.includes("background") || pLower.includes("latar")) {
    if (targetScene) {
      targetScene.background = "radial-gradient(ellipse at 50% 20%, #003da5 0%, #05070e 80%)";
      summary = `Latar belakang ${targetScene.title || targetScene.name} diperbarui lebih dramatis.`;
    }
  }

  // Revision Type 4: Enlarge headline / text
  if (pLower.includes("lebih besar") || pLower.includes("perbesar") || pLower.includes("font")) {
    if (targetScene && Array.isArray(targetScene.elements)) {
      const textElem = targetScene.elements.find(e => e.type === "text");
      if (textElem) {
        if (!textElem.styling) textElem.styling = {};
        textElem.styling.fontSize = Math.min(120, (Number(textElem.styling.fontSize) || 48) + 16);
        summary = `Ukuran teks pada ${targetScene.title || targetScene.name} diperbesar.`;
      }
    }
  }

  // Revision Type 5: Change animation
  if (pLower.includes("animasi") || pLower.includes("smooth")) {
    if (targetScene && Array.isArray(targetScene.elements)) {
      targetScene.elements.forEach(el => {
        if (!el.animation) el.animation = {};
        el.animation.type = pLower.includes("scale") ? "scale" : "fade";
        el.animation.duration = 0.8;
        el.animation.easing = "power2.out";
      });
      summary = `Animasi elemen pada ${targetScene.title || targetScene.name} diubah menjadi lebih halus.`;
    }
  }

  // Revision Type 6: Swap asset
  if (pLower.includes("trophy") || pLower.includes("piala")) {
    if (targetScene && Array.isArray(targetScene.elements)) {
      const visualElem = targetScene.elements.find(e => ["image", "svg", "component"].includes(e.type));
      if (visualElem) {
        visualElem.type = "svg";
        visualElem.assetId = "ast_trophy_ladder";
        visualElem.props = { componentId: "svg_trophy_ladder" };
        summary = `Aset visual pada ${targetScene.title || targetScene.name} diganti dengan Piala Juara Emas.`;
      }
    }
  } else if (pLower.includes("jersey") || pLower.includes("baju")) {
    if (targetScene && Array.isArray(targetScene.elements)) {
      const visualElem = targetScene.elements.find(e => ["image", "svg", "component"].includes(e.type));
      if (visualElem) {
        visualElem.type = "svg";
        visualElem.assetId = "ast_jersey_no10";
        visualElem.props = { componentId: "svg_jersey_no10" };
        summary = `Aset visual pada ${targetScene.title || targetScene.name} diganti dengan Jersey No. 10.`;
      }
    }
  }

  // Recalculate sequential start times and frames
  recalculateSceneTimings(revised);
  const validated = validateProject(revised);

  return {
    success: true,
    project: validated.project,
    summary
  };
}

/**
 * Revises an existing project based on incremental prompt instructions.
 * Connects to Gemini API when available, and falls back gracefully to Heuristic Engine with transparent source status.
 */
export async function reviseProjectWithAI(currentProject, revisionPrompt, targetSceneId = null) {
  if (!currentProject || !Array.isArray(currentProject.scenes)) {
    throw new Error("Project aktif tidak valid.");
  }

  const cleanPrompt = sanitizeUserPrompt(revisionPrompt);
  if (!cleanPrompt) {
    throw new Error("Instruksi revisi tidak boleh kosong.");
  }

  const apiKey = getApiKey();
  const { assets, audioList } = buildAssetCatalogContext();
  let providerError = null;

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemInstruction = `You are the Lead Creative Director revising a Unified Project JSON (version 1.0.0).
Your task: Modify the project based on the user's revision instruction.
Target Scene ID: ${targetSceneId || "auto (infer from prompt or revise relevant scenes)"}

STRICT REVISION RULES:
1. ONLY modify the properties or scenes relevant to the user's instruction.
2. PRESERVE all other scenes, elements, audio settings, and styling unchanged.
3. You may ONLY reference visual asset IDs that exist in the catalog: ${JSON.stringify(assets.map(a => a.id))}
4. The output must be pure parseable JSON representing the complete revised UnifiedProject object.`;

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\nCURRENT PROJECT JSON:\n${JSON.stringify(currentProject)}\n\nREVISION INSTRUCTION:\n"${cleanPrompt}"`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const geminiRes = await res.json();
        const rawJson = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          const validated = validateProject(parsed);
          if (validated.valid) {
            recalculateSceneTimings(validated.project);
            return {
              success: true,
              project: validated.project,
              source: "gemini_api",
              summary: `Revisi proyek berhasil diterapkan oleh Gemini AI sesuai instruksi "${cleanPrompt}".`
            };
          } else {
            providerError = `Validasi skema gagal: ${validated.errors.join(", ")}`;
          }
        }
      } else {
        providerError = `Gemini API HTTP ${res.status}`;
      }
    } catch (err) {
      providerError = err.message || "Timeout / gagal terhubung ke Gemini API";
    }
  }

  // Fallback to Heuristic Revision
  const heuristicResult = reviseProjectWithHeuristic(currentProject, cleanPrompt, targetSceneId);
  return {
    success: true,
    project: heuristicResult.project,
    source: apiKey ? "heuristic_fallback" : "heuristic_offline",
    providerError: providerError || null,
    summary: apiKey
      ? `[Fallback Heuristik] ${heuristicResult.summary} (Gemini tidak merespons: ${providerError}).`
      : `${heuristicResult.summary} (Mode Revisi Heuristik Lokal)`
  };
}

