import React, { useState, useEffect, useRef } from 'react';
import DataTable, { ExpanderComponentProps } from 'react-data-table-component';
import DarkModePreferredStatus from './DarkMode';
import { Route, Routes, Navigate, useLocation } from "react-router-dom"
import { Chart as GoogleChart } from "react-google-charts";

// TODO: add a list of TODOs and put this on ice?
//
// support serving multiple data.json files for users/orgs at the same time
// user -> repo force directed graph
// parallelize fetching
// starred repos

function caseInsensitiveSortFn(field: string) {
  return (a: any, b: any) => {
    const aVal = field in a && !!a[field] ? a[field].toLowerCase() : '';
    const bVal = field in b && !!b[field] ? b[field].toLowerCase() : '';
    if (aVal > bVal) return 1;
    if (bVal > aVal) return -1;
    return 0;
  }
}

const dataTableDarkStyles = {
  cells: {
    style: {
      backgroundColor: 'rgb(29, 35, 42)',
      color: 'rgb(166, 173, 186)',
    }
  },
  rows: {
    style: {
      backgroundColor: 'rgb(29, 35, 42)',
      color: 'rgb(166, 173, 186)',
    },
  },
  headRow: {
    style: {
      backgroundColor: 'rgb(29, 35, 42)',
      color: 'rgb(166, 173, 186)',
    }
  },
  expanderRow: {
    style: {
      backgroundColor: 'rgb(29, 35, 42)',
      color: 'rgb(166, 173, 186)',
      fontSize: '10px',
    }
  },
  pagination: {
    style: {
      backgroundColor: 'rgb(29, 35, 42)',
      color: 'rgb(166, 173, 186)',
    }
  },
};

const dataTableLightStyles = {
  expanderRow: {
    style: {
      fontSize: '10px',
    }
  }
};

const DataTableExpanded: React.FC<ExpanderComponentProps<Record<string, any>>> = ({ data }) => {
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

function MemberTable(props: any) {
  const [showPersonal, setShowPersonal] = React.useState(false);
  const [showNonMembers, setShowNonMembers] = React.useState(false);

  const columns = React.useMemo(
    () => {
      let owner ='';
      if ('org' in props.data) {
        owner = props.data.org.login
      }
      else if ('user' in props.data) {
        owner = props.data.user.login;
      }
        return [
          {
            id: 'avatarUrl',
            name: '',
            cell: (row: any) => <a href={`https://github.com/${row.login}`}><img src={row.avatarUrl} className='max-h-6 w-6'></img></a>,
            maxWidth: "60px",
            minWidth: "60px",
          },
          {
              id: 'login',
              name: 'Login',
              sortable: true,
              sortFunction: caseInsensitiveSortFn('login'),
              selector: (row: any) => row.login,
              cell: (row: any) => <a href={`https://github.com/${row.login}`} className="font-bold link link-hover">
                {'nonMemberLogins' in props.data && row.login in props.data.nonMemberLogins ? row.login + '†' : row.login}
              </a>,
              maxWidth: "360px",
          },
          {
              name: 'Name',
              sortable: true,
              sortFunction: caseInsensitiveSortFn('name'),
              selector: (row: any) => row.name,
              maxWidth: "360px",
          },
          {
            name: 'Org PRs - 3mo',
            sortable: true,
            selector: (row: any) => row.prs.threeMoOrgPrCount.issueCount,
            cell: (row: any) => <a href={`https://github.com/pulls?q=is%3Apr+author%3A${row.login}+org%3A${owner}+`} className="link link-hover">{row.prs.threeMoOrgPrCount.issueCount}</a>,
            maxWidth: "140px",
          },
          {
            name: 'Org PRs - 12mo',
            sortable: true,
            selector: (row: any) => row.prs.twelveMoOrgPrCount.issueCount,
            cell: (row: any) => <a href={`https://github.com/pulls?q=is%3Apr+author%3A${row.login}+org%3A${owner}+`} className="link link-hover">{row.prs.twelveMoOrgPrCount.issueCount}</a>,
            maxWidth: "140px",
          },
          {
            name: 'Org PRs',
            sortable: true,
            selector: (row: any) => row.prs.orgPrCount.issueCount,
            cell: (row: any) => <a href={`https://github.com/pulls?q=is%3Apr+author%3A${row.login}+org%3A${owner}+`} className="link link-hover">{row.prs.orgPrCount.issueCount}</a>,
            maxWidth: "140px",
          },
          {
            name: 'Repos',
            sortable: true,
            selector: (row: any) => row.repositories.totalCount,
            cell: (row: any) => <a href={`https://github.com/${row.login}?tab=repositories`} className="link link-hover">{row.repositories.totalCount}</a>,
            maxWidth: "110px",
            omit: !showPersonal,
          },
          {
            name: 'Starred',
            sortable: true,
            selector: (row: any) => row.starredRepositories.totalCount,
            cell: (row: any) => <a href={`https://github.com/${row.login}?tab=stars`} className="link link-hover">{row.starredRepositories.totalCount}</a>,
            maxWidth: "110px",
            omit: !showPersonal,
          },
          {
            name: 'Followers',
            sortable: true,
            selector: (row: any) => row.followers.totalCount,
            maxWidth: "110px",
            omit: !showPersonal,
          },
          {
            name: 'Following',
            sortable: true,
            selector: (row: any) => row.following.totalCount,
            maxWidth: "110px",
            omit: !showPersonal,
          },
          {
            id: 'buttons',
            name: <div>
              <button className="btn btn-xs btn-ghost font-light" onClick={() => setShowNonMembers(!showNonMembers)}>{showNonMembers ? '-' : '+'} Non-members</button>
              <button className="btn btn-xs btn-ghost font-light hidden" onClick={() => setShowPersonal(!showPersonal)}>{showPersonal ? '-' : '+'} Personal</button>
            </div>,
            maxWidth: "160px",
          },
        ]
      },
    [props.data, showPersonal, showNonMembers],
  );

  return (
    <div>
      {!props.loaded
          ? <div className="flex justify-center items-center m-10">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          : <div>
              <DataTable
                  columns={columns}
                  data={showNonMembers ? props.data['members'].concat(props.data['nonMembers']) : props.data['members']}
                  dense={true}
                  fixedHeader={true}
                  responsive={true}
                  fixedHeaderScrollHeight={"86vh"}
                  defaultSortFieldId={"login"}
                  theme={props.prefersDarkMode ? 'dark' : 'light'}
                  customStyles={props.prefersDarkMode ? dataTableDarkStyles : dataTableLightStyles}
                  expandableRows
                  expandableRowsComponent={DataTableExpanded}
                  pagination={true}
                  paginationPerPage={100}
                  paginationRowsPerPageOptions={[25, 50, 100, 1000]}
              />
            </div>
        }
    </div>
  );
}

function RepoTable(props: any) {
  const columns = React.useMemo(
    () => {
      let owner ='';
      if ('org' in props.data) {
        owner = props.data.org.login
      }
      else if ('user' in props.data) {
        owner = props.data.user.login;
      }
      return [
        {
            name: 'Name',
            sortable: true,
            sortFunction: caseInsensitiveSortFn('name'),
            selector: (row: any) => row.name,
            cell: (row: any) => <a href={`https://github.com/${owner}/${row.name}`} className="font-bold link link-hover">
              {row.name} {row.isFork ? <span title="Fork">↗</span> : null} {row.isArchived ? <span title="Archived">†</span> : null}
            </a>,
            maxWidth: "300px",
        },
        {
            name: 'Description',
            selector: (row: any) => row.description,
            maxWidth: "400px",
        },
        {
          name: 'Created At',
          sortable: true,
          selector: (row: any) => row.createdAt,
          cell: (row: any) => <p>{(new Date(row.createdAt)).toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          })}</p>,
          maxWidth: "110px",
        },
        {
          id: 'pushedAt',
          name: 'Pushed At',
          sortable: true,
          selector: (row: any) => row.pushedAt,
          cell: (row: any) => <p>{(new Date(row.pushedAt)).toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          })}</p>,
          maxWidth: "180px",
        },
        {
          name: 'PR Count',
          sortable: true,
          selector: (row: any) => row.pullRequests.totalCount,
          cell: (row: any) => <a href={`https://github.com/${owner}/${row.name}/pulls`} className="link link-hover">{row.pullRequests.totalCount}</a>,
          maxWidth: "110px",
        },
        {
          name: 'Language',
          sortable: true,
          selector: (row: any) => row.languages.edges.length > 0 ? row.languages.edges[0].node.name : '',
          cell: (row: any) => <div>
            {row.languages.edges.length > 0
              ? <div className="flex items-center">
                  <svg height="10" width="10" className="mr-1">
                    <circle cx="5" cy="5" r="4" fill={row.languages.edges[0].node.color} />
                  </svg>
                  <p>{row.languages.edges[0].node.name}</p>
                </div>
              : ''}
          </div>,
          maxWidth: "140px",
        },
      ]
    },
    [props.data],
  );

  return (
    <div>
      {!props.loaded
          ? <div className="flex justify-center items-center m-10">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          : <div>
              <DataTable
                  columns={columns}
                  data={props.data['repos']}
                  dense={true}
                  fixedHeader={true}
                  responsive={true}
                  fixedHeaderScrollHeight={"86vh"}
                  defaultSortFieldId={"pushedAt"}
                  defaultSortAsc={false}
                  theme={props.prefersDarkMode ? 'dark' : 'light'}
                  customStyles={props.prefersDarkMode ? dataTableDarkStyles : dataTableLightStyles}
                  expandableRows
                  expandableRowsComponent={DataTableExpanded}
                  pagination={true}
                  paginationPerPage={100}
                  paginationRowsPerPageOptions={[25, 50, 100, 1000]}
              />
            </div>
        }
    </div>
  );
}

function RepoTimeline(props: any) {
  const chartData = React.useMemo(
    () => {
      const columns = [
        { type: "string", id: "Repo" },
        { type: "date", id: "Start" },
        { type: "date", id: "End" },
      ];

      let rows = [];
      if ('repos' in props.data) {
        rows = props.data.repos.map((repo: any) => {
          return [
            repo.isArchived ? repo.name + ' †' : repo.name,
            new Date(repo.createdAt),
            // corner case: if repo is created after it's last push, just use the created date
            new Date(repo.createdAt) < new Date(repo.pushedAt) ? new Date(repo.pushedAt) : new Date(repo.createdAt),
          ]
        })
      }
      return [columns, ...rows];
    },
    [props.data],
  );

  return (
    <div>
      {!props.loaded
          ? <div className="flex justify-center items-center m-10">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          : <GoogleChart
              chartType="Timeline"
              data={chartData}
              width="100%"
              height="88vh"
              options={{
                alternatingRowStyle: false,
                backgroundColor: props.prefersDarkMode ? 'rgb(29, 35, 42)' : '#fff',
                fontName: 'ui-sans-serif',
                timeline: {
                  singleColor: "rgb(25, 174, 159)",
                  rowLabelStyle: {
                    color: props.prefersDarkMode ? '#fff' : null,
                  },
                  barLabelStyle: {
                    color: props.prefersDarkMode ? '#fff' : null,
                  },
                },
              }} />
        }
    </div>
  );
}

function ContribTimeline(props: any) {
  const chartData = React.useMemo(
    () => {
      const columns = [
        { type: "string", id: "Name" },
        { type: "date", id: "Start" },
        { type: "date", id: "End" },
      ];

      let rows: any[] = [];
      if ('prDates' in props.data) {
        rows = Object.keys(props.data.prDates).map(name => {
          const dates = props.data.prDates[name];
          return [
            name in props.data.nonMemberLogins ? name + ' †' : name ,
            new Date(dates.earliest),
            new Date(dates.latest),
          ]
        });
      }
      rows.sort((a, b) => a[1] - b[1]);
      return [columns, ...rows];
    },
    [props.data],
  );

  // TODO: factor this out for ContribTimeline and RepoTimeline
  return (
    <div>
      {!props.loaded
          ? <div className="flex justify-center items-center m-10">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          : <GoogleChart
              chartType="Timeline"
              data={chartData}
              width="100%"
              height="88vh"
              options={{
                alternatingRowStyle: false,
                backgroundColor: props.prefersDarkMode ? 'rgb(29, 35, 42)' : '#fff',
                fontName: 'ui-sans-serif',
                timeline: {
                  singleColor: "rgb(204, 0, 156)",
                  rowLabelStyle: {
                    color: props.prefersDarkMode ? '#fff' : null,
                  },
                  barLabelStyle: {
                    color: props.prefersDarkMode ? '#fff' : null,
                  },
                },
              }} />
        }
    </div>
  );
}

function App() {
  const [data, setData] = useState<Record<string, any>>({});
  const fetchStarted = useRef(false); // to prevent double detch from React StrictMode
  const [loaded, setLoaded] = useState(false);

  const location = useLocation();
  const prefersDarkMode = DarkModePreferredStatus();

  const fetchData = async () => {
    try {
      const response = await fetch('/data/data.json');
      if (!response.ok) {
        console.log(response.text());
        return { success: false };
      }
      const json = await response.json();
      return { success: true, data: json };
    } catch (error) {
      console.log(error);
      return { success: false };
    }
  }

  useEffect(() => {
    (async () => {
      if (fetchStarted.current) return;
      fetchStarted.current = true;

      const res = await fetchData();
      if (res.success) {
        setData(res.data);
      }
      setLoaded(true);
    })();
  }, []);

  return (
    <div className="">
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost hover:bg-inherit normal-case text-xl">gh-organizer</a>
          {'org' in data &&
            <span>{data['org']['login']} - {data['org']['name']}</span>
          }
          {'user' in data &&
            <span>{data['user']['login']} - {data['user']['name']}</span>
          }
          {'lastUpdated' in data &&
            <span className="text-xs text-slate-500 pl-2">
              (last updated {(new Date(data['lastUpdated'])).toLocaleString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
              })})
            </span>
          }
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <details>
                <summary>
                  {location.pathname}
                </summary>
                <ul className="p-2 bg-base-100 z-10 absolute right-0">
                  <li><a href={`/members`}>/members</a></li>
                  <li><a href={`/repos`}>/repos</a></li>
                  <li><a href={`/repo-timeline`}>/repo-timeline</a></li>
                  <li><a href={`/contrib-timeline`}>/contrib-timeline</a></li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>
      <div className="px-6">
        {/* Content */}
        <Routes>
          <Route path="/members" element={
            <MemberTable loaded={loaded} data={data} prefersDarkMode={prefersDarkMode}></MemberTable>
          } />
          <Route path="/repos" element={
            <RepoTable loaded={loaded} data={data} prefersDarkMode={prefersDarkMode}></RepoTable>
          } />
          <Route path="/repo-timeline" element={
            <RepoTimeline loaded={loaded} data={data} prefersDarkMode={prefersDarkMode}></RepoTimeline>
          } />
          <Route path="/contrib-timeline" element={
            <ContribTimeline loaded={loaded} data={data} prefersDarkMode={prefersDarkMode}></ContribTimeline>
          } />
          <Route path="/*" element={<Navigate to="/members" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
