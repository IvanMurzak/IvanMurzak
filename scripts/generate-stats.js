const fs = require('fs');
const { fetchGitHubData } = require('./api');
const { generateGithubStatsSVG } = require('./generators/github-stats');
const { generateStreakStatsSVG } = require('./generators/streak-stats');
const { generateRepoCardSVG } = require('./generators/repo-card');

const GITHUB_STATS_FILE = 'images/stats/github-stats.svg';
const STREAK_STATS_FILE = 'images/stats/streak-stats.svg';
const REPO_CARDS_DIR = 'images/pins';

const REPOS_TO_PIN = [
  'Unity-MCP',
  'Unity-ImageLoader',
  'Unity-Theme',
  'Unity-Gyroscope-Parallax',
  'Unity-Package-Template',
  'Unity-Mouse-Parallax',
  'Unity-PlayerPrefsEx',
  'Unity-EFCore-SQLite',
  'Unity-Saver',
  'Unity-AudioLoader',
  'Unity-IAP-Store',
  'Unity-NonDrawingGraphic',
  'UBuilder',
  'Unity-Network-REST',
  'Unity-Appodeal-Simplifier',
  'Unity-Gyroscope-Manager',
  'Unity-Extensions',
  'Unity-iOS-Pods-Bitcode',
  'Unity-Mobile-Notifications-Simplifier'
];

async function main() {
  try {
    console.log('Fetching GitHub data...');
    const data = await fetchGitHubData();

    console.log('Generating GitHub Stats...');
    const githubStatsSVG = generateGithubStatsSVG(data);
    fs.writeFileSync(GITHUB_STATS_FILE, githubStatsSVG);
    console.log(`Successfully generated ${GITHUB_STATS_FILE}`);

    console.log('Generating Streak Stats...');
    const streakStatsSVG = generateStreakStatsSVG(data);
    fs.writeFileSync(STREAK_STATS_FILE, streakStatsSVG);
    console.log(`Successfully generated ${STREAK_STATS_FILE}`);
    
    console.log('Generating Repo Cards...');
    const userRepos = data.user.repositories.nodes;
    
    for (const repoName of REPOS_TO_PIN) {
        const repo = userRepos.find(r => r.name === repoName);
        if (repo) {
            const svg = generateRepoCardSVG(repo);
            const filePath = `${REPO_CARDS_DIR}/${repoName}.svg`;
            fs.writeFileSync(filePath, svg);
            console.log(`Generated ${filePath}`);
        } else {
            console.warn(`Repo not found: ${repoName}`);
        }
    }

  } catch (error) {
    console.error('Error generating stats:', error);
    process.exit(1);
  }
}

main();