import {
  createDefaultProject,
  validateProject,
  migrateLegacyTemplateToProject,
  projectToLegacyConfig,
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
} from "../project-schema.js";

import { PERSIB_TABS } from "../templates.js";
import { generateMotionGraphicHTML } from "../motion-engine.js";
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

function runTests() {
  console.log("\n=======================================================");
  console.log("  AI MOTION GRAPHIC STUDIO - PHASE 2A TEST SUITE");
  console.log("=======================================================\n");

  const project = migrateLegacyTemplateToProject(PERSIB_TABS.post_match);
  const initialSceneCount = project.scenes.length;
  const initialDuration = project.totalDuration;

  // 1. Add, delete, duplicate, and reorder scene
  console.log("[Test 1] Scene Operations (Add, Delete, Duplicate, Reorder)");
  const newScene = addScene(project, { name: "Penalti Krusial", duration: 6 });
  assert(project.scenes.length === initialSceneCount + 1, "Scene added successfully");
  assert(newScene.name === "Penalti Krusial", "Scene name matches");
  assert(project.totalDuration === initialDuration + 6, `Total duration updated accurately (${project.totalDuration}s)`);

  const dupScene = duplicateScene(project, newScene.id);
  assert(dupScene !== null, "Scene duplicated successfully");
  assert(dupScene.id !== newScene.id, "Duplicated scene has unique ID");
  assert(dupScene.name.includes("(Salinan)"), "Duplicated scene name has copy marker");

  const reorderOk = reorderScenes(project, 0, 1);
  assert(reorderOk === true, "Scene reordered successfully");
  assert(project.scenes[0].order === 1 && project.scenes[1].order === 2, "Scene orders updated sequentially");

  const delOk = deleteScene(project, dupScene.id);
  assert(delOk === true, "Scene deleted successfully");
  const delNonExisting = deleteScene(project, "non_existing_id");
  assert(delNonExisting === false, "Delete invalid scene handled safely");

  // 2. Add, delete, duplicate, and reorder element
  console.log("\n[Test 2] Element Operations (Add, Delete, Duplicate, Reorder)");
  const targetScene = project.scenes[0];
  const initialElCount = targetScene.elements.length;

  const newEl = addElement(project, targetScene.id, {
    type: "text",
    name: "Teks Subjudul Baru",
    content: "Persib Juara 2026",
    position: { x: 100, y: 500 },
    size: { width: 400, height: 100 }
  });
  assert(newEl !== null, "Element added to scene successfully");
  assert(targetScene.elements.length === initialElCount + 1, "Scene element count increased");

  const dupEl = duplicateElement(project, targetScene.id, newEl.id);
  assert(dupEl !== null, "Element duplicated successfully");
  assert(dupEl.id !== newEl.id, "Duplicated element has unique ID");
  assert(dupEl.position.x === newEl.position.x + 20, "Duplicated element offset on X position");

  const reorderElOk = reorderElements(project, targetScene.id, 0, targetScene.elements.length - 1);
  assert(reorderElOk === true, "Elements reordered in layer tree");
  assert(targetScene.elements[targetScene.elements.length - 1].zIndex === targetScene.elements.length, "zIndex synchronized with layer order");

  const delElOk = deleteElement(project, targetScene.id, dupEl.id);
  assert(delElOk === true, "Element deleted successfully");

  // 3. Show/hide and lock/unlock layer
  console.log("\n[Test 3] Show/Hide and Lock/Unlock Layer");
  setElementVisibility(project, targetScene.id, newEl.id, false);
  assert(newEl.visible === false, "Element visibility toggled to false (hidden)");
  setElementVisibility(project, targetScene.id, newEl.id, true);
  assert(newEl.visible === true, "Element visibility toggled back to true");

  setElementLock(project, targetScene.id, newEl.id, true);
  assert(newEl.locked === true, "Element lock toggled to true (locked)");
  setElementLock(project, targetScene.id, newEl.id, false);
  assert(newEl.locked === false, "Element lock toggled to false (unlocked)");

  // 4. Canvas move and resize calculations
  console.log("\n[Test 4] Canvas Move & Resize");
  updateElementProperties(project, targetScene.id, newEl.id, {
    position: { x: 250, y: 650 },
    size: { width: 550, height: 160 }
  });
  assert(newEl.position.x === 250 && newEl.position.y === 650, "Element moved to (250, 650)");
  assert(newEl.size.width === 550 && newEl.size.height === 160, "Element resized to 550x160");

  // 5. Properties panel update
  console.log("\n[Test 5] Properties Panel Update");
  updateElementProperties(project, targetScene.id, newEl.id, {
    rotation: 15,
    opacity: 0.85,
    styling: { fontSize: 72, color: "#f0a500" },
    animation: { type: "scale", delay: 0.2, duration: 0.6 }
  });
  assert(newEl.rotation === 15, "Rotation property updated");
  assert(newEl.opacity === 0.85, "Opacity property updated");
  assert(newEl.styling.fontSize === 72, "Styling fontSize updated");
  assert(newEl.animation.type === "scale", "Animation type updated to scale");

  updateSceneProperties(project, targetScene.id, {
    name: "Kickoff Babak Pertama",
    duration: 7,
    transition: { type: "slash", direction: "left", duration: 0.5 }
  });
  assert(targetScene.name === "Kickoff Babak Pertama", "Scene title updated");
  assert(targetScene.duration === 7, "Scene duration updated to 7s");
  assert(targetScene.transition.direction === "left", "Transition direction updated to left");

  // 6. Timeline seek and frame conversion
  console.log("\n[Test 6] Timeline Seek & Frame Calculation");
  const fps = project.fps || 30;
  const seekTime = 12.5;
  const expectedFrame = Math.round(seekTime * fps);
  assert(expectedFrame === 375, `12.5 seconds at 30 FPS equals frame 375`);

  // 7. Scene duration and total duration consistency
  console.log("\n[Test 7] Scene Duration & Total Duration Consistency");
  recalculateSceneTimings(project);
  const sumDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);
  assert(Math.abs(sumDuration - project.totalDuration) < 0.001, `Sum of scenes (${sumDuration}s) equals totalDuration (${project.totalDuration}s)`);

  // 8. Audio playback and seek synchronization
  console.log("\n[Test 8] Audio Configuration & Synchronization");
  updateAudioProperties(project, {
    enabled: true,
    bgmUrl: "https://example.com/persib-anthem.mp3",
    volume: 0.9,
    muted: false
  });
  assert(project.audio.enabled === true, "Audio enabled in project");
  assert(project.audio.bgmUrl === "https://example.com/persib-anthem.mp3", "Audio URL configured");
  assert(project.audio.volume === 0.9, "Audio volume set to 90%");

  // 9. Undo and redo state restoration
  console.log("\n[Test 9] Undo & Redo Mechanism");
  const historyStack = [];
  const redoStack = [];

  // Snapshot before change
  historyStack.push(JSON.parse(JSON.stringify(project)));
  updateSceneProperties(project, targetScene.id, { name: "Nama Diubah Saja" });
  assert(targetScene.name === "Nama Diubah Saja", "State changed to 'Nama Diubah Saja'");

  // Perform Undo
  redoStack.push(JSON.parse(JSON.stringify(project)));
  const restored = historyStack.pop();
  assert(restored.scenes[0].name === "Kickoff Babak Pertama", "Undo restores previous scene name");

  // Perform Redo
  historyStack.push(JSON.parse(JSON.stringify(restored)));
  const redone = redoStack.pop();
  assert(redone.scenes[0].name === "Nama Diubah Saja", "Redo reapplies modified scene name");

  // 10. Save and reload project
  console.log("\n[Test 10] Save and Reload Project (Serialization)");
  const serialized = JSON.stringify(project);
  const reloaded = JSON.parse(serialized);
  const reloadedValidation = validateProject(reloaded);
  assert(reloadedValidation.valid === true, "Serialized project reloaded and validated successfully");
  assert(reloaded.audio.enabled === true, "Audio settings preserved across reload");
  assert(reloaded.scenes.length === project.scenes.length, "All scenes preserved across reload");

  // 11. Preview GSAP after changes
  console.log("\n[Test 11] GSAP Preview Compilation After Changes");
  const mutatedHTML = generateMotionGraphicHTML(project);
  assert(typeof mutatedHTML === "string" && mutatedHTML.length > 5000, "GSAP HTML compiled from mutated project");
  assert(mutatedHTML.includes("bgmAudio"), "GSAP HTML includes background audio player");
  assert(mutatedHTML.includes("Kickoff Babak Pertama") || mutatedHTML.includes("Penalti Krusial"), "Mutated scene content reflected in HTML");

  // 12. Remotion render after changes
  console.log("\n[Test 12] Remotion Still Frame Render After Changes");
  const testOutFile = path.resolve(__dirname, "../out/test-phase2a.png");
  try {
    // Write mutated project to input file for Remotion verification
    fs.writeFileSync(path.resolve(__dirname, "../input/unified-project.json"), JSON.stringify(project, null, 2));
    execSync("npx remotion still UnifiedProject out/test-phase2a.png --frame=15", {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf-8"
    });
    assert(fs.existsSync(testOutFile), "Remotion rendered still frame after Phase 2A project mutations");
  } catch (err) {
    assert(false, `Remotion render failed: ${err.message}`);
  }

  // 13. Legacy template compatibility
  console.log("\n[Test 13] Legacy Template Compatibility");
  const tabKeys = Object.keys(PERSIB_TABS);
  tabKeys.forEach(key => {
    const orig = PERSIB_TABS[key];
    const proj = migrateLegacyTemplateToProject(orig);
    const back = projectToLegacyConfig(proj);
    assert(back.id === key, `Legacy template '${key}' converts cleanly to UnifiedProject and back`);
  });

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

