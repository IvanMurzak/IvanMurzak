const { fmt, fmtK, ICONS, sharedCSS } = require('../theme');

// Wide flagship repo card with rotating gradient border and periodic shine.
// repo: GitHub repo node; downloads: OpenUPM all-time downloads (or null).
function generateFlagshipSVG(theme, repo, downloads, eyebrow) {
  const t = theme;
  const W = 955, H = 150;

  const desc = repo.description || '';
  const maxLine = 88;
  let desc1 = desc, desc2 = '';
  if (desc.length > maxLine) {
    const cut = desc.lastIndexOf(' ', maxLine);
    desc1 = desc.slice(0, cut);
    desc2 = desc.slice(cut + 1, cut + 1 + maxLine);
  }

  const lang = repo.primaryLanguage ? repo.primaryLanguage.name : '';
  const langColor = repo.primaryLanguage ? repo.primaryLanguage.color : '#8d96a0';

  const chips = [
    { icon: ICONS.star, v: fmt(repo.stargazers.totalCount), l: 'stars' },
    { icon: ICONS.fork, v: String(repo.forkCount), l: 'forks' },
  ];
  if (downloads) chips.push({ icon: ICONS.download, v: fmtK(downloads), l: 'downloads' });

  let chipsSVG = '';
  let cx = 25;
  chips.forEach((c) => {
    chipsSVG += `<g>
      <svg x="${cx}" y="116" width="15" height="15" viewBox="0 0 16 16"><path fill="${t.muted}" d="${c.icon}"/></svg>
      <text x="${cx + 20}" y="128" class="f-val">${c.v}</text>
      <text x="${(cx + 20 + String(c.v).length * 8.6 + 6).toFixed(1)}" y="128" class="f-lab">${c.l}</text>
    </g>`;
    cx += 24 + String(c.v).length * 8.6 + c.l.length * 6.4 + 34;
  });
  if (lang) {
    chipsSVG += `<g>
      <circle cx="${cx + 6}" cy="123" r="5.5" fill="${langColor}"/>
      <text x="${cx + 17}" y="128" class="f-val">${lang}</text>
    </g>`;
  }

  return `<svg width="955" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${repo.name}: ${fmt(repo.stargazers.totalCount)} stars, ${repo.forkCount} forks${downloads ? ', ' + fmtK(downloads) + ' downloads' : ''}.">
  <style>
    .f-eyebrow { font: 600 9px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.accent}; letter-spacing: 1.6px; }
    .f-name { font: 700 22px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .f-desc { font: 400 13px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    .f-val { font: 600 13px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .f-lab { font: 400 12px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    #f-shine { animation: sweep 9s linear infinite; }
    ${sharedCSS()}
    @media (prefers-reduced-motion: reduce) {
      #f-shine { animation: none; display: none; }
    }
  </style>
  <defs>
    <linearGradient id="f-borderGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.border}"/>
      <stop offset="0.5" stop-color="${t.accentHi}"/>
      <stop offset="1" stop-color="${t.border}"/>
      <animateTransform attributeName="gradientTransform" type="rotate" from="0 0.5 0.5" to="360 0.5 0.5" dur="10s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="f-shineGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.shine}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${t.shine}"/>
      <stop offset="1" stop-color="${t.shine}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="f-cardClip"><rect x="1" y="1" rx="6" width="${W - 2}" height="${H - 2}"/></clipPath>
  </defs>
  <rect x="0.75" y="0.75" rx="6" width="${W - 1.5}" height="${H - 1.5}" fill="${t.bg}" stroke="url(#f-borderGrad)" stroke-width="1.5"/>
  <text class="f-eyebrow" x="25" y="32">${eyebrow}</text>
  <text class="f-name" x="25" y="62">${repo.name}</text>
  <text class="f-desc" x="25" y="86">${escapeXML(desc1)}</text>
  <text class="f-desc" x="25" y="103">${escapeXML(desc2)}</text>
  ${chipsSVG}
  <g clip-path="url(#f-cardClip)">
    <rect id="f-shine" x="-150" y="0" width="110" height="${H}" fill="url(#f-shineGrad)" style="transform: skewX(-14deg)"/>
  </g>
</svg>`;
}

function escapeXML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { generateFlagshipSVG };
