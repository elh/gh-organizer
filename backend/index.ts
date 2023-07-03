import express from 'express';
import dotenv from 'dotenv';
import { Octokit } from "octokit";

// env vars
dotenv.config();
if (!process.env.GH_TOKEN || !process.env.GH_ORG) {
  console.error('GH_TOKEN and GH_ORG env vars are required');
  process.exit(1);
}

// set up
const app = express();
const port = process.env.PORT || 4000;
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

// app + routes
app.get('/org', async (_, res) => {
  try {
    const resp = await octokit.request("POST /graphql", {
      query: `query ($login: String!) {
        organization(login: $login) {
          avatarUrl
          description
          name
        }
      }`,
      variables: {
        login: process.env.GH_ORG,
      },
    });
    res.json(resp);
  } catch(err) {
    console.error(err);
    res.status(500).json({'error': 'Error querying Github'});
  }
});

// query params:
// * cursor - cursor from pageInfo.endCursor
app.get('/members', async (req, res) => {
  const pageSize = 20;
  // no pull request information
  try {
    const resp = await octokit.request("POST /graphql", {
      query: `query ($login: String!, $after: String, $pageSize: Int!) {
        organization(login: $login) {
          membersWithRole(first: $pageSize, after: $after) {
            totalCount
            pageInfo {
              endCursor
              hasNextPage
            }
            nodes {
              # bio
              login
              name
              avatarUrl
              pronouns
              bio
              status {
                emoji
                message
              }
              email
              twitterUsername
              websiteUrl
              # attributes. not querying pull requests here. just some other simple stats
              followers {
                totalCount
              }
              following {
                totalCount
              }
              organizations(first: 100) {
                totalCount
                pageInfo {
                  endCursor
                  hasNextPage
                }
                nodes {
                  login
                  name
                }
              }
              repositories(isFork: false, privacy: PUBLIC) {
                totalCount
              }
              socialAccounts(first: 100) {
                totalCount
                pageInfo {
                  endCursor
                  hasNextPage
                }
                nodes {
                  displayName
                  provider
                  url
                }
              }
              sponsors {
                totalCount
              }
              starredRepositories {
                totalCount
              }
            }
          }
        }
      }`,
      variables: {
        login: process.env.GH_ORG,
        pageSize: pageSize,
        after: req.query['cursor'] || null,
      },
    });
    if (resp.data.errors) {
      console.error(resp.data.errors);
      res.status(500).json({'error': 'Error querying Github'});
      return;
    }
    const out = resp.data.data.organization.membersWithRole;
    res.json(out);
  } catch(err) {
    console.error(err);
    res.status(500).json({'error': 'Error querying Github'});
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
