const fs = require('fs');
const { fetchGitHubData } = require('./api');
const { generateCombinedStatsSVG } = require('./generators/combined-stats');
const { generateRepoCardSVG } = require('./generators/repo-card');

const COMBINED_STATS_FILE = 'images/stats/combined-stats.svg';
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

    console.log('Generating Combined Stats...');
    const combinedStatsSVG = generateCombinedStatsSVG(data);

    // Ensure stats directory exists
    const statsDir = COMBINED_STATS_FILE.substring(0, COMBINED_STATS_FILE.lastIndexOf('/'));
    if (!fs.existsSync(statsDir)) {
        fs.mkdirSync(statsDir, { recursive: true });
    }
    fs.writeFileSync(COMBINED_STATS_FILE, combinedStatsSVG);
    console.log(`Successfully generated ${COMBINED_STATS_FILE}`);
    
    console.log('Generating Repo Cards...');
    const userRepos = data.user.repositories.nodes;
    
    // Ensure pins directory exists
    if (!fs.existsSync(REPO_CARDS_DIR)) {
        fs.mkdirSync(REPO_CARDS_DIR, { recursive: true });
    }
    
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