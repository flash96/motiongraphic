/**
 * Base TTS Provider Abstract Interface
 * Defines uniform contract for Text-to-Speech providers in MotionGraphic Studio.
 */

export class BaseTtsProvider {
  constructor(id, name) {
    if (new.target === BaseTtsProvider) {
      throw new TypeError("Cannot construct BaseTtsProvider directly.");
    }
    this.id = id;
    this.name = name;
  }

  /**
   * Returns whether provider is properly configured with valid credentials/API key.
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error("Method isConfigured() must be implemented.");
  }

  /**
   * Returns list of available voices.
   * @param {string} [language]
   * @returns {Promise<Array<{ id: string, name: string, language: string, gender?: string, previewUrl?: string }>>}
   */
  async listVoices(language = "id-ID") {
    throw new Error("Method listVoices() must be implemented.");
  }

  /**
   * Synthesizes text into audio buffer.
   * @param {Object} options
   * @param {string} options.text
   * @param {string} options.voiceId
   * @param {string} [options.language]
   * @param {Object} [options.parameters]
   * @returns {Promise<{ audioBuffer: Buffer, mimeType: string, fileExtension: string, duration: number, timingMetadata?: any }>}
   */
  async synthesize({ text, voiceId, language, parameters }) {
    throw new Error("Method synthesize() must be implemented.");
  }

  /**
   * Returns whether provider supports voice cloning / custom voices.
   * @returns {boolean}
   */
  supportsCustomVoices() {
    return false;
  }

  /**
   * Returns list of custom voices created on this provider.
   * @returns {Promise<Array<{ id: string, name: string, description?: string, provider: string, isCustom: boolean }>>}
   */
  async listCustomVoices() {
    return [];
  }

  /**
   * Creates a custom cloned voice on the provider.
   * @param {Object} options
   * @param {string} options.name
   * @param {string} [options.description]
   * @param {Array<Buffer|{ buffer: Buffer, fileName?: string, mimeType?: string }>} options.sampleBuffers
   * @param {Object} options.consent - Mandatory speaker consent details
   * @param {boolean} options.consent.agreed
   * @param {string} options.consent.speakerName
   * @param {boolean} options.consent.rightsConfirmed
   * @returns {Promise<{ id: string, name: string, description?: string, provider: string, isCustom: boolean, createdAt: string }>}
   */
  async addCustomVoice({ name, description, sampleBuffers, consent }) {
    throw new Error(`Provider "${this.name}" tidak mendukung fitur voice cloning / custom voice.`);
  }

  /**
   * Deletes a custom cloned voice on the provider.
   * @param {string} voiceId
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async deleteCustomVoice(voiceId) {
    throw new Error(`Provider "${this.name}" tidak mendukung penghapusan custom voice.`);
  }

  /**
   * Estimates duration in seconds based on text word count and speaking rate.
   * Typical speaking rate: ~140-160 words per minute (~2.5 words per second).
   * @param {string} text
   * @param {number} [speakingRate=1.0]
   * @returns {number}
   */
  estimateDuration(text, speakingRate = 1.0) {
    if (!text || typeof text !== "string") return 1.0;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const rate = Math.max(0.5, Math.min(2.0, Number(speakingRate) || 1.0));
    const baseSeconds = (words / 2.5) / rate;
    // Add 0.4s natural breathing room
    return Math.max(1.0, Math.round((baseSeconds + 0.4) * 10) / 10);
  }
}

