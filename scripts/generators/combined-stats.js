const { calculateRank } = require('../utils');
const { monthlyContributions } = require('../api');
const { fmt } = require('../theme');

// Stats + streak card pair ("Variant B"): metric bars with relative scales,
// gradient rank ring with TOP N% caption, contribution sparkline behind the
// streak columns, blinking embers over the flame. Entrance animations play
// once at image load; idle loops animate opacity only.
function generateCombinedStatsSVG(theme, data) {
  const t = theme;

  // --- GITHUB STATS DATA ---
  const user = data.user;
  const totalStars = user.repositories.nodes.reduce((acc, repo) => acc + repo.stargazers.totalCount, 0);
  const totalCommits = user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount;
  const totalPRs = user.pullRequests.totalCount;
  const totalIssues = user.issues.totalCount;
  const followers = user.followers ? user.followers.totalCount : 0;
  const repoCount = user.repositories.nodes.length;

  const rank = calculateRank({
    commits: totalCommits,
    contribs: user.contributionsCollection.contributionCalendar.totalContributions || 0,
    issues: totalIssues,
    prs: totalPRs,
    stars: totalStars,
    followers: followers,
    repos: repoCount,
  });
  const topPct = Math.max(1, Math.ceil(100 - rank.score));

  // --- STREAK STATS DATA ---
  const contributionCalendar = data.user.contributionsCollection.contributionCalendar;
  const weeks = contributionCalendar.weeks;
  const days = weeks.flatMap((week) => week.contributionDays);

  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakRange = { start: null, end: null };
  let longestStreakRange = { start: null, end: null };

  days.sort((a, b) => new Date(a.date) - new Date(b.date));

  let tempStreak = 0;
  let tempStart = null;
  let streakActive = true;

  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    const count = day.contributionCount;
    if (i === days.length - 1) {
      if (count > 0) {
        currentStreak++;
        currentStreakRange.end = day.date;
        currentStreakRange.start = day.date;
      } else {
        streakActive = false;
      }
    } else {
      if (count > 0) {
        if (currentStreak === 0 && !streakActive) {
          const d1 = new Date(days[i + 1].date);
          const d2 = new Date(day.date);
          const diffDays = Math.ceil(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) {
            currentStreak++;
            currentStreakRange.end = day.date;
            currentStreakRange.start = day.date;
            streakActive = true;
          } else { break; }
        } else if (currentStreak > 0 || streakActive) {
          currentStreak++;
          currentStreakRange.start = day.date;
        }
      } else {
        if (currentStreak > 0) break;
      }
    }
  }

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (day.contributionCount > 0) {
      if (tempStreak === 0) tempStart = day.date;
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakRange.start = tempStart;
        longestStreakRange.end = days[i - 1].date;
      }
      tempStreak = 0;
    }
  }
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
    longestStreakRange.start = tempStart;
    longestStreakRange.end = days[days.length - 1].date;
  }

  const totalContributions = contributionCalendar.totalContributions;
  const firstContributionDate = days[0].date;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const formatRange = (start, end) => `${formatDate(start)} - ${formatDate(end)}`;

  // --- LAYOUT ---
  const leftWidth = 450;
  const rightWidth = 495;
  const height = 195;
  const gap = 10;
  const totalWidth = leftWidth + rightWidth + gap;

  // Metric bars: log scale keeps small counts visible next to 20k+ commits.
  const metrics = [
    { label: 'Total Stars', value: totalStars },
    { label: 'Total Commits', value: totalCommits },
    { label: 'Total PRs', value: totalPRs },
    { label: 'Total Issues', value: totalIssues },
    { label: 'Followers', value: followers },
  ];
  const trackW = 275;
  const maxLog = Math.max(...metrics.map((m) => Math.log10(m.value + 1)));
  metrics.forEach((m) => {
    m.barW = Math.round(trackW * (Math.log10(m.value + 1) / maxLog));
  });

  // Rank ring
  const rankR = 44;
  const rankC = 2 * Math.PI * rankR;
  const rankOffset = rankC - (rank.score / 100) * rankC;

  // Streak ring
  const streakR = 40;
  const streakC = 2 * Math.PI * streakR;
  const streakProgress = longestStreak > 0 ? currentStreak / longestStreak : 0;
  const streakOffset = streakC - streakProgress * streakC;

  // Sparkline: last 14 months of real contributions along the card bottom.
  const monthly = monthlyContributions(user, 14);
  let sparkSVG = '';
  if (monthly.length >= 2) {
    const maxC = Math.max(...monthly.map((m) => m.c), 1);
    const pts = monthly.map((m, i) => {
      const x = 1 + (i * (rightWidth - 2)) / (monthly.length - 1);
      const y = 192 - (m.c / maxC) * 60;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const line = 'M' + pts.join(' L');
    const area = `${line} L${(rightWidth - 1)},194 L1,194 Z`;
    sparkSVG = `<g class="cs-spark" clip-path="url(#cs-clipR)">
      <path d="${area}" fill="${t.accent}" opacity="${t.name === 'dark' ? '.08' : '.06'}"/>
      <path d="${line}" stroke="${t.accent}" stroke-width="1.5" fill="none" opacity="${t.name === 'dark' ? '.35' : '.3'}"/>
    </g>`;
  }

  const rows = metrics.map((m, i) => `
    <g class="cs-row" style="animation-delay:${150 + i * 110}ms">
      <text class="cs-lab" x="25" y="${36 + i * 32}">${m.label}</text>
      <text class="cs-val" x="300" y="${37 + i * 32}" text-anchor="end">${fmt(m.value)}</text>
      <rect x="25" y="${44 + i * 32}" width="${trackW}" height="4" rx="2" fill="${t.grid}"/>
      <rect class="cs-bar" style="animation-delay:${250 + i * 110}ms" x="25" y="${44 + i * 32}" width="${m.barW}" height="4" rx="2" fill="url(#cs-bg)"/>
    </g>`).join('');

  return `<svg width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub stats: ${fmt(totalStars)} stars, ${fmt(totalCommits)} commits, rank ${rank.level}. ${fmt(totalContributions)} contributions, current streak ${currentStreak} days.">
  <style>
    .cs-lab { font: 400 12.5px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    .cs-val { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .cs-big { font: 700 28px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .cs-rank { font: 700 24px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .cs-cap { font: 600 9px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; letter-spacing: 1.4px; }
    .cs-sub { font: 400 13px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    .cs-date { font: 400 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    .cs-cur { font: 700 13.5px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.accent}; }
    .cs-fade { opacity: 0; animation: cs-fadein .5s ease-out forwards; }
    .cs-row { opacity: 0; animation: cs-fadein .45s ease-out both; }
    .cs-bar { transform: scaleX(0); transform-box: fill-box; transform-origin: left;
              animation: cs-grow .8s cubic-bezier(.33,1,.4,1) both; }
    .cs-ringL { stroke-dasharray: ${rankC.toFixed(2)}; stroke-dashoffset: ${rankC.toFixed(2)};
                animation: cs-drawL 1.2s cubic-bezier(.33,1,.4,1) .5s both; }
    .cs-ringR { stroke-dasharray: ${streakC.toFixed(2)}; stroke-dashoffset: ${streakC.toFixed(2)};
                animation: cs-drawR 1.2s cubic-bezier(.33,1,.4,1) .6s both; }
    .cs-spark { opacity: 0; animation: cs-fadein 1s ease-out .9s forwards; }
    .cs-halo { animation: cs-breathe 4.5s ease-in-out infinite alternate; }
    .cs-flame { animation: cs-flick 2.8s ease-in-out infinite; }
    .cs-e1 { opacity: 0; animation: cs-blink 2.4s ease-in-out .2s infinite; }
    .cs-e2 { opacity: 0; animation: cs-blink 2.4s ease-in-out 1s infinite; }
    .cs-e3 { opacity: 0; animation: cs-blink 2.4s ease-in-out 1.8s infinite; }
    @keyframes cs-fadein { to { opacity: 1; } }
    @keyframes cs-grow { to { transform: scaleX(1); } }
    @keyframes cs-drawL { to { stroke-dashoffset: ${rankOffset.toFixed(2)}; } }
    @keyframes cs-drawR { to { stroke-dashoffset: ${streakOffset.toFixed(2)}; } }
    @keyframes cs-breathe { from { opacity: .45; } to { opacity: 1; } }
    @keyframes cs-flick { 0%, 100% { opacity: 1; } 40% { opacity: .68; } 65% { opacity: .9; } }
    @keyframes cs-blink { 0%, 100% { opacity: 0; } 50% { opacity: .85; } }
    @media (prefers-reduced-motion: reduce) {
      .cs-fade, .cs-row, .cs-spark { animation: none; opacity: 1; }
      .cs-bar { animation: none; transform: none; }
      .cs-ringL { animation: none; stroke-dashoffset: ${rankOffset.toFixed(2)}; }
      .cs-ringR { animation: none; stroke-dashoffset: ${streakOffset.toFixed(2)}; }
      .cs-halo, .cs-flame, .cs-e1, .cs-e2, .cs-e3 { animation: none; }
    }
  </style>
  <defs>
    <linearGradient id="cs-bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}"/>
      <stop offset="1" stop-color="${t.accentHi}"/>
    </linearGradient>
    <linearGradient id="cs-rg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.accentHi}"/>
      <stop offset="1" stop-color="${t.accent}"/>
    </linearGradient>
    <linearGradient id="cs-num" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accentHi}"/>
      <stop offset="1" stop-color="${t.accent}"/>
    </linearGradient>
    <radialGradient id="cs-hg">
      <stop offset=".55" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset=".8" stop-color="${t.accent}" stop-opacity=".14"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cs-sep" x1="0" y1="30" x2="0" y2="170" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.grid}" stop-opacity="0"/>
      <stop offset=".5" stop-color="${t.grid}"/>
      <stop offset="1" stop-color="${t.grid}" stop-opacity="0"/>
    </linearGradient>
    <mask id="cs-mask">
      <rect x="-55" y="-55" width="110" height="110" fill="#fff"/>
      <ellipse cy="-40" rx="13" ry="18" fill="#000"/>
    </mask>
    <clipPath id="cs-clipR"><rect x="0.5" y="0.5" rx="6" width="${rightWidth - 1}" height="${height - 1}"/></clipPath>
  </defs>

  <!-- LEFT CARD: metric bars + rank ring -->
  <g>
    <rect x="0.5" y="0.5" rx="6" width="${leftWidth - 1}" height="${height - 1}" fill="${t.bg}" stroke="${t.border}"/>
    ${rows}
    <g transform="translate(382,92)">
      <circle class="cs-halo" r="57" fill="url(#cs-hg)"/>
      <circle r="${rankR}" stroke="${t.grid}" stroke-width="6" fill="none"/>
      <circle class="cs-ringL" r="${rankR}" stroke="url(#cs-rg)" stroke-width="6" fill="none" stroke-linecap="round" transform="rotate(-90)"/>
      <text class="cs-rank cs-fade" style="animation-delay:.9s" y="9" text-anchor="middle">${rank.level}</text>
    </g>
    <text class="cs-cap cs-fade" style="animation-delay:1.1s" x="382" y="162" text-anchor="middle">TOP ${topPct}%</text>
  </g>

  <!-- RIGHT CARD: contributions + streak -->
  <g transform="translate(${leftWidth + gap},0)">
    <rect x="0.5" y="0.5" rx="6" width="${rightWidth - 1}" height="${height - 1}" fill="${t.bg}" stroke="${t.border}"/>
    ${sparkSVG}
    <line x1="165" y1="30" x2="165" y2="170" stroke="url(#cs-sep)"/>
    <line x1="330" y1="30" x2="330" y2="170" stroke="url(#cs-sep)"/>
    <g class="cs-row" style="animation-delay:250ms">
      <text class="cs-big" x="82.5" y="86" text-anchor="middle">${fmt(totalContributions)}</text>
      <text class="cs-sub" x="82.5" y="114" text-anchor="middle">Total Contributions</text>
      <text class="cs-date" x="82.5" y="136" text-anchor="middle">${formatDate(firstContributionDate)} - Present</text>
    </g>
    <g class="cs-row" style="animation-delay:400ms">
      <g transform="translate(247.5,78)">
        <circle class="cs-halo" r="52" fill="url(#cs-hg)" style="animation-delay:1.2s"/>
        <g mask="url(#cs-mask)">
          <circle r="${streakR}" stroke="${t.grid}" stroke-width="5" fill="none"/>
          <circle class="cs-ringR" r="${streakR}" stroke="url(#cs-rg)" stroke-width="5" fill="none" stroke-linecap="round" transform="rotate(-90)"/>
        </g>
        <g class="cs-flame" transform="translate(0,-52)">
          <path d="M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z" fill="${t.accent}"/>
        </g>
        <circle class="cs-e1" cx="-9" cy="-57" r="1.6" fill="${t.accentHi}"/>
        <circle class="cs-e2" cx="2" cy="-63" r="1.4" fill="${t.accentHi}"/>
        <circle class="cs-e3" cx="10" cy="-55" r="1.6" fill="${t.accentHi}"/>
        <text class="cs-big" y="10" text-anchor="middle" fill="url(#cs-num)">${currentStreak}</text>
      </g>
      <text class="cs-cur" x="247.5" y="150" text-anchor="middle">Current Streak</text>
      <text class="cs-date" x="247.5" y="170" text-anchor="middle">${formatRange(currentStreakRange.start, currentStreakRange.end)}</text>
    </g>
    <g class="cs-row" style="animation-delay:550ms">
      <text class="cs-big" x="412.5" y="86" text-anchor="middle">${fmt(longestStreak)}</text>
      <text class="cs-sub" x="412.5" y="114" text-anchor="middle">Longest Streak</text>
      <text class="cs-date" x="412.5" y="136" text-anchor="middle">${formatRange(longestStreakRange.start, longestStreakRange.end)}</text>
    </g>
  </g>
</svg>`;
}

module.exports = { generateCombinedStatsSVG };
