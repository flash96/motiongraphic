import { BaseTtsProvider } from "./base-provider.js";
import { createSyntheticWavBuffer } from "./audio-generator-helper.js";

export const GOOGLE_CURATED_VOICES = [
  { id: "id-ID-Standard-A", name: "Standard A (Wanita)", language: "id-ID", gender: "FEMALE" },
  { id: "id-ID-Standard-B", name: "Standard B (Pria - Host)", language: "id-ID", gender: "MALE" },
  { id: "id-ID-Standard-C", name: "Standard C (Pria - Tegas)", language: "id-ID", gender: "MALE" },
  { id: "id-ID-Standard-D", name: "Standard D (Wanita - Narasi)", language: "id-ID", gender: "FEMALE" },
  { id: "id-ID-Wavenet-A", name: "WaveNet A (Wanita Natural HD)", language: "id-ID", gender: "FEMALE" },
  { id: "id-ID-Wavenet-B", name: "WaveNet B (Pria Komentator HD)", language: "id-ID", gender: "MALE" },
  { id: "id-ID-Wavenet-C", name: "WaveNet C (Pria Bass HD)", language: "id-ID", gender: "MALE" },
  { id: "id-ID-Wavenet-D", name: "WaveNet D (Wanita Berita HD)", language: "id-ID", gender: "FEMALE" },
  { id: "en-US-Standard-C", name: "English C (Female Standard)", language: "en-US", gender: "FEMALE" },
  { id: "en-US-Standard-D", name: "English D (Male Announcer)", language: "en-US", gender: "MALE" },
  { id: "en-US-Wavenet-D", name: "English D (Male WaveNet Pro)", language: "en-US", gender: "MALE" }
];

export class GoogleTtsProvider extends BaseTtsProvider {
  constructor(options = {}) {
    super("google", "Google Cloud Text-to-Speech");
    this.apiKey = options.apiKey || process.env.GOOGLE_TTS_API_KEY || "";
    this.mockMode = Boolean(options.mockMode || process.env.TTS_MOCK_GOOGLE === "true");
    this.timeoutMs = options.timeoutMs || 15000;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async listVoices(language = "id-ID") {
    // If configured and not in mock mode, attempt live voice list with fallback
    if (this.isConfigured() && !this.mockMode && typeof fetch === "function") {
      try {
        const url = `https://texttospeech.googleapis.com/v1/voices?key=${encodeURIComponent(this.apiKey)}&languageCode=${encodeURIComponent(language)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.voices) && data.voices.length > 0) {
            return data.voices.map(v => ({
              id: v.name,
              name: `${v.name.split("-").slice(-2).join(" ")} (${v.ssmlGender || "NEUTRAL"})`,
              language: v.languageCodes?.[0] || language,
              gender: v.ssmlGender || "NEUTRAL"
            }));
          }
        }
      } catch (e) {
        // Fallback to curated list
      }
    }

    if (!language || language === "all") {
      return [...GOOGLE_CURATED_VOICES];
    }
    const filtered = GOOGLE_CURATED_VOICES.filter(v => v.language.toLowerCase().startsWith(language.toLowerCase().split("-")[0]));
    return filtered.length > 0 ? filtered : [...GOOGLE_CURATED_VOICES];
  }

  async synthesize({ text, voiceId, language = "id-ID", parameters = {} }) {
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new Error("Teks narasi wajib diisi untuk generate voiceover.");
    }

    const speakingRate = Math.max(0.5, Math.min(2.0, Number(parameters.speakingRate) || 1.0));
    const pitch = Math.max(-10.0, Math.min(10.0, Number(parameters.pitch) || 0.0));
    const targetVoice = voiceId || "id-ID-Standard-A";
    const duration = this.estimateDuration(text, speakingRate);

    // Mock Mode / Local testing fallback if not configured
    if (!this.isConfigured() || this.mockMode) {
      if (!this.isConfigured() && !this.mockMode) {
        throw new Error("Google Cloud TTS belum dikonfigurasi. Harap isi GOOGLE_TTS_API_KEY pada file .env.");
      }
      const audioBuffer = createSyntheticWavBuffer(duration, 440);
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

    // Live Google Cloud Text-to-Speech REST Call
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(this.apiKey)}`;
    const payload = {
      input: { text: text.trim() },
      voice: {
        languageCode: language || "id-ID",
        name: targetVoice
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate,
        pitch
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMsg = `Google TTS Error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) {
            errorMsg = `Google TTS: ${errData.error.message}`;
          }
        } catch (_) {}

        if (response.status === 429) {
          errorMsg = "Google TTS: Rate limit tercapai. Silakan coba beberapa saat lagi.";
        } else if (response.status === 403 || response.status === 400) {
          errorMsg = `Google TTS API Key tidak valid atau izin Text-to-Speech API belum aktif.`;
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.audioContent) {
        throw new Error("Google TTS tidak mengembalikan data audioContent.");
      }

      const audioBuffer = Buffer.from(data.audioContent, "base64");
      return {
        audioBuffer,
        mimeType: "audio/mpeg",
        fileExtension: "mp3",
        duration,
        timingMetadata: {
          wordCount: text.trim().split(/\s+/).length,
          provider: "google",
          voiceId: targetVoice,
          speakingRate,
          pitch
        }
      };
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error(`Google TTS request timeout setelah ${this.timeoutMs / 1000} detik.`);
      }
      throw err;
    }
  }
}

