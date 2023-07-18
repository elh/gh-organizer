# gh-organizer 📇

Visualize your Github organization or user. gh-organizer can be run on your own private Github org and repos.

I created this because I wanted to understand the history of contributors and repos in my private organizations.

[Demo](https://elh.github.io/gh-organizer/)

#### `/members` and `/repos` View
* All current members of the organization and PR stats
* All repos and some basic stats
* Toggle to show or hide non-member contributors (marked with †)
* Toggle to show or hide forked repos
* Links

#### `/repo-timeline` View
* Timeline of repos. Bar displays created date to last push date
* Ordered by created date

#### `/contrib-timeline` View
* Timeline of all contributors. Bar displays first to last merge date
* Ordered by first merge date

#### `/force-graph` View
* An interactive force graph of contributors to repos they have contributed to

<p align="center">
    <img width="95%" alt="repo timeline" src="https://github.com/elh/gh-organizer/assets/1035393/53491d62-31a4-4c3a-bad9-92918411f436">
    <img width="95%" alt="force graph" src="https://github.com/elh/gh-organizer/assets/1035393/3d0bcaec-fc9e-44d6-879d-bd10f5a6ab8f">
    <img width="95%" alt="force graph" src="https://github.com/elh/gh-organizer/assets/1035393/759de8ac-d864-475d-a49a-88f3c3bf5024">
</p>

## Usage

gh-organizer works by prefetching data from the Github API and serving it from JSON files. Pulling this information is too slow to do realtime and I do not intend to implement kicking off async tasks at the moment.

We fetch that organization information via `backend/fetch.ts` and store those files in `backend/data/`
```bash
# `npx ts-node fetch.ts <mode> <owner> <fetchers> [<repo-privacy>]`
# `npx ts-node fetch.ts org clojure all`
# 1) mode is either "org" or "user"
# 2) owner is a github org or user to fetch for
# 3) fetchers is a comma-separated list of fetchers to run
#      options: org, members, members-prs, repo-prs, nonmembers, nonmembers-prs, all. if all, run all fetchers
#      example: "org,members"
#      hack: "org" also applies to the "user" mode owner
# 4) repo-privacy is an optional control filter on repo privacy, either "PUBLIC" or "PRIVATE". if unset, will fetch all repos
#
# using janky positional arguments because i dont think flags are easy to use in typscript. sorry
npx ts-node fetch.ts org tlaplus all
# or
make fetch MODE=org OWNER=tlaplus FETCHERS=all REPOPRIVACY=PUBLIC
```

And then serve it to the front end
```bash
make run-backend-dev

make run-frontend-dev
# you can run w/ default fixture files
# includes data from some public orgs that I admire
REACT_APP_USE_FIXTURES=true make run-frontend-dev
```

## TODO

* Ability to kick off fetching jobs on the fly
* Host this as a Github app w/ Github auth or OAuth
