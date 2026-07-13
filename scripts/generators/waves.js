// Accent-colored wave divider. Static by design: continuous full-width
// repaints are one of the most expensive things a README full of animated
// SVGs can do, and the parallax layering reads well without motion.
function generateWavesSVG(theme, inverse = false) {
  const t = theme;
  const flip = inverse ? ' transform="scale(1,-1) translate(0,-96)"' : '';
  return `<svg width="955" height="70" viewBox="0 24 150 28" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs><path id="w-wave" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18 58-18 88-18 58 18 88 18 v44h-528z"/></defs>
  <g${flip}>
    <use href="#w-wave" x="8" y="0" fill="${t.accent}" opacity="0.25"/>
    <use href="#w-wave" x="55" y="3" fill="${t.accent}" opacity="0.18"/>
    <use href="#w-wave" x="102" y="5" fill="${t.accent}" opacity="0.12"/>
    <use href="#w-wave" x="30" y="7" fill="${t.accent}" opacity="0.35"/>
  </g>
</svg>`;
}

module.exports = { generateWavesSVG };
