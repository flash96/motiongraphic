import {
  getAllAssets,
  getAssetById,
  filterAssets,
  addUploadedAsset,
  deleteAsset,
  checkAssetUsage,
  validateProjectAssets,
  BUILTIN_ASSETS,
  ASSET_CATEGORIES
} from "../asset-library.js";

import { SHARED_SVG_COMPONENTS, renderSvgComponent } from "../shared-svg-library.js";
import { sanitizeSvg, isValidSvgString } from "../svg-sanitizer.js";
import { createDefaultProject, addScene, addElement, validateProject } from "../project-schema.js";
import { generateMotionGraphicHTML } from "../motion-engine.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function runAssetTests() {
  console.log("\n=======================================================");
  console.log("  AI MOTION GRAPHIC STUDIO - PHASE 2B TEST SUITE");
  console.log("=======================================================\n");

  // [Test 1] Upload file PNG valid
  console.log("[Test 1] Upload file PNG valid");
  const pngAsset = addUploadedAsset({
    name: "Logo Sponsor Resmi",
    category: "Club Logo",
    fileType: "png",
    fileUrl: "/public/uploads/test_sponsor.png",
    width: 400,
    height: 120,
    fileSize: 45000,
    tags: ["sponsor", "partner"]
  });
  assert(pngAsset.id && pngAsset.id.startsWith("ast_up_"), "PNG asset has valid unique ID prefix");
  assert(pngAsset.fileType === "png", "PNG fileType correctly recorded");
  assert(pngAsset.fileUrl === "/public/uploads/test_sponsor.png", "PNG fileUrl recorded accurately");
  assert(getAssetById(pngAsset.id) !== null, "PNG asset retrievable via getAssetById");

  // [Test 2] Upload file JPG valid
  console.log("\n[Test 2] Upload file JPG valid");
  const jpgAsset = addUploadedAsset({
    name: "Foto Stadion Gelora",
    category: "Stadium",
    fileType: "jpg",
    fileUrl: "/public/uploads/test_stadium.jpg",
    width: 1920,
    height: 1080,
    fileSize: 320000,
    tags: ["stadion", "tribun"]
  });
  assert(jpgAsset.fileType === "jpg", "JPG fileType correctly recorded");
  assert(jpgAsset.category === "Stadium", "JPG category correctly assigned");
  assert(getAssetById(jpgAsset.id)?.name === "Foto Stadion Gelora", "JPG asset retrievable by ID");

  // [Test 3] Upload file SVG valid
  console.log("\n[Test 3] Upload file SVG valid");
  const rawCleanSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#003da5"/></svg>`;
  assert(isValidSvgString(rawCleanSvg) === true, "Valid SVG string recognized");
  const sanitizedClean = sanitizeSvg(rawCleanSvg);
  assert(sanitizedClean.includes("<circle"), "Clean SVG markup preserved");
  const svgAsset = addUploadedAsset({
    name: "Bintang Juara SVG",
    category: "Decorative Graphics",
    fileType: "svg",
    fileUrl: "/public/uploads/test_star.svg",
    width: 100,
    height: 100,
    fileSize: 450
  });
  assert(svgAsset.fileType === "svg", "SVG asset registered successfully");

  // [Test 4] Tolak file bukan gambar (.txt / .exe)
  console.log("\n[Test 4] Tolak file bukan gambar (.txt / .exe)");
  const allowedExts = [".png", ".jpg", ".jpeg", ".svg"];
  function validateFileExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return allowedExts.includes(ext);
  }
  assert(validateFileExtension("virus.exe") === false, "Rejected .exe file");
  assert(validateFileExtension("script.txt") === false, "Rejected .txt file");
  assert(validateFileExtension("document.pdf") === false, "Rejected .pdf file");
  assert(validateFileExtension("photo.PNG") === true, "Allowed case-insensitive .PNG file");

  // [Test 5] Tolak file gambar melebihi ukuran 5MB
  console.log("\n[Test 5] Tolak file gambar melebihi ukuran 5MB");
  const MAX_SIZE = 5 * 1024 * 1024;
  function validateFileSize(bytes) {
    return bytes <= MAX_SIZE;
  }
  assert(validateFileSize(5 * 1024 * 1024) === true, "Allowed exactly 5MB file");
  assert(validateFileSize(5.1 * 1024 * 1024) === false, "Rejected 5.1MB file");
  assert(validateFileSize(10 * 1024 * 1024) === false, "Rejected 10MB file");

  // [Test 6] Sanitasi SVG menghapus script dan event handler berbahaya
  console.log("\n[Test 6] Sanitasi SVG menghapus script dan event handler berbahaya");
  const maliciousSvg = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" onload="alert('pwned')">
      <script>alert('xss attack');</script>
      <rect width="100" height="100" fill="#f0a500" onclick="stealCookies()" onerror="bad()"/>
      <a href="javascript:alert(1)"><text x="10" y="20">Click Me</text></a>
      <iframe src="https://evil.com"></iframe>
    </svg>
  `;
  const sanitized = sanitizeSvg(maliciousSvg);
  assert(!sanitized.includes("<script"), "Sanitizer stripped <script> tag");
  assert(!sanitized.includes("alert('xss"), "Sanitizer stripped script content");
  assert(!sanitized.includes("onload="), "Sanitizer stripped onload attribute");
  assert(!sanitized.includes("onclick="), "Sanitizer stripped onclick attribute");
  assert(!sanitized.includes("onerror="), "Sanitizer stripped onerror attribute");
  assert(!sanitized.includes("javascript:"), "Sanitizer stripped javascript: pseudo-protocol");
  assert(!sanitized.includes("<iframe"), "Sanitizer stripped <iframe> tag");
  assert(sanitized.includes("<rect"), "Sanitizer preserved benign <rect> tag");

  // [Test 7] Keunikan Asset ID untuk setiap aset yang diunggah
  console.log("\n[Test 7] Keunikan Asset ID untuk setiap aset yang diunggah");
  const ids = new Set();
  for (let i = 0; i < 25; i++) {
    const a = addUploadedAsset({
      name: `Asset Unik ${i}`,
      category: "Custom Upload",
      fileUrl: `/public/uploads/file_${i}.png`
    });
    ids.add(a.id);
  }
  assert(ids.size === 25, "All 25 generated asset IDs are completely unique");

  // [Test 8] Filter galeri berdasarkan kategori
  console.log("\n[Test 8] Filter galeri berdasarkan kategori");
  const trophyAssets = filterAssets("Trophy");
  assert(trophyAssets.length >= 2, "Filtered 'Trophy' returns at least 2 trophy assets");
  assert(trophyAssets.every(a => a.category === "Trophy"), "All filtered items belong to 'Trophy'");

  const clubLogoAssets = filterAssets("Club Logo");
  assert(clubLogoAssets.some(a => a.id === "ast_persib_logo"), "Club Logo category contains Persib logo");

  const allAssets = filterAssets("All");
  assert(allAssets.length >= BUILTIN_ASSETS.length, "Category 'All' returns all catalog items");

  // [Test 9] Pencarian aset berdasarkan nama atau tag
  console.log("\n[Test 9] Pencarian aset berdasarkan nama atau tag");
  const searchRadar = filterAssets("All", "radar");
  assert(searchRadar.length >= 1, "Found duel radar via keyword 'radar'");
  assert(searchRadar[0].id === "ast_duel_radar", "Matching asset is ast_duel_radar");

  const searchPiala = filterAssets("All", "piala");
  assert(searchPiala.some(a => a.id === "ast_trophy_ladder"), "Found trophy ladder via tag 'piala'");

  const searchWilujeng = filterAssets("All", "wilujeng");
  assert(searchWilujeng.some(a => a.id === "ast_wilujeng_stamp"), "Found Wilujeng Sumping stamp via keyword");

  // [Test 10] Penggunaan aset yang sama di berbagai scene
  console.log("\n[Test 10] Penggunaan aset yang sama di berbagai scene");
  const project1 = createDefaultProject({ videoTitle: "Project Multi-Scene Asset" });
  addScene(project1, { title: "Adegan Pembuka", duration: 5 });
  addScene(project1, { title: "Adegan Penutup", duration: 5 });

  // Use the same asset in scene 1 and scene 2
  const sharedAssetId = "ast_persib_logo";
  addElement(project1, project1.scenes[0].id, {
    type: "image",
    name: "Logo Adegan 1",
    assetId: sharedAssetId,
    assetUrl: "/public/logos/brand/logo.png"
  });
  addElement(project1, project1.scenes[1].id, {
    type: "image",
    name: "Logo Adegan 2",
    assetId: sharedAssetId,
    assetUrl: "/public/logos/brand/logo.png"
  });

  const usageReport = checkAssetUsage(project1, sharedAssetId);
  assert(usageReport.inUse === true, "Shared asset reported as in-use");
  assert(usageReport.count === 2, "Asset usage count is 2 across project");
  assert(usageReport.scenes.length === 2, "Asset referenced in 2 separate scenes");

  // [Test 11] Deteksi aset yang hilang (missing asset)
  console.log("\n[Test 11] Deteksi aset yang hilang (missing asset)");
  const projectWithMissing = createDefaultProject({ videoTitle: "Project Missing Asset" });
  addElement(projectWithMissing, projectWithMissing.scenes[0].id, {
    type: "image",
    name: "Poster Hilang",
    assetId: "ast_missing_ghost_asset"
  });

  const depValidation = validateProjectAssets(projectWithMissing);
  assert(depValidation.valid === false, "Project with missing asset flagged as invalid");
  assert(depValidation.missing.length === 1, "Exactly 1 missing asset detected");
  assert(depValidation.missing[0].includes("ast_missing_ghost_asset"), "Missing report identifies missing ID");

  // [Test 12] Hapus aset yang tidak digunakan (berhasil)
  console.log("\n[Test 12] Hapus aset yang tidak digunakan (berhasil)");
  const disposableAsset = addUploadedAsset({
    name: "Aset Sekali Pakai",
    category: "Custom Upload",
    fileUrl: "/public/uploads/disposable.png"
  });
  assert(getAssetById(disposableAsset.id) !== null, "Disposable asset registered");

  const deleteResult = deleteAsset(project1, disposableAsset.id);
  assert(deleteResult.success === true, "Unused asset deleted successfully");
  assert(getAssetById(disposableAsset.id) === null, "Deleted asset no longer exists in library");

  // [Test 13] Pencegahan hapus aset yang sedang digunakan (gagal dengan peringatan)
  console.log("\n[Test 13] Pencegahan hapus aset yang sedang digunakan (gagal dengan peringatan)");
  const inUseCustomAsset = addUploadedAsset({
    name: "Foto Pemain Inti",
    category: "Custom Upload",
    fileUrl: "/public/uploads/player_in_use.png"
  });
  addElement(project1, project1.scenes[0].id, {
    type: "image",
    name: "Foto Pemain",
    assetId: inUseCustomAsset.id,
    assetUrl: inUseCustomAsset.fileUrl
  });

  const safeDeleteResult = deleteAsset(project1, inUseCustomAsset.id, false);
  assert(safeDeleteResult.success === false, "Safe delete prevented deletion of in-use asset");
  assert(safeDeleteResult.reason.includes("masih digunakan"), "Safe delete returned informative warning");
  assert(getAssetById(inUseCustomAsset.id) !== null, "In-use asset was not deleted");

  // [Test 14] Konsistensi tampilan komponen SVG antara GSAP dan Remotion
  console.log("\n[Test 14] Konsistensi tampilan komponen SVG antara GSAP dan Remotion");
  const renderedShield = renderSvgComponent("svg_persib_shield", {
    width: 200,
    height: 240,
    colors: { primary: "#003da5", accent: "#f0a500", secondary: "#ffffff" }
  });
  assert(renderedShield.includes("<svg"), "renderSvgComponent outputs valid SVG container");
  assert(renderedShield.includes('viewBox="0 0 200 240"'), "renderSvgComponent matches coordinate viewBox");
  assert(renderedShield.includes("PERSIB"), "renderSvgComponent contains PERSIB title typography");

  const renderedTrophy = renderSvgComponent("svg_trophy_ladder", { width: 300, height: 380 });
  assert(renderedTrophy.includes('viewBox="0 0 300 380"'), "Trophy component rendered with expected viewBox");
  assert(renderedTrophy.includes("linearGradient"), "Trophy component contains metallic linear gradients");

  // [Test 15] Penggantian rasio kanvas (9:16, 16:9, 1:1) dan penyesuaian posisi aset
  console.log("\n[Test 15] Penggantian rasio kanvas (9:16, 16:9, 1:1) dan penyesuaian posisi aset");
  const proj916 = createDefaultProject({ aspectRatio: "9:16", canvas: { width: 1080, height: 1920 } });
  const html916 = generateMotionGraphicHTML(proj916);
  assert(html916.includes("width: 1080px;"), "9:16 HTML has 1080px width stage");
  assert(html916.includes("height: 1920px;"), "9:16 HTML has 1920px height stage");

  const proj169 = createDefaultProject({ aspectRatio: "16:9", canvas: { width: 1920, height: 1080 } });
  const html169 = generateMotionGraphicHTML(proj169);
  assert(html169.includes("width: 1920px;"), "16:9 HTML has 1920px width stage");
  assert(html169.includes("height: 1080px;"), "16:9 HTML has 1080px height stage");

  const proj11 = createDefaultProject({ aspectRatio: "1:1", canvas: { width: 1080, height: 1080 } });
  const html11 = generateMotionGraphicHTML(proj11);
  assert(html11.includes("width: 1080px;"), "1:1 HTML has 1080px width stage");
  assert(html11.includes("height: 1080px;"), "1:1 HTML has 1080px height stage");

  // [Test 16] Ekspor project dengan aset (HTML dan MP4)
  console.log("\n[Test 16] Ekspor project dengan aset (HTML dan MP4)");
  const exportProj = createDefaultProject({ videoTitle: "Ekspor Uji Aset Studio" });
  addElement(exportProj, exportProj.scenes[0].id, {
    type: "svg",
    name: "Perisai Lambang Persib",
    assetId: "ast_persib_shield",
    props: { componentId: "svg_persib_shield" },
    position: { x: 440, y: 700 },
    size: { width: 200, height: 240 }
  });
  addElement(exportProj, exportProj.scenes[0].id, {
    type: "image",
    name: "Logo Resmi",
    assetId: "ast_persib_logo",
    assetUrl: "/public/logos/brand/logo.png",
    position: { x: 440, y: 300 },
    size: { width: 200, height: 200 }
  });

  const exportedHtml = generateMotionGraphicHTML(exportProj);
  assert(exportedHtml.includes("custom-scene-elements-stage"), "HTML export contains custom elements stage");
  assert(exportedHtml.includes("PERSIB"), "HTML export embeds rendered SVG component");
  assert(exportedHtml.includes("/public/logos/brand/logo.png"), "HTML export includes asset image reference");

  // Write out test project for Remotion still frame check
  fs.writeFileSync(path.join(__dirname, "..", "input", "unified-project.json"), JSON.stringify(exportProj, null, 2));

  let remotionRendered = false;
  try {
    execSync("npx remotion still UnifiedProject out/test-asset-render.png --frame=15", {
      stdio: "pipe",
      cwd: path.join(__dirname, "..")
    });
    remotionRendered = fs.existsSync(path.join(__dirname, "..", "out", "test-asset-render.png"));
  } catch (err) {
    console.error("Remotion still render error:", err.message);
  }
  assert(remotionRendered === true, "Remotion still frame rendered successfully with project assets");

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAssetTests();

