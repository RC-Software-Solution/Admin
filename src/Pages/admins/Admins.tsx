
import "./admins.css";
import { useAdmins } from "../../hooks/useAdmins";
import { EditIcon, PlusIcon } from "../../components/common/Icons";

export default function AdminsPage() {
  const { rows, toggleStatus, onEdit, onAddAdmin } = useAdmins();

  return (
    <div className="admins-page">
      <div className="admins-card">
        <div className="admins-header">
          <div>
            <h1 className="admins-title">Admins</h1>
            <p className="admins-subtitle">Manage administrative users</p>
          </div>

          <button className="btn-add" onClick={onAddAdmin} type="button">
            <span className="btn-add-plus">
              <PlusIcon className="icon-sm" />
            </span>
            Add Admin
          </button>
        </div>

        <div className="table-wrap">
          <table className="admins-table" role="table">
            <thead>
              <tr>
                <th className="col-name">Name</th>
                <th className="col-email">Email</th>
                <th className="col-role">Role</th>
                <th className="col-status">Status</th>
                <th className="col-date">Created Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="cell-strong">{a.name}</td>
                  <td className="cell-muted">{a.email}</td>

                  <td>
                    <span
                      className={
                        a.role === "Super Admin"
                          ? "pill pill-green"
                          : "pill pill-blue"
                      }
                    >
                      {a.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        a.status === "active"
                          ? "pill pill-status-active"
                          : "pill pill-status-suspended" // updated
                      }
                    >
                      {a.status}
                    </span>
                  </td>

                  <td className="cell-muted">{a.createdDate}</td>

                  <td>
                    <div className="actions">
                      <button
                        className="icon-btn"
                        type="button"
                        onClick={() => onEdit(a)}
                        aria-label={`Edit ${a.name}`}
                        title="Edit"
                      >
                        <EditIcon className="icon" />
                      </button>

                      <button
                        className={
                          a.status === "active"
                            ? "btn-outline btn-outline-danger"
                            : "btn-outline btn-outline-success"
                        }
                        type="button"
                        onClick={() => toggleStatus(a.id)}
                      >
                        {a.status === "active" ? "Suspend" : "Enable"} {/* updated */}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
