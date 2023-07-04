import { Octokit } from "octokit";

export async function getOrg(octokit: Octokit, org: string): Promise<Record<string, any>> {
  const resp = await octokit.request("POST /graphql", {
    query: `query ($org: String!) {
      organization(login: $org) {
        avatarUrl
        description
        name
      }
    }`,
    variables: {
      org,
    },
  });
  if (resp.data.errors) {
    throw new Error(`Error querying Github: ${String(resp.data.errors)}`);
  }
  return resp.data.data.organization;
}

export async function getMembers(octokit: Octokit, org: string, cursor: string | null): Promise<Record<string, any>> {
  const pageSize = 20;
  const resp = await octokit.request("POST /graphql", {
    query: `query ($org: String!, $after: String, $pageSize: Int!) {
      organization(login: $org) {
        membersWithRole(first: $pageSize, after: $after) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            ######## bio ########
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
            ######## attributes. not querying pull requests here. just some other simple stats ########
            followers {
              totalCount
            }
            following {
              totalCount
            }
            organizations(first: 100) {
              totalCount
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
      org: org,
      pageSize: pageSize,
      after: cursor,
    },
  });
  if (resp.data.errors) {
    throw new Error(`Error querying Github: ${String(resp.data.errors)}`);
  }
  return resp.data.data.organization.membersWithRole
}

export async function getPRStats(octokit: Octokit, org: string, login: string): Promise<Record<string, any>> {
  const threeMo = new Date();
  threeMo.setMonth(threeMo.getMonth() - 3);
  const twelveMo = new Date();
  twelveMo.setFullYear(twelveMo.getFullYear() - 1);

  const resp = await octokit.request("POST /graphql", {
    query: `query ($pageSize: Int!, $orgPrCountQuery: String!, $threeMoOrgPrCountQuery: String!, $twelveMoOrgPrCountQuery: String!) {
      orgPrCount: search(query: $orgPrCountQuery, first: $pageSize, type: ISSUE) {
        issueCount
      }
      threeMoOrgPrCount: search(query: $threeMoOrgPrCountQuery, first: $pageSize, type: ISSUE) {
        issueCount
      }
      twelveMoOrgPrCount: search(query: $twelveMoOrgPrCountQuery, first: $pageSize, type: ISSUE) {
        issueCount
      }
    }`,
    variables: {
      orgPrCountQuery: `is:pr org:${org} author:${login}`,
      threeMoOrgPrCountQuery: `is:pr org:${org} author:${login} created:>${threeMo.toISOString().slice(0,10)}`,
      twelveMoOrgPrCountQuery: `is:pr org:${org} author:${login} created:>${twelveMo.toISOString().slice(0,10)}`,
      pageSize: 1,
    },
  });
  if (resp.data.errors) {
    throw new Error(`Error querying Github: ${String(resp.data.errors)}`);
  }
  return resp.data.data;
}

export async function getRepos(octokit: Octokit, org: string, cursor: string | null): Promise<Record<string, any>> {
  const pageSize = 20;
  const resp = await octokit.request("POST /graphql", {
    query: `query ($org: String!, $after: String, $pageSize: Int!) {
      organization(login: $org) {
        repositories(first: $pageSize, after: $after) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            name
            description
            isArchived
            isFork
            createdAt
            pushedAt
            archivedAt
            # codeowners. API does not return the actual codeowner users
            # collaborators is just generic users in the org; not based on PRs
            pullRequests {
              totalCount
              # get pull request details separately e.g. authors
            }
            languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  color
                  name
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      org: org,
      pageSize: pageSize,
      after: cursor,
    },
  });
  if (resp.data.errors) {
    throw new Error(`Error querying Github: ${JSON.stringify(resp.data.errors, null, 2)}`);
  }
  return resp.data.data.organization.repositories
}
