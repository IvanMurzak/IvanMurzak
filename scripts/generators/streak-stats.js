function generateStreakStatsSVG(data) {
  const contributionCalendar = data.user.contributionsCollection.contributionCalendar;
  const weeks = contributionCalendar.weeks;
  const days = weeks.flatMap(week => week.contributionDays);

  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakRange = { start: null, end: null };
  let longestStreakRange = { start: null, end: null };
  
  // Sort days by date just in case
  days.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate streaks
  let tempStreak = 0;
  let tempStart = null;

  // Check if today has contributions.
  // Note: The last day in the list is usually today (or yesterday if timezone differs).
  // We iterate backwards for current streak.
  
  // Current Streak
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // We need to be careful about timezone.
  // The API returns dates in YYYY-MM-DD.
  
  let streakActive = true;
  
  // Iterate backwards to find current streak
  for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      const count = day.contributionCount;
      
      // If we are just starting (most recent day)
      if (i === days.length - 1) {
          if (count > 0) {
              currentStreak++;
              currentStreakRange.end = day.date;
              currentStreakRange.start = day.date;
          } else {
              // If today has 0, streak might still be active if yesterday had contributions
              // But wait, usually "current streak" implies you contributed today OR yesterday (if today isn't over).
              // However, strictly, if today is 0, streak is 0 unless we allow a "grace period" for today.
              // Most streak counters count "today" as 0 if no contribution yet, but if yesterday had one, it shows that.
              // Let's be strict: if the last day (today) is 0, check yesterday.
              streakActive = false; // Tentatively false
          }
      } else {
          // Previous days
          if (count > 0) {
              if (currentStreak === 0 && !streakActive) {
                  // This means the last day (today) was 0, but this one (yesterday) is > 0.
                  // Check if it is indeed yesterday.
                  const d1 = new Date(days[i+1].date);
                  const d2 = new Date(day.date);
                  const diffTime = Math.abs(d1 - d2);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                  
                  if (diffDays <= 1) {
                       currentStreak++;
                       currentStreakRange.end = day.date; // Streak ends yesterday
                       currentStreakRange.start = day.date;
                       streakActive = true; // Reactivate
                  } else {
                      break; // Gap too big
                  }
              } else if (currentStreak > 0 || streakActive) {
                  currentStreak++;
                  currentStreakRange.start = day.date;
              }
          } else {
              // count == 0
              if (currentStreak > 0) break; // Streak broken
          }
      }
  }
  
  // Longest Streak
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
  // Check last streak
  if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
      longestStreakRange.start = tempStart;
      longestStreakRange.end = days[days.length-1].date;
  }
  
  const totalContributions = contributionCalendar.totalContributions;
  const firstContributionDate = days[0].date; // Approximate start of year/record
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

  const currentStreakText = `${currentStreak} days`;
  const longestStreakText = `${longestStreak} days`;
  const totalText = `${totalContributions.toLocaleString()}`;
  
  const cardWidth = 495;
  const cardHeight = 195;

  const svg = `
  <svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      .label { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #006AFF; }
      .value { font: 700 28px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333; }
      .date { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #777; }
      .ring { fill: none; stroke: #006AFF; stroke-width: 5; }
      .fire { fill: #006AFF; }
    </style>
    
    <rect x="0.5" y="0.5" rx="4.5" height="99%" width="99%" fill="none" stroke="#e1e4e8" stroke-opacity="0"/>
    
    <!-- Separators -->
    <line x1="165" y1="28" x2="165" y2="170" stroke="#E4E2E2" stroke-width="1"/>
    <line x1="330" y1="28" x2="330" y2="170" stroke="#E4E2E2" stroke-width="1"/>

    <!-- Total Contributions -->
    <g transform="translate(82.5, 48)">
        <text x="0" y="32" text-anchor="middle" class="value" fill="#006AFF">${totalText}</text>
    </g>
    <g transform="translate(82.5, 84)">
        <text x="0" y="32" text-anchor="middle" class="label">Total Contributions</text>
    </g>
    <g transform="translate(82.5, 114)">
        <text x="0" y="32" text-anchor="middle" class="date">${formatDate(firstContributionDate)} - Present</text>
    </g>

    <!-- Current Streak -->
    <g transform="translate(247.5, 48)">
        <text x="0" y="32" text-anchor="middle" class="value" fill="#0579C3">${currentStreak}</text>
    </g>
    <g transform="translate(247.5, 108)">
        <text x="0" y="32" text-anchor="middle" class="label" fill="#0579C3">Current Streak</text>
    </g>
    <g transform="translate(247.5, 145)">
        <text x="0" y="21" text-anchor="middle" class="date">${formatRange(currentStreakRange.start, currentStreakRange.end)}</text>
    </g>
     <!-- Fire Icon Placeholder (Simplified) -->
    <g transform="translate(247.5, 20)">
       <path d="M -6 0 L 6 0 L 0 12 Z" fill="#006AFF" />
    </g>

    <!-- Longest Streak -->
    <g transform="translate(412.5, 48)">
        <text x="0" y="32" text-anchor="middle" class="value" fill="#006AFF">${longestStreak}</text>
    </g>
    <g transform="translate(412.5, 84)">
        <text x="0" y="32" text-anchor="middle" class="label">Longest Streak</text>
    </g>
    <g transform="translate(412.5, 114)">
         <text x="0" y="32" text-anchor="middle" class="date">${formatRange(longestStreakRange.start, longestStreakRange.end)}</text>
    </g>

  </svg>
  `;
  return svg;
}

module.exports = { generateStreakStatsSVG };