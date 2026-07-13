// Accent-colored wave divider with slow parallax drift.
// The wave path repeats every 176 units, so a -176px translate loops seamlessly.
function generateWavesSVG(theme, inverse = false) {
  const t = theme;
  const flip = inverse ? ' transform="scale(1,-1) translate(0,-96)"' : '';
  return `<svg width="955" height="70" viewBox="0 24 150 28" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <style>
    .w-l1 { animation: w-drift 14s linear infinite; }
    .w-l2 { animation: w-drift 10s linear infinite reverse; }
    .w-l3 { animation: w-drift 18s linear infinite; }
    .w-l4 { animation: w-drift 8s linear infinite reverse; }
    @media (prefers-reduced-motion: reduce) { .w-l1, .w-l2, .w-l3, .w-l4 { animation: none; } }
    @keyframes w-drift { from { transform: translateX(0); } to { transform: translateX(-176px); } }
  </style>
  <defs><path id="w-wave" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18 58-18 88-18 58 18 88 18 v44h-528z"/></defs>
  <g${flip}>
    <use href="#w-wave" class="w-l1" y="0" fill="${t.accent}" opacity="0.25"/>
    <use href="#w-wave" class="w-l2" y="3" fill="${t.accent}" opacity="0.18"/>
    <use href="#w-wave" class="w-l3" y="5" fill="${t.accent}" opacity="0.12"/>
    <use href="#w-wave" class="w-l4" y="7" fill="${t.accent}" opacity="0.35"/>
  </g>
</svg>`;
}

module.exports = { generateWavesSVG };
