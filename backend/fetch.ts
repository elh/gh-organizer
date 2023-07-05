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

// `npx ts-node fetch.ts <mode> <owner> <fetchers>`
// `npx ts-node fetch.ts clojure all`
// 1) mode is either "org" or "user"
// 1) owner is a github org or user to fetch for
// 2) fetchers is a comma-separated list of fetchers to run
//      options: org, members, members-prs, repo-prs, nonmembers, nonmembers-prs, all. if all, run all fetchers
//      example: "org,members"
//      hack: "org" also applies to the "user" mode owner
if (process.argv.length < 5) {
  console.error('Usage: npx ts-node fetch.ts <mode> <owner> <fetchers>');
  process.exit(1);
}
const mode = process.argv[2];
const orgOrUser = process.argv[3]; // the owner
const fetchers = process.argv[4] ? process.argv[4].split(',') : [];
if (mode !== 'org' && mode !== 'user') {
  console.error('Mode must be either "org" or "user"');
  process.exit(1);
}

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
      // // org xor user object will be present
      // 'org': {},
      // 'user': {},
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

    if (fetcherEnabled('org')) {
      if (mode == 'org') {
        console.time('getOrg')
        data['org'] = await getOrg(octokit, orgOrUser);
        console.timeEnd('getOrg')
        await fs.writeFile(file, JSON.stringify(data, null, 2));
      } else {
        console.time('getUser')
        data['user'] = await getUser(octokit, orgOrUser);
        console.timeEnd('getUser')
        await fs.writeFile(file, JSON.stringify(data, null, 2));
      }
    }

    if (fetcherEnabled('members')) {
      if (mode == 'org') {
        data['members'] = [];
        let cursor: string | null = null;
        let done = false;
        console.time('getMembers - all')
        let i = 0;
        while (!done) { // ts really doesn't like constant condition loops
          console.time('getMembers - ' + i)
          const resp = await getMembers(octokit, orgOrUser, cursor);
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
      } else {
        data['members'] = [data['user']];
      }
    }

    if (fetcherEnabled('members-prs')) {
      // TODO: do this in a promise pool
      console.time('getPRStats - all')
      for (const member of data['members']) {
        console.time('getPRStats - ' + member.login)
        const stats = await getPRStats(octokit, orgOrUser, member.login);
        console.timeEnd('getPRStats - ' + member.login)
        member['prs'] = stats;
        await fs.writeFile(file, JSON.stringify(data, null, 2));
      }
      console.timeEnd('getPRStats - all')
    }

    if (fetcherEnabled('repos')) {
      data['repos'] = [];
      let cursor: string | null = null;
      let done = false;
      console.time('getRepos - all')
      let i = 0;
      while (!done) { // ts really doesn't like constant condition loops
        console.time('getRepos - ' + i)
        const resp = await getRepos(octokit, mode == "org" ? "organization" : "user", orgOrUser, cursor);
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

    if (fetcherEnabled('repo-prs')) {
      // TODO: do this in a promise pool
      console.time('getRepoPullRequests - all')
      for (const repo of data['repos']) {
        console.time('getRepoPullRequests - ' + repo.name)

        let cursor: string | null = null;
        let done = false;
        let i = 0;
        while (!done) { // ts really doesn't like constant condition loops
          console.time('getRepoPullRequests - ' + repo.name + ' - ' + i)
          let resp: Record<string, any> = {};
          try {
            resp = await getRepoPullRequests(octokit, orgOrUser, repo.name, cursor);
          } catch (err) {
            console.error('Error fetching PRs for repo ' + repo.name + ': ' + err);
            console.timeEnd('getRepoPullRequests - ' + repo.name + ' - ' + i)
            break;
          }
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

    if (fetcherEnabled('nonmembers')) {
      // TODO: do this in a promise pool
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

    if (fetcherEnabled('nonmembers-prs')) {
      // TODO: do this in a promise pool
      console.time('getNonMemberPRStats - all')
      for (const nonmember of data['nonMembers']) {
        console.time('getNonMemberPRStats - ' + nonmember.login)
        const stats = await getPRStats(octokit, orgOrUser, nonmember.login);
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
