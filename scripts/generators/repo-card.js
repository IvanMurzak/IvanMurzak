const { fmtK, ICONS } = require('../theme');

// Themed repo pin card (dark/light), entrance rise animation.
// repo: GitHub repo node; downloads: OpenUPM downloads or null;
// index: card position used to stagger the entrance.
function generateRepoCardSVG(theme, repo, downloads = null, index = 0) {
  const t = theme;
  // Card is 130 tall; extra transparent bottom strip is the uniform vertical
  // gap between card rows (it scales with the card, like the column gap).
  const W = 470, CARD_H = 130, GAP = 9, H = CARD_H + GAP;

  const description = repo.description || 'No description provided';
  const maxLineLength = 62;
  const words = description.split(' ');
  let lines = [];
  let currentLine = '';
  words.forEach((word) => {
    if ((currentLine + word).length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  lines.push(currentLine.trim());
  if (lines.length > 2) {
    lines = lines.slice(0, 2);
    lines[1] = lines[1].slice(0, maxLineLength - 1) + '…';
  }

  const lang = repo.primaryLanguage ? repo.primaryLanguage.name : '';
  const langColor = repo.primaryLanguage ? repo.primaryLanguage.color : '#8d96a0';

  let cx = 25;
  let statsSVG = '';
  if (lang) {
    statsSVG += `<circle cx="${cx + 5}" cy="${CARD_H - 27}" r="5" fill="${langColor}"/>
    <text x="${cx + 15}" y="${CARD_H - 22.5}" class="p-stat">${lang}</text>`;
    cx += 15 + lang.length * 7 + 22;
  }
  const stats = [
    { icon: ICONS.star, v: fmtK(repo.stargazers.totalCount) },
    { icon: ICONS.fork, v: String(repo.forkCount) },
  ];
  if (downloads) stats.push({ icon: ICONS.download, v: fmtK(downloads) });
  stats.forEach((s) => {
    statsSVG += `<svg x="${cx}" y="${CARD_H - 37}" width="14" height="14" viewBox="0 0 16 16"><path fill="${t.muted}" d="${s.icon}"/></svg>
      <text x="${cx + 18}" y="${CARD_H - 22.5}" class="p-stat">${s.v}</text>`;
    cx += 18 + s.v.length * 7 + 24;
  });

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${repo.name}: ${repo.stargazers.totalCount} stars, ${repo.forkCount} forks${downloads ? ', ' + fmtK(downloads) + ' downloads' : ''}.">
  <style>
    .p-card { opacity: 0; animation: p-rise .55s ease-out ${200 + (index % 8) * 130}ms both; }
    .p-name { font: 600 16px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.accent}; }
    .p-desc { font: 400 12px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    .p-stat { font: 400 12px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    @keyframes p-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .p-card { animation: none; opacity: 1; } }
  </style>
  <g class="p-card">
    <rect x="0.5" y="0.5" rx="6" width="${W - 1}" height="${CARD_H - 1}" fill="${t.bg}" stroke="${t.border}"/>
    <svg x="25" y="24" width="16" height="16" viewBox="0 0 16 16"><path fill="${t.muted}" d="${ICONS.repo}"/></svg>
    <text class="p-name" x="49" y="37">${repo.name}</text>
    <text class="p-desc" x="25" y="66">${escapeXML(lines[0] || '')}</text>
    <text class="p-desc" x="25" y="82">${escapeXML(lines[1] || '')}</text>
    ${statsSVG}
  </g>
</svg>`;
}

function escapeXML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { generateRepoCardSVG };
