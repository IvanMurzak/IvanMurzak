const https = require('https');

const TOKEN = process.env.GH_TOKEN;
const USERNAME = 'IvanMurzak';
const NPM_USERNAME = 'baizor';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpJSON(hostname, path, extraHeaders = {}) {
  const options = {
    hostname,
    path,
    method: 'GET',
    headers: { 'User-Agent': 'Node.js Script', ...extraHeaders },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Bad JSON from ${hostname}${path}: ${data.slice(0, 120)}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Retry wrapper with backoff — public APIs (npm especially) rate-limit bursts.
// Cloudflare 1015 blocks need long cool-downs, so back off aggressively.
async function httpJSONRetry(hostname, path, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await httpJSON(hostname, path);
      await sleep(hostname.includes('npmjs') ? 500 : 250);
      return r;
    } catch (e) {
      if (i === attempts - 1) {
        console.warn(`  giving up on ${hostname}${path}: ${e.message}`);
        return null;
      }
      await sleep(5000 * (i + 1));
    }
  }
  return null;
}

function postGraphQL(query) {
  const options = {
    hostname: 'api.github.com',
    path: '/graphql',
    method: 'POST',
    headers: {
      'Authorization': `bearer ${TOKEN}`,
      'User-Agent': 'Node.js Script',
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errors) {
            reject(new Error(JSON.stringify(json.errors)));
          } else {
            resolve(json.data);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

async function fetchGitHubData() {
  if (!TOKEN) {
    throw new Error('GH_TOKEN is not set.');
  }

  console.log('Fetching basic user info...');
  const userInfoQuery = `
    query {
      user(login: "${USERNAME}") {
        name
        login
        createdAt
        followers {
          totalCount
        }
        pullRequests(first: 1) {
          totalCount
        }
        issues(first: 1) {
          totalCount
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
          nodes {
            name
            description
            stargazers {
              totalCount
            }
            forkCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
    }
  `;

  const basicData = await postGraphQL(userInfoQuery);
  const user = basicData.user;
  const createdYear = new Date(user.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();

  console.log(`User created in ${createdYear}. Fetching history from then to ${currentYear}...`);

  let aggregatedContributions = {
    totalCommitContributions: 0,
    restrictedContributionsCount: 0,
    contributionCalendar: {
      totalContributions: 0,
      weeks: []
    }
  };

  for (let year = createdYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const contributionQuery = `
      query {
        user(login: "${USERNAME}") {
          contributionsCollection(from: "${from}", to: "${to}") {
            totalCommitContributions
            restrictedContributionsCount
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    console.log(`Fetching contributions for ${year}...`);
    try {
      const yearData = await postGraphQL(contributionQuery);
      const collection = yearData.user.contributionsCollection;

      aggregatedContributions.totalCommitContributions += collection.totalCommitContributions;
      aggregatedContributions.restrictedContributionsCount += collection.restrictedContributionsCount;
      aggregatedContributions.contributionCalendar.totalContributions += collection.contributionCalendar.totalContributions;
      aggregatedContributions.contributionCalendar.weeks.push(...collection.contributionCalendar.weeks);

    } catch (error) {
      console.error(`Failed to fetch data for ${year}:`, error);
    }
  }

  // Year-window queries include future days of the current year as zeros —
  // drop them so month grouping and streak math see only real days.
  const todayISO = new Date().toISOString().slice(0, 10);
  aggregatedContributions.contributionCalendar.weeks = aggregatedContributions.contributionCalendar.weeks
    .map((w) => ({ contributionDays: w.contributionDays.filter((d) => d.date <= todayISO) }))
    .filter((w) => w.contributionDays.length > 0);

  user.contributionsCollection = aggregatedContributions;

  return { user };
}

// Deduped, date-sorted days from the aggregated contribution calendar.
// GitHub returns per-year calendars that can overlap at year boundaries.
function calendarDays(user) {
  const byDate = new Map();
  for (const week of user.contributionsCollection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      byDate.set(day.date, day.contributionCount);
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

// Contributions grouped per calendar month, last `count` months.
function monthlyContributions(user, count = 36) {
  const totals = {};
  for (const { date, count: c } of calendarDays(user)) {
    const key = date.slice(0, 7); // YYYY-MM
    totals[key] = (totals[key] || 0) + c;
  }
  return Object.keys(totals)
    .sort()
    .map((m) => ({ m, c: totals[m] }))
    .slice(-count);
}

// Per-day contributions for the last `count` days (up to and including today).
function dailyContributions(user, count = 40) {
  const days = calendarDays(user);
  const todayISO = new Date().toISOString().slice(0, 10);
  const upToToday = days.filter((d) => d.date <= todayISO);
  return upToToday.slice(-count).map((d) => ({ d: d.date, c: d.count }));
}

// ---------------------------------------------------------------------------
// OpenUPM: enumerate ALL packages owned by the user, no hardcoded lists.
// 1. /-/all registry listing → match author/maintainer.
// 2. Author-less entries with plausible prefixes → verify via the package's
//    full registry doc (repository.url must point to the user's GitHub).
// Returns { total, packages: [{ name, downloads, repo }] } where repo is the
// GitHub repo name extracted from the latest version's repository.url.
// ---------------------------------------------------------------------------
async function fetchOpenUPMAll() {
  console.log('OpenUPM: listing registry...');
  const all = await httpJSONRetry('package.openupm.com', '/-/all');
  if (!all) return { total: 0, packages: [] };

  const authorRe = /ivan ?murzak|github\.com\/IvanMurzak/i;
  const matched = [];
  const candidates = [];

  for (const [name, p] of Object.entries(all)) {
    if (name === '_updated' || name.startsWith('org.nuget.')) continue;
    const author = ((p.author && (p.author.name || '')) + ' ' + ((p.author && p.author.url) || ''));
    const maints = (p.maintainers || []).map((m) => m.name).join(' ');
    if (authorRe.test(author) || authorRe.test(maints)) {
      matched.push(name);
    } else if (!p.author && !(p.maintainers || []).length && /^(extensions\.unity|com\.(github\.)?ivanmurzak)/i.test(name)) {
      candidates.push(name);
    }
  }

  const packages = [];
  let total = 0;

  async function addPackage(name, requireRepoOwner) {
    const doc = await httpJSONRetry('package.openupm.com', '/' + name);
    let repo = null;
    if (doc && doc.versions && doc['dist-tags'] && doc['dist-tags'].latest) {
      const v = doc.versions[doc['dist-tags'].latest];
      const url = (v && v.repository && (v.repository.url || v.repository)) || (v && v.homepage) || '';
      const m = String(url).match(/github\.com\/IvanMurzak\/([\w.-]+?)(?:\.git|#|$)/i);
      if (m) repo = m[1];
    }
    if (requireRepoOwner && !repo) return; // candidate not verified as ours
    const dl = await httpJSONRetry('package.openupm.com', '/downloads/point/all-time/' + name);
    const downloads = (dl && dl.downloads) || 0;
    packages.push({ name, downloads, repo });
    total += downloads;
  }

  for (const name of matched) await addPackage(name, false);
  for (const name of candidates) await addPackage(name, true);

  console.log(`OpenUPM: ${packages.length} packages, ${total} downloads total`);
  return { total, packages };
}

// ---------------------------------------------------------------------------
// NuGet: enumerate all packages owned by the profile via the v3 Search API.
// The API has no owner: qualifier, so we search related terms and filter the
// `owners` field, paging where needed. Each package's projectUrl points at
// its GitHub repo, which lets pin cards show per-repo NuGet downloads.
// ---------------------------------------------------------------------------
async function fetchNuGetAll() {
  console.log('NuGet: searching packages...');
  const queries = [USERNAME, `com.${USERNAME}`, 'McpPlugin', 'ReflectorNet'];
  const repoRe = new RegExp(`github\\.com\\/${USERNAME}\\/([\\w.-]+?)(?:\\.git|\\/|#|$)`, 'i');
  const seen = new Map();
  for (const q of queries) {
    const r = await httpJSONRetry('azuresearch-usnc.nuget.org', `/query?q=${encodeURIComponent(q)}&take=100&prerelease=true`);
    for (const p of (r && r.data) || []) {
      const owners = (p.owners || []).map((o) => o.toLowerCase());
      if (owners.includes(USERNAME.toLowerCase())) {
        const m = String(p.projectUrl || '').match(repoRe);
        seen.set(p.id, { downloads: p.totalDownloads, repo: m ? m[1] : null });
      }
    }
  }
  const packages = [...seen.entries()].map(([name, v]) => ({ name, downloads: v.downloads, repo: v.repo }));
  const total = packages.reduce((a, p) => a + p.downloads, 0);
  console.log(`NuGet: ${packages.length} packages, ${total} downloads total`);
  return { total, packages };
}

// ---------------------------------------------------------------------------
// npm: enumerate all packages of the maintainer, then sum all-time downloads.
// The downloads API caps ranges at ~18 months, so we walk 540-day windows
// starting from each package's creation date.
// ---------------------------------------------------------------------------
async function fetchNpmAll() {
  console.log('npm: searching packages...');
  const names = [];
  for (let from = 0; ; from += 250) {
    const r = await httpJSONRetry('registry.npmjs.org', `/-/v1/search?text=maintainer:${NPM_USERNAME}&size=250&from=${from}`);
    const objects = (r && r.objects) || [];
    names.push(...objects.map((o) => o.package.name));
    if (objects.length < 250) break;
  }

  const day = (d) => d.toISOString().slice(0, 10);
  const now = new Date();
  const floor = new Date('2015-01-10'); // earliest date the downloads API supports
  const packages = [];
  let total = 0;

  for (const name of names) {
    const meta = await httpJSONRetry('registry.npmjs.org', '/' + encodeURIComponent(name));
    const created = new Date((meta && meta.time && meta.time.created) || floor);
    let start = created < floor ? floor : created;
    let sum = 0;
    while (start < now) {
      let end = new Date(start.getTime() + 540 * 24 * 3600 * 1000);
      if (end > now) end = now;
      const r = await httpJSONRetry('api.npmjs.org', `/downloads/range/${day(start)}:${day(end)}/${encodeURIComponent(name)}`);
      if (r && r.downloads) sum += r.downloads.reduce((a, d) => a + d.downloads, 0);
      start = new Date(end.getTime() + 24 * 3600 * 1000);
    }
    packages.push({ name, downloads: sum });
    total += sum;
  }

  console.log(`npm: ${packages.length} packages, ${total} downloads total`);
  return { total, packages };
}

module.exports = {
  fetchGitHubData,
  monthlyContributions,
  dailyContributions,
  fetchOpenUPMAll,
  fetchNuGetAll,
  fetchNpmAll,
};
