import React, { useState, useEffect, useRef } from 'react';

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
        <table className="table table-xs table-pin-rows">
          <thead>
            <tr>
              <th>Login</th>
              <th>Name</th>
              <th>Repos</th>
              <th>Starred</th>
              <th>Followers</th>
              <th>Following</th>
              {/* <th>Orgs</th>
              <th>Sponsors</th> */}
            </tr>
          </thead>
          <tbody>
            {'members' in data &&
              data['members'].map((member: any, i: number) =>
                <tr className="hover" key={i}>
                  <th><a href={`https://github.com/${member['login']}`} className="link link-hover">{member['login']}</a></th>
                  <td>{member['name']}</td>
                  <td>{member['repositories']['totalCount']}</td>
                  <td>{member['starredRepositories']['totalCount']}</td>
                  <td>{member['followers']['totalCount']}</td>
                  <td>{member['following']['totalCount']}</td>
                  {/* <td>{member['organizations']['totalCount']}</td>
                  <td>{member['sponsors']['totalCount']}</td> */}
                </tr>
              )
            }
          </tbody>
        </table>
        {!loaded &&
          <div className="flex justify-center items-center m-10">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        }
      </div>
    </div>
  );
}

export default App;
