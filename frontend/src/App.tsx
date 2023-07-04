import React, { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';

function caseInsensitiveSortFn(field: string) {
  return (a: any, b: any) => {
    const aVal = field in a && !!a[field] ? a[field].toLowerCase() : '';
    const bVal = field in b && !!b[field] ? b[field].toLowerCase() : '';
    if (aVal > bVal) return 1;
    if (bVal > aVal) return -1;
    return 0;
  }
}

const columns = [
  {
      name: 'Login',
      sortable: true,
      sortFunction: caseInsensitiveSortFn('login'),
      selector: (row: any) => row.login,
      cell: (row: any) => <a href={`https://github.com/${row.login}`} className="font-bold link link-hover">{row.login}</a>
  },
  {
      name: 'Name',
      sortable: true,
      sortFunction: caseInsensitiveSortFn('name'),
      selector: (row: any) => row.name,
  },
  {
    name: 'Org PRs',
    sortable: true,
    selector: (row: any) => row.prs.org_pr_count,
    cell: (row: any) => <a href={`https://github.com/pulls?q=is%3Apr+author%3A${row.login}+org%3Agoforward+`} className="link link-hover">{row.prs.org_pr_count}</a>
  },
  {
    name: 'Repos',
    sortable: true,
    selector: (row: any) => row.repositories.totalCount,
    cell: (row: any) => <a href={`https://github.com/${row.login}?tab=repositories`} className="link link-hover">{row.repositories.totalCount}</a>
  },
  {
    name: 'Starred',
    sortable: true,
    selector: (row: any) => row.starredRepositories.totalCount,
    cell: (row: any) => <a href={`https://github.com/${row.login}?tab=stars`} className="link link-hover">{row.starredRepositories.totalCount}</a>
  },
  {
    name: 'Followers',
    sortable: true,
    selector: (row: any) => row.followers.totalCount,
  },
  {
    name: 'Following',
    sortable: true,
    selector: (row: any) => row.following.totalCount,
  },
];

function App() {
  const [data, setData] = useState<Record<string, any>>({});
  const fetchStarted = useRef(false); // to prevent double detch from React StrictMode
  const [loaded, setLoaded] = useState(false);

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

  // Consider https://github.com/jbetancur/react-data-table-component for sorting
  return (
    <div className="overflow-x-auto">
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl">gh-organizer</a>
          {'org' in data &&
          <div>
            {/* <img className="w-8 mx-2" src={data['org']['avatarUrl']} alt="logo"/> */}
            <span>{data['org']['name']}</span>
          </div>
          }
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <details>
                <summary>
                  Members
                </summary>
                <ul className="p-2 bg-base-100 z-10">
                  <li><a>Members</a></li>
                  <li><a>Repos</a></li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>
      <div className="px-6">
        {!loaded &&
          <div className="flex justify-center items-center m-10">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        }
        {'members' in data &&
          <DataTable
              columns={columns}
              data={data['members']}
              dense={true}
              fixedHeader={true}
              responsive={true}
          />
        }
      </div>
    </div>
  );
}

export default App;
