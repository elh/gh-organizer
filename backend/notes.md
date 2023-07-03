PRs with basic details
```graphql
query ($pageSize: Int!) {
  search(query: "is:pr author:elh", first: $pageSize, type: ISSUE) {
    issueCount
    pageInfo {
      endCursor
      hasNextPage
    }
    nodes {
      ... on PullRequest {
        baseRepository {
          nameWithOwner
        }
        number
        title
      }
    }
  }
}
```

All member details
```graphql
query ($login: String!, $after: String, $pageSize: Int!) {
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
        pronouns
        bio
        status {
          emoji
          message
        }
        email
        twitterUsername
        websiteUrl
        # attributes. not querying pull requests here. just some other simple stats
        followers {
          totalCount
        }
        following {
          totalCount
        }
        organizations(first: 100) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
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
          pageInfo {
            endCursor
            hasNextPage
          }
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
}
```
