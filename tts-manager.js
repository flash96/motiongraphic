/**
 * TTS Manager (Voiceover Engine Orchestrator)
 * Coordinates TTS providers, synthesizes audio files, registers audio assets,
 * and handles reliability, timeout, and outdated text detection.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleTtsProvider } from "./tts-providers/google-tts-provider.js";
import { ElevenLabsProvider } from "./tts-providers/elevenlabs-provider.js";
import { registerVoiceoverAsset, getAudioAssetById } from "./audio-library.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VOICEOVER_DIR = path.join(__dirname, "public", "audio", "voiceover");

// Ensure voiceover directory exists
if (!fs.existsSync(VOICEOVER_DIR)) {
  fs.mkdirSync(VOICEOVER_DIR, { recursive: true });
}

export class TtsManager {
  constructor() {
    this.providers = new Map();
    this.registerProvider(new GoogleTtsProvider());
    this.registerProvider(new ElevenLabsProvider());
  }

  registerProvider(provider) {
    if (!provider || !provider.id) {
      throw new Error("Provider must have an id.");
    }
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId) {
    return this.providers.get(providerId) || null;
  }

  async listProviders(language = "id-ID") {
    const list = [];
    for (const [id, provider] of this.providers.entries()) {
      let voices = [];
      try {
        voices = await provider.listVoices(language);
      } catch (e) {
        voices = [];
      }

      list.push({
        id,
        name: provider.name,
        configured: provider.isConfigured(),
        supportsCustomVoices: Boolean(provider.supportsCustomVoices?.()),
        voices
      });
    }
    return list;
  }

  /**
   * Returns list of custom voices from a specific provider.
   */
  async listCustomVoices(providerId = "elevenlabs") {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider TTS "${providerId}" tidak dikenali.`);
    }
    if (!provider.supportsCustomVoices()) {
      return [];
    }
    return await provider.listCustomVoices();
  }

  /**
   * Adds a custom voice with mandatory speaker consent.
   */
  async addCustomVoice({ providerId = "elevenlabs", name, description, sampleBuffers, consent }) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider TTS "${providerId}" tidak dikenali.`);
    }
    if (!provider.supportsCustomVoices()) {
      throw new Error(`Provider "${provider.name}" tidak mendukung fitur custom voice / voice cloning.`);
    }
    return await provider.addCustomVoice({ name, description, sampleBuffers, consent });
  }

  /**
   * Deletes a custom cloned voice.
   */
  async deleteCustomVoice({ providerId = "elevenlabs", voiceId }) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider TTS "${providerId}" tidak dikenali.`);
    }
    if (!provider.supportsCustomVoices()) {
      throw new Error(`Provider "${provider.name}" tidak mendukung penghapusan custom voice.`);
    }
    return await provider.deleteCustomVoice(voiceId);
  }

  /**
   * Generates voiceover for a specific scene, saves the audio file,
   * registers it as an Audio Asset, and returns reference metadata.
   */
  async generateVoiceoverForScene({
    sceneId,
    sceneIndex = 1,
    text,
    providerId = "google",
    voiceId,
    language = "id-ID",
    parameters = {},
    oldAudioUrl = null,
    forceMock = false
  }) {
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new Error("Teks narasi tidak boleh kosong.");
    }

    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider TTS "${providerId}" tidak dikenali.`);
    }

    // Set mock mode override if requested (useful for testing)
    const originalMock = provider.mockMode;
    if (forceMock) {
      provider.mockMode = true;
    }

    try {
      const result = await provider.synthesize({
        text: text.trim(),
        voiceId,
        language,
        parameters
      });

      const timestamp = Date.now();
      const ext = result.fileExtension || "mp3";
      const sanitizedSceneId = String(sceneId || "sc").replace(/[^a-zA-Z0-9_-]/g, "");
      const fileName = `vo_${sanitizedSceneId}_${timestamp}.${ext}`;
      const filePath = path.join(VOICEOVER_DIR, fileName);

      // Write audio buffer to disk
      fs.writeFileSync(filePath, result.audioBuffer);

      const fileUrl = `/public/audio/voiceover/${fileName}`;
      const assetId = `aud_vo_${sanitizedSceneId}_${timestamp}`;

      // Register into Audio Library
      const asset = registerVoiceoverAsset({
        id: assetId,
        name: `VO Adegan ${sceneIndex} (${voiceId || "Default"})`,
        fileUrl,
        fileType: ext,
        duration: result.duration,
        sceneId,
        provider: providerId,
        voiceId: voiceId || "",
        language,
        sourceText: text.trim(),
        parameters
      });

      // Safely cleanup old audio file if it exists and was replaced
      if (oldAudioUrl && oldAudioUrl.startsWith("/public/audio/voiceover/")) {
        const oldPath = path.join(__dirname, oldAudioUrl);
        if (fs.existsSync(oldPath) && oldPath !== filePath) {
          try {
            fs.unlinkSync(oldPath);
          } catch (_) {}
        }
      }

      const customRecord = provider._customVoicesStore?.find(cv => cv.id === voiceId || cv.voiceId === voiceId);
      const isCustom = Boolean(
        customRecord || (voiceId && String(voiceId).startsWith("cloned_"))
      );
      const speakerName = customRecord?.speakerName || "";

      return {
        success: true,
        assetId: asset.id,
        audioUrl: fileUrl,
        duration: result.duration,
        sourceText: text.trim(),
        status: "ready",
        provider: providerId,
        voiceId: voiceId || "",
        isCustomVoice: isCustom,
        speakerName,
        language,
        parameters,
        timingMetadata: result.timingMetadata || null,
        captionsNeedRealign: true,
        generatedAt: new Date().toISOString()
      };
    } finally {
      if (forceMock) {
        provider.mockMode = originalMock;
      }
    }
  }

  /**
   * Generates a short preview voiceover sample without binding to a project scene.
   */
  async previewSpeech({
    text = "Halo Bobotoh, selamat datang di Persib Motion Studio!",
    providerId = "google",
    voiceId,
    language = "id-ID",
    parameters = {},
    forceMock = false
  }) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider TTS "${providerId}" tidak dikenali.`);
    }

    const originalMock = provider.mockMode;
    if (forceMock) provider.mockMode = true;

    try {
      const result = await provider.synthesize({
        text,
        voiceId,
        language,
        parameters
      });

      const tempFileName = `preview_${providerId}_${Date.now()}.${result.fileExtension || "mp3"}`;
      const filePath = path.join(VOICEOVER_DIR, tempFileName);
      fs.writeFileSync(filePath, result.audioBuffer);

      return {
        success: true,
        audioUrl: `/public/audio/voiceover/${tempFileName}`,
        duration: result.duration,
        provider: providerId,
        voiceId
      };
    } finally {
      if (forceMock) provider.mockMode = originalMock;
    }
  }
}

// Global Singleton Instance
export const defaultTtsManager = new TtsManager();

