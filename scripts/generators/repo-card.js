function formatDownloads(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function generateRepoCardSVG(repo, downloads = null) {
  const name = repo.name;
  const description = repo.description || 'No description provided';
  const stars = repo.stargazers.totalCount;
  const forks = repo.forkCount;
  const langName = repo.primaryLanguage ? repo.primaryLanguage.name : '';
  const langColor = repo.primaryLanguage ? repo.primaryLanguage.color : '#333';

  // Wrap description text (simple approximation)
  const maxLineLength = 55;
  const words = description.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
      if ((currentLine + word).length > maxLineLength) {
          lines.push(currentLine);
          currentLine = word + ' ';
      } else {
          currentLine += word + ' ';
      }
  });
  lines.push(currentLine);
  if (lines.length > 2) lines = lines.slice(0, 2); // Limit to 2 lines

  const cardWidth = 400;
  const cardHeight = 120;

  // Dynamic Offset Calculation
  const fontSize = 12;
  const charWidth = fontSize * 0.6; // Approx width per char
  const gap = 20;

  let langWidth = 0;
  if (langName) {
      langWidth = 15 + (langName.length * charWidth);
  }

  const starsX = langName ? (langWidth + gap) : 0;

  const starsTextWidth = String(stars).length * charWidth;
  const starsBlockWidth = 20 + starsTextWidth;

  const forksX = starsX + starsBlockWidth + gap;

  const starIcon = `<path fill="#586069" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`;
  const forkIcon = `<path fill="#586069" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>`;
  const downloadIcon = `<path fill="#586069" d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75z"/><path fill="#586069" d="M7.25 7.689V2a.75.75 0 011.5 0v5.689l1.97-1.969a.749.749 0 111.06 1.06l-3.25 3.25a.749.749 0 01-1.06 0L4.22 6.78a.749.749 0 111.06-1.06l1.97 1.969z"/>`;

  // Downloads section (right side)
  const downloadsSection = downloads !== null ? `
        <g transform="translate(${cardWidth - 25}, 100)">
             <svg x="-35" y="-10" width="16" height="16" viewBox="0 0 16 16">${downloadIcon}</svg>
             <text x="0" y="0" class="stat" text-anchor="end">${formatDownloads(downloads)}</text>
        </g>
  ` : '';

  const svg = `
  <svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      .name { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #006AFF; }
      .description { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #586069; }
      .stat { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #586069; }
      .lang-color { width: 12px; height: 12px; rx: 6px; }
    </style>

    <rect x="0.5" y="0.5" rx="4.5" height="99%" width="99%" fill="none" stroke="#e1e4e8" stroke-opacity="0"/>

    <g transform="translate(25, 35)">
        <text x="0" y="0" class="name">${name}</text>
    </g>

    <g transform="translate(25, 60)">
        ${lines.map((line, i) => `<text x="0" y="${i * 15}" class="description">${line}</text>`).join('')}
    </g>

    <g transform="translate(25, 100)">
        <!-- Language -->
        ${langName ? `
        <g>
             <circle cx="6" cy="-4" r="6" fill="${langColor}"/>
             <text x="15" y="0" class="stat">${langName}</text>
        </g>
        ` : ''}

        <!-- Stars -->
        <g transform="translate(${starsX}, 0)">
             <svg x="0" y="-10" width="16" height="16" viewBox="0 0 16 16">${starIcon}</svg>
             <text x="20" y="0" class="stat">${stars}</text>
        </g>

        <!-- Forks -->
        <g transform="translate(${forksX}, 0)">
             <svg x="0" y="-10" width="16" height="16" viewBox="0 0 16 16">${forkIcon}</svg>
             <text x="15" y="0" class="stat">${forks}</text>
        </g>
    </g>

    <!-- Downloads (right side) -->
    ${downloadsSection}
  </svg>
  `;
  return svg;
}

module.exports = { generateRepoCardSVG };