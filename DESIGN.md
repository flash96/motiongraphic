# DESIGN.md: MotionGraphic Studio System

## Identity & Purpose
MotionGraphic Studio adalah aplikasi web untuk menyusun dan membuat motion graphic vertikal (9:16) standar studio explainer berbasis GSAP dan SVG, tanpa perlu menulis prompt manual yang panjang. Pengguna mengatur variabel kunci (topik, gaya, palet, durasi, alur adegan, dan audio), lalu mengklik satu tombol untuk mengompilasi dan memutar motion graphic secara instan.

## Tiga Dial (Liveliness Settings)
- **ENERGY: 2 (Balanced)**: Tampilan studio kerja yang profesional, rapi, dan terstruktur. Fokus utama adalah kemudahan pengaturan variabel dan keterbacaan panggung preview 9:16.
- **RHYTHM: 2 (Structured Studio)**: Layout 2 kolom pada desktop (panel inspektor konfigurasi di sisi kiri, live stage 9:16 dan kontrol playback di sisi kanan), berubah menjadi alur tumpuk vertikal yang ergonomis pada perangkat mobile.
- **MOTION: 2 (Functional & Cinematic)**: UI aplikasi menggunakan transisi cepat dan responsif (150-200ms ease-out). Stage preview motion graphic menggunakan GSAP timeline 30fps dengan kinetic typography, secondary motion, dan easing studio.

## Palet Warna & Tema (Dukungan Dual-Mode: Dark & Light)
Sesuai aturan R-21 dan R-34, aplikasi menyediakan tema Dark (default studio) dan Light dengan kontras WCAG AA (minimal 4.5:1 untuk teks biasa, 3:1 untuk elemen interaktif):

### Dark Mode (Studio Default)
- Base Background: `#0e1117`
- Panel Surface: `#161b22`
- Elevated Card / Inputs: `#1f242d`
- Border: `#30363d` (kontras 3.2:1 terhadap background)
- Text Primary: `#f0f6fc` (kontras > 14:1)
- Text Secondary: `#9ca3af` (kontras 5.2:1)
- Accent Focus: `#2563eb` (Blue 600) / Hover `#1d4ed8`

### Light Mode
- Base Background: `#f8fafc`
- Panel Surface: `#ffffff`
- Elevated Card / Inputs: `#f1f5f9`
- Border: `#cbd5e1` (kontras 3.4:1)
- Text Primary: `#0f172a` (kontras > 15:1)
- Text Secondary: `#475569` (kontras 5.5:1)
- Accent Focus: `#1d4ed8` (Blue 700)

## Tipografi
- Font Keluarga UI: `Inter`, system-ui, -apple-system, sans-serif.
- Skala Ukuran:
  - Header App: 18px (semi-bold 600)
  - Section Title: 14px (semi-bold 600, letter-spacing normal)
  - Label Input: 13px (medium 500)
  - Body / Input Text: 13px - 14px (regular 400)
  - Helper & Badge: 11px - 12px (medium 500)

## Variabel Motion Graphic yang Diakomodasi
1. **Konsep & Topik**: Judul topik, kategori (edukasi, program/kebijakan, data/statistik, bisnis, dsb.), tujuan, target audiens, dan nada bicara.
2. **Preset Gaya Visual**:
   - Preset A (Editorial Hangat): Latar krem kertas bertekstur, Playfair Display Italic + Karla/Inter, aksen terracotta/amber.
   - Preset B (Bold Flat): Latar solid dengan motif bentuk geometris, Poppins tebal, transisi wipe, kartu putih rounded.
   - Preset C (Playful Edukasi): Latar gradasi gelap berbintik, Nunito membulat, aksen cerah (kuning, mint, pink), chip mapel, subtitle karaoke.
   - Kustom: Palet 4 hex (utama 1, utama 2, teks, aksen).
3. **Durasi & Timing**: 15 detik, 30 detik, 45 detik, 60 detik (30 FPS).
4. **Objek Utama (Persistent Metaphor)**: Wadah terisi, toples koin, grafik batang bertumbuh, nampan makanan, roket kecepatan, dsb.
5. **Editor Adegan (Scene Builder)**:
   - Adegan 1 (Hook): Pertanyaan/pernyataan pemikat, teks layar maks 4 kata.
   - Adegan 2 (Data / Masalah): Angka count-up, label sumber data, teks layar.
   - Adegan 3 (Inti Solusi / Penjelasan): Poin pembahasan, visualisasi kartu.
   - Adegan 4 (Dampak / Sebelum-Sesudah): Perubahan bentuk objek utama.
   - Adegan 5 (CTA & Sumber): Call to action penutup, teks sumber/footer (>=32px).
6. **Audio & Subtitle**: Tanpa suara (hanya visual), audio upload lokal, atau Web Speech API TTS preview.
7. **Kontrol Player & Ekspor**:
   - Live Player 9:16 (1080x1920 terskala otomatis).
   - Play/Pause, scrubber waktu, indikator scene/cues, lompat scene, speed 0.5x/1x.
   - Mode Rekam: Fullscreen bersih dengan hitung mundur 3 detik untuk screen recording.
   - Download Standalone HTML (`index.html`) siap render dengan GSAP mandiri.
   - Export Prompt Ringkas & Konfigurasi JSON.

## Kepatuhan Aturan Anti-Slop
- Tanpa karakter em dash di teks UI (menggunakan tanda hubung, titik dua, koma, atau tanda kurung).
- Tanpa ornamen palsu, tanpa status dot yang berkedip tanpa arti.
- Semua tombol dan kontrol interaktif memiliki fungsi nyata dan responsif terhadap keyboard (Enter, Spasi, Tab, Escape).
- Target sentuh minimal 44px untuk kenyamanan perangkat mobile.

