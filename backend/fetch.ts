import dotenv from 'dotenv';
import fs from 'fs/promises';
import { Octokit } from "octokit";
import {getOrg, getMembers, getPRStats, getRepos, getRepoPullRequests, getUser} from './gh';

const file = 'data/data.json';

// env vars
dotenv.config();
if (!process.env.GH_TOKEN) {
  console.error('GH_TOKEN env var is required');
  process.exit(1);
}

// `npx ts-node fetch.ts <org> <fetchers>`
// `npx ts-node fetch.ts clojure all`
// 1) org is a github org to fetch
// 2) fetchers is a comma-separated list of fetchers to run
//      options: org, members, members-prs, repo-prs, nonmembers, nonmembers-prs, all. if all, run all fetchers
//      example: "org,members"
console.log(process.argv)
if (process.argv.length < 4) {
  console.error('Usage: npx ts-node fetch.ts <org> <fetchers>');
  process.exit(1);
}
const org = process.argv[2];
const fetchers = process.argv[3] ? process.argv[3].split(',') : [];

// set up
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

function fetcherEnabled(name: string): boolean {
  return fetchers.includes(name) || fetchers.includes('all');
}

async function fetch() {
  try {
    // load existing file. if file does not exist, data is an empty object
    let data: any = {
      'lastUpdated': '',
      'org': {},
      'members': [],
      'repos': [],
      'nonMemberLogins': {},
      'prDates': {},
      'nonMembers': [],
    };
    try {
      const jsonString = await fs.readFile(file, 'utf-8');
      data = JSON.parse(jsonString);
    } catch (err) {
      console.log('No existing data file found. Creating new one.');
    }
    data['lastUpdated'] = new Date().toISOString();
    console.time('fetch')

    if (!('org' in data) || fetcherEnabled('org')) {
      console.time('getOrg')
      data['org'] = await getOrg(octokit, org);
      console.timeEnd('getOrg')
      await fs.writeFile(file, JSON.stringify(data, null, 2));
    }

    if (!('members' in data) || fetcherEnabled('members')) {
      data['members'] = [];
      let cursor: string | null = null;
      let done = false;
      console.time('getMembers - all')
      let i = 0;
      while (!done) { // ts really doesn't like constant condition loops
        console.time('getMembers - ' + i)
        const resp = await getMembers(octokit, org, cursor);
        console.timeEnd('getMembers - ' + i)
        data['members'] = data['members'].concat(resp.nodes);
        await fs.writeFile(file, JSON.stringify(data, null, 2));

        if (!resp.pageInfo.hasNextPage) {
          done = true;
          break;
        }
        cursor = resp.pageInfo.endCursor;
        i++
      }
      console.timeEnd('getMembers - all')
    }

    // only run if explicitly requested
    if (fetcherEnabled('members-prs')) {
      // TODO: do this in a promise pool. why isn't there an obvious solution to this in ts...
      console.time('getPRStats - all')
      for (const member of data['members']) {
        console.time('getPRStats - ' + member.login)
        const stats = await getPRStats(octokit, org, member.login);
        console.timeEnd('getPRStats - ' + member.login)
        member['prs'] = stats;
        await fs.writeFile(file, JSON.stringify(data, null, 2));
      }
      console.timeEnd('getPRStats - all')
    }

    if (!('repos' in data) || fetcherEnabled('repos')) {
      data['repos'] = [];
      let cursor: string | null = null;
      let done = false;
      console.time('getRepos - all')
      let i = 0;
      while (!done) { // ts really doesn't like constant condition loops
        console.time('getRepos - ' + i)
        const resp = await getRepos(octokit, org, cursor);
        console.timeEnd('getRepos - ' + i)
        data['repos'] = data['repos'].concat(resp.nodes);
        await fs.writeFile(file, JSON.stringify(data, null, 2));

        if (!resp.pageInfo.hasNextPage) {
          done = true;
          break;
        }
        cursor = resp.pageInfo.endCursor;
        i++
      }
      console.timeEnd('getRepos - all')
    }

    // only run if explicitly requested
    if (fetcherEnabled('repo-prs')) {
      // TODO: do this in a promise pool. why isn't there an obvious solution to this in ts...
      console.time('getRepoPullRequests - all')
      for (const repo of data['repos']) {
        console.time('getRepoPullRequests - ' + repo.name)

        let cursor: string | null = null;
        let done = false;
        let i = 0;
        while (!done) { // ts really doesn't like constant condition loops
          console.time('getRepoPullRequests - ' + repo.name + ' - ' + i)
          const resp = await getRepoPullRequests(octokit, org, repo.name, cursor);
          console.timeEnd('getRepoPullRequests - ' + repo.name + ' - ' + i)

          for (const pr of resp.nodes) {
            if (pr.author == null) {
              continue;
            }
            if (!data['members'].some((member: any) => member.login === pr.author.login)) {
              if (!(pr.author.login in data['nonMemberLogins'])) {
                data['nonMemberLogins'][pr.author.login] = true;
              }
            }

            // track each author's earliest and latest PR merge date in data.prDates
            if (pr.mergedAt != null) {
              if (!(pr.author.login in data['prDates'])) {
                data['prDates'][pr.author.login] = {
                  'earliest': pr.mergedAt,
                  'latest': pr.mergedAt,
                };
              } else {
                if (new Date(pr.mergedAt) < (new Date(data['prDates'][pr.author.login]['earliest']))) {
                  data['prDates'][pr.author.login]['earliest'] = pr.mergedAt;
                }
                if (new Date(pr.mergedAt) > (new Date(data['prDates'][pr.author.login]['latest']))) {
                  data['prDates'][pr.author.login]['latest'] = pr.mergedAt;
                }
              }
            }
          }
          await fs.writeFile(file, JSON.stringify(data, null, 2));

          if (!resp.pageInfo.hasNextPage) {
            done = true;
            break;
          }
          cursor = resp.pageInfo.endCursor;
          i++
        }
        console.timeEnd('getRepoPullRequests - ' + repo.name)
      }
      console.timeEnd('getRepoPullRequests - all')
    }

    // only run if explicitly requested
    if (fetcherEnabled('nonmembers')) {
      // TODO: do this in a promise pool. why isn't there an obvious solution to this in ts...
      console.time('getUser - all')
      for (const nonMemberLogin of Object.keys(data['nonMemberLogins'])) {
        try {
          console.time('getUser - ' + nonMemberLogin)
          const user = await getUser(octokit, nonMemberLogin);
          data.nonMembers.push(user);
        } catch (err) {
          // hack: some are non-user bots like dependabot
          console.log("ignoring error for " + nonMemberLogin)
        }
        console.timeEnd('getUser - ' + nonMemberLogin)
        await fs.writeFile(file, JSON.stringify(data, null, 2));
      }
      console.timeEnd('getUser - all')
    }

    // only run if explicitly requested
    if (fetcherEnabled('nonmembers-prs')) {
      // TODO: do this in a promise pool. why isn't there an obvious solution to this in ts...
      console.time('getNonMemberPRStats - all')
      for (const nonmember of data['nonMembers']) {
        console.time('getNonMemberPRStats - ' + nonmember.login)
        const stats = await getPRStats(octokit, org, nonmember.login);
        console.timeEnd('getNonMemberPRStats - ' + nonmember.login)
        nonmember['prs'] = stats;
        await fs.writeFile(file, JSON.stringify(data, null, 2));
      }
      console.timeEnd('getNonMemberPRStats - all')
    }

    console.timeEnd('fetch')

  } catch (err) {
    console.log(err)
    console.error('An error occurred:', JSON.stringify(err, null, 2));
  }
}

fetch();
