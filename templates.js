// Persib Bandung Motion Graphic Templates & Frameworks
// 5 Tab Kategori Konten Media Persib
import { migrateLegacyTemplateToProject } from "./project-schema.js";

export const PERSIB_TABS = {
  post_match: {
    id: "post_match",
    name: "Post-Match Recap",
    icon: "⚽",
    badge: "Hasil Laga",
    topic: "Kemenangan Dramatis Maung Bandung!",
    category: "Hasil Pertandingan",
    angle: "Persib tampil dominan dan amankan 3 poin penting di kandang",
    audience: "Bobotoh & Pecinta Sepak Bola Indonesia",
    goal: "Rayakan Kemenangan & Rekap Hasil",
    tone: "Bangga, Bersemangat & Tegas",
    preset: "preset_b",
    colors: {
      primary: "#003da5",   // Biru Persib
      secondary: "#0a0a0a", // Gelap Modern
      text: "#ffffff",      // Putih Bersih
      accent: "#f0a500"     // Emas Brand Logo
    },
    duration: 30,
    metaphor: "card",
    scenes: [
      {
        id: 1,
        title: "Peluit Akhir",
        duration: 5,
        narration: "Peluit panjang berbunyi! Maung Bandung kembali amankan poin penuh di kandang!",
        screenText: "FULL TIME 3 POIN",
        highlightWord: "3 POIN",
        dataValue: "",
        dataLabel: "",
        visualAction: "Logo Maung Bandung dan plakat kemenangan mendarat mantap di panggung."
      },
      {
        id: 2,
        title: "Papan Skor Akhir",
        duration: 6,
        narration: "Dominasi tak terbendung sejak menit awal berbuah kemenangan meyakinkan 3 gol di Si Jalak Harupat.",
        screenText: "SKOR AKHIR PERSIB MENANG",
        highlightWord: "MENANG",
        dataValue: "3 - 1",
        dataLabel: "Skor Akhir",
        visualAction: "Papan skor besar beranimasi counter dinamis dengan highlight warna emas."
      },
      {
        id: 3,
        title: "Statistik Penguasaan",
        duration: 6,
        narration: "Persib unggul mutlak dalam penguasaan bola dan menciptakan 14 peluang tembakan berbahaya.",
        screenText: "DOMINASI TOTAL 58 PERSEN",
        highlightWord: "DOMINASI",
        dataValue: "58%",
        dataLabel: "Ball Possession",
        visualAction: "Grafik metrik statistik melonjak menunjukkan supremasi lini tengah."
      },
      {
        id: 4,
        title: "Man of the Match",
        duration: 7,
        narration: "Penampilan luar biasa sang juru gedor dengan torehan brace membawa Pangeran Biru terbang tinggi.",
        screenText: "MAN OF THE MATCH",
        highlightWord: "MATCH",
        dataValue: "8.9",
        dataLabel: "Rating Penampilan",
        visualAction: "Kartu bintang pertandingan terangkat dengan lencana penghargaan emas."
      },
      {
        id: 5,
        title: "Posisi Klasemen & Penutup",
        duration: 6,
        narration: "Tambahan 3 poin menjaga Maung Bandung tetap kokoh di jalur perebutan gelar juara!",
        screenText: "PUNCAK KLASEMEN MILIK KITA",
        highlightWord: "PUNCAK",
        dataValue: "#1",
        dataLabel: "Posisi Klasemen",
        visualAction: "Tangga klasemen terkunci di urutan teratas diikuti seruan bangga Bobotoh."
      }
    ]
  },

  weekly_recap: {
    id: "weekly_recap",
    name: "Rangkuman Mingguan",
    icon: "📊",
    badge: "Tren Pekan Ini",
    topic: "Rapor Sepekan Persib Bandung",
    category: "Rangkuman Mingguan",
    angle: "Catatan performa sepekan, konsistensi taktik dan tren poin klasemen",
    audience: "Bobotoh & Pemerhati Liga 1",
    goal: "Analisis & Update Performa",
    tone: "Objektif, Taktis & Optimis",
    preset: "preset_b",
    colors: {
      primary: "#003da5",
      secondary: "#0d1117",
      text: "#f0f6fc",
      accent: "#f0a500"
    },
    duration: 30,
    metaphor: "chart",
    scenes: [
      {
        id: 1,
        title: "Pembuka Pekan Ini",
        duration: 5,
        narration: "Inilah rangkuman catatan penting perjuangan Maung Bandung sepanjang pekan ini.",
        screenText: "RAPOR MINGGUAN SEPEKAN",
        highlightWord: "RAPOR",
        dataValue: "",
        dataLabel: "",
        visualAction: "Folder laporan mingguan terbuka memunculkan rangkuman data penting."
      },
      {
        id: 2,
        title: "Rentetan Tak Terkalahkan",
        duration: 6,
        narration: "Tren positif terus terjaga dengan torehan lima kemenangan beruntun di semua ajang.",
        screenText: "LIMA LAGA TANPA KALAH",
        highlightWord: "TANPA",
        dataValue: "5 LAGA",
        dataLabel: "Unbeaten Streak",
        visualAction: "Grafik garis melesat naik membentuk kurva kemenangan yang stabil."
      },
      {
        id: 3,
        title: "Produktivitas Lini Depan",
        duration: 7,
        narration: "Lini serang menunjukkan ketajaman impresif dengan total 12 gol tercipta dari berbagai skema.",
        screenText: "DUA BELAS GOL TERCIPTA",
        highlightWord: "DUA BELAS",
        dataValue: "12 GOL",
        dataLabel: "Gol Pekan Ini",
        visualAction: "Meteran produktivitas terisi penuh mencapai zona hijau maksimal."
      },
      {
        id: 4,
        title: "Koleksi Poin Klasemen",
        duration: 6,
        narration: "Koleksi poin kini mencapai 37 poin dan terus menempel ketat rival terdekat di papan atas.",
        screenText: "TIGA PULUH TUJUH POIN",
        highlightWord: "TUJUH",
        dataValue: "37 POIN",
        dataLabel: "Total Poin",
        visualAction: "Indikator poin bertambah cepat dan mengunci peringkat papan atas."
      },
      {
        id: 5,
        title: "Fokus Laga Berikutnya",
        duration: 6,
        narration: "Pekan depan duel akbar telah menanti. Jaga kekompakan dan kawal Maung Bandung sampai tuntas!",
        screenText: "KAWAL KEBANGGAAN TERUS",
        highlightWord: "KEBANGGAAN",
        dataValue: "MATCHDAY 16",
        dataLabel: "Laga Berikutnya",
        visualAction: "Jadwal pertandingan pekan depan menyala sebagai penutup aksi."
      }
    ]
  },

  trivia_facts: {
    id: "trivia_facts",
    name: "Fakta & Trivia Unik",
    icon: "💡",
    badge: "Sejarah & Rekor",
    topic: "Tahukah Kamu? Rekor Bersejarah Persib",
    category: "Fakta & Trivia Unik",
    angle: "Membongkar catatan rekor emas legendaris yang membuktikan kebesaran klub",
    audience: "Bobotoh Lintas Generasi & Fans Bola",
    goal: "Edukasi & Menghidupkan Sejarah",
    tone: "Menarik, Edukatif & Penuh Respek",
    preset: "preset_c",
    colors: {
      primary: "#003da5",
      secondary: "#090d16",
      text: "#ffffff",
      accent: "#f0a500"
    },
    duration: 30,
    metaphor: "meter",
    scenes: [
      {
        id: 1,
        title: "Hook Misteri Rekor",
        duration: 5,
        narration: "Tahukah kamu ada satu rekor bersejarah Maung Bandung yang sulit dipecahkan hingga hari ini?",
        screenText: "TAHUKAH KAMU REKOR EMAS",
        highlightWord: "REKOR",
        dataValue: "",
        dataLabel: "",
        visualAction: "Simbol mahkota dan emblem tahun 1933 berputar masuk dengan efek partikel emas."
      },
      {
        id: 2,
        title: "Rekor Tak Terkalahkan",
        duration: 6,
        narration: "Persib pernah mencatatkan rekor spektakuler 14 laga beruntun tanpa menelan satu pun kekalahan.",
        screenText: "EMPAT BELAS LAGA KEBANGGAAN",
        highlightWord: "EMPAT BELAS",
        dataValue: "14 LAGA",
        dataLabel: "Laga Unbeaten",
        visualAction: "Perisai baja tak tertembus terpampang kokoh di tengah panggung."
      },
      {
        id: 3,
        title: "Duet Legendaris Tersubur",
        duration: 7,
        narration: "Kombinasi gol dari duet penyerang maut ini pernah menyumbangkan 35 gol dalam satu musim kompetisi.",
        screenText: "TIGA PULUH LIMA GOL",
        highlightWord: "TIGA PULUH",
        dataValue: "35 GOL",
        dataLabel: "Duet Mematikan",
        visualAction: "Dua sepatu emas menyatu membentuk angka rekor yang berkilau."
      },
      {
        id: 4,
        title: "Basis Suporter Raksasa",
        duration: 6,
        narration: "Dukungan tanpa henti Bobotoh menjadikan atmosfer kandang Persib diakui sebagai salah satu yang terpanas di Asia.",
        screenText: "JUTAAN BOBOTOH SETIA",
        highlightWord: "BOBOTOH",
        dataValue: "5.000.000+",
        dataLabel: "Suporter Setia",
        visualAction: "Gelombang lautan biru Bobotoh menyala menggetarkan layar."
      },
      {
        id: 5,
        title: "Kebanggaan Abadi",
        duration: 6,
        narration: "Sejarah emas membuktikan kebesaran nama Persib Bandung. Bagikan jika kamu bangga jadi Bobotoh!",
        screenText: "BANGGA DUKUNG PERSIB BANDUNG",
        highlightWord: "PERSIB",
        dataValue: "SINCE 1933",
        dataLabel: "Warisan Sejarah",
        visualAction: "Stempel verifikasi kehormatan terkunci mantap di penutup video."
      }
    ]
  },

  before_match: {
    id: "before_match",
    name: "Before Match (Preview)",
    icon: "⚔️",
    badge: "Jadwal & Preview",
    topic: "BIG MATCH ALERT: Menatap Duel Klasik",
    category: "Preview Pertandingan",
    angle: "Kesiapan armada Maung Bandung menghadapi laga sarat gengsi dan adu taktik",
    audience: "Bobotoh & Penonton Sepak Bola",
    goal: "Hype Pertandingan & Info Siaran",
    tone: "Tegang, Agresif & Berenergi Tinggi",
    preset: "preset_b",
    colors: {
      primary: "#003da5",
      secondary: "#080c14",
      text: "#ffffff",
      accent: "#f0a500"
    },
    duration: 30,
    metaphor: "container",
    scenes: [
      {
        id: 1,
        title: "Alarm Big Match",
        duration: 5,
        narration: "Panggung panas sepak bola tanah air siap membara! Duel penuh gengsi menanti di akhir pekan.",
        screenText: "BIG MATCH PERSIB READY",
        highlightWord: "BIG MATCH",
        dataValue: "",
        dataLabel: "",
        visualAction: "Dua kubu lambang bertabrakan memicu percikan energi persaingan panas."
      },
      {
        id: 2,
        title: "Catatan Head to Head",
        duration: 6,
        narration: "Dari lima duel terakhir, Pangeran Biru mendominasi dengan merebut tiga kemenangan krusial.",
        screenText: "HEAD TO HEAD UNGGUL",
        highlightWord: "UNGGUL",
        dataValue: "3 WINS",
        dataLabel: "5 Duel Terakhir",
        visualAction: "Timbangan head-to-head condong berat ke kubu biru Persib."
      },
      {
        id: 3,
        title: "Kondisi Kesiapan Skuad",
        duration: 7,
        narration: "Seluruh pilar inti dalam kondisi fisik seratus persen dan siap menjalankan instruksi strategi pelatih.",
        screenText: "SERATUS PERSEN SIAP TEMPUR",
        highlightWord: "SERATUS",
        dataValue: "100%",
        dataLabel: "Kesiapan Tim",
        visualAction: "Meteran kesiapan armada naik cepat hingga batas maksimal."
      },
      {
        id: 4,
        title: "Kunci Strategi Laga",
        duration: 6,
        narration: "Transisi kilat dari bertahan ke menyerang serta determinasi lini sayap akan menjadi kunci penentu.",
        screenText: "TRANSISI KILAT PENENTU KEMENANGAN",
        highlightWord: "KILAT",
        dataValue: "TRANSISI",
        dataLabel: "Kunci Taktik",
        visualAction: "Papan taktik berkedip memetakan jalur serangan tajam menuju gawang lawan."
      },
      {
        id: 5,
        title: "Jadwal Kickoff & Siaran",
        duration: 6,
        narration: "Jangan lewatkan siaran langsung kickoff Sabtu malam pukul 19.00 WIB. Birukan stadion dan layar kacamumu!",
        screenText: "KICK OFF SABTU MALAM",
        highlightWord: "KICK OFF",
        dataValue: "19:00 WIB",
        dataLabel: "Stadion Si Jalak Harupat",
        visualAction: "Jam hitung mundur berdetik tepat ke waktu kickoff dan mengunci jadwal."
      }
    ]
  },

  transfer_news: {
    id: "transfer_news",
    name: "Transfer & Berita",
    icon: "📰",
    badge: "Breaking News",
    topic: "WILUJENG SUMPING: Amunisi Baru Tiba!",
    category: "Kabar Transfer & Skuad",
    angle: "Pengumuman resmi rekrutan anyar untuk memperkokoh kedalaman armada Maung Bandung",
    audience: "Bobotoh & Pecinta Bursa Transfer",
    goal: "Pengumuman Resmi & Antusiasme",
    tone: "Eksklusif, Resmi & Cepat",
    preset: "preset_b",
    colors: {
      primary: "#003da5",
      secondary: "#070b12",
      text: "#ffffff",
      accent: "#f0a500"
    },
    duration: 25,
    metaphor: "card",
    scenes: [
      {
        id: 1,
        title: "Breaking News Sump 바",
        duration: 5,
        narration: "Resmi! Maung Bandung resmi memperkenalkan pilar baru untuk mengarungi sisa musim ini.",
        screenText: "RESMI WILUJENG SUMPING",
        highlightWord: "WILUJENG",
        dataValue: "",
        dataLabel: "",
        visualAction: "Stempel resmi 'Wilujeng Sumping' mencap panggung dengan efek kilat."
      },
      {
        id: 2,
        title: "Profil & Posisi Baru",
        duration: 5,
        narration: "Gelandang kreatif berlabel tim nasional ini siap mengenakan nomor punggung keramat di Bandung.",
        screenText: "PLAYMAKER BARU TIBA",
        highlightWord: "PLAYMAKER",
        dataValue: "NO. 10",
        dataLabel: "Posisi Pemain",
        visualAction: "Jersey nomor 10 terbentang megah dengan nama pilar anyar."
      },
      {
        id: 3,
        title: "Catatan Statistik Mentereng",
        duration: 5,
        narration: "Koleksi delapan assist dan akurasi umpan tinggi menjadi modal besar mempertajam daya gedor.",
        screenText: "DELAPAN ASSIST MUSIM LALU",
        highlightWord: "DELAPAN",
        dataValue: "8 ASSIST",
        dataLabel: "Rekor Musim Lalu",
        visualAction: "Kartu statistik pemain terisi data pencapaian yang memukau."
      },
      {
        id: 4,
        title: "Masa Kontrak Jangka Panjang",
        duration: 5,
        narration: "Manajemen langsung mengikat kontrak dua tahun penuh demi komitmen mempertahankan kejayaan klub.",
        screenText: "KONTRAK RESMI DUA TAHUN",
        highlightWord: "DUA TAHUN",
        dataValue: "2 TAHUN",
        dataLabel: "Durasi Kontrak",
        visualAction: "Tanda tangan dokumen resmi terkunci dengan segel lambang klub."
      },
      {
        id: 5,
        title: "Sambutan Hangat Bobotoh",
        duration: 5,
        narration: "Selamat datang di Bumi Pasundan! Tuliskan pesan dan doa terbaikmu untuk penggawa baru kita di kolom komentar!",
        screenText: "SELAMAT DATANG DI BANDUNG",
        highlightWord: "BANDUNG",
        dataValue: "PERSIB 1933",
        dataLabel: "Official Media",
        visualAction: "Pita sambutan selamat datang membentang diiringi riuh gembira Bobotoh."
      }
    ]
  }
};

export const DEFAULT_TAB = "post_match";
export const DEFAULT_FRAMEWORK = PERSIB_TABS[DEFAULT_TAB];
export const FRAMEWORKS = PERSIB_TABS;

export function getUnifiedProjectForTab(tabId) {
  const template = PERSIB_TABS[tabId] || PERSIB_TABS[DEFAULT_TAB];
  return migrateLegacyTemplateToProject(template);
}

export const PERSIB_PROJECTS = {
  post_match: migrateLegacyTemplateToProject(PERSIB_TABS.post_match),
  weekly_recap: migrateLegacyTemplateToProject(PERSIB_TABS.weekly_recap),
  trivia_facts: migrateLegacyTemplateToProject(PERSIB_TABS.trivia_facts),
  before_match: migrateLegacyTemplateToProject(PERSIB_TABS.before_match),
  transfer_news: migrateLegacyTemplateToProject(PERSIB_TABS.transfer_news)
};

