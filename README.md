# MotionGraphic Studio : Pembuat Video Vertikal 9:16

Aplikasi web studio untuk menyusun dan membuat motion graphic vertikal (9:16, 1080x1920, 30 FPS) berbasis kode GSAP dan SVG berkualitas After Effects tanpa perlu mengetik prompt panjang secara berulang-ulang.

## Variabel yang Dapat Diubah (Parameter Kunci)

1. **Topik & Konsep Dasar:**
   - Topik Utama (string)
   - Kategori (Program Kebijakan, Sains & Kesehatan, Edukasi Finansial, Karier & Teknologi, Sejarah, dsb.)
   - Sudut Pandang Cerita / Angle (hook utama penonton)
   - Target Penonton (Masyarakat Umum, Pelajar/Mahasiswa, Profesional, UMKM)
   - Tujuan Video (Edukasi, Ajakan Aksi/Kampanye, Promosi, Opini)
   - Nada Bicara (Tegas, Hangat, Ceria, Formal)

2. **Preset Gaya Visual & Desain:**
   - **Preset A (Editorial Hangat):** Latar krem kertas bertekstur, Playfair Display Italic, aksen warna terracotta/keemasan, nomor bab elegan.
   - **Preset B (Bold Flat):** Latar solid motif geometris, Poppins 800, kartu putih rounded-24px, count-up angka tebal.
   - **Preset C (Playful Edukasi):** Latar gelap berpartikel melayang, Nunito 800 membulat, warna cerah (kuning, mint, pink), subtitle karaoke bawah.
   - **Palet Warna:** 4 picker warna visual (Utama 1, Utama 2 / Latar, Teks Kontras, Aksen Kunci) dengan kode hex otomatis.

3. **Durasi & Objek Utama (Persistent Metaphor):**
   - Durasi: 15 detik (Shorts/Reels), 30 detik (Standar), 45 detik, 60 detik.
   - Objek Utama: Nampan Makan (MBG), Stoples Madu (Sains), Toples Koin (Finansial), Grafik Batang (Pertumbuhan). Objek ini terus berevolusi dan bergerak berkesinambungan di setiap adegan (kontinuitas objek).

4. **Editor Alur Adegan & Naskah (Scene Builder):**
   - Tambah/hapus adegan secara fleksibel.
   - Pengaturan durasi per adegan.
   - Naskah narasi lengkap.
   - Teks layar (maksimal 4 kata kunci) dengan mask reveal kinetic typography.
   - Kata aksen (highlight warna).
   - Milestone angka count-up dan label sumber data terverifikasi.

## Cara Menjalankan Aplikasi

Pilih salah satu cara berikut:

### Cara 1: Menggunakan Node Server (Tanpa dependensi tambahan)
```bash
npm start
```
Buka browser di: `http://localhost:3000`

### Cara 2: Menggunakan Vite Development Server
```bash
npm run dev
```
Buka browser di URL lokal yang ditampilkan Vite (biasanya `http://localhost:5173`).

### Cara 3: Menggunakan Laragon Apache
Cukup jalankan Laragon dan buka: `http://localhost/motiongraphic/`

---

## Fitur Ekspor

1. **Pratinjau Langsung (Live 9:16 Canvas):**
   - Skala responsif otomatis untuk layar desktop dan laptop.
   - Kontrol Play / Pause, Scrubber slider waktu presisi, tombol lompat adegan, dan pilihan kecepatan 0.5x / 1.0x / 1.5x.
   - **Mode Rekam:** Menghilangkan seluruh kontrol, menampilkan hitung mundur 3-2-1, lalu memutar layar penuh untuk memudahkan rekaman layar (Screen Record).

2. **Unduh HTML Standalone:**
   - Menghasilkan 1 file HTML mandiri 100% offline-ready yang dapat diputar kapan saja atau dipasang di web lain.
   - Dilengkapi fungsi `window.seek(detik)` dan `window.DURATION` untuk integrasi otomatis.

3. **Salin Prompt AI:**
   - Menyusun konfigurasi variabel ke dalam format prompt terstruktur siap pakai jika ingin divariasikan dengan model AI lain.

4. **Paket Render MP4:**
   - Menghasilkan script `render.js` (Playwright + FFmpeg) untuk merender video MP4 1080x1920 30 FPS frame-by-frame dengan ketajaman maksimal.

