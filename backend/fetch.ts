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

  } catch (err) {
    console.error('An error occurred:', err);
  }
}

fetch();
