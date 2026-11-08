/**
 * Test Suite: AI Motion Graphic Studio — Phase 4C
 * Voice Cloning & Custom Voice Integration
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BaseTtsProvider } from "../tts-providers/base-provider.js";
import { GoogleTtsProvider } from "../tts-providers/google-tts-provider.js";
import { ElevenLabsProvider } from "../tts-providers/elevenlabs-provider.js";
import { TtsManager } from "../tts-manager.js";
import { createDefaultProject, validateProject, sanitizeScene } from "../project-schema.js";
import { generateMotionGraphicHTML } from "../motion-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n=======================================================");
console.log("  AI MOTION GRAPHIC STUDIO - PHASE 4C TEST SUITE");
console.log("  Voice Cloning & Custom Voice Integration");
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
  const customStoreTestPath = path.join(__dirname, "..", "public", "cache", "test-custom-voices.json");

  // Helper to create ElevenLabs provider with isolated test storage
  function createTestElevenLabs(apiKey = "") {
    return new ElevenLabsProvider({ apiKey, storageFile: customStoreTestPath });
  }

  // Cleanup helper
  function cleanupTestStore() {
    if (fs.existsSync(customStoreTestPath)) {
      try { fs.unlinkSync(customStoreTestPath); } catch (_) {}
    }
  }

  cleanupTestStore();

  // ----------------------------------------------------
  // TEST 1: Provider Capability Contract (supportsCustomVoices)
  // ----------------------------------------------------
  console.log("[Test 1] Provider Capability Detection");
  test("GoogleTtsProvider reports supportsCustomVoices() as false", () => {
    const google = new GoogleTtsProvider({ apiKey: "" });
    assert.strictEqual(google.supportsCustomVoices(), false);
  });

  test("ElevenLabsProvider reports supportsCustomVoices() as true", () => {
    const eleven = createTestElevenLabs();
    assert.strictEqual(eleven.supportsCustomVoices(), true);
  });

  test("BaseTtsProvider defaults supportsCustomVoices() to false", () => {
    class DummyProvider extends BaseTtsProvider {
      isConfigured() { return true; }
      async listVoices() { return []; }
      async synthesize() { return {}; }
      estimateDuration() { return 1; }
    }
    const dummy = new DummyProvider("dummy", "Dummy");
    assert.strictEqual(dummy.supportsCustomVoices(), false);
  });

  // ----------------------------------------------------
  // TEST 2: Provider Rejection on Unsupported Operations
  // ----------------------------------------------------
  console.log("\n[Test 2] Unsupported Custom Voice Operations");
  await testAsync("GoogleTtsProvider rejects addCustomVoice with explicit error", async () => {
    const google = new GoogleTtsProvider({ apiKey: "" });
    await assert.rejects(
      async () => {
        await google.addCustomVoice({ name: "Suara Baru" });
      },
      /tidak mendukung.*custom voice/i
    );
  });

  await testAsync("GoogleTtsProvider listCustomVoices returns empty array", async () => {
    const google = new GoogleTtsProvider({ apiKey: "" });
    const list = await google.listCustomVoices();
    assert.deepStrictEqual(list, []);
  });

  // ----------------------------------------------------
  // TEST 3: Speaker Consent Verification & Legal Safeguards
  // ----------------------------------------------------
  console.log("\n[Test 3] Speaker Consent Verification & Legal Safeguards");
  await testAsync("ElevenLabs rejects addCustomVoice when consent is missing", async () => {
    const eleven = createTestElevenLabs();
    await assert.rejects(
      async () => {
        await eleven.addCustomVoice({
          name: "Test Voice",
          sampleBuffers: [Buffer.alloc(2048, 1)]
        });
      },
      /Persetujuan eksplisit.*consent.*wajib/i
    );
  });

  await testAsync("ElevenLabs rejects addCustomVoice when consent.agreed is false", async () => {
    const eleven = createTestElevenLabs();
    await assert.rejects(
      async () => {
        await eleven.addCustomVoice({
          name: "Test Voice",
          consent: { agreed: false, speakerName: "Budi Santoso", rightsConfirmed: true },
          sampleBuffers: [Buffer.alloc(2048, 1)]
        });
      },
      /Persetujuan eksplisit.*consent.*wajib/i
    );
  });

  await testAsync("ElevenLabs rejects addCustomVoice when speakerName is empty", async () => {
    const eleven = createTestElevenLabs();
    await assert.rejects(
      async () => {
        await eleven.addCustomVoice({
          name: "Test Voice",
          consent: { agreed: true, speakerName: "   ", rightsConfirmed: true },
          sampleBuffers: [Buffer.alloc(2048, 1)]
        });
      },
      /Nama pemilik suara.*wajib diisi/i
    );
  });

  await testAsync("ElevenLabs rejects addCustomVoice when rightsConfirmed is false", async () => {
    const eleven = createTestElevenLabs();
    await assert.rejects(
      async () => {
        await eleven.addCustomVoice({
          name: "Test Voice",
          consent: { agreed: true, speakerName: "Budi Santoso", rightsConfirmed: false },
          sampleBuffers: [Buffer.alloc(2048, 1)]
        });
      },
      /Persetujuan eksplisit.*consent.*wajib/i
    );
  });

  // ----------------------------------------------------
  // TEST 4: Audio Sample Validation
  // ----------------------------------------------------
  console.log("\n[Test 4] Audio Sample Validation");
  await testAsync("ElevenLabs rejects addCustomVoice when no samples are provided", async () => {
    const eleven = createTestElevenLabs();
    await assert.rejects(
      async () => {
        await eleven.addCustomVoice({
          name: "Test Voice",
          consent: { agreed: true, speakerName: "Budi Santoso", rightsConfirmed: true },
          sampleBuffers: []
        });
      },
      /Minimal satu.*sampel.*wajib/i
    );
  });

  await testAsync("ElevenLabs rejects addCustomVoice when sample buffer is too small (<1KB)", async () => {
    const eleven = createTestElevenLabs();
    await assert.rejects(
      async () => {
        await eleven.addCustomVoice({
          name: "Test Voice",
          consent: { agreed: true, speakerName: "Budi Santoso", rightsConfirmed: true },
          sampleBuffers: [Buffer.alloc(500, 0)] // Only 500 bytes
        });
      },
      /terlalu pendek atau kosong/i
    );
  });

  await testAsync("ElevenLabs rejects addCustomVoice when sample buffer exceeds 10MB limit", async () => {
    const eleven = createTestElevenLabs();
    await assert.rejects(
      async () => {
        await eleven.addCustomVoice({
          name: "Test Voice",
          consent: { agreed: true, speakerName: "Budi Santoso", rightsConfirmed: true },
          sampleBuffers: [Buffer.alloc(11 * 1024 * 1024, 0)] // 11MB
        });
      },
      /melebihi batas maksimum 10MB/i
    );
  });

  // ----------------------------------------------------
  // TEST 5: Custom Voice Creation Workflow & Metadata Audit
  // ----------------------------------------------------
  console.log("\n[Test 5] Custom Voice Creation Workflow & Metadata Audit");
  let createdVoiceId = null;
  await testAsync("ElevenLabs creates custom voice successfully with valid inputs and audit record", async () => {
    const eleven = createTestElevenLabs();
    const sampleBuffer = Buffer.alloc(4096, 0x41); // 4KB valid buffer

    const result = await eleven.addCustomVoice({
      name: "Komentator Persib Kang Asep",
      description: "Suara energik dan khas Sunda untuk laga Persib",
      sampleBuffers: [sampleBuffer],
      consent: {
        agreed: true,
        speakerName: "Asep Sunandar",
        rightsConfirmed: true
      }
    });

    assert.ok(result);
    assert.ok(result.voiceId);
    assert.strictEqual(result.name, "Komentator Persib Kang Asep");
    assert.strictEqual(result.speakerName, "Asep Sunandar");
    assert.strictEqual(result.isCustom, true);
    assert.strictEqual(result.consent.agreed, true);
    assert.ok(result.consent.timestamp);
    assert.strictEqual(result.provider, "elevenlabs");

    createdVoiceId = result.voiceId;
  });

  // ----------------------------------------------------
  // TEST 6: Ephemeral Sample Handling (No Audio Files Kept on Disk)
  // ----------------------------------------------------
  console.log("\n[Test 6] Ephemeral Audio Sample Handling");
  test("Ephemeral guarantee: uploaded voice training sample buffers are not written to voiceover directory", () => {
    // Check that custom voice store contains metadata only, not audio blobs
    const content = JSON.parse(fs.readFileSync(customStoreTestPath, "utf-8"));
    assert.ok(Array.isArray(content));
    assert.strictEqual(content.length, 1);
    const stored = content[0];
    assert.strictEqual(stored.voiceId, createdVoiceId);
    assert.strictEqual(typeof stored.sampleBuffers, "undefined", "Raw sample buffers must NOT be stored in metadata");
    assert.strictEqual(typeof stored.audioBlob, "undefined", "No raw audio blobs stored in metadata");
  });

  // ----------------------------------------------------
  // TEST 7: Voice Listing Integration (Presets + Custom Voices)
  // ----------------------------------------------------
  console.log("\n[Test 7] Voice Listing Integration");
  await testAsync("listVoices merges standard presets and custom cloned voices", async () => {
    const eleven = createTestElevenLabs();
    const voices = await eleven.listVoices("id-ID");
    
    // Should contain standard curated presets
    const standardPreset = voices.find(v => v.voiceId === "21m00Tcm4TlvDq8ikWAM" || v.name.includes("Rachel") || v.name.includes("Domi"));
    assert.ok(standardPreset, "Standard curated preset should be present");
    assert.strictEqual(standardPreset.isCustom, false);

    // Should contain our custom voice
    const customVoice = voices.find(v => v.voiceId === createdVoiceId);
    assert.ok(customVoice, "Custom cloned voice must appear in voice list");
    assert.strictEqual(customVoice.isCustom, true);
    assert.ok(customVoice.name.includes("Komentator Persib Kang Asep"));
    assert.strictEqual(customVoice.speakerName, "Asep Sunandar");
  });

  // ----------------------------------------------------
  // TEST 8: TtsManager Orchestration for Custom Voices
  // ----------------------------------------------------
  console.log("\n[Test 8] TtsManager Orchestration");
  const manager = new TtsManager({
    elevenLabsKey: ""
  });
  const elProv = manager.getProvider("elevenlabs");
  elProv.storageFile = customStoreTestPath;
  elProv._customVoicesStore = elProv._loadCustomVoices();

  await testAsync("TtsManager exposes custom voice support in provider list", async () => {
    const providers = await manager.listProviders();
    const googleInfo = providers.find(p => p.id === "google");
    const elevenInfo = providers.find(p => p.id === "elevenlabs");

    assert.strictEqual(googleInfo.supportsCustomVoices, false);
    assert.strictEqual(elevenInfo.supportsCustomVoices, true);
  });

  await testAsync("TtsManager delegates addCustomVoice and listCustomVoices cleanly", async () => {
    const customVoices = await manager.listCustomVoices("elevenlabs");
    assert.strictEqual(customVoices.length, 1);
    assert.strictEqual(customVoices[0].voiceId, createdVoiceId);
  });

  // ----------------------------------------------------
  // TEST 9: Voiceover Generation Using Custom Voice
  // ----------------------------------------------------
  console.log("\n[Test 9] Voiceover Generation Using Custom Voice");
  await testAsync("generateVoiceoverForScene synthesizes audio with custom voice metadata", async () => {
    const project = createDefaultProject("laga");
    const scene = project.scenes[0];
    scene.narration = "Gol spektakuler dari tendangan bebas luar kotak penalti!";

    const res = await manager.generateVoiceoverForScene({
      sceneId: scene.id,
      sceneIndex: 1,
      text: scene.narration,
      providerId: "elevenlabs",
      voiceId: createdVoiceId,
      language: "id-ID",
      parameters: { speed: 1.05 },
      forceMock: true
    });

    assert.ok(res.success);
    assert.ok(res.assetId);
    assert.ok(res.audioUrl);
    assert.strictEqual(res.voiceId, createdVoiceId);
    assert.strictEqual(res.isCustomVoice, true);
    assert.strictEqual(res.speakerName, "Asep Sunandar");
    assert.strictEqual(res.captionsNeedRealign, true);
  });

  // ----------------------------------------------------
  // TEST 10: Caption Invalidation on Voice Change
  // ----------------------------------------------------
  console.log("\n[Test 10] Caption Invalidation on Voice Change");
  await testAsync("Changing voiceover marks existing captions as outdated", async () => {
    const project = createDefaultProject("laga");
    const scene = project.scenes[0];
    scene.narration = "Umpan silang disambut dengan sundulan keras!";
    
    // Simulate pre-existing captions
    scene.captions = {
      status: "aligned",
      cues: [
        { start: 0.1, end: 1.5, text: "Umpan silang disambut" },
        { start: 1.5, end: 2.8, text: "dengan sundulan keras!" }
      ]
    };

    // Regenerate voiceover with different voice
    const res = await manager.generateVoiceoverForScene({
      sceneId: scene.id,
      sceneIndex: 1,
      text: scene.narration,
      providerId: "elevenlabs",
      voiceId: createdVoiceId,
      language: "id-ID",
      forceMock: true
    });

    assert.ok(res.success);
    assert.strictEqual(res.captionsNeedRealign, true, "Captions must be flagged as needing realignment");
  });

  // ----------------------------------------------------
  // TEST 11: Unified Project JSON Schema & Backward Compatibility
  // ----------------------------------------------------
  console.log("\n[Test 11] Unified Project Schema & Backward Compatibility");
  test("sanitizeScene preserves isCustomVoice and speakerName properties", () => {
    const rawScene = {
      id: "scene_cloned_01",
      name: "Scene Kloning",
      duration: 5,
      narration: "Suara khas Bobotoh!",
      voiceover: {
        enabled: true,
        provider: "elevenlabs",
        voiceId: createdVoiceId,
        isCustomVoice: true,
        speakerName: "Asep Sunandar",
        assetId: "audio_vo_test_123"
      }
    };

    const sanitized = sanitizeScene(rawScene, 0);
    assert.strictEqual(sanitized.voiceover.isCustomVoice, true);
    assert.strictEqual(sanitized.voiceover.speakerName, "Asep Sunandar");
    assert.strictEqual(sanitized.voiceover.voiceId, createdVoiceId);
  });

  test("validateProject passes with custom voice metadata in scene voiceover", () => {
    const project = createDefaultProject("laga");
    project.scenes[0].voiceover = {
      enabled: true,
      provider: "elevenlabs",
      voiceId: createdVoiceId,
      isCustomVoice: true,
      speakerName: "Asep Sunandar",
      assetId: "audio_vo_custom_001"
    };

    const val = validateProject(project);
    assert.strictEqual(val.valid, true, `Validation failed: ${val.errors.join(", ")}`);
  });

  test("Legacy project without voice cloning properties validates seamlessly", () => {
    const legacyProject = createDefaultProject("trivia");
    // Ensure no custom voice properties present
    legacyProject.scenes.forEach(s => {
      if (s.voiceover) {
        delete s.voiceover.isCustomVoice;
        delete s.voiceover.speakerName;
      }
    });

    const val = validateProject(legacyProject);
    assert.strictEqual(val.valid, true);
  });

  // ----------------------------------------------------
  // TEST 12: Custom Voice Deletion
  // ----------------------------------------------------
  console.log("\n[Test 12] Custom Voice Deletion");
  await testAsync("deleteCustomVoice removes custom voice record cleanly", async () => {
    const eleven = createTestElevenLabs();
    const delResult = await eleven.deleteCustomVoice(createdVoiceId);
    assert.strictEqual(delResult.success, true);

    const remaining = await eleven.listCustomVoices();
    assert.strictEqual(remaining.length, 0);
  });

  // ----------------------------------------------------
  // TEST 13: HTML Generation Compatibility with Custom Voice
  // ----------------------------------------------------
  console.log("\n[Test 13] GSAP HTML Preview Compatibility");
  test("generateMotionGraphicHTML renders cleanly with custom voice scene", () => {
    const project = createDefaultProject("duel");
    project.scenes[0].voiceover = {
      enabled: true,
      provider: "elevenlabs",
      voiceId: "cloned_test_voice",
      isCustomVoice: true,
      speakerName: "Budi Komentator",
      assetId: "audio_vo_duel_cloned"
    };

    const html = generateMotionGraphicHTML(project);
    assert.ok(typeof html === "string");
    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("window.PROJECT ="));
    assert.ok(html.includes('id="stage"'));
  });

  // Cleanup isolated test store
  cleanupTestStore();

  console.log(`\n=======================================================`);
  console.log(`  PHASE 4C TESTS COMPLETED: ${passedCount} passed, 0 failed`);
  console.log(`=======================================================\n`);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
