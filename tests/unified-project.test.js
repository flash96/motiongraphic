import {
  createDefaultProject,
  validateProject,
  migrateLegacyTemplateToProject,
  projectToLegacyConfig,
  recalculateSceneTimings,
  CURRENT_SCHEMA_VERSION
} from "../project-schema.js";

import { PERSIB_TABS, getUnifiedProjectForTab, PERSIB_PROJECTS } from "../templates.js";
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
  console.log("  AI MOTION GRAPHIC STUDIO - PHASE 1 TEST SUITE");
  console.log("=======================================================\n");

  // 1. Project JSON Creation & Validation
  console.log("[Test 1] Project JSON Creation & Validation");
  const defaultProj = createDefaultProject({ videoTitle: "Test Match", totalDuration: 30 });
  assert(defaultProj.version === CURRENT_SCHEMA_VERSION, "Project has current schema version");
  assert(defaultProj.canvas.width === 1080 && defaultProj.canvas.height === 1920, "Default canvas is 1080x1920");
  assert(defaultProj.fps === 30, "Default FPS is 30");

  const validation = validateProject(defaultProj);
  assert(validation.valid === true, "Default project passes validation");
  assert(validation.errors.length === 0, "No validation errors on clean project");

  // 2. Serialization and Deserialization
  console.log("\n[Test 2] Serialization & Deserialization");
  const jsonStr = JSON.stringify(defaultProj);
  const parsedProj = JSON.parse(jsonStr);
  assert(parsedProj.version === defaultProj.version, "Version preserved across JSON serialization");
  assert(parsedProj.videoTitle === defaultProj.videoTitle, "Video title preserved across serialization");
  const revalidated = validateProject(parsedProj);
  assert(revalidated.valid === true, "Deserialized JSON passes validation");

  // 3. Legacy Template Migration Compatibility
  console.log("\n[Test 3] Legacy Template Compatibility");
  const tabKeys = Object.keys(PERSIB_TABS);
  assert(tabKeys.length === 5, "All 5 Persib tabs exist in templates");

  tabKeys.forEach(tabKey => {
    const legacyTab = PERSIB_TABS[tabKey];
    const migrated = migrateLegacyTemplateToProject(legacyTab);
    assert(migrated.version === CURRENT_SCHEMA_VERSION, `Tab '${tabKey}' migrated with version ${CURRENT_SCHEMA_VERSION}`);
    assert(migrated.scenes.length === legacyTab.scenes.length, `Tab '${tabKey}' scenes count matches (${migrated.scenes.length})`);
    assert(migrated.theme.colors.primary === legacyTab.colors.primary, `Tab '${tabKey}' primary color preserved`);
    assert(migrated.metadata.category === legacyTab.category, `Tab '${tabKey}' category preserved`);

    // Verify round-trip conversion
    const roundTrip = projectToLegacyConfig(migrated);
    assert(roundTrip.id === tabKey, `Tab '${tabKey}' round-trip ID matches`);
    assert(roundTrip.scenes.length === legacyTab.scenes.length, `Tab '${tabKey}' round-trip scenes match`);
  });

  // 4. GSAP Engine Compatibility
  console.log("\n[Test 4] GSAP Engine Compatibility");
  const postMatchProj = PERSIB_PROJECTS.post_match;
  const gsapHTML = generateMotionGraphicHTML(postMatchProj);
  assert(typeof gsapHTML === "string" && gsapHTML.length > 5000, "GSAP HTML generated successfully");
  assert(gsapHTML.includes('id="stage"'), "GSAP HTML contains virtual stage #stage");
  assert(gsapHTML.includes("window.PROJECT ="), "GSAP HTML embeds Unified Project JSON");
  assert(gsapHTML.includes("window.DURATION ="), "GSAP HTML embeds window.DURATION");
  assert(gsapHTML.includes("window.seek ="), "GSAP HTML provides window.seek API");

  // Also verify legacy config directly passed to GSAP engine works seamlessly
  const legacyHTML = generateMotionGraphicHTML(PERSIB_TABS.weekly_recap);
  assert(legacyHTML.includes("Rangkuman Mingguan"), "GSAP handles legacy config directly without errors");

  // 5. Remotion Adapter Compatibility
  console.log("\n[Test 5] Remotion Adapter Compatibility");
  assert(fs.existsSync(path.resolve(__dirname, "../src/components/UnifiedProjectComposition.tsx")), "UnifiedProjectComposition component exists");
  assert(fs.existsSync(path.resolve(__dirname, "../src/Root.tsx")), "Root.tsx exists");
  const rootContent = fs.readFileSync(path.resolve(__dirname, "../src/Root.tsx"), "utf-8");
  assert(rootContent.includes('id="UnifiedProject"'), "Root.tsx registers UnifiedProject composition");
  assert(rootContent.includes('id="PostMatchRecap"'), "Root.tsx preserves legacy PostMatchRecap composition");

  // 6. Scene Duration and Total Duration Consistency
  console.log("\n[Test 6] Scene Duration and Total Duration Consistency");
  const testProj = migrateLegacyTemplateToProject(PERSIB_TABS.post_match);
  recalculateSceneTimings(testProj);
  const totalFromScenes = testProj.scenes.reduce((sum, s) => sum + s.duration, 0);
  assert(Math.abs(totalFromScenes - testProj.totalDuration) < 0.01, `Total duration matches sum of scenes (${testProj.totalDuration}s)`);

  let expectedStartFrame = 0;
  let frameConsistency = true;
  testProj.scenes.forEach(s => {
    if (s.startFrame !== expectedStartFrame) frameConsistency = false;
    expectedStartFrame += s.durationInFrames;
  });
  assert(frameConsistency, "Scene startFrames and durationInFrames are sequential and consistent");

  // 7. Element Positions, Sizes, and Styling Consistency
  console.log("\n[Test 7] Element Positions, Sizes, and Styling");
  const firstScene = testProj.scenes[0];
  assert(firstScene.elements.length >= 3, `Scene 1 has ${firstScene.elements.length} structured visual elements`);

  const headlineElem = firstScene.elements.find(el => el.type === "text" && el.name === "Screen Text Headline");
  assert(headlineElem !== undefined, "Screen text headline element exists in scene");
  assert(headlineElem.position.x === 80 && headlineElem.position.y === 230, "Headline position x/y matches specification");
  assert(headlineElem.styling.fontSize > 0, "Headline styling has valid fontSize");

  // 8. Basic Animation Mappings
  console.log("\n[Test 8] Basic Animation Mappings");
  const animTypes = new Set();
  testProj.scenes.forEach(s => {
    s.elements.forEach(el => {
      if (el.animation) animTypes.add(el.animation.type);
    });
  });
  assert(animTypes.has("fade"), "Animation type 'fade' is supported and present");
  assert(animTypes.has("slide"), "Animation type 'slide' is supported and present");
  assert(animTypes.has("scale"), "Animation type 'scale' is supported and present");

  // 9. HTML Export Pipeline
  console.log("\n[Test 9] HTML Export Pipeline");
  const exportedHTML = generateMotionGraphicHTML(testProj);
  assert(exportedHTML.startsWith("<!DOCTYPE html>"), "Exported HTML is well-formed HTML5 document");
  assert(exportedHTML.includes("cdnjs.cloudflare.com") || exportedHTML.includes("GreenSock"), "GSAP library is included");
  assert(exportedHTML.includes("buildTimeline"), "GSAP master timeline builder is present");

  // 10. MP4 Export Compatibility (ESM & Remotion Frame Render)
  console.log("\n[Test 10] MP4 Export Compatibility (ESM & Remotion)");
  // Check that example-match and unified-project exist
  assert(fs.existsSync(path.resolve(__dirname, "../input/unified-project.json")), "input/unified-project.json exists");

  // Run Remotion CLI still check to verify renderer pipeline
  try {
    const stillOut = execSync("npx remotion still UnifiedProject out/test-verify.png --frame=15", {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf-8"
    });
    assert(fs.existsSync(path.resolve(__dirname, "../out/test-verify.png")), "Remotion successfully rendered frame from UnifiedProject");
  } catch (err) {
    assert(false, `Remotion still render failed: ${err.message}`);
  }

  // 11. Invalid Project Handling & Safe Fallback
  console.log("\n[Test 11] Invalid Project Data Handling & Safe Fallback");
  const invalidNull = validateProject(null);
  assert(invalidNull.valid === false, "Null project is flagged as invalid");
  assert(invalidNull.errors.length > 0, "Descriptive error message returned for null project");

  const invalidDimensions = validateProject({
    version: "1.0.0",
    canvas: { width: -100, height: 0 },
    fps: 300,
    scenes: []
  });
  assert(invalidDimensions.valid === false, "Invalid dimensions & FPS flagged");
  assert(invalidDimensions.errors.some(e => e.includes("canvas")), "Canvas error message reported");
  assert(invalidDimensions.errors.some(e => e.includes("FPS")), "FPS error message reported");
  assert(invalidDimensions.errors.some(e => e.includes("at least one scene")), "Missing scenes error reported");

  const duplicateSceneIds = validateProject({
    version: "1.0.0",
    canvas: { width: 1080, height: 1920 },
    fps: 30,
    scenes: [
      { id: "scene_1", duration: 5, elements: [] },
      { id: "scene_1", duration: 5, elements: [] }
    ]
  });
  assert(duplicateSceneIds.valid === false, "Duplicate scene IDs flagged");
  assert(duplicateSceneIds.errors.some(e => e.includes("Duplicate scene ID")), "Duplicate scene ID error message reported");

  // Verify engine does not crash when given invalid data
  try {
    const fallbackHTML = generateMotionGraphicHTML({});
    assert(typeof fallbackHTML === "string" && fallbackHTML.length > 1000, "GSAP engine safely handles invalid input with fallback");
  } catch (err) {
    assert(false, `GSAP engine crashed on invalid input: ${err.message}`);
  }

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

