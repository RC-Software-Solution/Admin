
import { useState } from "react";
import "./admins.css";
import { useAdmins } from "../../hooks/useAdmins";
import type { AdminRole } from "../../types/admins";
import { PlusIcon } from "../../components/common/Icons";

export default function AdminsPage() {
  const { rows, error, add } = useAdmins();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "admin" as AdminRole });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await add(form)) {
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", role: "admin" });
    }
  };

  return (
    <div className="admins-page">
      <div className="admins-card">
        <div className="admins-header">
          <div>
            <h1 className="admins-title">Admins</h1>
            <p className="admins-subtitle">Manage administrative users</p>
          </div>

          <button className="btn-add" onClick={() => setOpen((o) => !o)} type="button">
            <span className="btn-add-plus">
              <PlusIcon className="icon-sm" />
            </span>
            Add Admin
          </button>
        </div>

        {open && (
          <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
            <input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Initial password (8+ chars)" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button className="btn-add" type="submit">Create</button>
          </form>
        )}
        {error && <p role="alert">{error}</p>}

        <div className="table-wrap">
          <table className="admins-table" role="table">
            <thead>
              <tr>
                <th className="col-name">Name</th>
                <th className="col-email">Email</th>
                <th className="col-role">Role</th>
                <th className="col-status">Status</th>
                <th className="col-date">Created Date</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="cell-strong">{a.full_name}</td>
                  <td className="cell-muted">{a.email}</td>

                  <td>
                    <span
                      className={
                        a.role === "super_admin"
                          ? "pill pill-green"
                          : "pill pill-blue"
                      }
                    >
                      {a.role === "super_admin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        a.status === "active"
                          ? "pill pill-status-active"
                          : "pill pill-status-suspended"
                      }
                    >
                      {a.status}
                    </span>
                  </td>

                  <td className="cell-muted">{new Date(a.created_at).toLocaleDateString()}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
