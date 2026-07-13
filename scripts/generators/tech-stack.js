// Tech stack pill row with staggered pop-in and gentle dot pulse.
const STACK = ['C#', '.NET', 'Unity', 'MCP', 'TypeScript', 'Python', 'Docker', 'GitHub Actions'];

function generateTechStackSVG(theme) {
  const t = theme;
  const W = 955, H = 56;
  const pillH = 30, gap = 10;
  const widths = STACK.map((s) => 34 + s.length * 7.6);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (STACK.length - 1);
  let x = (W - totalW) / 2;
  let pills = '';
  STACK.forEach((s, i) => {
    const w = widths[i];
    pills += `<g>
      <rect x="${x.toFixed(1)}" y="${(H - pillH) / 2}" width="${w.toFixed(1)}" height="${pillH}" rx="${pillH / 2}" fill="${t.chipBg}" stroke="${t.border}"/>
      <circle cx="${(x + 16).toFixed(1)}" cy="${H / 2}" r="3.5" fill="${t.accent}" class="st-dot" style="animation-delay:${(i * 0.35).toFixed(2)}s"/>
      <text x="${(x + 26).toFixed(1)}" y="${H / 2 + 4.5}" class="st-txt">${s}</text>
    </g>`;
    x += w + gap;
  });
  return `<svg width="955" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tech stack: ${STACK.join(', ')}.">
  <style>
    .st-txt { font: 600 12.5px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .st-dot { animation: st-pulse 3s ease-in-out infinite alternate; }
    @keyframes st-pulse { from { opacity: .55; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .st-dot { animation: none; opacity: 1; } }
  </style>
  ${pills}
</svg>`;
}

module.exports = { generateTechStackSVG };
