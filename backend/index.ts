import express from 'express';
import dotenv from 'dotenv';
// import { Octokit } from "octokit";

// env vars
dotenv.config();
if (!process.env.GH_TOKEN || !process.env.GH_ORG) {
  console.error('GH_TOKEN and GH_ORG env vars are required');
  process.exit(1);
}

// set up
// const octokit = new Octokit({
//   auth: process.env.GH_TOKEN,
// });

// env vars
dotenv.config();
const port = process.env.PORT || 4000;

// serve data/data.json
const app = express();
app.use('/data', express.static('data'));

// app.get('/repo_pull_requests', async (req, res) => {
//   // no pull request information
//   try {
//     const cursor = typeof req.query['cursor'] === 'string' && req.query['cursor'] !== '' ? req.query['cursor'] : null;
//     const repo = typeof req.query['repo'] === 'string' && req.query['repo'] !== '' ? req.query['repo'] : "";
//     const resp = await getRepoPullRequests(octokit, String(process.env.GH_ORG), repo, cursor);
//     res.json(resp);
//   } catch(err) {
//     console.error(JSON.stringify(err, null, 2));
//     res.status(500).json({'error': 'Error querying Github'});
//   }
// });

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
