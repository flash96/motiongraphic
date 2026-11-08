/**
 * Central Asset Library & Catalog Manager
 * Unified management for images, vector graphics, and shared SVG components.
 */

import { SHARED_SVG_COMPONENTS, renderSvgComponent } from "./shared-svg-library.js";

export const ASSET_CATEGORIES = [
  "All",
  "Club Logo",
  "Opponent Logo",
  "Player Photo",
  "Team Photo",
  "Jersey",
  "Trophy",
  "Stadium",
  "Badge & Number",
  "Decorative Graphics",
  "Background",
  "Custom Upload"
];

// Built-in Default Asset Catalog
export const BUILTIN_ASSETS = [
  {
    id: "ast_persib_logo",
    name: "Logo Resmi Persib Bandung",
    category: "Club Logo",
    fileType: "png",
    fileUrl: "/public/logos/brand/logo.png",
    thumbnail: "/public/logos/brand/logo.png",
    width: 240,
    height: 240,
    aspectRatio: "1:1",
    fileSize: 92646,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["persib", "logo", "official", "brand", "crest"]
  },
  {
    id: "ast_persib_shield",
    name: "Perisai Vektor Persib 1933",
    category: "Club Logo",
    fileType: "svg-component",
    componentId: "svg_persib_shield",
    fileUrl: "component:svg_persib_shield",
    thumbnail: "component:svg_persib_shield",
    width: 200,
    height: 240,
    aspectRatio: "1:1.2",
    fileSize: 1200,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["perisai", "shield", "crest", "vector", "persib"]
  },
  {
    id: "ast_trophy_ladder",
    name: "Piala Juara Emas (Trophy)",
    category: "Trophy",
    fileType: "svg-component",
    componentId: "svg_trophy_ladder",
    fileUrl: "component:svg_trophy_ladder",
    thumbnail: "component:svg_trophy_ladder",
    width: 300,
    height: 380,
    aspectRatio: "1:1.26",
    fileSize: 2400,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["trophy", "piala", "juara", "emas", "champions"]
  },
  {
    id: "ast_gold_crown",
    name: "Mahkota Raja Juara (Crown)",
    category: "Trophy",
    fileType: "svg-component",
    componentId: "svg_gold_crown",
    fileUrl: "component:svg_gold_crown",
    thumbnail: "component:svg_gold_crown",
    width: 280,
    height: 200,
    aspectRatio: "1.4:1",
    fileSize: 1500,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["crown", "mahkota", "gold", "king", "juara"]
  },
  {
    id: "ast_jersey_no10",
    name: "Jersey Pangeran Biru No. 10",
    category: "Jersey",
    fileType: "svg-component",
    componentId: "svg_jersey_no10",
    fileUrl: "component:svg_jersey_no10",
    thumbnail: "component:svg_jersey_no10",
    width: 320,
    height: 360,
    aspectRatio: "1:1.12",
    fileSize: 2800,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["jersey", "baju", "nomor10", "playmaker", "seragam"]
  },
  {
    id: "ast_scoreboard_stadium",
    name: "Papan Skor Stadion Si Jalak Harupat",
    category: "Stadium",
    fileType: "svg-component",
    componentId: "svg_scoreboard_stadium",
    fileUrl: "component:svg_scoreboard_stadium",
    thumbnail: "component:svg_scoreboard_stadium",
    width: 740,
    height: 320,
    aspectRatio: "2.3:1",
    fileSize: 3200,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["scoreboard", "skor", "papan", "stadion", "fulltime"]
  },
  {
    id: "ast_duel_radar",
    name: "Radar Taktik & Duel Antar Lini",
    category: "Radar",
    fileType: "svg-component",
    componentId: "svg_duel_radar",
    fileUrl: "component:svg_duel_radar",
    thumbnail: "component:svg_duel_radar",
    width: 400,
    height: 400,
    aspectRatio: "1:1",
    fileSize: 2100,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["radar", "taktik", "headtohead", "duel", "analisis"]
  },
  {
    id: "ast_motm_badge",
    name: "Lencana Bintang MOTM",
    category: "Badge & Number",
    fileType: "svg-component",
    componentId: "svg_motm_badge",
    fileUrl: "component:svg_motm_badge",
    thumbnail: "component:svg_motm_badge",
    width: 260,
    height: 260,
    aspectRatio: "1:1",
    fileSize: 1800,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["motm", "badge", "lencana", "star", "penghargaan"]
  },
  {
    id: "ast_wilujeng_stamp",
    name: "Stempel Wilujeng Sumping",
    category: "Badge & Number",
    fileType: "svg-component",
    componentId: "svg_wilujeng_stamp",
    fileUrl: "component:svg_wilujeng_stamp",
    thumbnail: "component:svg_wilujeng_stamp",
    width: 440,
    height: 160,
    aspectRatio: "2.75:1",
    fileSize: 1600,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["wilujeng", "sumping", "transfer", "stempel", "resmi"]
  },
  {
    id: "ast_vs_badge",
    name: "Lencana Duel Panas (VS)",
    category: "Badge & Number",
    fileType: "svg-component",
    componentId: "svg_vs_badge",
    fileUrl: "component:svg_vs_badge",
    thumbnail: "component:svg_vs_badge",
    width: 220,
    height: 220,
    aspectRatio: "1:1",
    fileSize: 1400,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["vs", "versus", "duel", "bigmatch", "api"]
  },
  {
    id: "ast_speedlines",
    name: "Garis Kecepatan Diagonal",
    category: "Decorative Graphics",
    fileType: "svg-component",
    componentId: "svg_decorative_speedlines",
    fileUrl: "component:svg_decorative_speedlines",
    thumbnail: "component:svg_decorative_speedlines",
    width: 400,
    height: 200,
    aspectRatio: "2:1",
    fileSize: 900,
    createdAt: "2026-11-08T00:00:00.000Z",
    tags: ["speedlines", "motion", "garis", "kecepatan", "overlay"]
  }
];

// In-Memory Custom Asset Registry
const customAssetsRegistry = new Map();

/**
 * Returns all available assets (Built-in + Custom Uploads).
 */
export function getAllAssets() {
  const customList = Array.from(customAssetsRegistry.values());
  return [...BUILTIN_ASSETS, ...customList];
}

/**
 * Retrieves asset by its unique Asset ID.
 */
export function getAssetById(assetId) {
  if (!assetId) return null;
  return getAllAssets().find(a => a.id === assetId) || null;
}

/**
 * Filters assets by category and case-insensitive search keyword.
 */
export function filterAssets(category = "All", searchQuery = "") {
  let assets = getAllAssets();

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
 * Adds an uploaded asset into the registry.
 */
export function addUploadedAsset(assetData) {
  if (!assetData || !assetData.fileUrl) {
    throw new Error("Data asset tidak lengkap.");
  }

  const assetId = assetData.id || `ast_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const asset = {
    id: assetId,
    name: assetData.name || "Aset Kustom",
    category: assetData.category || "Custom Upload",
    fileType: assetData.fileType || "png",
    fileUrl: assetData.fileUrl,
    thumbnail: assetData.thumbnail || assetData.fileUrl,
    width: Number(assetData.width) || 300,
    height: Number(assetData.height) || 300,
    aspectRatio: assetData.aspectRatio || "1:1",
    fileSize: Number(assetData.fileSize) || 0,
    createdAt: assetData.createdAt || new Date().toISOString(),
    tags: Array.isArray(assetData.tags) ? assetData.tags : ["upload", "custom"]
  };

  customAssetsRegistry.set(assetId, asset);
  return asset;
}

/**
 * Checks whether an asset is currently referenced in any scene of the project.
 */
export function checkAssetUsage(project, assetId) {
  if (!project || !project.scenes || !assetId) {
    return { inUse: false, count: 0, scenes: [] };
  }

  const matchingScenes = [];
  let usageCount = 0;

  project.scenes.forEach(scene => {
    let usedInScene = false;
    (scene.elements || []).forEach(el => {
      if (el.assetId === assetId || el.assetUrl === assetId || el.props?.componentId === assetId) {
        usageCount++;
        usedInScene = true;
      }
    });
    if (usedInScene) {
      matchingScenes.push(scene.title || scene.name || `Adegan ${scene.order}`);
    }
  });

  return {
    inUse: usageCount > 0,
    count: usageCount,
    scenes: matchingScenes
  };
}

/**
 * Deletes an uploaded asset from registry with dependency safety check.
 */
export function deleteAsset(project, assetId, force = false) {
  if (!customAssetsRegistry.has(assetId)) {
    // Built-in assets cannot be deleted
    if (BUILTIN_ASSETS.some(a => a.id === assetId)) {
      return { success: false, reason: "Aset bawaan sistem tidak dapat dihapus." };
    }
    return { success: false, reason: "Aset tidak ditemukan." };
  }

  const usage = checkAssetUsage(project, assetId);
  if (usage.inUse && !force) {
    return {
      success: false,
      reason: `Aset masih digunakan pada ${usage.count} elemen di adegan: ${usage.scenes.join(", ")}`,
      usage
    };
  }

  customAssetsRegistry.delete(assetId);
  return { success: true };
}

/**
 * Validates all asset dependencies in a project before rendering or export.
 */
export function validateProjectAssets(project) {
  if (!project || !Array.isArray(project.scenes)) {
    return { valid: true, missing: [], warnings: [] };
  }

  const missing = [];
  const warnings = [];
  const checked = new Set();

  project.scenes.forEach(scene => {
    (scene.elements || []).forEach(el => {
      if (el.assetId && !checked.has(el.assetId)) {
        checked.add(el.assetId);
        const asset = getAssetById(el.assetId);
        if (!asset) {
          missing.push(`Asset ID "${el.assetId}" (Elemen: "${el.name || el.type}", Adegan: "${scene.name || scene.title}")`);
        }
      }
    });
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

