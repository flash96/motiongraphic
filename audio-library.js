/**
 * Audio Asset Management & Catalog
 * Centralized audio management for Background Music (BGM) and Sound Effects (SFX).
 */

export const AUDIO_CATEGORIES = [
  "All",
  "Voiceover",
  "Background Music",
  "Stadium Atmosphere",
  "Crowd Chant",
  "Whoosh",
  "Impact",
  "Transition Sound",
  "Celebration Sound",
  "Other Sound Effects"
];

export const BUILTIN_AUDIO_ASSETS = [
  {
    id: "aud_persib_anthem",
    name: "Persib Juara Rock Anthem (BGM)",
    category: "Background Music",
    fileType: "mp3",
    fileUrl: "/public/audio/bgm/persib_rock_anthem.mp3",
    duration: 32.5,
    volume: 0.85,
    tags: ["anthem", "rock", "semangat", "juara", "bgm"],
    license: "Royalty-Free Persib Media Production"
  },
  {
    id: "aud_stadium_roar",
    name: "Gemuruh Bobotoh Si Jalak Harupat",
    category: "Stadium Atmosphere",
    fileType: "mp3",
    fileUrl: "/public/audio/sfx/stadium_roar.mp3",
    duration: 28.0,
    volume: 0.7,
    tags: ["stadion", "bobotoh", "chant", "tribun", "atmosphere"],
    license: "Royalty-Free Audio"
  },
  {
    id: "aud_crowd_celebration",
    name: "Sorak Sorai Gol Kemenangan",
    category: "Celebration Sound",
    fileType: "mp3",
    fileUrl: "/public/audio/sfx/crowd_goal_cheer.mp3",
    duration: 8.4,
    volume: 0.9,
    tags: ["gol", "selebrasi", "juara", "menang"],
    license: "Royalty-Free Audio"
  },
  {
    id: "aud_cinematic_impact",
    name: "Sub Bass Hit & Cinematic Impact",
    category: "Impact",
    fileType: "wav",
    fileUrl: "/public/audio/sfx/cinematic_impact.wav",
    duration: 3.2,
    volume: 0.95,
    tags: ["impact", "bass", "dramatis", "hit", "trailer"],
    license: "Royalty-Free Audio"
  },
  {
    id: "aud_whoosh_transition",
    name: "Fast Energy Whoosh Swipe",
    category: "Whoosh",
    fileType: "mp3",
    fileUrl: "/public/audio/sfx/whoosh_fast.mp3",
    duration: 1.5,
    volume: 0.8,
    tags: ["whoosh", "swipe", "transisi", "cepat"],
    license: "Royalty-Free Audio"
  },
  {
    id: "aud_breaking_alert",
    name: "Breaking News Ticker Chime",
    category: "Transition Sound",
    fileType: "mp3",
    fileUrl: "/public/audio/sfx/breaking_alert.mp3",
    duration: 2.1,
    volume: 0.8,
    tags: ["breaking", "news", "transfer", "alert", "chime"],
    license: "Royalty-Free Audio"
  }
];

const customAudioRegistry = new Map();

/**
 * Returns all audio assets (built-in + uploaded).
 */
export function getAllAudioAssets() {
  const customList = Array.from(customAudioRegistry.values());
  return [...BUILTIN_AUDIO_ASSETS, ...customList];
}

/**
 * Retrieves audio asset by its unique Asset ID.
 */
export function getAudioAssetById(assetId) {
  if (!assetId) return null;
  return getAllAudioAssets().find(a => a.id === assetId) || null;
}

/**
 * Filters audio assets by category and keyword.
 */
export function filterAudioAssets(category = "All", searchQuery = "") {
  let assets = getAllAudioAssets();

  if (category && category !== "All") {
    assets = assets.filter(a => a.category.toLowerCase() === category.toLowerCase());
  }

  if (searchQuery && searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase().trim();
    assets = assets.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  return assets;
}

/**
 * Adds an uploaded audio asset.
 */
export function addUploadedAudio(audioData) {
  if (!audioData || !audioData.fileUrl) {
    throw new Error("Data audio tidak lengkap.");
  }

  const assetId = audioData.id || `aud_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const asset = {
    id: assetId,
    name: audioData.name || "Audio Kustom",
    category: audioData.category || "Background Music",
    fileType: audioData.fileType || "mp3",
    fileUrl: audioData.fileUrl,
    duration: Number(audioData.duration) || 30,
    volume: Number(audioData.volume) || 0.8,
    fileSize: Number(audioData.fileSize) || 0,
    createdAt: audioData.createdAt || new Date().toISOString(),
    tags: Array.isArray(audioData.tags) ? audioData.tags : ["upload", "audio"],
    license: "User Uploaded Audio"
  };

  customAudioRegistry.set(assetId, asset);
  return asset;
}

/**
 * Registers an AI-generated Voiceover audio asset.
 */
export function registerVoiceoverAsset(data) {
  if (!data || !data.fileUrl) {
    throw new Error("Data voiceover tidak lengkap.");
  }

  const assetId = data.id || `aud_vo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const asset = {
    id: assetId,
    name: data.name || "AI Voiceover",
    category: "Voiceover",
    fileType: data.fileType || "mp3",
    fileUrl: data.fileUrl,
    duration: Number(data.duration) || 3.0,
    volume: 1.0,
    createdAt: data.createdAt || new Date().toISOString(),
    tags: ["voiceover", "tts", data.provider || "google", data.voiceId || ""],
    license: "AI Generated Voiceover (Persib Media)",
    metadata: {
      sceneId: data.sceneId,
      provider: data.provider,
      voiceId: data.voiceId,
      language: data.language,
      sourceText: data.sourceText,
      parameters: data.parameters
    }
  };

  customAudioRegistry.set(assetId, asset);
  return asset;
}

/**
 * Deletes custom audio asset.
 */
export function deleteAudioAsset(project, assetId) {
  if (!customAudioRegistry.has(assetId)) {
    if (BUILTIN_AUDIO_ASSETS.some(a => a.id === assetId)) {
      return { success: false, reason: "Audio bawaan sistem tidak dapat dihapus." };
    }
    return { success: false, reason: "Audio tidak ditemukan." };
  }

  if (project?.audio?.assetId === assetId || project?.audio?.bgmUrl === customAudioRegistry.get(assetId)?.fileUrl) {
    return { success: false, reason: "Audio ini sedang digunakan sebagai BGM proyek aktif." };
  }

  customAudioRegistry.delete(assetId);
  return { success: true };
}

/**
 * Recommends audio based on video concept/theme.
 */
export function recommendAudioForConcept(concept = {}) {
  const topic = (concept.topic || concept.name || "").toLowerCase();
  const category = (concept.category || "").toLowerCase();

  if (topic.includes("transfer") || category.includes("transfer")) {
    return getAudioAssetById("aud_breaking_alert") || getAudioAssetById("aud_cinematic_impact");
  }
  if (topic.includes("menang") || topic.includes("skor") || topic.includes("recap") || category.includes("hasil")) {
    return getAudioAssetById("aud_crowd_celebration") || getAudioAssetById("aud_persib_anthem");
  }
  if (topic.includes("duel") || topic.includes("versus") || category.includes("preview")) {
    return getAudioAssetById("aud_cinematic_impact") || getAudioAssetById("aud_stadium_roar");
  }

  return getAudioAssetById("aud_persib_anthem") || BUILTIN_AUDIO_ASSETS[0];
}

