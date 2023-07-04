import { Octokit } from "octokit";

export async function getOrg(octokit: Octokit, org: string): Promise<Record<string, any>> {
  const resp = await octokit.request("POST /graphql", {
    query: `query ($login: String!) {
      organization(login: $login) {
        avatarUrl
        description
        name
      }
    }`,
    variables: {
      login: org,
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
            # pronouns
            # bio
            # status {
            #  emoji
            #  message
            # }
            # email
            # twitterUsername
            # websiteUrl
            # attributes. not querying pull requests here. just some other simple stats
            followers {
              totalCount
            }
            following {
              totalCount
            }
            # organizations(first: 100) {
            #   totalCount
            #   pageInfo {
            #     endCursor
            #     hasNextPage
            #   }
            #   nodes {
            #     login
            #     name
            #   }
            # }
            repositories(isFork: false, privacy: PUBLIC) {
              totalCount
            }
            # socialAccounts(first: 100) {
            #   totalCount
            #   pageInfo {
            #     endCursor
            #     hasNextPage
            #   }
            #   nodes {
            #     displayName
            #     provider
            #     url
            #   }
            # }
            # sponsors {
            #   totalCount
            # }
            starredRepositories {
              totalCount
            }
          }
        }
      }
    }`,
    variables: {
      login: org,
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
  const resp = await octokit.request("POST /graphql", {
    query: `query ($pageSize: Int!, $query: String!) {
      search(query: $query, first: $pageSize, type: ISSUE) {
        issueCount
      }
    }`,
    variables: {
      query: `is:pr org:${org} author:${login}`,
      pageSize: 1,
    },
  });
  if (resp.data.errors) {
    throw new Error(`Error querying Github: ${String(resp.data.errors)}`);
  }
  return {
    'org_pr_count': resp.data.data.search.issueCount,
  };
}
