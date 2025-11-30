const { calculateRank } = require('../utils');

function generateGithubStatsSVG(data) {
  const user = data.user;
  const totalStars = user.repositories.nodes.reduce((acc, repo) => acc + repo.stargazers.totalCount, 0);
  const totalCommits = user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount;
  const totalPRs = user.pullRequests.totalCount;
  const totalIssues = user.issues.totalCount;
  const followers = user.followers ? user.followers.totalCount : 0;
  const repoCount = user.repositories.nodes.length; 

  // Calculate Rank
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

  // Colors
  const colors = {
    bg: '#ffffff',
    border: '#e1e4e8',
    header: '#0969da',
    label: '#333',
    value: '#24292f',
    icon: '#0969da',
    ring: '#2f80ed'
  };

  // Layout
  const cardWidth = 450;
  const cardHeight = 215; // Adjusted for 5 rows without header
  const padding = 25;
  
  // Rank Circle Config
  const circleX = 360;
  const circleY = 107; // Centered vertically (215 / 2)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = rank.score; 
  const dashOffset = circumference - (progress / 100) * circumference;

  // Stats layout
  const lineHeight = 35;
  const startY = 30; // Moved up since header is gone
  const labelX = 55;
  const valueX = 180;

  // Icons
  const starIcon = `<path fill="${colors.icon}" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`;
  const commitIcon = `<path fill="${colors.icon}" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/>`;
  const prIcon = `<path fill="${colors.icon}" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zm2.25 7.5a.75.75 0 100 1.5.75.75 0 000-1.5zM1.5 11.5a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zm2.325-9.25a.75.75 0 01.75.75v7.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z"/>`;
  const issueIcon = `<path fill="${colors.icon}" d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0-5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>`;
  const followerIcon = `<path fill="${colors.icon}" d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.507 5.507 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4.001 4.001 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.49 3.49 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.75.75 0 0 1-1.498.179 3.5 3.5 0 0 0-5.136-2.36.75.75 0 1 1-1.01-1.03l.053-.052A2.994 2.994 0 0 1 11 4Zm-5.5 3.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>`;

  const svg = `
  <svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.header}; }
      .stat-label { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.label}; }
      .stat-value { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.value}; }
      .rank-label { font: 600 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.value}; }
      .rank-text { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.label}; }
      
      @keyframes fadein {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes rankAnimation {
        from { stroke-dashoffset: ${circumference}; }
        to { stroke-dashoffset: ${dashOffset}; }
      }
    </style>
    
    <rect x="0.5" y="0.5" rx="4.5" height="99%" width="99%" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1"/>

    <!-- Stats List -->
    <g transform="translate(25, ${startY})">
        
        <!-- Stars -->
        <g transform="translate(0, 0)" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.6s">
             <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${starIcon}</svg>
            <text x="${labelX - 25}" y="10" class="stat-label">Total Stars</text>
            <text x="${valueX}" y="10" class="stat-value">${totalStars}</text>
        </g>

        <!-- Commits -->
        <g transform="translate(0, ${lineHeight})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.7s">
             <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${commitIcon}</svg>
            <text x="${labelX - 25}" y="10" class="stat-label">Total Commits</text>
            <text x="${valueX}" y="10" class="stat-value">${totalCommits}</text>
        </g>

        <!-- PRs -->
        <g transform="translate(0, ${lineHeight * 2})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.8s">
             <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${prIcon}</svg>
            <text x="${labelX - 25}" y="10" class="stat-label">Total PRs</text>
            <text x="${valueX}" y="10" class="stat-value">${totalPRs}</text>
        </g>

        <!-- Issues -->
        <g transform="translate(0, ${lineHeight * 3})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 0.9s">
             <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${issueIcon}</svg>
            <text x="${labelX - 25}" y="10" class="stat-label">Total Issues</text>
            <text x="${valueX}" y="10" class="stat-value">${totalIssues}</text>
        </g>

        <!-- Followers -->
        <g transform="translate(0, ${lineHeight * 4})" style="opacity: 0; animation: fadein 0.5s ease-in-out forwards 1.0s">
             <svg x="0" y="-5" width="16" height="16" viewBox="0 0 16 16">${followerIcon}</svg>
            <text x="${labelX - 25}" y="10" class="stat-label">Followers</text>
            <text x="${valueX}" y="10" class="stat-value">${followers}</text>
        </g>
    </g>

    <!-- Rank Circle -->
    <g transform="translate(${circleX}, ${circleY})">
        <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#e1e4e8" stroke-width="6" />
        <circle cx="0" cy="0" r="${radius}" fill="none" stroke="${colors.ring}" stroke-width="6" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" stroke-linecap="round" transform="rotate(-90)" style="animation: rankAnimation 1s forwards ease-in-out"/>
        
        <text x="0" y="5" text-anchor="middle" class="rank-label">${rank.level}</text>
    </g>
  </svg>
  `;
  return svg;
}