import { generateMotionGraphicHTML } from "./motion-engine.js";
import { validateProject, migrateLegacyTemplateToProject } from "./project-schema.js";
import { validateProjectAssets } from "./asset-library.js";

// Download the standalone, offline-ready HTML file
export function downloadHTMLFile(config) {
  const project = (config && config.version && config.canvas)
    ? validateProject(config).project
    : migrateLegacyTemplateToProject(config);

  const assetCheck = validateProjectAssets(project);
  if (!assetCheck.valid && typeof window !== "undefined") {
    const proceed = window.confirm(
      `Peringatan: Terdapat ${assetCheck.missing.length} aset yang hilang:\n- ` +
      assetCheck.missing.join("\n- ") +
      "\n\nTetap lanjutkan ekspor HTML?"
    );
    if (!proceed) return { success: false, missing: assetCheck.missing };
  }

  const htmlContent = generateMotionGraphicHTML(project);
  const safeFilename = (project.videoTitle || project.name || "motion-graphic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const w = project.canvas?.width || 1080;
  const h = project.canvas?.height || 1920;
  a.href = url;
  a.download = `${safeFilename || "motion-graphic"}-${w}x${h}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download the Unified Project JSON file directly
export function downloadProjectJSON(config) {
  const project = (config && config.version && config.canvas)
    ? validateProject(config).project
    : migrateLegacyTemplateToProject(config);

  const assetCheck = validateProjectAssets(project);
  if (!assetCheck.valid && typeof window !== "undefined") {
    const proceed = window.confirm(
      `Peringatan: Terdapat ${assetCheck.missing.length} aset yang hilang:\n- ` +
      assetCheck.missing.join("\n- ") +
      "\n\nTetap simpan file JSON proyek?"
    );
    if (!proceed) return { success: false, missing: assetCheck.missing };
  }

  const jsonContent = JSON.stringify(project, null, 2);
  const safeFilename = (project.videoTitle || project.name || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFilename || "project"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Compile the user settings into a clean, structured AI Master Prompt
export function generateStructuredPrompt(config) {
  const project = (config && config.version && config.canvas)
    ? validateProject(config).project
    : migrateLegacyTemplateToProject(config);

  const topic = project.videoTitle || project.name || "Topik Video";
  const category = project.metadata?.category || "Edukasi";
  const angle = project.metadata?.angle || "Sudut pandang cerita utama";
  const audience = project.metadata?.audience || "Masyarakat Umum";
  const goal = project.metadata?.goal || "Edukasi";
  const tone = project.metadata?.tone || "Informatif";
  const preset = project.metadata?.preset || "preset_b";
  const colors = project.theme?.colors || { primary: "#1e3a8a", secondary: "#f8fafc", text: "#0f172a", accent: "#2563eb" };
  const duration = project.totalDuration || 30;
  const metaphor = project.metadata?.metaphor || "card";
  const scenes = project.scenes || [];

  const presetNames = {
    preset_a: "A (Editorial Hangat: Kertas krem, Playfair Display Italic, aksen terracotta)",
    preset_b: "B (Bold Flat: Latar solid motif geometris, Poppins 800, kartu rounded-24px)",
    preset_c: "C (Playful Edukasi: Latar gradasi gelap partikel, Nunito 800, aksen cerah, karaoke subtitle)"
  };

  const sceneRows = scenes.map((s, idx) => {
    return `| Adegan ${idx + 1}: ${s.name || s.title || ""} | ${s.duration}s | Narasi: "${s.narration || ""}" | Teks Layar: "${s.screenText || ""}" | Visual: ${s.visualAction || ""} |`;
  }).join("\n");

  return `### BRIEF MOTION GRAPHIC VERTIKAL (9:16)
Topik: ${topic}
Kategori: ${category}
Sudut Cerita: ${angle}
Target Penonton: ${audience}
Tujuan: ${goal}
Durasi: ${duration} Detik (30 FPS, Resolusi ${project.canvas?.width || 1080}x${project.canvas?.height || 1920})
Preset Gaya: ${presetNames[preset] || preset}
Palet Warna: Utama 1 (${colors.primary}), Utama 2 (${colors.secondary}), Teks (${colors.text}), Aksen (${colors.accent})
Objek Utama (Persistent Metaphor): ${metaphor}
Gaya Bicara: ${tone}

### STRUKTUR ADEGAN & NASKAH:
${sceneRows}

### INSTRUKSI OUTPUT:
1. Buat file HTML mandiri dengan panggung ${project.canvas?.width || 1080}x${project.canvas?.height || 1920} terskala otomatis.
2. Gunakan GSAP 3 timeline deterministik dengan kendali global window.seek(detik) dan window.DURATION = ${duration}.
3. Terapkan kinetic typography per kata dan kontinuitas objek utama (${metaphor}) di setiap adegan.
4. Jaga batas aman teks (250px atas, 420px bawah) dan kontras minimal 4.5:1.`;
}

// Download the Playwright + FFmpeg batch render script (consistent ESM syntax)
export function downloadRenderPackage(config) {
  const project = (config && config.version && config.canvas)
    ? validateProject(config).project
    : migrateLegacyTemplateToProject(config);

  const assetCheck = validateProjectAssets(project);
  if (!assetCheck.valid && typeof window !== "undefined") {
    const proceed = window.confirm(
      `Peringatan: Terdapat ${assetCheck.missing.length} aset yang hilang:\n- ` +
      assetCheck.missing.join("\n- ") +
      "\n\nTetap unduh skrip render MP4?"
    );
    if (!proceed) return { success: false, missing: assetCheck.missing };
  }

  const safeFilename = (project.videoTitle || project.name || "motion-graphic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  const canvasWidth = project.canvas?.width || 1080;
  const canvasHeight = project.canvas?.height || 1920;
  const fps = project.fps || 30;

  // ESM-compatible render script
  const renderScript = `// render.js: Ekspor otomatis Frame-by-Frame ke MP4 ${canvasWidth}x${canvasHeight} (${fps}fps)
// Prasyarat:
// 1. npm i playwright
// 2. npx playwright install chromium
// 3. Pastikan ffmpeg terpasang di sistem PATH

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renderVideo() {
  const htmlFile = path.resolve(__dirname, "${safeFilename || 'video'}-${canvasWidth}x${canvasHeight}.html");
  const framesDir = path.resolve(__dirname, "frames");

  if (!fs.existsSync(htmlFile)) {
    console.error(\`[Error] File HTML tidak ditemukan: \${htmlFile}\`);
    console.error("Pastikan file HTML hasil unduhan berada di direktori yang sama dengan render.js.");
    process.exit(1);
  }

  // Verifikasi ffmpeg di PATH
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch (e) {
    console.error("[Error] FFmpeg tidak terdeteksi di PATH sistem.");
    console.error("Silakan instal FFmpeg terlebih dahulu agar dapat menggabungkan frame menjadi video MP4.");
    process.exit(1);
  }

  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  console.log("Memulai browser Chromium untuk render...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error("[Error] Gagal meluncurkan Chromium. Jalankan: npx playwright install chromium", err);
    process.exit(1);
  }

  const page = await browser.newPage({ viewport: { width: ${canvasWidth}, height: ${canvasHeight} } });

  console.log(\`Membuka file: file://\${htmlFile}\`);
  await page.goto("file://" + htmlFile, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const duration = await page.evaluate(() => window.DURATION || 30);
  const videoFps = ${fps};
  const totalFrames = Math.round(duration * videoFps);

  console.log(\`Merender \${totalFrames} frame (\${duration} detik @ \${videoFps}fps)...\`);

  for (let i = 0; i <= totalFrames; i++) {
    const time = i / videoFps;
    await page.evaluate((t) => window.seek(t), time);

    const stage = await page.$("#stage");
    if (!stage) {
      console.error("[Error] Elemen #stage tidak ditemukan pada file HTML.");
      break;
    }
    const framePath = path.join(framesDir, \`frame_\${String(i).padStart(5, "0")}.png\`);
    await stage.screenshot({ path: framePath });

    if (i % videoFps === 0 || i === totalFrames) {
      const pct = Math.round((i / totalFrames) * 100);
      console.log(\`Progres Render: \${pct}% (\${Math.round(time)}s / \${duration}s)\`);
    }
  }

  await browser.close();
  console.log("Frame screenshot selesai. Menggabungkan video dengan FFmpeg...");

  const outputFile = path.resolve(__dirname, "${safeFilename || 'video'}-output.mp4");
  const ffmpegCmd = \`ffmpeg -y -framerate \${videoFps} -i frames/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 "\${outputFile}"\`;

  try {
    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log(\`\\n🎉 Berhasil! Video tersimpan di: \${outputFile}\`);
  } catch (err) {
    console.error("[Error] Gagal menjalankan FFmpeg saat menggabungkan frame:", err);
  }
}

renderVideo().catch((err) => {
  console.error("Terjadi kesalahan fatal selama rendering:", err);
  process.exit(1);
});
`;

  const blob = new Blob([renderScript], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "render.js";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
