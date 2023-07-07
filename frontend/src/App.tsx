import React, { useState, useEffect, useRef } from 'react';
import DataTable, { ExpanderComponentProps } from 'react-data-table-component';
import DarkModePreferredStatus from './DarkMode';
import { Outlet, Route, Routes, Navigate, useParams, useLocation, useOutletContext, useNavigate } from "react-router-dom"
import { Chart as GoogleChart } from "react-google-charts";
import Screenshot1 from './assets/screenshot_1.png';

// TODO: ???
// kick off indexes as a background job from the API
// user -> repo force directed graph
// parallelize fetching
// starred repos
// split user and org modes. people love seeing all their contributions, regardless of ownership
// option for including or not including nonmembers
// use fancier grid component. select columns and resize manually

function caseInsensitiveSortFn(field: string) {
  return (a: any, b: any) => {
    const aVal = field in a && !!a[field] ? a[field].toLowerCase() : '';
    const bVal = field in b && !!b[field] ? b[field].toLowerCase() : '';
    if (aVal > bVal) return 1;
    if (bVal > aVal) return -1;
    return 0;
  }
}

// return "owner" from a gh-organizer fetch data object
function getOwner(data: Record<string, any>) : Record<string, any> {
  if ('org' in data) {
    return data.org
  }
  else if ('user' in data) {
    return data.user;
  }
  return {};
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

function MemberTable() {
  const props: any = useOutletContext();
  const [showPersonal, setShowPersonal] = React.useState(false);
  const [showNonMembers, setShowNonMembers] = React.useState(false);

  const owner = React.useMemo(
    () => {
      return getOwner(props.data);
    },
    [props.data],
  );

  const columns = React.useMemo(
    () => {
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
            cell: (row: any) => <a href={`https://github.com/pulls?q=is%3Apr+author%3A${row.login}+org%3A${owner.login}+`} className="link link-hover">{row.prs.threeMoOrgPrCount.issueCount}</a>,
            maxWidth: "140px",
          },
          {
            name: 'Org PRs - 12mo',
            sortable: true,
            selector: (row: any) => row.prs.twelveMoOrgPrCount.issueCount,
            cell: (row: any) => <a href={`https://github.com/pulls?q=is%3Apr+author%3A${row.login}+org%3A${owner.login}+`} className="link link-hover">{row.prs.twelveMoOrgPrCount.issueCount}</a>,
            maxWidth: "140px",
          },
          {
            name: 'Org PRs',
            sortable: true,
            selector: (row: any) => row.prs.orgPrCount.issueCount,
            cell: (row: any) => <a href={`https://github.com/pulls?q=is%3Apr+author%3A${row.login}+org%3A${owner.login}+`} className="link link-hover">{row.prs.orgPrCount.issueCount}</a>,
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

function RepoTable() {
  const props: any = useOutletContext();
  const [showForks, setShowForks] = React.useState(true);

  const owner = React.useMemo(
    () => {
      return getOwner(props.data);
    },
    [props.data],
  );

  const columns = React.useMemo(
    () => {
      return [
        {
            name: 'Name',
            sortable: true,
            sortFunction: caseInsensitiveSortFn('name'),
            selector: (row: any) => row.name,
            cell: (row: any) => <a href={`https://github.com/${owner.login}/${row.name}`} className="font-bold link link-hover">
              {row.name} {row.isFork ? <span title="Fork">↗</span> : null} {row.isArchived ? <span title="Archived">†</span> : null}
            </a>,
            maxWidth: "280px",
        },
        {
            name: 'Description',
            selector: (row: any) => row.description,
            maxWidth: "600px",
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
        {
          name: 'Stars',
          sortable: true,
          selector: (row: any) => row.stargazerCount,
          maxWidth: "110px",
        },
        {
          name: 'PR Count',
          sortable: true,
          selector: (row: any) => row.pullRequests.totalCount,
          cell: (row: any) => <a href={`https://github.com/${owner.login}/${row.name}/pulls`} className="link link-hover">{row.pullRequests.totalCount}</a>,
          maxWidth: "110px",
        },
        {
          id: 'buttons',
          name: <div>
            <button className="btn btn-xs btn-ghost font-light" onClick={() => setShowForks(!showForks)}>{showForks ? '-' : '+'} Forks</button>
          </div>,
          maxWidth: "160px",
        },
      ]
    },
    [props.data, showForks],
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
                  data={showForks ? props.data['repos'] : props.data['repos'].filter((repo: any) => !repo.isFork)}
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

function Timeline({ chartData, color, prefersDarkMode} : {chartData: any, color: string, prefersDarkMode: boolean}) {
  return (
    <GoogleChart
      chartType="Timeline"
      data={chartData}
      width="100%"
      height="88vh"
      options={{
        alternatingRowStyle: false,
        backgroundColor: prefersDarkMode ? 'rgb(29, 35, 42)' : '#fff',
        fontName: 'ui-sans-serif',
        timeline: {
          singleColor: color,
          rowLabelStyle: {
            color: prefersDarkMode ? '#fff' : null,
          },
          barLabelStyle: {
            color: prefersDarkMode ? '#fff' : null,
          },
        },
      }} />
  );
}

function RepoTimeline() {
  const props: any = useOutletContext();
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
          : <Timeline chartData={chartData} color={"rgb(25, 174, 159)"} prefersDarkMode={props.prefersDarkMode} />
        }
    </div>
  );
}

function ContribTimeline() {
  const props: any = useOutletContext();
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

  return (
    <div>
      {!props.loaded
          ? <div className="flex justify-center items-center m-10">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          : <Timeline chartData={chartData} color={"rgb(204, 0, 156)"} prefersDarkMode={props.prefersDarkMode} />
        }
    </div>
  );
}

// TODO: link to github in footer
function Home() {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<string[]>([]);
  const fetchStarted = useRef(false); // to prevent double detch from React StrictMode

  const fetchData = async () => {
    try {
      const response = await fetch(`/data`);
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
        setPaths(res.data);
      }
    })();
  }, []);

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(`/owners/${event.target.value}`);
  }

  return (
    <div className="hero min-h-screen bg-base-100">
      <div className="hero-content flex-col lg:flex-row">
        <div className="py-10">
          <img src={Screenshot1} className="rounded-lg shadow-2xl py-4" />
          {/* <img src={Screenshot2} className="rounded-lg shadow-2xl py-4" /> */}
        </div>
        <div className="max-w-xl px-10">
          <div className="px-2">
            <h1 className="text-5xl font-bold">gh-organizer</h1>
            <p className="py-6">Github org (and user) stats and timeline visualizer 📇</p>
          </div>
          <div className="flex-none">
            <select className="select select-sm bg-base-200 w-72 mx-2 font-semibold" onChange={handleSelect}>
              <option disabled selected>Org or user</option>
              {paths.map(path => {
                path = path.replace(/\.[^/.]+$/, ""); // w/o file extension
                return (
                  <option>{path}</option>
                );
              })}
            </select>
          </div>
          <div className="h-12" /> {/* jank: vertical spacer */}
        </div>
      </div>
    </div>
  );
}

function FailedToLoadPage() {
  return (
    <div className="p-14">
      <div className="alert alert-error">
        <span>Failed to load owner org or user. We might not have that ready.</span>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="p-14">
      <div className="alert alert-error">
        <span>Not Found.</span>
      </div>
    </div>
  );
}

function NavBar({ data }: any) {
  const location = useLocation();

  const owner = React.useMemo(
    () => {
      return getOwner(data);
    },
    [data],
  );

  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a href={`/`} className="btn btn-ghost hover:bg-inherit normal-case text-2xl">gh-organizer</a>
        <a href={`https://github.com/${owner.login}`} className="link link-hover">{owner.login} - {owner.name}</a>
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
        <ul className="menu menu-horizontal px-4">
          <li>
            <details>
              <summary className="bg-base-200">
                {/* jank: I like nav bar being outside of the page components */}
                /{location.pathname.split('/').slice(-1)[0]}
              </summary>
              <ul className="p-2 bg-base-100 z-10 absolute right-0">
                <li><a href={`/owners/${owner.login}/members`}>/members</a></li>
                <li><a href={`/owners/${owner.login}/repos`}>/repos</a></li>
                <li><a href={`/owners/${owner.login}/repo-timeline`}>/repo-timeline</a></li>
                <li><a href={`/owners/${owner.login}/contrib-timeline`}>/contrib-timeline</a></li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  );
}

function OrgPage() {
  const { ownerId } = useParams();
  const [data, setData] = useState<Record<string, any>>({});
  const fetchStarted = useRef(false); // to prevent double detch from React StrictMode
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const prefersDarkMode = DarkModePreferredStatus();

  const fetchData = async () => {
    try {
      const response = await fetch(`/data/${ownerId}.json`);
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
      } else {
        setError(true);
      }
      setLoaded(true);
    })();
  }, []);

  return (
    <div className="p-8">
      <NavBar data={data} />
      <div className="px-6">
        {loaded &&
          <div>
            {!error
              ? <Outlet context={{ loaded, data, prefersDarkMode }}/>
              : <FailedToLoadPage />
            }
          </div>
        }
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="owners/:ownerId" element={<OrgPage />}>
        {/* jank: nested routes will take props via useOutletContext */}
        <Route path="members" element={<MemberTable />} />
        <Route path="repos" element={<RepoTable />} />
        <Route path="repo-timeline" element={<RepoTimeline />} />
        <Route path="contrib-timeline" element={<ContribTimeline />} />
        <Route index element={<Navigate to="members" replace />} />
        <Route path="*" element={<Navigate to="members" replace />} />
      </Route>
      <Route path="/*" element={<NotFoundPage/>} />
    </Routes>
  );
}

export default App;
