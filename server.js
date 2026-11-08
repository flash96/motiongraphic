import http from "http";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { sanitizeSvg, isValidSvgString } from "./svg-sanitizer.js";
import { getAllAssets, addUploadedAsset, BUILTIN_ASSETS, getAssetById } from "./asset-library.js";
import { generateProjectFromPrompt, reviseProjectWithAI } from "./ai-director.js";
import { getAllAudioAssets, addUploadedAudio, getAudioAssetById } from "./audio-library.js";
import { getOrGenerateThumbnail } from "./thumbnail-manager.js";
import { defaultTtsManager } from "./tts-manager.js";
import { createCaptionsFromNarration } from "./caption-aligner.js";
import { validateProject } from "./project-schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

// Load environment variables if .env exists
try {
  if (typeof process.loadEnvFile === "function" && fs.existsSync(path.join(__dirname, ".env"))) {
    process.loadEnvFile(path.join(__dirname, ".env"));
  }
} catch (_) {}

const UPLOADS_DIR = path.join(__dirname, "public", "uploads");
const AUDIO_UPLOADS_DIR = path.join(__dirname, "public", "uploads", "audio");
const VOICEOVER_DIR = path.join(__dirname, "public", "audio", "voiceover");
const MANIFEST_PATH = path.join(__dirname, "public", "assets", "manifest.json");

// Ensure directories exist
[UPLOADS_DIR, AUDIO_UPLOADS_DIR, VOICEOVER_DIR, path.dirname(MANIFEST_PATH)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Initialize manifest if not existing
function loadManifest() {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      const content = fs.readFileSync(MANIFEST_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Gagal membaca manifest aset:", err.message);
  }
  return [...BUILTIN_ASSETS];
}

function saveManifest(assets) {
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(assets, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan manifest aset:", err.message);
  }
}

// Sync in-memory registry on start
const initialAssets = loadManifest();
initialAssets.forEach(a => {
  if (a.category === "Custom Upload" || a.id.startsWith("ast_up_")) {
    try { addUploadedAsset(a); } catch (e) {}
  }
});

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

const ALLOWED_EXTS = [".png", ".jpg", ".jpeg", ".svg"];
const ALLOWED_AUDIO_EXTS = [".mp3", ".wav"];

// Helper to parse JSON body
function parseJsonBody(req, limit = MAX_UPLOAD_SIZE) {
  return new Promise((resolve, reject) => {
    let body = "";
    let byteLength = 0;
    req.on("data", chunk => {
      byteLength += chunk.length;
      if (byteLength > limit) {
        reject(new Error("FILE_TOO_LARGE"));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (e) {
        reject(new Error("INVALID_JSON"));
      }
    });
    req.on("error", err => reject(err));
  });
}

// Helper to parse multipart/form-data natively
function parseMultipartBody(req, contentType, limit = MAX_UPLOAD_SIZE) {
  return new Promise((resolve, reject) => {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      return reject(new Error("NO_BOUNDARY"));
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const chunks = [];
    let byteLength = 0;

    req.on("data", chunk => {
      byteLength += chunk.length;
      if (byteLength > limit) {
        reject(new Error("FILE_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const boundaryDelimiter = Buffer.from(`--${boundary}`);
      const parts = [];

      let start = 0;
      while (start < buffer.length) {
        const idx = buffer.indexOf(boundaryDelimiter, start);
        if (idx === -1) break;
        if (start > 0) {
          parts.push(buffer.subarray(start, idx));
        }
        start = idx + boundaryDelimiter.length;
      }

      const result = { fields: {}, file: null };

      for (const part of parts) {
        const headerEnd = part.indexOf("\r\n\r\n");
        if (headerEnd === -1) continue;

        const headerStr = part.subarray(0, headerEnd).toString("utf-8");
        const body = part.subarray(headerEnd + 4, part.length - 2);

        const dispMatch = headerStr.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
        if (!dispMatch) continue;

        const fieldName = dispMatch[1];
        const filename = dispMatch[2];

        if (filename !== undefined) {
          const typeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
          result.file = {
            filename,
            mimeType: typeMatch ? typeMatch[1].trim() : "application/octet-stream",
            data: body
          };
        } else {
          result.fields[fieldName] = body.toString("utf-8");
        }
      }

      resolve(result);
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const [reqPath] = req.url.split("?");

  // API 1: GET /api/assets
  if (req.method === "GET" && reqPath === "/api/assets") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getAllAssets()));
    return;
  }

  // API 2: GET /api/audio
  if (req.method === "GET" && reqPath === "/api/audio") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getAllAudioAssets()));
    return;
  }

  // API 3: GET /api/thumbnails
  if (req.method === "GET" && reqPath === "/api/thumbnails") {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const assetId = urlObj.searchParams.get("id");
    const thumb = getOrGenerateThumbnail(assetId);
    res.writeHead(200, {
      "Content-Type": thumb.mimeType || "image/svg+xml",
      "Cache-Control": "public, max-age=86400"
    });
    res.end(thumb.data);
    return;
  }

  // API 4: POST /api/ai/generate
  if (req.method === "POST" && reqPath === "/api/ai/generate") {
    try {
      const body = await parseJsonBody(req);
      const { prompt, aspectRatio, duration, preset } = body;
      if (!prompt || String(prompt).trim() === "") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Instruksi prompt tidak boleh kosong." }));
        return;
      }
      const result = await generateProjectFromPrompt(prompt, { aspectRatio, duration, preset });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal generate AI project: ${err.message}` }));
      return;
    }
  }

  // API 5: POST /api/ai/revise
  if (req.method === "POST" && reqPath === "/api/ai/revise") {
    try {
      const body = await parseJsonBody(req);
      const { project, revisionPrompt, targetSceneId } = body;
      if (!project || !revisionPrompt) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Project dan instruksi revisi wajib diisi." }));
        return;
      }
      const result = await reviseProjectWithAI(project, revisionPrompt, targetSceneId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal merevisi adegan: ${err.message}` }));
      return;
    }
  }

  // API 6: POST /api/upload (Images & SVGs)
  if (req.method === "POST" && reqPath === "/api/upload") {
    const contentType = req.headers["content-type"] || "";

    try {
      let fileData = null;
      let originalName = "upload";
      let category = "Custom Upload";
      let mimeType = "";

      if (contentType.includes("application/json")) {
        const parsed = await parseJsonBody(req);
        originalName = parsed.filename || parsed.name || "upload";
        category = parsed.category || "Custom Upload";
        mimeType = parsed.mimeType || "image/png";

        if (parsed.contentBase64) {
          fileData = Buffer.from(parsed.contentBase64, "base64");
        } else if (parsed.content) {
          fileData = Buffer.from(parsed.content, "utf-8");
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Konten file kosong." }));
          return;
        }
      } else if (contentType.includes("multipart/form-data")) {
        const parsed = await parseMultipartBody(req, contentType);
        if (!parsed.file) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Tidak ada file yang diunggah." }));
          return;
        }
        fileData = parsed.file.data;
        originalName = parsed.file.filename;
        mimeType = parsed.file.mimeType;
        category = parsed.fields.category || "Custom Upload";
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Format request harus multipart/form-data atau JSON." }));
        return;
      }

      if (fileData.length > MAX_UPLOAD_SIZE) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ukuran file melebihi batas maksimal 5MB." }));
        return;
      }

      const ext = path.extname(originalName).toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Format file ${ext} tidak diizinkan. Hanya file PNG, JPG, dan SVG yang didukung.` }));
        return;
      }

      let finalBuffer = fileData;
      let width = 300;
      let height = 300;

      if (ext === ".svg" || mimeType === "image/svg+xml") {
        const rawSvg = fileData.toString("utf-8");
        if (!isValidSvgString(rawSvg)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "File tidak valid sebagai struktur SVG." }));
          return;
        }
        try {
          const cleanSvg = sanitizeSvg(rawSvg);
          finalBuffer = Buffer.from(cleanSvg, "utf-8");

          const vbMatch = cleanSvg.match(/viewBox=["']\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
          if (vbMatch) {
            width = Math.round(parseFloat(vbMatch[3])) || 300;
            height = Math.round(parseFloat(vbMatch[4])) || 300;
          }
        } catch (sErr) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Sanitasi SVG gagal: ${sErr.message}` }));
          return;
        }
      }

      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const assetId = `ast_up_${uniqueSuffix}`;
      const safeFilename = `${assetId}${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeFilename);

      fs.writeFileSync(filePath, finalBuffer);

      const fileUrl = `/public/uploads/${safeFilename}`;
      const assetRecord = {
        id: assetId,
        name: path.basename(originalName, ext).replace(/[_-]+/g, " ").trim() || "Aset Kustom",
        category: category || "Custom Upload",
        fileType: ext.replace(".", ""),
        fileUrl,
        thumbnail: fileUrl,
        width,
        height,
        aspectRatio: `${width}:${height}`,
        fileSize: finalBuffer.length,
        createdAt: new Date().toISOString(),
        tags: ["upload", "custom", ext.replace(".", "")]
      };

      addUploadedAsset(assetRecord);
      const manifest = loadManifest();
      manifest.push(assetRecord);
      saveManifest(manifest);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, asset: assetRecord }));
      return;
    } catch (err) {
      if (err.message === "FILE_TOO_LARGE") {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ukuran file melebihi batas maksimal 5MB." }));
        return;
      }
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Terjadi kesalahan saat memproses upload: ${err.message}` }));
      return;
    }
  }

  // API 7: POST /api/upload-audio
  if (req.method === "POST" && reqPath === "/api/upload-audio") {
    const contentType = req.headers["content-type"] || "";
    try {
      let fileData = null;
      let originalName = "audio.mp3";
      let category = "Background Music";

      if (contentType.includes("multipart/form-data")) {
        const parsed = await parseMultipartBody(req, contentType, MAX_AUDIO_UPLOAD_SIZE);
        if (!parsed.file) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Tidak ada berkas audio yang diunggah." }));
          return;
        }
        fileData = parsed.file.data;
        originalName = parsed.file.filename;
        category = parsed.fields.category || "Background Music";
      } else {
        const parsed = await parseJsonBody(req, MAX_AUDIO_UPLOAD_SIZE);
        originalName = parsed.filename || "audio.mp3";
        category = parsed.category || "Background Music";
        if (parsed.contentBase64) {
          fileData = Buffer.from(parsed.contentBase64, "base64");
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Konten audio kosong." }));
          return;
        }
      }

      if (fileData.length > MAX_AUDIO_UPLOAD_SIZE) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ukuran audio melebihi batas 10MB." }));
        return;
      }

      const ext = path.extname(originalName).toLowerCase();
      if (!ALLOWED_AUDIO_EXTS.includes(ext)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Format audio ${ext} tidak didukung. Harap gunakan MP3 atau WAV.` }));
        return;
      }

      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const audioId = `aud_up_${uniqueSuffix}`;
      const safeFilename = `${audioId}${ext}`;
      const filePath = path.join(AUDIO_UPLOADS_DIR, safeFilename);

      fs.writeFileSync(filePath, fileData);

      const fileUrl = `/public/uploads/audio/${safeFilename}`;
      const audioRecord = addUploadedAudio({
        id: audioId,
        name: path.basename(originalName, ext).replace(/[_-]+/g, " ").trim() || "Audio Kustom",
        category,
        fileType: ext.replace(".", ""),
        fileUrl,
        duration: 30,
        volume: 0.85,
        fileSize: fileData.length
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, audio: audioRecord }));
      return;
    } catch (err) {
      if (err.message === "FILE_TOO_LARGE") {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ukuran audio melebihi batas 10MB." }));
        return;
      }
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Upload audio gagal: ${err.message}` }));
      return;
    }
  }

  // API 8: POST /api/assets/delete
  if (req.method === "POST" && reqPath === "/api/assets/delete") {
    try {
      const parsed = await parseJsonBody(req);
      const { assetId } = parsed;

      if (!assetId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Asset ID wajib diisi." }));
        return;
      }

      const existing = getAssetById(assetId);
      if (!existing) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Aset tidak ditemukan." }));
        return;
      }

      if (BUILTIN_ASSETS.some(a => a.id === assetId)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Aset bawaan sistem tidak dapat dihapus." }));
        return;
      }

      if (existing.fileUrl && existing.fileUrl.startsWith("/public/uploads/")) {
        const diskPath = path.join(__dirname, existing.fileUrl);
        if (fs.existsSync(diskPath)) {
          try { fs.unlinkSync(diskPath); } catch (e) {}
        }
      }

      const manifest = loadManifest().filter(a => a.id !== assetId);
      saveManifest(manifest);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: `Aset ${assetId} berhasil dihapus.` }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // API 9: GET /api/tts/providers
  if (req.method === "GET" && reqPath === "/api/tts/providers") {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const lang = urlObj.searchParams.get("lang") || "id-ID";
      const providers = await defaultTtsManager.listProviders(lang);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, providers }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal memuat provider TTS: ${err.message}` }));
      return;
    }
  }

  // API 10: POST /api/tts/synthesize
  if (req.method === "POST" && reqPath === "/api/tts/synthesize") {
    try {
      const body = await parseJsonBody(req);
      const { sceneId, sceneIndex, text, providerId, voiceId, language, parameters, oldAudioUrl, forceMock } = body;

      if (!text || String(text).trim() === "") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Teks narasi wajib diisi untuk membuat voiceover." }));
        return;
      }

      const result = await defaultTtsManager.generateVoiceoverForScene({
        sceneId,
        sceneIndex,
        text,
        providerId: providerId || "google",
        voiceId,
        language: language || "id-ID",
        parameters: parameters || {},
        oldAudioUrl,
        forceMock: Boolean(forceMock)
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, voiceover: result }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal memproses voiceover: ${err.message}` }));
      return;
    }
  }

  // API 11: POST /api/tts/preview
  if (req.method === "POST" && reqPath === "/api/tts/preview") {
    try {
      const body = await parseJsonBody(req);
      const { text, providerId, voiceId, language, parameters, forceMock } = body;

      const result = await defaultTtsManager.previewSpeech({
        text: text || "Halo Bobotoh, selamat datang di Persib Motion Studio!",
        providerId: providerId || "google",
        voiceId,
        language: language || "id-ID",
        parameters: parameters || {},
        forceMock: Boolean(forceMock)
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, preview: result }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal memutar sampel suara: ${err.message}` }));
      return;
    }
  }

  // API 11B: GET /api/tts/custom-voices
  if (req.method === "GET" && reqPath === "/api/tts/custom-voices") {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const providerId = urlObj.searchParams.get("provider") || "elevenlabs";
      const customVoices = await defaultTtsManager.listCustomVoices(providerId);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, voices: customVoices }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal mengambil daftar custom voice: ${err.message}` }));
      return;
    }
  }

  // API 11C: POST /api/tts/custom-voice
  if (req.method === "POST" && reqPath === "/api/tts/custom-voice") {
    try {
      const body = await parseJsonBody(req);
      const { name, description, speakerName, consentAgreed, rightsConfirmed, audioBase64, audioMimeType, providerId } = body;

      if (!consentAgreed || !rightsConfirmed || !speakerName || !String(speakerName).trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          error: "Persetujuan eksplisit dari pemilik suara (consent) dan konfirmasi hak cipta wajib disetujui."
        }));
        return;
      }

      if (!name || !String(name).trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Nama custom voice wajib diisi." }));
        return;
      }

      if (!audioBase64) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "File sampel suara audio wajib diunggah." }));
        return;
      }

      const audioBuffer = Buffer.from(audioBase64, "base64");
      if (audioBuffer.length < 1024) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Sampel audio terlalu pendek atau kosong (minimal 1KB)." }));
        return;
      }

      if (audioBuffer.length > 10 * 1024 * 1024) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ukuran sampel audio melebihi batas 10MB." }));
        return;
      }

      const voice = await defaultTtsManager.addCustomVoice({
        providerId: providerId || "elevenlabs",
        name: String(name).trim(),
        description: description ? String(description).trim() : "",
        sampleBuffers: [{ buffer: audioBuffer, mimeType: audioMimeType || "audio/mpeg" }],
        consent: {
          speakerName: String(speakerName).trim(),
          agreed: Boolean(consentAgreed),
          rightsConfirmed: Boolean(rightsConfirmed)
        }
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, voice }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal membuat custom voice: ${err.message}` }));
      return;
    }
  }

  // API 11D: DELETE /api/tts/custom-voice/:id
  if (req.method === "DELETE" && reqPath.startsWith("/api/tts/custom-voice/")) {
    try {
      const voiceId = decodeURIComponent(reqPath.replace("/api/tts/custom-voice/", "").trim());
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const providerId = urlObj.searchParams.get("provider") || "elevenlabs";

      const result = await defaultTtsManager.deleteCustomVoice({ providerId, voiceId });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal menghapus custom voice: ${err.message}` }));
      return;
    }
  }

  // API 12: POST /api/captions/generate
  if (req.method === "POST" && reqPath === "/api/captions/generate") {
    try {
      const body = await parseJsonBody(req);
      const { sceneId, narration, audioUrl, preset, styleOverrides } = body;

      if (!narration || String(narration).trim() === "") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Naskah narasi tidak boleh kosong untuk membuat subtitle." }));
        return;
      }

      let audioDuration = 5.0;
      let audioBuffer = null;

      if (audioUrl && typeof audioUrl === "string") {
        const cleanUrl = audioUrl.split("?")[0].trim();
        const allowedPrefixes = ["/public/audio/", "/public/uploads/audio/"];
        const isAllowedPrefix = allowedPrefixes.some(prefix => cleanUrl.startsWith(prefix));

        if (isAllowedPrefix) {
          const diskPath = path.resolve(__dirname, "." + cleanUrl);
          const rel = path.relative(__dirname, diskPath);

          if (!rel.startsWith("..") && !path.isAbsolute(rel) && fs.existsSync(diskPath)) {
            try {
              audioBuffer = fs.readFileSync(diskPath);
              if (diskPath.endsWith(".wav") && audioBuffer.length > 44) {
                const sampleRate = audioBuffer.readUInt32LE(24);
                const numChannels = audioBuffer.readUInt16LE(22);
                if (sampleRate > 0 && numChannels > 0) {
                  const totalSamples = (audioBuffer.length - 44) / (numChannels * 2);
                  audioDuration = Math.round((totalSamples / sampleRate) * 100) / 100;
                }
              } else if (diskPath.endsWith(".mp3")) {
                const audioAsset = getAllAudioAssets().find(a => a.fileUrl === cleanUrl);
                if (audioAsset && audioAsset.duration > 0) {
                  audioDuration = audioAsset.duration;
                }
              }
            } catch (_) {}
          }
        }
      }

      const captions = createCaptionsFromNarration({
        sceneId: sceneId || "sc_1",
        narration: narration.trim(),
        audioDuration,
        audioBuffer,
        preset: preset || "persib_gold",
        styleOverrides: styleOverrides || {}
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, captions }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Gagal membuat caption: ${err.message}` }));
      return;
    }
  }

  // API 13: POST /api/project/sync-active
  if (req.method === "POST" && reqPath === "/api/project/sync-active") {
    try {
      const parsed = await parseJsonBody(req);
      const project = parsed.project || parsed;
      const validated = validateProject(project);
      if (!validated.valid) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Validasi project gagal: ${validated.errors.join(", ")}` }));
        return;
      }
      const inputDir = path.join(__dirname, "input");
      if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });
      fs.writeFileSync(path.join(inputDir, "unified-project.json"), JSON.stringify(validated.project, null, 2), "utf-8");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Project aktif berhasil disinkronkan ke Remotion runner." }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // API 14: POST /api/render/remotion
  if (req.method === "POST" && reqPath === "/api/render/remotion") {
    try {
      const parsed = await parseJsonBody(req);
      const project = parsed.project || parsed;
      if (project && project.scenes) {
        const validated = validateProject(project);
        if (validated.valid) {
          const inputDir = path.join(__dirname, "input");
          if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });
          fs.writeFileSync(path.join(inputDir, "unified-project.json"), JSON.stringify(validated.project, null, 2), "utf-8");
        }
      }

      const outDir = path.join(__dirname, "out");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

      execSync(`${npxCmd} remotion render UnifiedProject out/video.mp4`, {
        cwd: __dirname,
        stdio: "pipe",
        timeout: 120000
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        success: true,
        videoUrl: "/out/video.mp4",
        message: "Video MP4 berhasil dirender oleh Remotion!"
      }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: `Render Remotion gagal: ${err.message}`
      }));
      return;
    }
  }

  // Static File Serving with strict path containment
  let filePath = reqPath;
  if (filePath === "/") filePath = "/index.html";

  const safePath = path.resolve(__dirname, "." + filePath);
  const rel = path.relative(__dirname, safePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const headers = { "Content-Type": contentType };
    if ([".html", ".css", ".js", ".json"].includes(ext)) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      headers["Pragma"] = "no-cache";
      headers["Expires"] = "0";
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`MotionGraphic Studio berjalan di: http://localhost:${PORT}`);
});
