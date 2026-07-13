const fs = require('fs');
const {
  fetchGitHubData,
  monthlyContributions,
  dailyContributions,
  fetchOpenUPMAll,
  fetchNuGetAll,
  fetchNpmAll,
} = require('./api');
const { THEMES } = require('./theme');
const { generateCombinedStatsSVG } = require('./generators/combined-stats');
const { generateRepoCardSVG } = require('./generators/repo-card');
const { generateHeroSVG } = require('./generators/hero');
const { generateCommitsMonthlySVG } = require('./generators/commits-monthly');
const { generateFlagshipSVG } = require('./generators/flagship');
const { generateTechStackSVG } = require('./generators/tech-stack');
const { generateActivityPulseSVG } = require('./generators/activity-pulse');
const { generateWavesSVG } = require('./generators/waves');

const STATS_DIR = 'images/stats';
const PINS_DIR = 'images/pins';

const FLAGSHIP_REPO = 'Unity-MCP';
const FLAGSHIP_EYEBROW = 'FLAGSHIP · THE MOST POPULAR OPEN-SOURCE AI ASSISTANT FOR UNITY ENGINE';

// Which repos get a pin card. Display selection only — all download counts
// are discovered automatically from the registries (see api.js).
const REPOS_TO_PIN = [
  // AI
  'Unity-MCP',
  'Godot-MCP',
  'Unreal-MCP',
  'MCP-Plugin-dotnet',
  'ReflectorNet',
  'Unity-AI-Animation',
  'Unity-AI-ProBuilder',
  'Unity-AI-ParticleSystem',
  'Unity-AI-Tools-Template',
  // Godot
  'Godot-AI-Animation',
  'Godot-AI-Particles',
  'Godot-AI-Terrain3D',
  'Godot-AI-Dialogic',
  'Godot-AI-Beehave',
  'Godot-AI-PhantomCamera',
  'Godot-AI-GridMap',
  'Godot-AI-CSG',
  'Godot-AI-Navigation',
  'Godot-AI-Tilemap',
  'Godot-AI-Tools-Template',
  // Unreal
  'Unreal-AI-Niagara',
  'Unreal-AI-ControlRig',
  'Unreal-AI-Landscape',
  'Unreal-AI-GAS',
  'Unreal-AI-PCG',
  'Unreal-AI-EnhancedInput',
  'Unreal-AI-Template',
  // Unity
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
  'Unity-Mobile-Notifications-Simplifier',
];

function writeSVG(path, svg) {
  fs.writeFileSync(path, svg);
  console.log(`Generated ${path}`);
}

async function main() {
  try {
    for (const dir of [STATS_DIR, PINS_DIR]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    console.log('Fetching GitHub data...');
    const data = await fetchGitHubData();
    const userRepos = data.user.repositories.nodes;
    const monthly = monthlyContributions(data.user, 36);
    const daily = dailyContributions(data.user, 40);

    const openupm = await fetchOpenUPMAll();
    const nuget = await fetchNuGetAll();
    const npm = await fetchNpmAll();

    // Registry APIs fail soft (httpJSONRetry returns null after giving up).
    // A zero total means the API was unreachable, not that downloads dropped —
    // abort so the daily workflow never commits zeroed-out numbers.
    for (const [name, r] of [['OpenUPM', openupm], ['NuGet', nuget], ['npm', npm]]) {
      if (!r.total || !r.packages.length) {
        throw new Error(`${name} enumeration returned no data — refusing to write stale stats.`);
      }
    }

    // Downloads grouped by GitHub repo: OpenUPM packages map through their
    // repository.url, NuGet packages through their projectUrl. A repo shipping
    // on both registries shows the combined total.
    const downloadsByRepo = {};
    for (const p of [...openupm.packages, ...nuget.packages]) {
      if (p.repo) downloadsByRepo[p.repo] = (downloadsByRepo[p.repo] || 0) + p.downloads;
    }

    const heroData = {
      stars: userRepos.reduce((a, r) => a + r.stargazers.totalCount, 0),
      openupm: openupm.total,
      nuget: nuget.total,
      npm: npm.total,
      followers: data.user.followers ? data.user.followers.totalCount : 0,
    };
    console.log('Hero data:', JSON.stringify(heroData));

    for (const themeName of ['dark', 'light']) {
      const theme = THEMES[themeName];

      writeSVG(`${STATS_DIR}/hero-${themeName}.svg`, generateHeroSVG(theme, heroData));
      writeSVG(`${STATS_DIR}/combined-stats-${themeName}.svg`, generateCombinedStatsSVG(theme, data));
      writeSVG(`${STATS_DIR}/commits-monthly-${themeName}.svg`, generateCommitsMonthlySVG(theme, monthly));
      writeSVG(`${STATS_DIR}/tech-stack-${themeName}.svg`, generateTechStackSVG(theme));
      writeSVG(`${STATS_DIR}/activity-pulse-${themeName}.svg`, generateActivityPulseSVG(theme, daily));
      writeSVG(`${STATS_DIR}/waves-${themeName}.svg`, generateWavesSVG(theme));

      const flagship = userRepos.find((r) => r.name === FLAGSHIP_REPO);
      if (flagship) {
        writeSVG(
          `${STATS_DIR}/flagship-${themeName}.svg`,
          generateFlagshipSVG(theme, flagship, downloadsByRepo[FLAGSHIP_REPO] || null, FLAGSHIP_EYEBROW)
        );
      }

      REPOS_TO_PIN.forEach((repoName, index) => {
        const repo = userRepos.find((r) => r.name === repoName);
        if (!repo) {
          console.warn(`Repo not found: ${repoName}`);
          return;
        }
        const svg = generateRepoCardSVG(theme, repo, downloadsByRepo[repoName] || null, index);
        writeSVG(`${PINS_DIR}/${repoName}-${themeName}.svg`, svg);
      });
    }
  } catch (error) {
    console.error('Error generating stats:', error);
    process.exit(1);
  }
}

main();
