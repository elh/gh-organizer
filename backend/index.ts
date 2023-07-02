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
const port = process.env.PORT || 3000;
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

// app + routes
app.get('/', async (req, res) => {
  req.query
  try {
    const resp = await octokit.request("GET /orgs/{org}/members", {
      org: process.env.GH_ORG || "",
      per_page: 100
    });
    res.json(resp);
  } catch(err) {
    console.error(err);
    res.status(500).json({'error': 'Error querying Github'});
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
