const fs = require('fs');
const https = require('https');

const TOKEN = process.env.GH_TOKEN;
const USERNAME = 'IvanMurzak';

function fetchGitHubData() {
  if (!TOKEN) {
    throw new Error('GH_TOKEN is not set.');
  }

  const query = `
    query {
      user(login: "${USERNAME}") {
        name
        login
        createdAt
        contributionsCollection {
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

module.exports = { fetchGitHubData };