const fs = require('fs');
const https = require('https');

const TOKEN = process.env.GH_TOKEN;
const USERNAME = 'IvanMurzak';

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
  // 1. Fetch User Info & Creation Date
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

  // 2. Iterate years and fetch contributions
  // We go from createdYear to currentYear.
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

      // Append weeks. Note: GitHub might return overlapping weeks at year boundaries or partial weeks.
      // Usually simply concatenating is "good enough" for streak calc, but ideally we sort later.
      aggregatedContributions.contributionCalendar.weeks.push(...collection.contributionCalendar.weeks);

    } catch (error) {
      console.error(`Failed to fetch data for ${year}:`, error);
    }
  }

  // Merge aggregated data back into the user object structure expected by the generators
  user.contributionsCollection = aggregatedContributions;

  return { user };
}

module.exports = { fetchGitHubData };