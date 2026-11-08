import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BaseTtsProvider } from "./base-provider.js";
import { createSyntheticWavBuffer } from "./audio-generator-helper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, "..", "public", "cache");
const CUSTOM_VOICES_FILE = path.join(CACHE_DIR, "custom-voices-elevenlabs.json");

export const ELEVENLABS_CURATED_VOICES = [
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Komentator Pertandingan)", language: "id-ID", gender: "MALE", style: "Commentary" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Tenang & Profesional)", language: "id-ID", gender: "FEMALE", style: "Narrative" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (Enerjik & Semangat)", language: "id-ID", gender: "FEMALE", style: "Energetic" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Naratif & Dramatis)", language: "id-ID", gender: "FEMALE", style: "Dramatic" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Muda & Dinamis)", language: "id-ID", gender: "FEMALE", style: "Modern" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Bariton Dalam & Berwibawa)", language: "id-ID", gender: "MALE", style: "Deep Announcer" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold (Trailer & Aksi)", language: "id-ID", gender: "MALE", style: "Action" }
];

export class ElevenLabsProvider extends BaseTtsProvider {
  constructor(options = {}) {
    super("elevenlabs", "ElevenLabs");
    this.apiKey = options.apiKey || process.env.ELEVENLABS_API_KEY || "";
    this.mockMode = Boolean(options.mockMode || process.env.TTS_MOCK_ELEVENLABS === "true");
    this.timeoutMs = options.timeoutMs || 15000;
    this.storageFile = options.storageFile || CUSTOM_VOICES_FILE;
    this._customVoicesStore = this._loadCustomVoices();
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  /**
   * ElevenLabs supports voice cloning / custom voices via Voice Add API.
   */
  supportsCustomVoices() {
    return true;
  }

  _loadCustomVoices() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (_) {}
    return [];
  }

  _saveCustomVoices() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(this._customVoicesStore, null, 2), "utf8");
    } catch (_) {}
  }

  async listCustomVoices() {
    return [...this._customVoicesStore];
  }

  async listVoices(language = "id-ID") {
    let baseVoices = ELEVENLABS_CURATED_VOICES.map(v => ({
      ...v,
      voiceId: v.id,
      isCustom: Boolean(v.isCustom)
    }));

    if (this.isConfigured() && !this.mockMode && typeof fetch === "function") {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        const res = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: { "xi-api-key": this.apiKey },
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.voices) && data.voices.length > 0) {
            baseVoices = data.voices.map(v => ({
              id: v.voice_id,
              voiceId: v.voice_id,
              name: `${v.name}${v.labels?.accent ? ` (${v.labels.accent})` : ""}`,
              language: v.labels?.language || language,
              gender: v.labels?.gender ? v.labels.gender.toUpperCase() : "NEUTRAL",
              previewUrl: v.preview_url || "",
              isCustom: Boolean(v.category === "cloned" || v.category === "generated")
            }));
          }
        }
      } catch (e) {
        // Fallback to curated voices
      }
    }

    // Merge persistent custom voices that may have been created locally
    const customVoices = this._customVoicesStore.map(cv => ({
      id: cv.id,
      voiceId: cv.id,
      name: `${cv.name} [Custom]`,
      description: cv.description || "",
      language: cv.language || language,
      gender: cv.gender || "CUSTOM",
      previewUrl: cv.previewUrl || "",
      isCustom: true,
      speakerName: cv.speakerName || ""
    }));

    const existingIds = new Set(baseVoices.map(v => v.id));
    const merged = [...baseVoices];
    for (const cv of customVoices) {
      if (!existingIds.has(cv.id)) {
        merged.push(cv);
        existingIds.add(cv.id);
      }
    }

    return merged;
  }

  /**
   * Adds a custom voice with mandatory explicit speaker consent verification.
   */
  async addCustomVoice({ name, description = "", sampleBuffers = [], consent = {} }) {
    // 1. Mandatory Consent Verification
    if (!consent || consent.agreed !== true || !consent.rightsConfirmed) {
      throw new Error(
        "Persetujuan eksplisit dari pemilik suara (consent) dan konfirmasi hak penggunaan wajib disetujui sebelum melakukan cloning suara."
      );
    }
    if (!consent.speakerName || !String(consent.speakerName).trim()) {
      throw new Error("Nama pemilik suara (speaker) wajib diisi untuk verifikasi hak cipta.");
    }

    // 2. Validate voice name
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new Error("Nama custom voice wajib diisi.");
    }

    // 3. Validate audio samples
    if (!Array.isArray(sampleBuffers) || sampleBuffers.length === 0) {
      throw new Error("Minimal satu file sampel suara audio wajib diunggah untuk membuat custom voice.");
    }

    for (let i = 0; i < sampleBuffers.length; i++) {
      const sample = sampleBuffers[i];
      const buf = Buffer.isBuffer(sample) ? sample : sample?.buffer;
      if (!buf || buf.length < 1024) {
        throw new Error(`Sampel suara audio #${i + 1} terlalu pendek atau kosong (minimal 1KB).`);
      }
      if (buf.length > 10 * 1024 * 1024) {
        throw new Error(`Ukuran sampel suara audio #${i + 1} melebihi batas maksimum 10MB.`);
      }
    }

    const consentRecord = {
      speakerName: String(consent.speakerName).trim(),
      agreed: true,
      rightsConfirmed: true,
      timestamp: new Date().toISOString()
    };

    // 4. Live API Call or Mock Creation
    if (this.isConfigured() && !this.mockMode && typeof fetch === "function") {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs * 2);

      try {
        const formData = new FormData();
        formData.append("name", name.trim());
        if (description) formData.append("description", description.trim());
        formData.append(
          "labels",
          JSON.stringify({
            speaker: consentRecord.speakerName,
            source: "persib_motion_studio"
          })
        );

        sampleBuffers.forEach((sample, idx) => {
          const buf = Buffer.isBuffer(sample) ? sample : sample.buffer;
          const fileName = sample?.fileName || `sample_${idx + 1}.mp3`;
          const mimeType = sample?.mimeType || "audio/mpeg";
          formData.append("files", new Blob([buf], { type: mimeType }), fileName);
        });

        const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
          method: "POST",
          headers: { "xi-api-key": this.apiKey },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
          let errMsg = `ElevenLabs add voice error (${res.status})`;
          try {
            const errJson = await res.json();
            if (errJson?.detail?.message) errMsg = `ElevenLabs: ${errJson.detail.message}`;
            else if (errJson?.message) errMsg = `ElevenLabs: ${errJson.message}`;
          } catch (_) {}
          throw new Error(errMsg);
        }

        const data = await res.json();
        const voiceId = data.voice_id;

        const record = {
          id: voiceId,
          voiceId,
          name: name.trim(),
          description: description.trim(),
          provider: "elevenlabs",
          isCustom: true,
          speakerName: consentRecord.speakerName,
          consent: consentRecord,
          consentRecord,
          createdAt: new Date().toISOString()
        };

        this._customVoicesStore = this._customVoicesStore.filter(v => v.id !== voiceId);
        this._customVoicesStore.push(record);
        this._saveCustomVoices();

        return record;
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    }

    // Mock Mode fallback
    const mockVoiceId = `cloned_el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockRecord = {
      id: mockVoiceId,
      voiceId: mockVoiceId,
      name: name.trim(),
      description: description.trim() || "Custom Cloned Voice",
      provider: "elevenlabs",
      isCustom: true,
      speakerName: consentRecord.speakerName,
      consent: consentRecord,
      consentRecord,
      createdAt: new Date().toISOString()
    };

    this._customVoicesStore = this._customVoicesStore.filter(v => v.id !== mockVoiceId);
    this._customVoicesStore.push(mockRecord);
    this._saveCustomVoices();

    return mockRecord;
  }

  /**
   * Deletes a custom cloned voice reference and calls provider if configured.
   */
  async deleteCustomVoice(voiceId) {
    if (!voiceId) {
      throw new Error("Voice ID wajib diisi untuk menghapus custom voice.");
    }

    const existing = this._customVoicesStore.find(v => v.id === voiceId);

    // Call live API if configured and not mock
    if (this.isConfigured() && !this.mockMode && typeof fetch === "function") {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`, {
          method: "DELETE",
          headers: { "xi-api-key": this.apiKey },
          signal: controller.signal
        });
        clearTimeout(timeout);
      } catch (err) {
        // If live API fails, we still remove the local reference
      }
    }

    this._customVoicesStore = this._customVoicesStore.filter(v => v.id !== voiceId);
    this._saveCustomVoices();

    return {
      success: true,
      deletedVoiceId: voiceId,
      message: `Voice "${existing?.name || voiceId}" berhasil dihapus.`
    };
  }

  async synthesize({ text, voiceId, language = "id-ID", parameters = {} }) {
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new Error("Teks narasi wajib diisi untuk generate voiceover.");
    }

    const targetVoice = voiceId || "ErXwobaYiN019PkySvjV";
    const stability = Math.max(0.1, Math.min(1.0, Number(parameters.stability) || 0.75));
    const similarityBoost = Math.max(0.1, Math.min(1.0, Number(parameters.similarityBoost) || 0.75));
    const speed = Math.max(0.7, Math.min(1.5, Number(parameters.speakingRate) || 1.0));
    const duration = this.estimateDuration(text, speed);

    // Mock Mode / Local testing fallback if not configured
    if (!this.isConfigured() || this.mockMode) {
      if (!this.isConfigured() && !this.mockMode) {
        throw new Error("ElevenLabs belum dikonfigurasi. Harap isi ELEVENLABS_API_KEY pada file .env.");
      }
      const audioBuffer = createSyntheticWavBuffer(duration, 520);
      return {
        audioBuffer,
        mimeType: "audio/wav",
        fileExtension: "wav",
        duration,
        timingMetadata: {
          wordCount: text.trim().split(/\s+/).length,
          estimatedDuration: duration,
          isMock: true
        }
      };
    }

    // Live ElevenLabs REST Call
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(targetVoice)}?optimize_streaming_latency=0`;
    const payload = {
      text: text.trim(),
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        speed
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMsg = `ElevenLabs Error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.detail?.message) {
            errorMsg = `ElevenLabs: ${errData.detail.message}`;
          } else if (errData?.message) {
            errorMsg = `ElevenLabs: ${errData.message}`;
          }
        } catch (_) {}

        if (response.status === 429) {
          errorMsg = "ElevenLabs: Kuota kredit atau rate limit tercapai. Silakan coba beberapa saat lagi.";
        } else if (response.status === 401 || response.status === 403) {
          errorMsg = "ElevenLabs API Key tidak valid.";
        }

        throw new Error(errorMsg);
      }

      const arrayBuf = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);

      return {
        audioBuffer,
        mimeType: "audio/mpeg",
        fileExtension: "mp3",
        duration,
        timingMetadata: {
          wordCount: text.trim().split(/\s+/).length,
          provider: "elevenlabs",
          voiceId: targetVoice,
          stability,
          speed
        }
      };
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error(`ElevenLabs request timeout setelah ${this.timeoutMs / 1000} detik.`);
      }
      throw err;
    }
  }
}

