import { generateMotionGraphicHTML } from "./motion-engine.js";

// Download the standalone, offline-ready 1080x1920 HTML file
export function downloadHTMLFile(config) {
  const htmlContent = generateMotionGraphicHTML(config);
  const safeFilename = (config.topic || "motion-graphic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFilename || "motion-graphic"}-1080x1920.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Compile the user settings into a clean, structured AI Master Prompt
export function generateStructuredPrompt(config) {
  const {
    topic = "Topik Video",
    category = "Edukasi",
    angle = "Sudut pandang cerita utama",
    audience = "Masyarakat Umum",
    goal = "Edukasi",
    tone = "Informatif",
    preset = "preset_b",
    colors = { primary: "#1e3a8a", secondary: "#f8fafc", text: "#0f172a", accent: "#2563eb" },
    duration = 30,
    metaphor = "card",
    scenes = []
  } = config;

  const presetNames = {
    preset_a: "A (Editorial Hangat: Kertas krem, Playfair Display Italic, aksen terracotta)",
    preset_b: "B (Bold Flat: Latar solid motif geometris, Poppins 800, kartu rounded-24px)",
    preset_c: "C (Playful Edukasi: Latar gradasi gelap partikel, Nunito 800, aksen cerah, karaoke subtitle)"
  };

  const sceneRows = scenes.map((s, idx) => {
    return `| Adegan ${idx + 1}: ${s.title || ""} | ${s.duration}s | Narasi: "${s.narration}" | Teks Layar: "${s.screenText}" | Visual: ${s.visualAction} |`;
  }).join("\n");

  return `### BRIEF MOTION GRAPHIC VERTIKAL (9:16)
Topik: ${topic}
Kategori: ${category}
Sudut Cerita: ${angle}
Target Penonton: ${audience}
Tujuan: ${goal}
Durasi: ${duration} Detik (30 FPS, Resolusi 1080x1920)
Preset Gaya: ${presetNames[preset] || preset}
Palet Warna: Utama 1 (${colors.primary}), Utama 2 (${colors.secondary}), Teks (${colors.text}), Aksen (${colors.accent})
Objek Utama (Persistent Metaphor): ${metaphor}
Gaya Bicara: ${tone}

### STRUKTUR ADEGAN & NASKAH:
${sceneRows}

### INSTRUKSI OUTPUT:
1. Buat file HTML mandiri dengan panggung 1080x1920 terskala otomatis.
2. Gunakan GSAP 3 timeline deterministik dengan kendali global window.seek(detik) dan window.DURATION = ${duration}.
3. Terapkan kinetic typography per kata dan kontinuitas objek utama (${metaphor}) di setiap adegan.
4. Jaga batas aman teks (250px atas, 420px bawah) dan kontras minimal 4.5:1.`;
}

// Download the Playwright + FFmpeg batch render script
export function downloadRenderPackage(config) {
  const safeFilename = (config.topic || "motion-graphic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  const renderScript = `// render.js: Ekspor otomatis Frame-by-Frame ke MP4 1080x1920 (30fps)
// Prasyarat: npm i playwright && npx playwright install chromium
// Pastikan ffmpeg terpasang di sistem PATH

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function renderVideo() {
  const htmlFile = path.resolve(__dirname, "${safeFilename || 'video'}-1080x1920.html");
  const framesDir = path.resolve(__dirname, "frames");
  
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

  console.log("Memulai browser untuk render...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  
  await page.goto("file://" + htmlFile, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const duration = await page.evaluate(() => window.DURATION || 30);
  const fps = 30;
  const totalFrames = Math.round(duration * fps);

  console.log(\`Merender \${totalFrames} frame (\${duration} detik @ 30fps)...\`);

  for (let i = 0; i <= totalFrames; i++) {
    const time = i / fps;
    await page.evaluate((t) => window.seek(t), time);
    
    // Screenshot panggung #stage
    const stage = await page.$("#stage");
    const framePath = path.join(framesDir, \`frame_\${String(i).padStart(5, "0")}.png\`);
    await stage.screenshot({ path: framePath });

    if (i % 30 === 0) {
      console.log(\`Progres: \${Math.round((i / totalFrames) * 100)}% (\${Math.round(time)}s / \${duration}s)\`);
    }
  }

  await browser.close();
  console.log("Frame screenshot selesai. Menggabungkan video dengan FFmpeg...");

  const outputFile = path.resolve(__dirname, "output-1080x1920.mp4");
  const ffmpegCmd = \`ffmpeg -y -framerate \${fps} -i frames/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 "\${outputFile}"\`;

  try {
    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log(\`Berhasil! Video tersimpan di: \${outputFile}\`);
  } catch (err) {
    console.error("Gagal menjalankan FFmpeg. Pastikan FFmpeg terpasang.", err);
  }
}

renderVideo();
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

