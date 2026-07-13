// Shared theme tokens and helpers for all SVG generators.
// Accent colors validated for contrast and OKLCH lightness band on each surface.

const THEMES = {
  dark: {
    name: 'dark',
    bg: '#0d1117',
    border: '#30363d',
    ink: '#e6edf3',
    muted: '#8d96a0',
    grid: '#21262d',
    chipBg: '#161b22',
    shine: 'rgba(255,255,255,0.22)',
    accent: '#2f81f7',
    accentHi: '#79c0ff',
  },
  light: {
    name: 'light',
    bg: '#ffffff',
    border: '#d0d7de',
    ink: '#1f2328',
    muted: '#656d76',
    grid: '#eaeef2',
    chipBg: '#f6f8fa',
    shine: 'rgba(255,255,255,0.55)',
    accent: '#0969da',
    accentHi: '#54aeff',
  },
};

const fmt = (n) => n.toLocaleString('en-US').replace(/,/g, ' ');
const fmtK = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Octicons (16x16 viewBox path data)
const ICONS = {
  star: 'M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z',
  fork: 'M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z',
  download: 'M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z',
  repo: 'M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z',
};

// Entrance/idle keyframes shared by generators (identical bodies are safe to duplicate)
function sharedCSS() {
  return `
    .fade { opacity: 0; animation: fadein .5s ease-out forwards; }
    .chip { opacity: 0; animation: rise .5s ease-out both; }
    .late { opacity: 0; animation: fadein .45s ease-out 1.5s forwards; }
    @keyframes fadein { to { opacity: 1; } }
    @keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes breathe { from { opacity: .15; } to { opacity: .5; } }
    @keyframes ping { 0% { transform: scale(.5); opacity: .8; } 55% { transform: scale(2.4); opacity: 0; } 100% { transform: scale(2.4); opacity: 0; } }
    @keyframes sweep { 0% { transform: translateX(0) skewX(-14deg); } 22% { transform: translateX(1115px) skewX(-14deg); } 100% { transform: translateX(1115px) skewX(-14deg); } }
  `;
}

module.exports = { THEMES, fmt, fmtK, MONTH_NAMES, ICONS, sharedCSS };
