import { Octokit } from "octokit";

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
    throw new Error(`Error querying Github: ${resp.data.errors}`);
  }
  return {
    'org_pr_count': resp.data.data.search.issueCount,
  };
}
