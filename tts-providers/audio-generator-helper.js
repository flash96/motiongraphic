/**
 * Generates a valid RIFF WAVE audio buffer with a gentle sine tone or silence.
 * Compatible with all audio players, browsers, and Remotion rendering pipeline.
 *
 * @param {number} durationSeconds - duration in seconds
 * @param {number} [frequency=440] - tone frequency (Hz)
 * @param {number} [sampleRate=22050] - sample rate
 * @returns {Buffer} valid WAV audio buffer
 */
export function createSyntheticWavBuffer(durationSeconds = 2.0, frequency = 440, sampleRate = 22050) {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // "fmt " sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // "data" sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate gentle tone with smooth fade-in and fade-out to prevent clicks
  const attackSamples = Math.min(Math.floor(sampleRate * 0.05), totalSamples / 4);
  const decaySamples = attackSamples;

  for (let i = 0; i < totalSamples; i++) {
    let envelope = 1.0;
    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else if (i > totalSamples - decaySamples) {
      envelope = (totalSamples - i) / decaySamples;
    }

    const t = i / sampleRate;
    // Harmonic pleasant chime (commentary tone)
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.4 +
                   Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.15;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * envelope * 24000)));
    buffer.writeInt16LE(intSample, headerSize + i * 2);
  }

  return buffer;
}

