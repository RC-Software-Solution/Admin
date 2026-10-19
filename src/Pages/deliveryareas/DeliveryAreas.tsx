import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuPlus } from "react-icons/lu";
import { useDeliveryAreas } from "../../hooks/useDeliveryAreas";
import { Alert, Button, DataTable, Field, Mark, PageHeader } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";
import type { AreaForm, DeliveryArea } from "../../types/deliveryAreas";

const EMPTY: AreaForm = { area_name: "", code: "", status: "active", notes: "" };

export default function DeliveryAreasPage() {
  const { areas, error, loaded, metricsAvailable, metricOf, onSave, onDelete } = useDeliveryAreas();
  const navigate = useNavigate();
  // `form`: null = closed, {} = adding, {area} = editing
  const [form, setForm] = useState<{ area?: DeliveryArea } | null>(null);
  const [values, setValues] = useState<AreaForm>(EMPTY);
  const [toDelete, setToDelete] = useState<DeliveryArea | null>(null);

  const openForm = (area?: DeliveryArea) => {
    setValues(area ? { area_name: area.area_name, code: area.code ?? "", status: area.status, notes: area.notes ?? "" } : EMPTY);
    setForm({ area });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form && (await onSave(form.area, values))) setForm(null);
  };

  const assigned = toDelete?.assigned_users ?? 0;
  const plural = assigned === 1 ? "" : "s";

  const columns: Column<DeliveryArea>[] = [
    {
      key: "area",
      label: "Area",
      mobile: "title",
      cell: (a) => (
        <div>
          <b className="ui-cell__title">
            {a.area_name} {a.code && <span className="ui-cell__meta">{a.code}</span>}
          </b>
          {a.notes && <div className="ui-cell__meta">{a.notes}</div>}
        </div>
      ),
    },
    { key: "status", label: "Status", mobile: "inline", cell: (a) => <Mark tone={a.status === "active" ? "leaf" : "mist"}>{a.status === "active" ? "Active" : "Inactive"}</Mark> },
    {
      key: "customers",
      label: "Customers",
      align: "right",
      cell: (a) =>
        a.assigned_users ? (
          <Link className="ui-link" to={`/users?area=${a.area_id}`}>
            {a.assigned_users}
          </Link>
        ) : (
          (a.assigned_users ?? "—")
        ),
    },
    { key: "orders", label: "Orders", align: "right", cell: (a) => (metricsAvailable ? (metricOf(a)?.orderCount ?? 0) : "—") },
    { key: "revenue", label: "Revenue", align: "right", mobile: "amount", cell: (a) => <strong>{formatMoney(metricsAvailable ? (metricOf(a)?.totalRevenue ?? 0) : null)}</strong> },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (a) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${a.area_name}`} onClick={() => openForm(a)}>
            Edit
          </Button>
          <Button size="sm" variant="danger-ghost" aria-label={`Delete ${a.area_name}`} onClick={() => setToDelete(a)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Areas"
        subtitle="Where you deliver, and how each area is doing"
        actions={
          <Button variant="primary" onClick={() => openForm()}>
            <LuPlus aria-hidden="true" /> Add area
          </Button>
        }
      />

      <DataTable columns={columns} rows={areas} rowKey={(a) => String(a.area_id)} loading={!loaded && !error} error={form || toDelete ? null : error} emptyTitle="No delivery areas yet" />
      {areas.length > 0 && <p className="ui-hint" style={{ margin: "var(--space-4) 0 0" }}>{metricsAvailable ? "Orders and revenue cover all time." : "Order figures are unavailable right now."}</p>}

      <Modal open={!!form} title={form?.area ? "Edit area" : "New area"} onClose={() => setForm(null)}>
        <form className="modal__form" onSubmit={submit}>
          <Field label="Area name">
            <input autoFocus value={values.area_name} onChange={(e) => setValues({ ...values, area_name: e.target.value })} required />
          </Field>
          <Field label="Code" optional hint="Short code, for example KDY">
            <input maxLength={20} value={values.code ?? ""} onChange={(e) => setValues({ ...values, code: e.target.value })} />
          </Field>
          <Field label="Status">
            <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as AreaForm["status"] })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Schedule notes" optional>
            <textarea rows={3} value={values.notes ?? ""} onChange={(e) => setValues({ ...values, notes: e.target.value })} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={() => setForm(null)}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save area
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toDelete && assigned > 0} title={`${toDelete?.area_name} can't be deleted yet`} onClose={() => setToDelete(null)}>
        <p className="modal__body">
          {assigned} customer{plural} {assigned === 1 ? "is" : "are"} still assigned to this area. Move them to another area first, then delete it.
        </p>
        <div className="modal__actions">
          <Button onClick={() => setToDelete(null)}>Close</Button>
          <Button variant="primary" onClick={() => navigate(`/users?area=${toDelete?.area_id}`)}>
            View the {assigned} customer{plural}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete && assigned === 0}
        title="Delete area"
        message={`Delete "${toDelete?.area_name}"? This can't be undone.`}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await onDelete(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
}
