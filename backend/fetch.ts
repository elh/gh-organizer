import dotenv from 'dotenv';
import fs from 'fs/promises';
import { Octokit } from "octokit";
import {getOrg, getMembers, getPRStats} from './gh';

// env vars
dotenv.config();
if (!process.env.GH_TOKEN || !process.env.GH_ORG) {
  console.error('GH_TOKEN and GH_ORG env vars are required');
  process.exit(1);
}

// set up
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

async function fetch() {
  try {
    const data: Record<string, any> = {};

    console.time('getOrg')
    data['org'] = await getOrg(octokit, String(process.env.GH_ORG));
    console.timeEnd('getOrg')
    await fs.writeFile('data/data.json', JSON.stringify(data, null, 2));

    data['members'] = [];
    let cursor: string | null = null;
    let done = false;
    console.time('getMembers - all')
    while (!done) { // ts really doesn't like constant condition loops
      console.time('getMembers')
      const resp = await getMembers(octokit, String(process.env.GH_ORG), cursor);
      console.timeEnd('getMembers')
      data['members'] = data['members'].concat(resp.nodes);
      await fs.writeFile('data/data.json', JSON.stringify(data, null, 2));

      if (!resp.pageInfo.hasNextPage) {
        done = true;
        break;
      }
      cursor = resp.pageInfo.endCursor;
    }
    console.timeEnd('getMembers - all')

    // TODO: do this in a promise pool. why isn't there an obvious solution to this in ts...
    console.time('getPRStats - all')
    for (const member of data['members']) {
      console.time('getPRStats')
      const stats = await getPRStats(octokit, String(process.env.GH_ORG), member.login);
      console.timeEnd('getPRStats')
      member['prs'] = stats;
      await fs.writeFile('data/data.json', JSON.stringify(data, null, 2));
    }
    console.timeEnd('getPRStats - all')

  } catch (err) {
    console.error('An error occurred:', JSON.stringify(err, null, 2));
  }
}

fetch();
