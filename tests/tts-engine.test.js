/**
 * Test Suite: AI Motion Graphic Studio — Phase 4A
 * TTS Provider Integration (AI Voiceover Engine)
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BaseTtsProvider } from "../tts-providers/base-provider.js";
import { GoogleTtsProvider, GOOGLE_CURATED_VOICES } from "../tts-providers/google-tts-provider.js";
import { ElevenLabsProvider, ELEVENLABS_CURATED_VOICES } from "../tts-providers/elevenlabs-provider.js";
import { TtsManager, defaultTtsManager } from "../tts-manager.js";
import { getAllAudioAssets, getAudioAssetById, registerVoiceoverAsset } from "../audio-library.js";
import { createDefaultProject, validateProject, sanitizeScene } from "../project-schema.js";
import { generateMotionGraphicHTML } from "../motion-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VO_DIR = path.join(__dirname, "..", "public", "audio", "voiceover");

console.log("\n=======================================================");
console.log("  AI MOTION GRAPHIC STUDIO - PHASE 4A TEST SUITE");
console.log("=======================================================\n");

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exit(1);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exit(1);
  }
}

async function runTests() {
  // ----------------------------------------------------
  // TEST 1: Provider Adapter Architecture & Contract
  // ----------------------------------------------------
  console.log("[Test 1] Provider Adapter Architecture & Contract");
  test("BaseTtsProvider cannot be instantiated directly", () => {
    assert.throws(() => new BaseTtsProvider("test", "Test"), TypeError);
  });

  test("GoogleTtsProvider extends BaseTtsProvider and implements interface", () => {
    const google = new GoogleTtsProvider({ apiKey: "" });
    assert.strictEqual(google.id, "google");
    assert.strictEqual(typeof google.isConfigured, "function");
    assert.strictEqual(typeof google.listVoices, "function");
    assert.strictEqual(typeof google.synthesize, "function");
    assert.strictEqual(typeof google.estimateDuration, "function");
  });

  test("ElevenLabsProvider extends BaseTtsProvider and implements interface", () => {
    const eleven = new ElevenLabsProvider({ apiKey: "" });
    assert.strictEqual(eleven.id, "elevenlabs");
    assert.strictEqual(typeof eleven.isConfigured, "function");
    assert.strictEqual(typeof eleven.listVoices, "function");
    assert.strictEqual(typeof eleven.synthesize, "function");
  });

  // ----------------------------------------------------
  // TEST 2: Provider Configuration Status
  // ----------------------------------------------------
  console.log("\n[Test 2] Provider Configuration Status");
  test("Unconfigured provider returns isConfigured: false", () => {
    const google = new GoogleTtsProvider({ apiKey: "" });
    assert.strictEqual(google.isConfigured(), false);
    const eleven = new ElevenLabsProvider({ apiKey: "" });
    assert.strictEqual(eleven.isConfigured(), false);
  });

  test("Configured provider with valid key returns isConfigured: true", () => {
    const google = new GoogleTtsProvider({ apiKey: "AIzaSyDummyKeyForGoogleCloudTtsTesting123" });
    assert.strictEqual(google.isConfigured(), true);
    const eleven = new ElevenLabsProvider({ apiKey: "eleven_key_sample_token_secret_12345" });
    assert.strictEqual(eleven.isConfigured(), true);
  });

  // ----------------------------------------------------
  // TEST 3: Voice List Resolution & Filtering
  // ----------------------------------------------------
  console.log("\n[Test 3] Voice List Resolution & Filtering");
  await testAsync("Google TTS returns curated Indonesian voices by default", async () => {
    const google = new GoogleTtsProvider({ apiKey: "" });
    const voices = await google.listVoices("id-ID");
    assert(Array.isArray(voices));
    assert(voices.length >= 4);
    assert(voices.some(v => v.id === "id-ID-Standard-A"));
    assert(voices.some(v => v.id === "id-ID-Standard-B"));
  });

  await testAsync("ElevenLabs returns commentary and narrative voices", async () => {
    const eleven = new ElevenLabsProvider({ apiKey: "" });
    const voices = await eleven.listVoices("id-ID");
    assert(Array.isArray(voices));
    assert(voices.length >= 4);
    assert(voices.some(v => v.name.includes("Antoni")));
    assert(voices.some(v => v.name.includes("Rachel")));
  });

  // ----------------------------------------------------
  // TEST 4: TTS Generation using Mocked/Synthetic Provider
  // ----------------------------------------------------
  console.log("\n[Test 4] TTS Generation using Mocked/Synthetic Provider");
  await testAsync("Google TTS synthesize generates valid WAV audio buffer", async () => {
    const google = new GoogleTtsProvider({ apiKey: "", mockMode: true });
    const text = "Peluit panjang berbunyi! Persib Bandung kembali meraih poin penuh di Stadion GBLA!";
    const res = await google.synthesize({
      text,
      voiceId: "id-ID-Standard-B",
      language: "id-ID",
      parameters: { speakingRate: 1.0, pitch: 0.0 }
    });

    assert(Buffer.isBuffer(res.audioBuffer));
    assert(res.audioBuffer.length > 1000);
    // Verify RIFF WAVE magic header
    assert.strictEqual(res.audioBuffer.subarray(0, 4).toString(), "RIFF");
    assert.strictEqual(res.audioBuffer.subarray(8, 12).toString(), "WAVE");
    assert(res.duration > 2.0);
    assert.strictEqual(res.fileExtension, "wav");
  });

  await testAsync("ElevenLabs synthesize generates valid audio buffer", async () => {
    const eleven = new ElevenLabsProvider({ apiKey: "", mockMode: true });
    const text = "Wilujeng sumping striker baru Persib Bandung, amunisi tajam untuk putaran kedua!";
    const res = await eleven.synthesize({
      text,
      voiceId: "ErXwobaYiN019PkySvjV",
      language: "id-ID",
      parameters: { stability: 0.75, speakingRate: 1.1 }
    });

    assert(Buffer.isBuffer(res.audioBuffer));
    assert(res.audioBuffer.length > 1000);
    assert(res.duration > 2.0);
  });

  // ----------------------------------------------------
  // TEST 5: Input Validation & Error Handling
  // ----------------------------------------------------
  console.log("\n[Test 5] Input Validation & Error Handling");
  await testAsync("Empty narration text rejected with descriptive error", async () => {
    const google = new GoogleTtsProvider({ apiKey: "", mockMode: true });
    await assert.rejects(
      async () => { await google.synthesize({ text: "   " }); },
      /Teks narasi wajib diisi/
    );
  });

  await testAsync("Unconfigured live provider throws informative error when mock disabled", async () => {
    const google = new GoogleTtsProvider({ apiKey: "", mockMode: false });
    await assert.rejects(
      async () => { await google.synthesize({ text: "Halo Bandung" }); },
      /belum dikonfigurasi/
    );
  });

  // ----------------------------------------------------
  // TEST 6: Audio Asset Persistence & Library Registration
  // ----------------------------------------------------
  console.log("\n[Test 6] Audio Asset Persistence & Library Registration");
  let generatedAsset = null;
  await testAsync("TtsManager generates audio file on disk and registers in Audio Library", async () => {
    const manager = new TtsManager();
    const result = await manager.generateVoiceoverForScene({
      sceneId: "sc_test_1",
      sceneIndex: 1,
      text: "Persib Bandung juara Liga Indonesia 2024!",
      providerId: "google",
      voiceId: "id-ID-Standard-A",
      forceMock: true
    });

    assert.strictEqual(result.success, true);
    assert(result.audioUrl.startsWith("/public/audio/voiceover/"));
    assert(result.assetId.startsWith("aud_vo_sc_test_1"));
    assert.strictEqual(result.status, "ready");

    const diskPath = path.join(__dirname, "..", result.audioUrl);
    assert(fs.existsSync(diskPath), "Generated audio file must exist on disk");

    // Check Audio Library registration
    const asset = getAudioAssetById(result.assetId);
    assert(asset !== null, "Voiceover asset must be retrievable from Audio Library");
    assert.strictEqual(asset.category, "Voiceover");
    assert.strictEqual(asset.metadata.provider, "google");
    assert.strictEqual(asset.metadata.sourceText, "Persib Bandung juara Liga Indonesia 2024!");

    generatedAsset = result;
  });

  // ----------------------------------------------------
  // TEST 7: Project JSON Integration & Schema Validation
  // ----------------------------------------------------
  console.log("\n[Test 7] Project JSON Integration & Schema Validation");
  test("Project scene accepts voiceover configuration and passes schema validation", () => {
    const project = createDefaultProject({
      name: "Persib Match Recap with VO",
      scenes: [
        {
          id: "sc_1",
          name: "Pembuka Kemenangan",
          duration: 5,
          narration: "Peluit panjang berbunyi! Pangeran Biru amankan tiga poin kandang!",
          voiceover: {
            enabled: true,
            provider: "google",
            voiceId: "id-ID-Standard-A",
            language: "id-ID",
            parameters: { speakingRate: 1.0, pitch: 0.0 },
            assetId: generatedAsset.assetId,
            audioUrl: generatedAsset.audioUrl,
            sourceText: "Peluit panjang berbunyi! Pangeran Biru amankan tiga poin kandang!",
            duration: 4.2,
            status: "ready"
          }
        }
      ]
    });

    const validation = validateProject(project);
    assert.strictEqual(validation.valid, true, "Project with voiceover must pass validation");
    assert.strictEqual(validation.errors.length, 0);

    const sc = validation.project.scenes[0];
    assert.strictEqual(sc.voiceover.enabled, true);
    assert.strictEqual(sc.voiceover.audioUrl, generatedAsset.audioUrl);
    assert.strictEqual(sc.voiceover.status, "ready");
  });

  // ----------------------------------------------------
  // TEST 8: Regenerate Voiceover & Safe File Cleanup
  // ----------------------------------------------------
  console.log("\n[Test 8] Regenerate Voiceover & Safe File Cleanup");
  await testAsync("Regenerating voiceover creates new audio asset and cleans up previous file", async () => {
    const manager = new TtsManager();
    const oldUrl = generatedAsset.audioUrl;
    const oldPath = path.join(__dirname, "..", oldUrl);
    assert(fs.existsSync(oldPath));

    const updated = await manager.generateVoiceoverForScene({
      sceneId: "sc_test_1",
      sceneIndex: 1,
      text: "Revisi naskah narasi babak kedua!",
      providerId: "elevenlabs",
      voiceId: "ErXwobaYiN019PkySvjV",
      oldAudioUrl: oldUrl,
      forceMock: true
    });

    assert.strictEqual(updated.success, true);
    assert.notStrictEqual(updated.audioUrl, oldUrl);

    const newPath = path.join(__dirname, "..", updated.audioUrl);
    assert(fs.existsSync(newPath), "New audio file must exist");
    assert(!fs.existsSync(oldPath), "Old audio file should be cleanly removed on regeneration");
  });

  // ----------------------------------------------------
  // TEST 9: Outdated Narration Text Detection
  // ----------------------------------------------------
  console.log("\n[Test 9] Outdated Narration Text Detection");
  test("Editing scene.narration marks voiceover status as outdated", () => {
    const scene = sanitizeScene({
      id: "sc_1",
      name: "Scene 1",
      duration: 5,
      narration: "Teks narasi versi 2 yang baru diedit oleh pengguna",
      voiceover: {
        enabled: true,
        provider: "google",
        voiceId: "id-ID-Standard-A",
        audioUrl: "/public/audio/voiceover/vo_sc_1.mp3",
        sourceText: "Teks narasi versi 1 yang lama",
        status: "ready"
      }
    }, 0, 30);

    assert.strictEqual(scene.voiceover.status, "outdated", "Status should be outdated when narration differs from sourceText");
  });

  test("Matching narration preserves status ready", () => {
    const scene = sanitizeScene({
      id: "sc_1",
      name: "Scene 1",
      duration: 5,
      narration: "Teks narasi yang sama persis",
      voiceover: {
        enabled: true,
        provider: "google",
        voiceId: "id-ID-Standard-A",
        audioUrl: "/public/audio/voiceover/vo_sc_1.mp3",
        sourceText: "Teks narasi yang sama persis",
        status: "ready"
      }
    }, 0, 30);

    assert.strictEqual(scene.voiceover.status, "ready");
  });

  // ----------------------------------------------------
  // TEST 10: Backward Compatibility with Legacy Projects
  // ----------------------------------------------------
  console.log("\n[Test 10] Backward Compatibility with Legacy Projects");
  test("Legacy projects without voiceover continue to load and validate cleanly", () => {
    const legacyProject = {
      version: "1.0.0",
      id: "legacy_project_1",
      name: "Persib Juara 2024",
      canvas: { width: 1080, height: 1920 },
      fps: 30,
      totalDuration: 15,
      scenes: [
        { id: "sc_old_1", name: "Adegan Lama 1", duration: 5, elements: [] },
        { id: "sc_old_2", name: "Adegan Lama 2", duration: 5, elements: [] },
        { id: "sc_old_3", name: "Adegan Lama 3", duration: 5, elements: [] }
      ]
    };

    const res = validateProject(legacyProject);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.project.scenes.length, 3);
    assert.strictEqual(res.project.scenes[0].voiceover, undefined);
  });

  // ----------------------------------------------------
  // TEST 11: GSAP HTML Preview Integration
  // ----------------------------------------------------
  console.log("\n[Test 11] GSAP HTML Preview Integration");
  test("GSAP generated HTML embeds voiceover audio elements and sync logic", () => {
    const project = createDefaultProject({
      name: "GSAP VO Test",
      scenes: [
        {
          id: "sc_vo_1",
          name: "Intro VO",
          duration: 5,
          voiceover: {
            enabled: true,
            provider: "google",
            audioUrl: "/public/audio/voiceover/vo_test_sample.mp3"
          }
        }
      ]
    });

    const html = generateMotionGraphicHTML(project);
    assert(html.includes('id="vo_audio_0"'), "GSAP HTML must render audio element for scene 0 voiceover");
    assert(html.includes('class="vo-audio-elem"'), "GSAP HTML must have vo-audio-elem class");
    assert(html.includes("syncVoiceovers"), "GSAP runtime script must define syncVoiceovers handler");
  });

  // ----------------------------------------------------
  // TEST 12: Remotion Audio Rendering & Mixing
  // ----------------------------------------------------
  console.log("\n[Test 12] Remotion Audio Rendering & Mixing");
  test("UnifiedProjectComposition imports Audio and sequences scene voiceover", () => {
    const compPath = path.join(__dirname, "..", "src", "components", "UnifiedProjectComposition.tsx");
    const compContent = fs.readFileSync(compPath, "utf-8");

    assert(compContent.includes("scene.voiceover?.enabled"), "Remotion component must check scene.voiceover.enabled");
    assert(compContent.includes("<Sequence key={`vo_${scene.id}`}"), "Remotion component must place voiceover inside scene Sequence");
    assert(compContent.includes("Background Audio Track"), "Remotion component must retain background audio track for mixing");
  });

  console.log(`\n=======================================================`);
  console.log(`  PHASE 4A TEST RESULTS: ${passedCount} PASSED, 0 FAILED`);
  console.log(`=======================================================\n`);
}

runTests();
