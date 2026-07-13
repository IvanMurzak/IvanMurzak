// Activity pulse strip: one cell per day (last N days), cell opacity encodes
// real contribution intensity, a brightness wave travels across the row.
// Geometry is static — only opacity animates, so the loop is seamless.
function generateActivityPulseSVG(theme, days) {
  const t = theme;
  const W = 955, H = 64;
  const n = days.length, cell = 13, pitch = 17;
  const x0 = (W - (n * pitch - (pitch - cell))) / 2;
  const y0 = (H - cell) / 2;
  const max = Math.max(1, ...days.map((d) => d.c));
  let cells = '';
  days.forEach((d, i) => {
    const lv = 0.15 + 0.8 * (d.c / max);
    cells += `<rect x="${(x0 + i * pitch).toFixed(1)}" y="${y0}" width="${cell}" height="${cell}" rx="3" fill="${t.accent}" fill-opacity="${lv.toFixed(2)}" class="pu-cell" style="animation-delay:${(i * 0.085).toFixed(2)}s"><title>${d.d}: ${d.c}</title></rect>`;
  });
  return `<svg width="955" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Activity pulse: contribution intensity for the last ${n} days.">
  <style>
    .pu-cell { opacity: .5; animation: pu-wave 5s ease-in-out infinite; }
    @keyframes pu-wave { 0% { opacity: .5; } 10% { opacity: 1; } 22% { opacity: .5; } 100% { opacity: .5; } }
    @media (prefers-reduced-motion: reduce) { .pu-cell { animation: none; opacity: 1; } }
  </style>
  ${cells}
</svg>`;
}

module.exports = { generateActivityPulseSVG };
