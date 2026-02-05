const fs = require('fs');
const { fetchGitHubData, fetchOpenUPMDownloads } = require('./api');
const { generateCombinedStatsSVG } = require('./generators/combined-stats');
const { generateRepoCardSVG } = require('./generators/repo-card');

const COMBINED_STATS_FILE = 'images/stats/combined-stats.svg';
const REPO_CARDS_DIR = 'images/pins';

const REPOS_TO_PIN = [
  { name: 'Unity-MCP', packageId: 'com.ivanmurzak.unity.mcp' },
  { name: 'Unity-ImageLoader', packageId: 'extensions.unity.imageloader' },
  { name: 'Unity-Theme', packageId: 'extensions.unity.theme' },
  { name: 'Unity-Gyroscope-Parallax', packageId: 'extensions.unity.gyroscope.parallax' },
  { name: 'Unity-Package-Template' },
  { name: 'Unity-Mouse-Parallax', packageId: 'extensions.unity.mouse.parallax' },
  { name: 'Unity-PlayerPrefsEx', packageId: 'extensions.unity.playerprefsex' },
  { name: 'Unity-EFCore-SQLite' },
  { name: 'Unity-Saver', packageId: 'extensions.unity.saver' },
  { name: 'Unity-AudioLoader', packageId: 'extensions.unity.audioloader' },
  { name: 'Unity-IAP-Store', packageId: 'extensions.unity.iap.store' },
  { name: 'Unity-NonDrawingGraphic', packageId: 'extensions.unity.nondrawinggraphic' },
  { name: 'UBuilder', packageId: 'extensions.unity.ubuilder' },
  { name: 'Unity-Network-REST' },
  { name: 'Unity-Appodeal-Simplifier' },
  { name: 'Unity-Gyroscope-Manager' },
  { name: 'Unity-Extensions' },
  { name: 'Unity-iOS-Pods-Bitcode' },
  { name: 'Unity-Mobile-Notifications-Simplifier' },
  { name: 'Unity-AI-Tools-Template' },
  { name: 'Unity-AI-Animation', packageId: 'com.ivanmurzak.unity.mcp.ai.animation' },
  { name: 'Unity-AI-ProBuilder', packageId: 'com.ivanmurzak.unity.mcp.ai.probuilder' },
  { name: 'Unity-AI-ParticleSystem', packageId: 'com.ivanmurzak.unity.mcp.ai.particlesystem' },
  { name: 'ReflectorNet' },
  { name: 'MCP-Plugin-dotnet' }
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

    for (const repoConfig of REPOS_TO_PIN) {
      const repoName = repoConfig.name;
      const packageId = repoConfig.packageId;
      const repo = userRepos.find(r => r.name === repoName);
      if (repo) {
        let downloads = null;
        if (packageId) {
          console.log(`Fetching downloads for ${packageId}...`);
          downloads = await fetchOpenUPMDownloads(packageId);
          if (downloads !== null) {
            console.log(`  Downloads: ${downloads}`);
          }
        }
        const svg = generateRepoCardSVG(repo, downloads);
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