const { fmt, fmtK, sharedCSS } = require('../theme');

const PHRASES = ['AI Tools', 'AI Agents', 'AI Harness', '.NET & Unity', 'Game Dev'];

// Animated hero: gradient-shimmer name, cycling typing line, live metric chips.
// data: { stars, openupm, nuget, npm, followers }
function generateHeroSVG(theme, data) {
  const t = theme;
  const W = 955, H = 175, CX = W / 2;
  const T = PHRASES.length * 3.4;
  const fs = 15, charW = 9.0;

  // Negative base delay puts phrase 0 mid-hold (fully typed) at t=0, so the
  // frozen frame-0 render (reduced-motion image freeze) still shows a phrase.
  let phrases = '', clips = '';
  PHRASES.forEach((p, i) => {
    const text = '> ' + p;
    const w = text.length * charW + 8;
    const x = CX - w / 2;
    const delay = (i * 3.4 - 1.7).toFixed(1);
    clips += `<clipPath id="h-clip${i}"><rect class="h-tw" x="${x.toFixed(1)}" y="86" width="${w.toFixed(1)}" height="24" style="animation-delay:${delay}s"/></clipPath>`;
    phrases += `<text class="h-ph" x="${CX}" y="103" text-anchor="middle" clip-path="url(#h-clip${i})" style="animation-delay:${delay}s">${text.replace(/&/g, '&amp;')}</text>`;
  });

  const chips = [
    { v: fmt(data.stars), l: 'TOTAL STARS' },
    { v: fmtK(data.openupm), l: 'OPENUPM DL' },
    { v: fmtK(data.nuget), l: 'NUGET DL' },
    { v: fmtK(data.npm), l: 'NPM DL' },
    { v: String(data.followers), l: 'FOLLOWERS' },
  ];
  let chipsSVG = '';
  chips.forEach((c, i) => {
    const cx = CX + (i - 2) * 178;
    chipsSVG += `<g class="chip" style="animation-delay:${800 + i * 150}ms">
      <circle cx="${cx - 58}" cy="146" r="3" fill="${t.accent}" class="h-dot" style="animation-delay:${(i * 0.4).toFixed(1)}s"/>
      <text x="${cx - 48}" y="151" class="h-val">${c.v}</text>
      <text x="${cx - 48}" y="164" class="h-lbl">${c.l}</text>
    </g>`;
  });

  return `<svg width="955" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ivan Murzak. ${PHRASES.join(', ').replace(/&/g, '&amp;')}.">
  <style>
    .h-name { font: 800 42px 'Segoe UI', Ubuntu, sans-serif; fill: url(#h-nameGrad); }
    .h-ph { font: 600 ${fs}px ui-monospace, 'Cascadia Mono', Consolas, monospace; fill: ${t.ink};
            opacity: 0; animation: h-phrase ${T}s linear infinite both; }
    .h-tw { transform-box: fill-box; transform-origin: left;
            animation: h-type ${T}s linear infinite both; }
    .h-val { font: 700 19px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .h-lbl { font: 600 9px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; letter-spacing: 1px; }
    .h-dot { animation: h-pulse 3s ease-in-out infinite alternate; }
    @keyframes h-pulse { from { opacity: .55; } to { opacity: 1; } }
    @keyframes h-phrase { 0% { opacity: 1; } 18.5% { opacity: 1; } 20% { opacity: 0; } 100% { opacity: 0; } }
    @keyframes h-type {
      0% { transform: scaleX(0); animation-timing-function: steps(16, end); }
      6.5% { transform: scaleX(1); } 100% { transform: scaleX(1); }
    }
    ${sharedCSS()}
    @media (prefers-reduced-motion: reduce) {
      .fade, .chip, .h-ph, .h-dot { animation: none; opacity: 1; }
      .h-ph:not(:first-of-type) { display: none; }
      .h-tw { animation: none; transform: none; }
    }
  </style>
  <defs>
    <linearGradient id="h-nameGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0.35" stop-color="${t.accent}"/>
      <stop offset="0.5" stop-color="${t.accentHi}"/>
      <stop offset="0.65" stop-color="${t.accent}"/>
      <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="5.5s" repeatCount="indefinite"/>
    </linearGradient>
    ${clips}
  </defs>
  <text class="h-name fade" x="${CX}" y="58" text-anchor="middle">Ivan Murzak</text>
  ${phrases}
  ${chipsSVG}
</svg>`;
}

module.exports = { generateHeroSVG };
