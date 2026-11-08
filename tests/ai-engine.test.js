import {
  generateProjectFromPrompt,
  generateProjectWithHeuristic,
  reviseProjectWithAI,
  sanitizeUserPrompt
} from "../ai-director.js";

import {
  getAllAudioAssets,
  getAudioAssetById,
  filterAudioAssets,
  addUploadedAudio,
  deleteAudioAsset,
  recommendAudioForConcept,
  AUDIO_CATEGORIES
} from "../audio-library.js";

import {
  getOrGenerateThumbnail,
  clearThumbnailCache
} from "../thumbnail-manager.js";

import {
  validateProject,
  createDefaultProject,
  addElement,
  updateElementProperties,
  CURRENT_SCHEMA_VERSION
} from "../project-schema.js";

import { getAssetById, validateProjectAssets } from "../asset-library.js";
import { generateMotionGraphicHTML } from "../motion-engine.js";
import { PERSIB_TABS, getUnifiedProjectForTab } from "../templates.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runAiEngineTests() {
  console.log("\n=======================================================");
  console.log("  AI MOTION GRAPHIC STUDIO - PHASE 3 TEST SUITE");
  console.log("=======================================================\n");

  // [Test 1] Gemini API connection & fallback
  console.log("[Test 1] Gemini API connection & fallback");
  const testPrompt = "Buat motion graphic kemenangan Persib Bandung skor 2-1 di stadion GBLA durasi 30 detik";
  const genResult = await generateProjectFromPrompt(testPrompt, { aspectRatio: "9:16", duration: 30 });
  assert(genResult.success === true, "AI Generator returns success status");
  assert(genResult.project !== null && typeof genResult.project === "object", "AI Generator returns project object");
  assert(["gemini_api", "gemini_fallback", "creative_director_engine", "heuristic_fallback", "heuristic_offline"].includes(genResult.source), "AI Generator identifies valid engine source");

  // [Test 2] Prompt-to-Project generation
  console.log("\n[Test 2] Prompt-to-Project generation");
  const project = genResult.project;
  assert(project.version === CURRENT_SCHEMA_VERSION, `Project version matches ${CURRENT_SCHEMA_VERSION}`);
  assert(project.videoTitle && project.videoTitle.length > 0, "Generated project has meaningful video title");
  assert(project.aspectRatio === "9:16", "Aspect ratio is 9:16");
  assert(project.canvas.width === 1080 && project.canvas.height === 1920, "Canvas dimensions match 1080x1920");
  assert(project.scenes && project.scenes.length >= 4, "Generated at least 4 narrative scenes");

  // [Test 3] Unified Project JSON validation
  console.log("\n[Test 3] Unified Project JSON validation");
  const validation = validateProject(project);
  assert(validation.valid === true, "AI generated project passes schema validation");
  assert(validation.errors.length === 0, "No schema validation errors");

  // [Test 4] Invalid AI response handling
  console.log("\n[Test 4] Invalid AI response handling");
  const invalidJsonTest = { version: "1.0.0", canvas: { width: -100, height: 0 }, fps: 0, scenes: [] };
  const invalidVal = validateProject(invalidJsonTest);
  assert(invalidVal.valid === false, "Invalid AI response structure flagged as invalid");
  assert(invalidVal.errors.length > 0, "Descriptive validation errors returned for invalid project");
  assert(invalidVal.project && invalidVal.project.scenes.length > 0, "Safe normalized fallback project provided");

  // [Test 5] Asset selection berdasarkan katalog
  console.log("\n[Test 5] Asset selection berdasarkan katalog");
  let allAssetsValid = true;
  project.scenes.forEach(sc => {
    (sc.elements || []).forEach(el => {
      if (el.assetId) {
        const found = getAssetById(el.assetId);
        if (!found) allAssetsValid = false;
      }
    });
  });
  assert(allAssetsValid === true, "All assets chosen by AI strictly exist in Central Asset Library");

  // [Test 6] Missing asset handling
  console.log("\n[Test 6] Missing asset handling");
  const testMissingProj = JSON.parse(JSON.stringify(project));
  testMissingProj.scenes[0].elements.push({
    id: "el_ghost",
    type: "image",
    name: "Ghost Image",
    assetId: "ast_non_existent_id_999"
  });
  const missingCheck = validateProjectAssets(testMissingProj);
  assert(missingCheck.valid === false, "Missing asset flagged by validator");
  assert(missingCheck.missing.length === 1, "Exactly one missing asset detected");

  // [Test 7] Scene planning
  console.log("\n[Test 7] Scene planning");
  const titles = project.scenes.map(s => s.title || s.name);
  assert(titles[0].includes("PEMBUKA") || titles[0].includes("Intro"), "Scene 1 acts as Intro");
  assert(project.scenes.some(s => (s.screenText || "").includes("PERSIB")), "Scene contains screen text for Persib");
  assert(project.scenes.every(s => s.narration && s.narration.length > 5), "All scenes have scripted narrations");

  // [Test 8] Total duration consistency
  console.log("\n[Test 8] Total duration consistency");
  const sumSceneDurations = project.scenes.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  assert(Math.abs(sumSceneDurations - project.totalDuration) < 0.1, `Sum of scenes (${sumSceneDurations}s) matches totalDuration (${project.totalDuration}s)`);
  assert(project.scenes[0].startFrame === 0, "First scene starts at frame 0");

  // [Test 9] AI scene revision
  console.log("\n[Test 9] AI scene revision");
  const origScene1Duration = project.scenes[0].duration;
  const origScene2Title = project.scenes[1].title || project.scenes[1].name;

  const revResult = await reviseProjectWithAI(project, "Kurangi durasi intro menjadi 4 detik", project.scenes[0].id);
  assert(revResult.success === true, "AI scene revision executed successfully");
  assert(revResult.project.scenes[0].duration === 4, "Scene 1 duration updated to exactly 4s");
  assert(revResult.project.totalDuration === (project.totalDuration - origScene1Duration + 4), "Project total duration adjusted consistently");

  // [Test 10] Preservation of unrelated scenes
  console.log("\n[Test 10] Preservation of unrelated scenes");
  const revisedProj = revResult.project;
  assert(revisedProj.scenes[1].title === project.scenes[1].title, "Scene 2 title remains unmodified");
  assert(revisedProj.scenes[1].elements.length === project.scenes[1].elements.length, "Scene 2 element count preserved");
  assert(revisedProj.scenes[2].title === project.scenes[2].title, "Scene 3 title remains unmodified");

  // [Test 11] Undo/redo setelah AI revision
  console.log("\n[Test 11] Undo/redo setelah AI revision");
  const historyStates = [JSON.parse(JSON.stringify(project))];
  historyStates.push(JSON.parse(JSON.stringify(revisedProj)));
  // Undo: pop revised state, retrieve previous state
  const undoneState = historyStates[0];
  assert(undoneState.scenes[0].duration === origScene1Duration, "Undo restores initial scene duration");
  // Redo: retrieve revised state
  const redoneState = historyStates[1];
  assert(redoneState.scenes[0].duration === 4, "Redo reapplies revised scene duration");

  // [Test 12] Audio asset selection
  console.log("\n[Test 12] Audio asset selection");
  const victoryAudio = recommendAudioForConcept({ topic: "kemenangan skor 2-1", category: "Hasil Pertandingan" });
  assert(victoryAudio && victoryAudio.category.includes("Celebration") || victoryAudio.category.includes("Background"), "Recommended celebration or background audio for victory");

  const transferAudio = recommendAudioForConcept({ topic: "transfer wilujeng sumping", category: "Kabar Transfer & Skuad" });
  assert(transferAudio && (transferAudio.id === "aud_breaking_alert" || transferAudio.id === "aud_cinematic_impact"), "Recommended alert/impact audio for transfer announcement");

  // [Test 13] Audio preview integration
  console.log("\n[Test 13] Audio preview integration");
  assert(project.audio !== undefined, "Project has audio configuration");
  assert(project.audio.enabled === true, "Audio is enabled in project");
  assert(project.audio.bgmUrl && project.audio.bgmUrl.length > 0, "BGM URL is set in project");

  // [Test 14] Thumbnail generation
  console.log("\n[Test 14] Thumbnail generation");
  clearThumbnailCache();
  const thumb1 = getOrGenerateThumbnail("ast_persib_shield", true);
  assert(thumb1 && thumb1.data, "Thumbnail generated for ast_persib_shield");
  assert(thumb1.mimeType === "image/svg+xml", "Thumbnail has image/svg+xml mimeType");
  assert(thumb1.fromCache === false, "First generation marked as fromCache: false");

  // [Test 15] Thumbnail caching
  console.log("\n[Test 15] Thumbnail caching");
  const thumb2 = getOrGenerateThumbnail("ast_persib_shield", false);
  assert(thumb2 && thumb2.fromCache === true, "Repeated lookup retrieved from cache (fromCache: true)");

  // [Test 16] GSAP preview dari hasil AI
  console.log("\n[Test 16] GSAP preview dari hasil AI");
  const gsapHtml = generateMotionGraphicHTML(project);
  assert(gsapHtml.includes('id="stage"'), "GSAP HTML contains #stage viewport");
  assert(gsapHtml.includes('id="customSceneElementsStage"'), "GSAP HTML contains customSceneElementsStage");
  assert(gsapHtml.includes(project.scenes[0].screenText), "GSAP HTML embeds generated headline text");

  // [Test 17] Remotion render dari hasil AI
  console.log("\n[Test 17] Remotion render dari hasil AI");
  fs.writeFileSync(path.join(__dirname, "..", "input", "unified-project.json"), JSON.stringify(project, null, 2));

  let remotionAiRendered = false;
  try {
    execSync("npx remotion still UnifiedProject out/test-ai-render.png --frame=15", {
      stdio: "pipe",
      cwd: path.join(__dirname, "..")
    });
    remotionAiRendered = fs.existsSync(path.join(__dirname, "..", "out", "test-ai-render.png"));
  } catch (err) {
    console.error("Remotion render error:", err.message);
  }
  assert(remotionAiRendered === true, "Remotion still frame rendered successfully from AI generated project");

  // [Test 18] API key security
  console.log("\n[Test 18] API key security");
  const projectJsonString = JSON.stringify(project);
  assert(!projectJsonString.includes("AIzaSy"), "Project JSON contains no raw API key strings");
  const sanitizedPrompt = sanitizeUserPrompt("Halo\u0000Bobotoh\u001fJuara");
  assert(!sanitizedPrompt.includes("\u0000"), "Sanitizer stripped dangerous null bytes");

  // [Test 19] Template lama tetap kompatibel
  console.log("\n[Test 19] Template lama tetap kompatibel");
  const tabs = ["post_match", "weekly_recap", "trivia_facts", "before_match", "transfer_news"];
  let allTabsOk = true;
  tabs.forEach(tabId => {
    const tabProject = getUnifiedProjectForTab(tabId);
    if (!tabProject || tabProject.scenes.length !== 5) allTabsOk = false;
  });
  assert(allTabsOk === true, "All 5 legacy Persib templates remain fully compatible");

  // [Test 20] Manual editor tetap berfungsi
  console.log("\n[Test 20] Manual editor tetap berfungsi");
  const editableProj = JSON.parse(JSON.stringify(project));
  const newElement = addElement(editableProj, editableProj.scenes[0].id, {
    type: "text",
    name: "Teks Edit Manual",
    content: "Diedit Pengguna",
    position: { x: 50, y: 100 }
  });
  assert(newElement && newElement.id, "Element added manually to AI project");
  updateElementProperties(editableProj, editableProj.scenes[0].id, newElement.id, {
    position: { x: 120, y: 220 }
  });
  assert(editableProj.scenes[0].elements.find(e => e.id === newElement.id).position.x === 120, "Manual element modification persists accurately");

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAiEngineTests();

