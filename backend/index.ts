import express from 'express';
import dotenv from 'dotenv';
import { Octokit } from "octokit";
import {getOrg, getMembers, getPRStats} from './gh';

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

// serve data/data.json
app.use('/data', express.static('data'));

// query params: none
app.get('/org', async (_, res) => {
  try {
    const resp = await getOrg(octokit, String(process.env.GH_ORG));
    res.json(resp);
  } catch(err) {
    console.error(err);
    res.status(500).json({'error': 'Error querying Github'});
  }
});

// query params:
// * cursor - cursor from pageInfo.endCursor
app.get('/members', async (req, res) => {
  // no pull request information
  try {
    const cursor = typeof req.query['cursor'] === 'string' && req.query['cursor'] !== '' ? req.query['cursor'] : null;
    const resp = await getMembers(octokit, String(process.env.GH_ORG), cursor);
    res.json(resp);
  } catch(err) {
    console.error(err);
    res.status(500).json({'error': 'Error querying Github'});
  }
});

// query params:
// * login - member login
app.get('/pull_stats', async (req, res) => {
  try {
    const resp = await getPRStats(octokit, String(process.env.GH_ORG), String(req.query['login']));
    res.json(resp);
  } catch(err) {
    console.error(err);
    res.status(500).json({'error': 'Error querying Github'});
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
