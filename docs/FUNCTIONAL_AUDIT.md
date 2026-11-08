# FUNCTIONAL AUDIT MATRIX — AI MOTION GRAPHIC STUDIO
**Repository:** `flash96/motiongraphic`  
**Branch:** `main`  
**Audit Date:** 2026-11-08  
**Design Mode:** `ANTISLOP DURING`  
**Schema Version:** `1.0.0`

---

## 1. Klasifikasi Status Fitur

| Status | Keterangan |
|---|---|
| **WORKING** | Sudah berfungsi penuh, lulus pengujian, dan terhubung antara UI, data, dan backend. |
| **PARTIAL** | Berfungsi sebagian, namun ada bagian alur atau parameter yang belum lengkap atau belum terhubung. |
| **MOCK** | Hanya menggunakan data atau proses simulasi/dummy tanpa eksekusi engine/layanan sebenarnya. |
| **BROKEN** | Tidak bekerja, menghasilkan error, atau menyebabkan data tidak konsisten. |
| **UNVERIFIED** | Memerlukan kondisi/kredensial eksternal tertentu (mis. API key live berbayar) untuk diuji secara riil. |

---

## 2. Matriks Audit Fungsional

### A. Kontrol UI, Header, & Navigasi Utama

| No | Nama Fitur | Lokasi UI | File & Fungsi Terkait | Endpoint Backend | Status | Kondisi Aktual & Rekomendasi |
|---|---|---|---|---|---|---|
| 1 | Rasio Aspek Kanvas | Header (`#selAspectRatioHeader`) | `app.js` (`updateAspectRatio`) | - | **WORKING** | Berhasil mengubah rasio 9:16, 16:9, dan 1:1, menyesuaikan dimensi stage dan recalculate bounds. |
| 2 | AI Director Button & Modal | Header (`#btnOpenAiModal`) | `app.js`, `ai-director.js` | `POST /api/ai/generate` | **PARTIAL** | Modal dan storyboard preview berfungsi. Jika Gemini gagal/tidak ada key, fallback otomatis bekerja tapi sumbernya belum transparan kepada user. Perlu badge status sumber (Gemini vs Heuristic). |
| 3 | AI Revisi Button & Modal | Header (`#btnOpenAiRevisionModal`) | `app.js`, `ai-director.js` | `POST /api/ai/revise` | **PARTIAL** | Modal dan revisi bekerja, namun backend masih 100% menggunakan heuristic keyword regex. Perlu dihubungkan ke Gemini API yang sebenarnya dengan skema Unified Project JSON. |
| 4 | Galeri Aset Modal | Header (`#btnOpenAssetModal`) | `app.js`, `asset-library.js` | `GET /api/assets`, `GET /api/audio` | **WORKING** | Modal aset visual dan audio berfungsi, filter kategori, pencarian, dan pratinjau thumbnail SVG/gambar berfungsi. |
| 5 | Undo / Redo | Header (`#btnUndo`, `#btnRedo`) | `app.js` (`history`) | - | **WORKING** | Riwayat state project JSON tersimpan dan dipulihkan dengan akurat termasuk keyboard shortcut Ctrl+Z / Ctrl+Y. |
| 6 | Format Cepat Persib | Header (5 tombol template) | `app.js` (`loadTemplate`) | - | **WORKING** | Memuat 5 format (Laga, Pekan, Trivia, Duel, Berita) secara instan ke dalam Unified Project JSON. |
| 7 | Buka JSON (Import) | Header (`#btnOpenJson`) | `app.js` (`handleImportProject`) | - | **WORKING** | Membaca file JSON, memvalidasi skema dengan `validateProject`, dan merender ulang seluruh komponen editor. |
| 8 | Unduh JSON (Export) | Header (`#btnDownloadJson`) | `app.js`, `export-helper.js` | - | **WORKING** | Menghasilkan file JSON Unified Project yang valid dan terformat rapi. |
| 9 | Unduh Standalone HTML | Header (`#btnDownloadHtml`) | `app.js`, `export-helper.js`, `motion-engine.js` | - | **WORKING** | Mengompilasi project menjadi file HTML mandiri dengan GSAP embed siap diputar tanpa server. |
| 10 | Render MP4 Video | Header (`#btnDownloadRenderPkg`) | `app.js`, `export-helper.js` | - | **PARTIAL** | Tombol bertuliskan "Render MP4" tetapi mengunduh script Playwright capture, bukan merender project aktif menggunakan Remotion CLI/API. Perlu integrasi render Remotion project aktif. |
| 11 | Prompt Modal | Header (`#btnExportPrompt`) | `app.js` | - | **WORKING** | Menghasilkan teks prompt terstruktur sesuai spesifikasi proyek untuk dokumentasi. |
| 12 | Tema Gelap / Terang | Header (`#btnThemeToggle`) | `app.js` | - | **WORKING** | Mengganti atribut data-theme, menyimpan ke localStorage, kontras memenuhi panduan DESIGN.md. |

---

### B. Scene Management & Left Panel

| No | Nama Fitur | Lokasi UI | File & Fungsi Terkait | Endpoint Backend | Status | Kondisi Aktual & Rekomendasi |
|---|---|---|---|---|---|---|
| 13 | Tab Adegan, Layer, Konsep | Left Panel (`.panel-tab-nav`) | `app.js` | - | **WORKING** | Perpindahan tab halus, badge jumlah adegan dan layer terupdate otomatis. |
| 14 | Tambah Adegan | Left Panel (`#btnAddScene`) | `app.js` (`addScene`) | - | **WORKING** | Menambah adegan baru dengan ID unik, urutan berurutan, durasi default 5 detik, dan sinkron ke timeline. |
| 15 | Hapus Adegan | Kartu Adegan (`.btn-delete-scene`) | `app.js` (`deleteScene`) | - | **WORKING** | Menghapus adegan, mencegah hapus adegan terakhir, memperbarui total durasi dan timing adegan berikutnya. |
| 16 | Duplikasi Adegan | Kartu Adegan (`.btn-duplicate-scene`) | `app.js` (`duplicateScene`) | - | **WORKING** | Menduplikasi seluruh elemen visual dan konfigurasi ke adegan baru dengan ID baru. |
| 17 | Ubah Urutan Adegan | Kartu Adegan (tombol ▲/▼) | `app.js` (`reorderScene`) | - | **WORKING** | Mengubah urutan adegan, menghitung ulang `startFrame` dan `order`, merender ulang stage dan timeline. |
| 18 | Tree Layer & Elemen | Left Panel Tab 2 (`#layerTreeList`) | `app.js` (`renderLayerTree`) | - | **WORKING** | Menampilkan daftar layer adegan aktif, badge tipe layer, status lock dan visibility. |
| 19 | Tambah Elemen Layer | Left Panel Tab 2 (`#btnAddElement`) | `app.js` (`addElement`) | - | **WORKING** | Menambah elemen (text, shape, logo, image, svg, component) ke adegan aktif. |
| 20 | Form Konsep Proyek | Left Panel Tab 3 (`#tabContentConcept`) | `app.js` | - | **WORKING** | Mengubah topik, kategori, tujuan, audiens, nada, palet warna, dan durasi total proyek. |

---

### C. Canvas Viewport, Stage, & Timeline

| No | Nama Fitur | Lokasi UI | File & Fungsi Terkait | Endpoint Backend | Status | Kondisi Aktual & Rekomendasi |
|---|---|---|---|---|---|---|
| 21 | GSAP Preview Stage | Center Stage (`#stageIframe`) | `motion-engine.js` | - | **WORKING** | Stage iframe 1080x1920/1920x1080/1080x1080 merender animasi GSAP secara mulus pada 30 FPS. |
| 22 | Interactive Canvas Overlay | Center Stage (`#canvasOverlay`) | `app.js` (`setupCanvasOverlay`) | - | **WORKING** | Kotak seleksi elemen dengan 8 handle resize dan drag-and-drop posisi (X, Y, Width, Height) bekerja. |
| 23 | Transport Controls | Center Stage (`#playerControlsBar`) | `app.js` | - | **WORKING** | Play/Pause, Restart, Time Scrubber, Playback Speed (0.5x, 1.0x, 1.5x) mengirim pesan sinkron ke stage iframe. |
| 24 | Record Mode | Center Stage (`#btnParentRecordMode`) | `app.js` | - | **WORKING** | Masuk ke mode rekam layar bersih fullscreen dengan hitung mundur 3 detik. |
| 25 | Timeline Multi-Track | Bottom (`.studio-timeline-workspace`) | `app.js` (`renderTimeline`) | - | **WORKING** | Menampilkan track ruler, adegan, elemen, dan audio dengan playhead interaktif dan zoom slider. |
| 26 | Collapse / Expand Timeline | Bottom (`#btnToggleTimeline`) | `app.js`, `styles.css` | - | **WORKING** | Menciutkan timeline menjadi toolbar ramping 38px dan membentangkannya kembali. |

---

### D. Properties Inspector & Aset Visual / Audio

| No | Nama Fitur | Lokasi UI | File & Fungsi Terkait | Endpoint Backend | Status | Kondisi Aktual & Rekomendasi |
|---|---|---|---|---|---|---|
| 27 | Element Property Inspector | Right Panel (`#elementInspector`) | `app.js` | - | **WORKING** | Mengubah properti geometris (X, Y, W, H, Rotation, Scale, Opacity, Z-Index) dan styling teks/shape secara langsung. |
| 28 | Scene Property Inspector | Right Panel (`#sceneInspector`) | `app.js` | - | **WORKING** | Mengubah nama adegan, durasi, transisi masuk (none, slash, fade, slide), dan naskah narasi. |
| 29 | Background Music (BGM) | Right Panel (`#chkAudioEnabled`) | `app.js`, `audio-library.js` | - | **WORKING** | Memilih preset musik Persib atau URL kustom, mengatur volume dan mute audio latar. |
| 30 | Upload Aset Visual & Sanitasi | Asset Modal Dropzone | `server.js`, `svg-sanitizer.js` | `POST /api/upload` | **WORKING** | Upload file PNG, JPG, dan SVG. Sanitasi script jahat pada SVG berfungsi ketat, metadata manifest tersimpan. |
| 31 | Upload Berkas Audio | Asset Modal Dropzone Audio | `server.js`, `audio-library.js` | `POST /api/upload-audio` | **WORKING** | Upload berkas MP3/WAV hingga 10MB, terdaftar di library audio dengan ID unik. |
| 32 | Hapus Aset Kustom Aman | Asset Modal (`.btn-delete-asset`) | `server.js`, `asset-library.js` | `POST /api/assets/delete` | **WORKING** | Menghapus aset kustom dari disk dan manifest. Melindungi aset bawaan dan aset yang sedang digunakan proyek. |

---

### E. AI Voiceover, Custom Voice, & Captions

| No | Nama Fitur | Lokasi UI | File & Fungsi Terkait | Endpoint Backend | Status | Kondisi Aktual & Rekomendasi |
|---|---|---|---|---|---|---|
| 33 | Voiceover Synthesize | Scene Inspector (`#btnGenerateVoAudio`) | `tts-manager.js`, `server.js` | `POST /api/tts/synthesize` | **WORKING** | Mengubah teks narasi menjadi berkas audio di disk, mendaftarkan aset audio, dan menghubungkan ke adegan. |
| 34 | Pratinjau Suara TTS | Scene Inspector (`#btnPreviewVoSpeech`) | `tts-manager.js`, `server.js` | `POST /api/tts/preview` | **WORKING** | Memutar contoh suara tanpa mengubah proyek adegan. |
| 35 | Voice Cloning & Custom Voice | Scene Inspector (`#btnOpenCloneModal`) | `tts-providers/elevenlabs-provider.js` | `POST /api/tts/custom-voice`, `DELETE /api/tts/custom-voice/:id` | **WORKING** | Membuat custom voice dengan verifikasi izin pemilik suara eksplisit, ephemeral audio sample handling, dan pembatalan caption timing lama. |
| 36 | Auto-Caption Generation Backend | Backend Engine | `caption-aligner.js`, `server.js` | `POST /api/captions/generate` | **PARTIAL** | Backend dapat menghitung timing kata dan segmentasi. Namun belum memiliki forced alignment nyata dari durasi audio presisi jika provider tidak mengirim timestamps. |
| 37 | Caption Editor UI | Scene Inspector | Belum ada di UI | - | **BROKEN / MISSING** | Belum ada kontrol di Scene Inspector untuk generate caption, edit teks cue, sesuaikan start/end, ganti style karaoke, atau aktif/nonaktifkan subtitle. |
| 38 | GSAP Karaoke Caption Render | Stage Iframe | `motion-engine.js` (`syncCaptions`) | - | **WORKING** | GSAP preview merender highlight kata demi kata sesuai timeline playback. |
| 39 | Remotion Karaoke Caption Render | Video Video Output | `UnifiedProjectComposition.tsx` | - | **BROKEN / MISSING** | `UnifiedProjectComposition.tsx` belum memiliki komponen rendering caption/subtitle karaoke sama sekali. |

---

### F. Remotion Rendering & Ekspor

| No | Nama Fitur | Lokasi UI | File & Fungsi Terkait | Endpoint Backend | Status | Kondisi Aktual & Rekomendasi |
|---|---|---|---|---|---|---|
| 40 | Remotion Active Project Render | Terminal / Script | `src/Root.tsx`, `package.json` | - | **PARTIAL** | `Root.tsx` membaca `input/unified-project.json` sebagai default props, belum ada jembatan sinkronisasi otomatis dari `appProject` aktif di browser ke Remotion. |
| 41 | Konsistensi Properti Visual Remotion | Video Frame Render | `UnifiedProjectComposition.tsx` | - | **PARTIAL** | Rotation, scale, opacity elemen, dan transisi non-slash belum diimplementasikan sepenuhnya pada Remotion. |
| 42 | Remotion Audio Mixing | Video Frame Render | `UnifiedProjectComposition.tsx` | - | **WORKING** | Voiceover per adegan dan background music ter-sequence secara tepat menggunakan tag `<Audio>` Remotion. |
| 43 | Build Command (`npm run build`) | `package.json` | `package.json` | - | **PARTIAL** | `npm run build` masih menjalankan `PostMatchRecap` legacy bukan UnifiedProject. Perlu penambahan script render UnifiedProject. |

---

### G. Security & Reliability (Prioritas P0)

| No | Kerentanan / Masalah | File Terkait | Tingkat Risiko | Status | Rekomendasi Perbaikan |
|---|---|---|---|---|---|
| 44 | Path Traversal pada Static Serving | `server.js` (`safePath.startsWith(__dirname)`) | P0 (High) | **BROKEN** | Ganti dengan `path.relative(__dirname, safePath)` containment check untuk mencegah traversal path. |
| 45 | Arbitrary File Read pada Caption Endpoint | `server.js` (`/api/captions/generate`) | P0 (High) | **BROKEN** | Batasi `audioUrl` hanya pada direktori publik yang diizinkan (`/public/audio/`, `/public/uploads/audio/`). |
| 46 | Tracking `node_modules` di Git | Git repository index | P0 (Hygiene) | **BROKEN** | 6.875 berkas `node_modules` masih terlacak di index git. Perlu di-untrack via `git rm -r --cached node_modules`. |
| 47 | Script `npm run dev` Tidak Ditemukan | `README.md`, `package.json` | P1 | **BROKEN** | Tambahkan script `"dev": "npm run bundle && node server.js"` di `package.json`. |

---

## 3. Rekapitulasi Status Audit

- **Total Fitur & Komponen Diperiksa:** 47
- **WORKING:** 32 (68.1%)
- **PARTIAL:** 8 (17.0%)
- **MOCK:** 0 (0%)
- **BROKEN / MISSING:** 7 (14.9%)
- **UNVERIFIED:** 0 (0%)

