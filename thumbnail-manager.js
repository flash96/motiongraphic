/**
 * Asset Thumbnail Caching & Optimization Manager
 * Generates, caches, and serves lightweight previews for visual assets.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { renderSvgComponent } from "./shared-svg-library.js";
import { getAssetById } from "./asset-library.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THUMB_CACHE_DIR = path.join(__dirname, "public", "cache", "thumbs");

// Ensure cache directory exists
if (!fs.existsSync(THUMB_CACHE_DIR)) {
  fs.mkdirSync(THUMB_CACHE_DIR, { recursive: true });
}

// In-memory memory cache map for blazing fast repeated lookups
const memoryThumbCache = new Map();

/**
 * Returns thumbnail cache path for an asset.
 */
export function getThumbnailDiskPath(assetId) {
  const safeId = String(assetId).replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(THUMB_CACHE_DIR, `${safeId}.thumb.json`);
}

/**
 * Generates or retrieves cached thumbnail for a given visual asset.
 * Returns { mimeType: string, data: string | Buffer, fromCache: boolean }
 */
export function getOrGenerateThumbnail(assetId, forceRegenerate = false) {
  if (!assetId) {
    return getFallbackThumbnail("Aset Tidak Diketahui");
  }

  // 1. Check in-memory cache
  if (!forceRegenerate && memoryThumbCache.has(assetId)) {
    return { ...memoryThumbCache.get(assetId), fromCache: true };
  }

  // 2. Check disk cache
  const diskPath = getThumbnailDiskPath(assetId);
  if (!forceRegenerate && fs.existsSync(diskPath)) {
    try {
      const raw = fs.readFileSync(diskPath, "utf-8");
      const cached = JSON.parse(raw);
      memoryThumbCache.set(assetId, cached);
      return { ...cached, fromCache: true };
    } catch (e) {
      // Corrupt cache, proceed to regenerate
    }
  }

  // 3. Generate thumbnail
  const asset = getAssetById(assetId);
  if (!asset) {
    return getFallbackThumbnail(assetId);
  }

  let thumbData = null;

  // Case A: Shared SVG Component
  if (asset.fileType === "svg-component" || asset.componentId) {
    const compId = asset.componentId || asset.id;
    const svgMarkup = renderSvgComponent(compId, { width: 140, height: 110 });
    thumbData = {
      mimeType: "image/svg+xml",
      data: svgMarkup,
      width: 140,
      height: 110
    };
  }
  // Case B: SVG File
  else if (asset.fileType === "svg" && asset.fileUrl) {
    const localFilePath = path.join(__dirname, asset.fileUrl);
    if (fs.existsSync(localFilePath)) {
      try {
        const svgContent = fs.readFileSync(localFilePath, "utf-8");
        thumbData = {
          mimeType: "image/svg+xml",
          data: svgContent,
          width: 140,
          height: 110
        };
      } catch (err) {}
    }
  }
  // Case C: Raster Image (PNG, JPG)
  else if (asset.fileUrl) {
    const localFilePath = path.join(__dirname, asset.fileUrl);
    if (fs.existsSync(localFilePath)) {
      // Return reference with cache headers; for disk cache, store metadata
      thumbData = {
        mimeType: asset.fileType === "png" ? "image/png" : "image/jpeg",
        fileUrl: asset.fileUrl,
        data: asset.fileUrl,
        width: 140,
        height: 110
      };
    }
  }

  if (!thumbData) {
    thumbData = getFallbackThumbnail(asset.name || assetId);
  }

  // Persist to disk and memory
  try {
    fs.writeFileSync(diskPath, JSON.stringify(thumbData), "utf-8");
  } catch (err) {}

  memoryThumbCache.set(assetId, thumbData);
  return { ...thumbData, fromCache: false };
}

/**
 * Returns clean SVG fallback placeholder when asset or file is missing.
 */
export function getFallbackThumbnail(label = "Asset") {
  const safeLabel = String(label).replace(/[<>&'"]/g, "");
  const fallbackSvg = `
    <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg">
      <rect width="140" height="110" rx="8" fill="#182234" stroke="#f0a500" stroke-dasharray="4" stroke-width="1.5"/>
      <text x="70" y="50" font-family="'Inter', sans-serif" font-size="22" fill="#ef4444" text-anchor="middle">⚠️</text>
      <text x="70" y="74" font-family="'Inter', sans-serif" font-size="10" font-weight="700" fill="#9ca3af" text-anchor="middle">${safeLabel}</text>
    </svg>
  `.trim();

  return {
    mimeType: "image/svg+xml",
    data: fallbackSvg,
    isFallback: true,
    width: 140,
    height: 110
  };
}

/**
 * Clears in-memory and disk thumbnail cache.
 */
export function clearThumbnailCache() {
  memoryThumbCache.clear();
  if (fs.existsSync(THUMB_CACHE_DIR)) {
    const files = fs.readdirSync(THUMB_CACHE_DIR);
    for (const file of files) {
      if (file.endsWith(".thumb.json")) {
        try { fs.unlinkSync(path.join(THUMB_CACHE_DIR, file)); } catch (e) {}
      }
    }
  }
}

