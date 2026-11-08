/**
 * Shared SVG Component Library
 * Modular vector graphics for GSAP preview, visual editor, and Remotion video renderer.
 */

export const SHARED_SVG_COMPONENTS = {
  svg_persib_shield: {
    componentId: "svg_persib_shield",
    name: "Perisai Lambang Persib",
    category: "Club Logo",
    defaultProps: {
      width: 200,
      height: 240,
      colors: { primary: "#003da5", accent: "#f0a500", secondary: "#ffffff" }
    },
    render: (props = {}) => {
      const p = props.colors?.primary || "#003da5";
      const a = props.colors?.accent || "#f0a500";
      const s = props.colors?.secondary || "#ffffff";
      const w = props.width || 200;
      const h = props.height || 240;
      return `<svg viewBox="0 0 200 240" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${p}"/>
            <stop offset="100%" stop-color="#001844"/>
          </linearGradient>
        </defs>
        <polygon points="100,10 190,45 190,165 100,230 10,165 10,45" fill="url(#shieldGrad)" stroke="${s}" stroke-width="6"/>
        <polygon points="100,28 172,55 172,152 100,208 28,152 28,55" fill="none" stroke="${a}" stroke-width="4"/>
        <path d="M60,65 L140,65 L120,115 L80,115 Z" fill="${a}" opacity="0.9"/>
        <text x="100" y="150" font-family="'Bebas Neue', sans-serif" font-size="52" font-weight="900" fill="${s}" text-anchor="middle">PERSIB</text>
        <text x="100" y="180" font-family="'Inter', sans-serif" font-size="16" font-weight="800" fill="${a}" text-anchor="middle" letter-spacing="3">1933</text>
      </svg>`;
    }
  },

  svg_trophy_ladder: {
    componentId: "svg_trophy_ladder",
    name: "Piala Juara Emas (Trophy)",
    category: "Trophy",
    defaultProps: {
      width: 300,
      height: 380,
      colors: { primary: "#003da5", accent: "#f0a500", secondary: "#0a0a0a" }
    },
    render: (props = {}) => {
      const a = props.colors?.accent || "#f0a500";
      const p = props.colors?.primary || "#003da5";
      const w = props.width || 300;
      const h = props.height || 380;
      return `<svg viewBox="0 0 300 380" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldCupGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffe066"/>
            <stop offset="60%" stop-color="${a}"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <!-- Handles -->
        <path d="M50,80 C20,90 20,160 70,180" fill="none" stroke="${a}" stroke-width="12" stroke-linecap="round"/>
        <path d="M250,80 C280,90 280,160 230,180" fill="none" stroke="${a}" stroke-width="12" stroke-linecap="round"/>
        <!-- Main Cup Body -->
        <path d="M70,50 L230,50 L210,180 C190,230 110,230 90,180 Z" fill="url(#goldCupGrad)" stroke="#ffd700" stroke-width="4"/>
        <!-- Cup Rim & Crest -->
        <ellipse cx="150" cy="50" rx="80" ry="16" fill="#ffd700"/>
        <circle cx="150" cy="120" r="28" fill="${p}" stroke="#ffffff" stroke-width="3"/>
        <text x="150" y="130" font-family="'Bebas Neue', sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">★</text>
        <!-- Stem & Base -->
        <path d="M135,225 L165,225 L175,290 L125,290 Z" fill="url(#goldCupGrad)"/>
        <rect x="90" y="290" width="120" height="25" rx="6" fill="#ffd700"/>
        <rect x="70" y="315" width="160" height="45" rx="8" fill="#1e293b" stroke="${a}" stroke-width="3"/>
        <text x="150" y="345" font-family="'Bebas Neue', sans-serif" font-size="22" font-weight="900" fill="${a}" text-anchor="middle" letter-spacing="2">CHAMPIONS 2026</text>
      </svg>`;
    }
  },

  svg_jersey_no10: {
    componentId: "svg_jersey_no10",
    name: "Jersey Pangeran Biru No. 10",
    category: "Jersey",
    defaultProps: {
      width: 320,
      height: 360,
      colors: { primary: "#003da5", accent: "#f0a500", text: "#ffffff" }
    },
    render: (props = {}) => {
      const p = props.colors?.primary || "#003da5";
      const a = props.colors?.accent || "#f0a500";
      const t = props.colors?.text || "#ffffff";
      const w = props.width || 320;
      const h = props.height || 360;
      return `<svg viewBox="0 0 320 360" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="jerseyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${p}"/>
            <stop offset="100%" stop-color="#001a4d"/>
          </linearGradient>
        </defs>
        <!-- Jersey Body & Sleeves -->
        <path d="M90,30 L130,45 C150,48 170,48 190,45 L230,30 L310,95 L270,145 L240,125 L240,340 L80,340 L80,125 L50,145 L10,95 Z" fill="url(#jerseyGrad)" stroke="${a}" stroke-width="4"/>
        <!-- Collar -->
        <path d="M125,43 C140,65 180,65 195,43 Z" fill="${a}"/>
        <!-- Shoulder Stripes -->
        <line x1="85" y1="35" x2="30" y2="100" stroke="${a}" stroke-width="5"/>
        <line x1="235" y1="35" x2="290" y2="100" stroke="${a}" stroke-width="5"/>
        <!-- Club Emblem on Chest -->
        <polygon points="110,90 125,97 125,115 110,125 95,115 95,97" fill="${a}"/>
        <!-- Big Number 10 -->
        <text id="tnJerseyNumber" x="160" y="240" font-family="'Bebas Neue', sans-serif" font-size="120" font-weight="900" fill="${t}" text-anchor="middle" letter-spacing="4">10</text>
        <text x="160" y="275" font-family="'Inter', sans-serif" font-size="20" font-weight="800" fill="${a}" text-anchor="middle" letter-spacing="5">MAUNG BANDUNG</text>
      </svg>`;
    }
  },

  svg_scoreboard_stadium: {
    componentId: "svg_scoreboard_stadium",
    name: "Papan Skor Stadion (Scoreboard)",
    category: "Stadium",
    defaultProps: {
      width: 740,
      height: 320,
      colors: { primary: "#003da5", accent: "#f0a500", text: "#ffffff" }
    },
    render: (props = {}) => {
      const p = props.colors?.primary || "#003da5";
      const a = props.colors?.accent || "#f0a500";
      const t = props.colors?.text || "#ffffff";
      const w = props.width || 740;
      const h = props.height || 320;
      return `<svg viewBox="0 0 740 320" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="720" height="300" rx="24" fill="#0c121e" stroke="${a}" stroke-width="4"/>
        <!-- Header Pill -->
        <rect x="280" y="0" width="180" height="38" rx="19" fill="${a}"/>
        <text x="370" y="26" font-family="'Bebas Neue', sans-serif" font-size="22" font-weight="900" fill="#0a0a0a" text-anchor="middle">FULL TIME</text>
        <!-- Home Team -->
        <g transform="translate(110, 60)">
          <polygon points="40,0 80,16 80,72 40,104 0,72 0,16" fill="${p}" stroke="${a}" stroke-width="3"/>
          <text x="40" y="60" font-family="'Bebas Neue', sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">P</text>
          <text x="40" y="140" font-family="'Bebas Neue', sans-serif" font-size="30" font-weight="900" fill="${t}" text-anchor="middle">PERSIB</text>
        </g>
        <!-- Center Scores -->
        <text x="310" y="170" font-family="'Bebas Neue', sans-serif" font-size="110" font-weight="900" fill="${t}" text-anchor="middle">3</text>
        <text x="370" y="155" font-family="'Bebas Neue', sans-serif" font-size="60" font-weight="900" fill="${a}" text-anchor="middle">—</text>
        <text x="430" y="170" font-family="'Bebas Neue', sans-serif" font-size="110" font-weight="900" fill="#9ca3af" text-anchor="middle">1</text>
        <text x="370" y="215" font-family="'Inter', sans-serif" font-size="15" font-weight="700" fill="${a}" text-anchor="middle" letter-spacing="2">STADION SI JALAK HARUPAT</text>
        <!-- Away Team -->
        <g transform="translate(550, 60)">
          <polygon points="40,0 80,16 80,72 40,104 0,72 0,16" fill="#2d3748" stroke="#ffffff" stroke-width="3"/>
          <text x="40" y="60" font-family="'Bebas Neue', sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">R</text>
          <text x="40" y="140" font-family="'Bebas Neue', sans-serif" font-size="30" font-weight="900" fill="#9ca3af" text-anchor="middle">RIVAL</text>
        </g>
      </svg>`;
    }
  },

  svg_duel_radar: {
    componentId: "svg_duel_radar",
    name: "Radar Taktik & Duel (Radar)",
    category: "Radar",
    defaultProps: {
      width: 400,
      height: 400,
      colors: { primary: "#003da5", accent: "#f0a500", secondary: "#0070c0" }
    },
    render: (props = {}) => {
      const a = props.colors?.accent || "#f0a500";
      const p = props.colors?.primary || "#003da5";
      const w = props.width || 400;
      const h = props.height || 400;
      return `<svg viewBox="0 0 400 400" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="180" fill="#080e1a" stroke="${p}" stroke-width="4"/>
        <circle cx="200" cy="200" r="135" fill="none" stroke="${p}" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>
        <circle cx="200" cy="200" r="90" fill="none" stroke="${a}" stroke-width="2" opacity="0.7"/>
        <circle cx="200" cy="200" r="45" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="4,4"/>
        <!-- Crosshairs -->
        <line x1="20" y1="200" x2="380" y2="200" stroke="${p}" stroke-width="2" opacity="0.5"/>
        <line x1="200" y1="20" x2="200" y2="380" stroke="${p}" stroke-width="2" opacity="0.5"/>
        <!-- Radar Sweep Indicator -->
        <polygon id="bmRadarSweep" points="200,200 350,110 380,200" fill="${a}" opacity="0.25"/>
        <circle cx="200" cy="200" r="8" fill="${a}"/>
        <text x="200" y="360" font-family="'Inter', sans-serif" font-size="14" font-weight="800" fill="${a}" text-anchor="middle" letter-spacing="3">TACTICAL RADAR</text>
      </svg>`;
    }
  },

  svg_motm_badge: {
    componentId: "svg_motm_badge",
    name: "Lencana Bintang MOTM (Badge)",
    category: "Badge & Number",
    defaultProps: {
      width: 260,
      height: 260,
      colors: { accent: "#f0a500", primary: "#003da5", text: "#ffffff" }
    },
    render: (props = {}) => {
      const a = props.colors?.accent || "#f0a500";
      const p = props.colors?.primary || "#003da5";
      const t = props.colors?.text || "#ffffff";
      const w = props.width || 260;
      const h = props.height || 260;
      return `<svg viewBox="0 0 260 260" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="130,10 165,85 245,95 185,150 205,230 130,190 55,230 75,150 15,95 95,85" fill="#001844" stroke="${a}" stroke-width="6"/>
        <circle cx="130" cy="130" r="55" fill="${p}" stroke="#ffd700" stroke-width="3"/>
        <text x="130" y="125" font-family="'Bebas Neue', sans-serif" font-size="28" font-weight="900" fill="${a}" text-anchor="middle">MAN OF</text>
        <text x="130" y="152" font-family="'Bebas Neue', sans-serif" font-size="30" font-weight="900" fill="${t}" text-anchor="middle">MATCH</text>
      </svg>`;
    }
  },

  svg_wilujeng_stamp: {
    componentId: "svg_wilujeng_stamp",
    name: "Stempel Wilujeng Sumping",
    category: "Badge & Number",
    defaultProps: {
      width: 440,
      height: 160,
      colors: { accent: "#f0a500", text: "#ffffff" }
    },
    render: (props = {}) => {
      const a = props.colors?.accent || "#f0a500";
      const t = props.colors?.text || "#ffffff";
      const w = props.width || 440;
      const h = props.height || 160;
      return `<svg viewBox="0 0 440 160" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="420" height="140" rx="12" fill="none" stroke="${a}" stroke-width="6" stroke-dasharray="16,6"/>
        <rect x="22" y="22" width="396" height="116" rx="8" fill="rgba(240, 165, 0, 0.12)" stroke="${a}" stroke-width="2"/>
        <text x="220" y="70" font-family="'Bebas Neue', sans-serif" font-size="52" font-weight="900" fill="${a}" text-anchor="middle" letter-spacing="4">WILUJENG SUMPING</text>
        <text x="220" y="112" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="${t}" text-anchor="middle" letter-spacing="6">OFFICIAL PLAYER SIGNING</text>
      </svg>`;
    }
  },

  svg_vs_badge: {
    componentId: "svg_vs_badge",
    name: "Lencana Duel Panas (VS)",
    category: "Badge & Number",
    defaultProps: {
      width: 220,
      height: 220,
      colors: { accent: "#f0a500", primary: "#dc2626" }
    },
    render: (props = {}) => {
      const a = props.colors?.accent || "#f0a500";
      const p = props.colors?.primary || "#dc2626";
      const w = props.width || 220;
      const h = props.height || 220;
      return `<svg viewBox="0 0 220 220" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="110,10 140,80 215,80 155,125 180,195 110,150 40,195 65,125 5,80 80,80" fill="${p}" stroke="${a}" stroke-width="5"/>
        <circle cx="110" cy="110" r="48" fill="#0a0a0a" stroke="${a}" stroke-width="3"/>
        <text x="110" y="128" font-family="'Bebas Neue', sans-serif" font-size="54" font-weight="900" fill="${a}" text-anchor="middle" font-style="italic">VS</text>
      </svg>`;
    }
  },

  svg_gold_crown: {
    componentId: "svg_gold_crown",
    name: "Mahkota Raja Juara (Crown)",
    category: "Trophy",
    defaultProps: {
      width: 280,
      height: 200,
      colors: { accent: "#f0a500", primary: "#003da5" }
    },
    render: (props = {}) => {
      const a = props.colors?.accent || "#f0a500";
      const p = props.colors?.primary || "#003da5";
      const w = props.width || 280;
      const h = props.height || 200;
      return `<svg viewBox="0 0 280 200" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffe57f"/>
            <stop offset="100%" stop-color="${a}"/>
          </linearGradient>
        </defs>
        <path d="M20,160 L40,40 L95,110 L140,20 L185,110 L240,40 L260,160 Z" fill="url(#crownGrad)" stroke="#ffd700" stroke-width="4"/>
        <circle cx="40" cy="35" r="10" fill="#ffffff"/>
        <circle cx="140" cy="18" r="12" fill="#ffffff"/>
        <circle cx="240" cy="35" r="10" fill="#ffffff"/>
        <rect x="20" y="150" width="240" height="25" rx="6" fill="#1e293b" stroke="${a}" stroke-width="3"/>
        <circle cx="70" cy="162" r="6" fill="${p}"/>
        <circle cx="140" cy="162" r="6" fill="${a}"/>
        <circle cx="210" cy="162" r="6" fill="${p}"/>
      </svg>`;
    }
  },

  svg_decorative_speedlines: {
    componentId: "svg_decorative_speedlines",
    name: "Garis Kecepatan Diagonal (Speedlines)",
    category: "Decorative Graphics",
    defaultProps: {
      width: 400,
      height: 200,
      colors: { accent: "#f0a500" }
    },
    render: (props = {}) => {
      const a = props.colors?.accent || "#f0a500";
      const w = props.width || 400;
      const h = props.height || 200;
      return `<svg viewBox="0 0 400 200" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="190" x2="160" y2="10" stroke="${a}" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
        <line x1="60" y1="190" x2="210" y2="10" stroke="${a}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        <line x1="120" y1="190" x2="270" y2="10" stroke="${a}" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
        <line x1="180" y1="190" x2="330" y2="10" stroke="${a}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
        <line x1="240" y1="190" x2="390" y2="10" stroke="${a}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
      </svg>`;
    }
  }
};

/**
 * Renders an SVG component markup by componentId.
 */
export function renderSvgComponent(componentId, props = {}) {
  const comp = SHARED_SVG_COMPONENTS[componentId];
  if (!comp) {
    return `<svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="12" fill="#1e293b" stroke="#f0a500" stroke-width="2"/>
      <text x="100" y="105" font-family="'Inter', sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">Komponen SVG: ${componentId}</text>
    </svg>`;
  }
  return comp.render({ ...comp.defaultProps, ...props });
}

