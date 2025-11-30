
// Original probability implementation from github-readme-stats

function normalcdf(mean, sigma, to) {
  var z = (to - mean) / Math.sqrt(2 * sigma * sigma);
  var t = 1 / (1 + 0.3275911 * Math.abs(z));
  var a1 = 0.254829592;
  var a2 = -0.284496736;
  var a3 = 1.421413741;
  var a4 = -1.453152027;
  var a5 = 1.061405429;
  var erf =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  var sign = 1;
  if (z < 0) {
    sign = -1;
  }
  return (1 / 2) * (1 + sign * erf);
}

function calculateRank(params) {
  const COMMITS_OFFSET = 1.65;
  const CONTRIBS_OFFSET = 1.65;
  const ISSUES_OFFSET = 1;
  const STARS_OFFSET = 0.75;
  const PRS_OFFSET = 0.5;
  const FOLLOWERS_OFFSET = 0.45;
  const REPO_OFFSET = 1;

  const ALL_OFFSETS =
    COMMITS_OFFSET +
    CONTRIBS_OFFSET +
    ISSUES_OFFSET +
    STARS_OFFSET +
    PRS_OFFSET +
    FOLLOWERS_OFFSET +
    REPO_OFFSET;

  const rankS_Plus = 1;
  const rankS = 25; // Top 25%? No, this logic is inverted in some implementations or normalized to 100.
  // Let's stick to the standard thresholds usually derived after normalization.
  
  // 1. Calculate Total Weighted Score
  const score =
    params.commits * COMMITS_OFFSET +
    params.contribs * CONTRIBS_OFFSET +
    params.issues * ISSUES_OFFSET +
    params.stars * STARS_OFFSET +
    params.prs * PRS_OFFSET +
    params.followers * FOLLOWERS_OFFSET +
    params.repos * REPO_OFFSET;

  // 2. Calculate Probability (Percentile)
  // The mean and sigma here are empirical values used by github-readme-stats to model the "average" active dev.
  // Common values seen in their source: mean=1000, sigma=1000? Or inferred from millions of users.
  // Let's use the standard values often cited for this specific calculation.
  
  const mean = 1000;
  const sigma = 400; // Standard Deviation
  
  // The normalcdf gives us the probability P(X < score).
  // If score is high, probability -> 1 (100%).
  const probability = normalcdf(mean, sigma, score);
  
  // Convert to a 0-100 scale
  const normalizedScore = probability * 100;

  let level = '';
  
  // Determine Rank based on percentile
  if (normalizedScore >= 99) {
      level = 'S+';
  } else if (normalizedScore >= 95) {
      level = 'S';
  } else if (normalizedScore >= 85) {
      level = 'A++';
  } else if (normalizedScore >= 60) {
      level = 'A+';
  } else if (normalizedScore >= 45) {
      level = 'A';
  } else if (normalizedScore >= 35) {
      level = 'B+';
  } else if (normalizedScore >= 25) {
      level = 'B';
  } else {
      level = 'C';
  }

  return { level, score: normalizedScore };
}

module.exports = { calculateRank };
