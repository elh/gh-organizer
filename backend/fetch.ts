import dotenv from 'dotenv';
import fs from 'fs/promises';
import { Octokit } from "octokit";
import {getOrg, getMembers, getPRStats} from './gh';

const file = 'data/data.json';

// env vars
dotenv.config();
if (!process.env.GH_TOKEN || !process.env.GH_ORG) {
  console.error('GH_TOKEN and GH_ORG env vars are required');
  process.exit(1);
}

// command line args: a comma-separated list of fetchers to run
// options: org, members, members-prs, all. if all, run all fetchers
// example: "org,members"
const fetchers = process.argv[2] ? process.argv[2].split(',') : [];

// set up
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

function fetcherEnabled(name: string): boolean {
  return fetchers.includes(name) || fetchers.includes('all');
}

async function fetch() {
  try {
    // load existing file
    const jsonString = await fs.readFile(file, 'utf-8');
    const data = JSON.parse(jsonString);

    if (!('org' in data) || fetcherEnabled('org')) {
      console.time('getOrg')
      data['org'] = await getOrg(octokit, String(process.env.GH_ORG));
      console.timeEnd('getOrg')
      await fs.writeFile(file, JSON.stringify(data, null, 2));
    }

    if (!('members' in data) || fetcherEnabled('members')) {
      data['members'] = [];
      let cursor: string | null = null;
      let done = false;
      console.time('getMembers - all')
      while (!done) { // ts really doesn't like constant condition loops
        console.time('getMembers')
        const resp = await getMembers(octokit, String(process.env.GH_ORG), cursor);
        console.timeEnd('getMembers')
        data['members'] = data['members'].concat(resp.nodes);
        await fs.writeFile(file, JSON.stringify(data, null, 2));

        if (!resp.pageInfo.hasNextPage) {
          done = true;
          break;
        }
        cursor = resp.pageInfo.endCursor;
      }
      console.timeEnd('getMembers - all')
    }

    // only run if explicitly requested
    if (fetcherEnabled('members-prs')) {
      // TODO: do this in a promise pool. why isn't there an obvious solution to this in ts...
      console.time('getPRStats - all')
      for (const member of data['members']) {
        console.time('getPRStats')
        const stats = await getPRStats(octokit, String(process.env.GH_ORG), member.login);
        console.timeEnd('getPRStats')
        member['prs'] = stats;
        await fs.writeFile(file, JSON.stringify(data, null, 2));
      }
      console.timeEnd('getPRStats - all')
    }

  } catch (err) {
    console.error('An error occurred:', JSON.stringify(err, null, 2));
  }
}

fetch();
