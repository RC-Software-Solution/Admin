
import "./users.css"; // We can rename this later if needed, but keeping for now
import { useUsers } from "../../hooks/useUsers";
import { DownloadIcon, FilterIcon, EyeIcon } from "../../components/common/Icons";

export default function UsersPage() {
  const {
    activeTab,
    setActiveTab,
    query,
    setQuery,
    counts,
    filtered,
    onApprove,
    onReject,
    tabs
  } = useUsers();

  const onView = (id: string) => {
    // Replace with your modal / route
    console.log("View user:", id);
  };

  const onExport = () => {
    // Replace with your export logic
    console.log("Export clicked");
  };

  const onFilters = () => {
    // Replace with opening a filter panel
    console.log("Filters clicked");
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="title">Users</h1>
          <p className="subtitle">Manage customer accounts</p>
        </div>

        <button className="btn btn-export" onClick={onExport}>
          <DownloadIcon className="icon" />
          Export
        </button>
      </div>

      <div className="users-toolbar">
        <div className="tabs">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                className={`tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className={`count ${isActive ? "active" : ""}`}>
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="tools">
          <div className="search-wrap">
            <input
              className="search"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button className="btn btn-filters" onClick={onFilters}>
            <FilterIcon className="icon" />
            Filters
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th className="col-name">Name</th>
              <th>Email</th>
              <th>Area</th>
              <th>Status</th>
              <th>Registered</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="empty" colSpan={6}>
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td className="name">{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td className="muted">{u.area}</td>
                  <td>
                    <span className={`status-pill ${u.status}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="muted">{u.registered}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="icon-btn"
                        onClick={() => onView(u.id)}
                        aria-label="View"
                        title="View"
                      >
                        <EyeIcon className="icon" />
                      </button>

                      {u.status === "pending" && (
                        <>
                          <button
                            className="pill-btn approve"
                            onClick={() => onApprove(u.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="pill-btn reject"
                            onClick={() => onReject(u.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
