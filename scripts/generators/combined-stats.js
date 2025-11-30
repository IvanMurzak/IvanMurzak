const { calculateRank } = require('../utils');

function generateCombinedStatsSVG(data) {
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
    contribs: 0,
    issues: totalIssues,
    prs: totalPRs,
    stars: totalStars,
    followers: followers,
    repos: repoCount
  });
  
  if (user.contributionsCollection.contributionCalendar.totalContributions) {
      const betterRank = calculateRank({
        commits: totalCommits,
        contribs: user.contributionsCollection.contributionCalendar.totalContributions,
        issues: totalIssues,
        prs: totalPRs,
        stars: totalStars,
        followers: followers,
        repos: repoCount
      });
      rank.level = betterRank.level;
      rank.score = betterRank.score;
  }

  // --- STREAK STATS DATA ---
  const contributionCalendar = data.user.contributionsCollection.contributionCalendar;
  const weeks = contributionCalendar.weeks;
  const days = weeks.flatMap(week => week.contributionDays);

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
                  const d1 = new Date(days[i+1].date);
                  const d2 = new Date(day.date);
                  const diffTime = Math.abs(d1 - d2);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
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
              longestStreakRange.end = days[i-1].date;
          }
          tempStreak = 0;
      }
  }
  if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
      longestStreakRange.start = tempStart;
      longestStreakRange.end = days[days.length-1].date;
  }
  
  const totalContributions = contributionCalendar.totalContributions;
  const firstContributionDate = days[0].date;
  const lastContributionDate = days[days.length-1].date;

  const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const formatRange = (start, end) => {
      const s = formatDate(start);
      const e = formatDate(end);
      return `${s} - ${e}`;
  };

  const totalText = `${totalContributions.toLocaleString()}`;

  // --- COMMON CONFIG ---
  const colors = {
    bg: '#ffffff',
    border: '#e1e4e8',
    header: '#0969da',
    label: '#333',
    value: '#24292f',
    icon: '#0969da',
    ring: '#2f80ed',
    date: '#777',
    fire: '#0969da',
    currStreakLabel: '#0579C3',
    currStreakValue: '#333'
  };

  // Layout Dimensions
  const leftWidth = 450;
  const rightWidth = 495;
  const height = 195;
  const gap = 10;
  const totalWidth = leftWidth + rightWidth + gap;

  // Github Stats Config
  const ghPadding = 25;
  const ghLineHeight = 32;
  // Content height = 5 * 32 = 160. Card height = 195. (195-160)/2 = 17.5.
  // Adjusted to 30 for visual centering accounting for text baseline.
  const ghStartY = 30; 
  const ghLabelX = 55;
  const ghValueX = 180;
  const rankCircleX = 360;
  const rankCircleY = 97.5;
  const rankRadius = 50;
  const rankCircumference = 2 * Math.PI * rankRadius;
  const rankProgress = rank.score; 
  const rankDashOffset = rankCircumference - (rankProgress / 100) * rankCircumference;

  // Streak Stats Config
  const streakProgress = longestStreak > 0 ? (currentStreak / longestStreak) * 100 : 0;
  const streakRadius = 40; // Restored to 40
  const streakCircumference = 2 * Math.PI * streakRadius;
  const streakDashOffset = streakCircumference - (streakProgress / 100) * streakCircumference;

  // Icons
  const starIcon = `<path fill="${colors.icon}" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`;
  const commitIcon = `<path fill="${colors.icon}" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/>`;
  const prIcon = `<path fill="${colors.icon}" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zm2.25 7.5a.75.75 0 100 1.5.75.75 0 000-1.5zM1.5 11.5a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zm2.325-9.25a.75.75 0 01.75.75v7.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z"/>`;
  const issueIcon = `<path fill="${colors.icon}" d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0-5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>`;
  const followerIcon = `<path fill="${colors.icon}" d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.507 5.507 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4.001 4.001 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.49 3.49 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.75.75 0 0 1-1.498.179 3.5 3.5 0 0 0-5.136-2.36.75.75 0 1 1-1.01-1.03l.053-.052A2.994 2.994 0 0 1 11 4Zm-5.5 3.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>`;

  const svg = `
  <svg width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.header}; }
      .stat-label { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.label}; }
      .stat-value { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.value}; }
      .rank-label { font: 600 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.value}; }
      .rank-text { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.label}; }
      .label { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.label}; }
      .value { font: 700 28px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.value}; }
      .date { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.date}; }
      .ring { fill: none; stroke: ${colors.ring}; stroke-width: 5; }
      .fire { fill: ${colors.fire}; }
      
      @keyframes fadein {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes rankAnimation {
        from { stroke-dashoffset: ${rankCircumference}; }
        to { stroke-dashoffset: ${rankDashOffset}; }
      }
      @keyframes currstreak {
          0% { font-size: 3px; opacity: 0.2; }
          80% { font-size: 34px; opacity: 1; }
          100% { font-size: 28px; opacity: 1; }
      }
      @keyframes streakRing {
        from { stroke-dashoffset: ${streakCircumference}; }
        to { stroke-dashoffset: ${streakDashOffset}; }
      }
    </style>
    
    <defs>
        <clipPath id="outer_rectangle">
            <rect width="${rightWidth}" height="${height}" rx="4.5"/>
        </clipPath>
        <mask id="mask_out_ring_behind_fire">
            <rect width="${rightWidth}" height="${height}" fill="white"/>
            <ellipse id="mask-ellipse" cx="247.5" cy="32" rx="13" ry="18" fill="black"/>
        </mask>
    </defs>

    <!-- LEFT CARD: GitHub Stats -->
    <g transform="translate(0, 0)">
        <rect x="0.5" y="0.5" rx="4.5" height="${height-1}" width="${leftWidth-1}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1"/>

        <!-- Stats List -->
        <g transform="translate(${ghPadding}, ${ghStartY})">
            
            <!-- Stars -->
            <g transform="translate(0, 0)" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.6s">
                 <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${starIcon}</svg>
                <text x="${ghLabelX - 25}" y="10" class="stat-label">Total Stars</text>
                <text x="${ghValueX}" y="10" class="stat-value">${totalStars}</text>
            </g>

            <!-- Commits -->
            <g transform="translate(0, ${ghLineHeight})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.7s">
                 <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${commitIcon}</svg>
                <text x="${ghLabelX - 25}" y="10" class="stat-label">Total Commits</text>
                <text x="${ghValueX}" y="10" class="stat-value">${totalCommits}</text>
            </g>

            <!-- PRs -->
            <g transform="translate(0, ${ghLineHeight * 2})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.8s">
                 <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${prIcon}</svg>
                <text x="${ghLabelX - 25}" y="10" class="stat-label">Total PRs</text>
                <text x="${ghValueX}" y="10" class="stat-value">${totalPRs}</text>
            </g>

            <!-- Issues -->
            <g transform="translate(0, ${ghLineHeight * 3})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.9s">
                 <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${issueIcon}</svg>
                <text x="${ghLabelX - 25}" y="10" class="stat-label">Total Issues</text>
                <text x="${ghValueX}" y="10" class="stat-value">${totalIssues}</text>
            </g>

            <!-- Followers -->
            <g transform="translate(0, ${ghLineHeight * 4})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 1.0s">
                 <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${followerIcon}</svg>
                <text x="${ghLabelX - 25}" y="10" class="stat-label">Followers</text>
                <text x="${ghValueX}" y="10" class="stat-value">${followers}</text>
            </g>
        </g>

        <!-- Rank Circle -->
        <g transform="translate(${rankCircleX}, ${rankCircleY})">
            <circle cx="0" cy="0" r="${rankRadius}" fill="none" stroke="#e1e4e8" stroke-width="6" />
            <circle cx="0" cy="0" r="${rankRadius}" fill="none" stroke="${colors.ring}" stroke-width="6" stroke-dasharray="${rankCircumference}" stroke-dashoffset="${rankCircumference}" stroke-linecap="round" transform="rotate(-90)" style="animation: rankAnimation 1s forwards ease-in-out"/>
            
            <text x="0" y="5" text-anchor="middle" class="rank-label">${rank.level}</text>
        </g>
    </g>

    <!-- RIGHT CARD: Streak Stats -->
    <g transform="translate(${leftWidth + gap}, 0)">
        <g clip-path="url(#outer_rectangle)">
            <g style="isolation: isolate">
                <rect stroke="${colors.border}" fill="${colors.bg}" rx="4.5" x="0.5" y="0.5" width="${rightWidth - 1}" height="${height - 1}"/>
            </g>
            <g style="isolation: isolate">
                <line x1="165" y1="28" x2="165" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="#E4E2E2" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"/>
                <line x1="330" y1="28" x2="330" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="#E4E2E2" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"/>
            </g>
            <g style="isolation: isolate">
                <!-- Total Contributions big number -->
                <g transform="translate(82.5, 48)">
                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.label}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="700" font-size="28px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.6s">
                        ${totalText}
                    </text>
                </g>

                <!-- Total Contributions label -->
                <g transform="translate(82.5, 84)">
                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.label}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="400" font-size="14px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.7s">
                        Total Contributions
                    </text>
                </g>

                <!-- Total Contributions range -->
                <g transform="translate(82.5, 114)">
                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.date}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="400" font-size="12px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.8s">
                        ${formatDate(firstContributionDate)} - Present
                    </text>
                </g>
            </g>
            <g style="isolation: isolate">
                <!-- Current Streak Group -->
                <g transform="translate(247.5, 48)"> 
                    <g transform="translate(0, 23)"> <!-- Center the ring -->
                        <g mask="url(#mask_out_ring_behind_fire)">
                            <circle cx="0" cy="0" r="${streakRadius}" fill="none" stroke="#e1e4e8" stroke-width="5"/>
                            <circle cx="0" cy="0" r="${streakRadius}" fill="none" stroke="${colors.ring}" stroke-width="5" stroke-dasharray="${streakCircumference}" stroke-dashoffset="${streakCircumference}" stroke-linecap="round" transform="rotate(-90)" style="animation: streakRing 1s forwards ease-in-out 0.5s"/>
                        </g>
                        <!-- Fire icon -->
                        <g transform="translate(0, -52)" stroke-opacity="0" style="opacity: 0; animation: fadein 0.5s linear forwards 0.6s">
                            <path d="M -12 -0.5 L 15 -0.5 L 15 23.5 L -12 23.5 L -12 -0.5 Z" fill="none"/>
                            <path d="M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z" fill="${colors.fire}" stroke-opacity="0"/>
                        </g>
                    </g>

                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.currStreakValue}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="700" font-size="28px" font-style="normal" style="animation: currstreak 0.6s linear forwards">
                        ${currentStreak}
                    </text>
                </g>

                <!-- Current Streak label -->
                <g transform="translate(247.5, 108)">
                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.currStreakLabel}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="700" font-size="14px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.9s">
                        Current Streak
                    </text>
                </g>

                <!-- Current Streak range -->
                <g transform="translate(247.5, 145)">
                    <text x="0" y="21" stroke-width="0" text-anchor="middle" fill="${colors.date}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="400" font-size="12px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.9s">
                        ${formatRange(currentStreakRange.start, currentStreakRange.end)}
                    </text>
                </g>

                <!-- Longest Streak -->
                <g transform="translate(412.5, 48)">
                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.label}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="700" font-size="28px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 1.2s">
                        ${longestStreak}
                    </text>
                </g>

                <!-- Longest Streak label -->
                <g transform="translate(412.5, 84)">
                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.label}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="400" font-size="14px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 1.3s">
                        Longest Streak
                    </text>
                </g>

                <!-- Longest Streak range -->
                <g transform="translate(412.5, 114)">
                    <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${colors.date}" stroke="none" font-family="&quot;Segoe UI&quot;, Ubuntu, sans-serif" font-weight="400" font-size="12px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 1.4s">
                        ${formatRange(longestStreakRange.start, longestStreakRange.end)}
                    </text>
                </g>
            </g>
        </g>
    </g>
  </svg>
  `;
  return svg;
}

module.exports = { generateCombinedStatsSVG };