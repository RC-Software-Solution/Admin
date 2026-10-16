import { useState } from "react";
import "../admins/admins.css";
import "../sessions/sessions.css";
import { useFoodItems } from "../../hooks/useFoodItems";
import type { FoodItem, FoodItemForm, MealType } from "../../types/menu";
import { PlusIcon } from "../../components/common/Icons";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";

type Dialog = { kind: "add" } | { kind: "edit" | "delete"; item: FoodItem } | null;
const EMPTY: FoodItemForm = { name: "", description: "", price: "", meal_type: "veg", image_url: "" };

export default function FoodItemsPage() {
  const { rows, error, clearError, add, edit, remove } = useFoodItems();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | MealType>("");
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setForm(d.kind === "edit" ? { ...d.item, price: String(d.item.price) } : EMPTY);
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "add" ? await add(form) : dialog?.kind === "edit" && (await edit(dialog.item.id, form))) close();
  };

  const confirmDelete = async () => {
    if (dialog?.kind === "delete") await remove(dialog.item.id);
    close();
  };

  const shown = rows.filter((r) => (!type || r.meal_type === type) && r.name.toLowerCase().includes(search.trim().toLowerCase()));
  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit";
  const set = (k: keyof FoodItemForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="admins-page">
      <div className="admins-card">
        <div className="admins-header">
          <div>
            <h1 className="admins-title">Food Items</h1>
            <p className="admins-subtitle">The catalog that sessions pick from</p>
          </div>
          <button className="btn-add" onClick={() => open({ kind: "add" })} type="button">
            <span className="btn-add-plus"><PlusIcon className="icon-sm" /></span>
            Add Item
          </button>
        </div>

        <div className="toolbar">
          <input type="search" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={type} onChange={(e) => setType(e.target.value as "" | MealType)}>
            <option value="">All types</option>
            <option value="veg">Veg</option>
            <option value="non-veg">Non-veg</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Modal open={formOpen} title={dialog?.kind === "edit" ? `Edit ${dialog.item.name}` : "Add food item"} onClose={close}>
          <form className="modal__form" onSubmit={submit}>
            <input placeholder="Name" value={form.name} onChange={set("name")} required />
            <textarea placeholder="Description (optional)" value={form.description ?? ""} onChange={set("description")} rows={2} />
            <input type="number" placeholder="Price (LKR)" min="0.01" step="0.01" value={form.price} onChange={set("price")} required />
            <select value={form.meal_type} onChange={set("meal_type")}>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-veg</option>
              <option value="other">Other</option>
            </select>
            <input type="url" placeholder="Image URL (optional)" value={form.image_url ?? ""} onChange={set("image_url")} />
            {error && <p role="alert">{error}</p>}
            <div className="modal__actions">
              <button type="button" className="modal__btn" onClick={close}>Cancel</button>
              <button type="submit" className="modal__btn modal__btn--primary">Save</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={dialog?.kind === "delete"}
          title="Delete food item"
          message={dialog?.kind === "delete" ? `Delete ${dialog.item.name}? It is also removed from any session that uses it.` : ""}
          confirmLabel="Delete"
          onCancel={close}
          onConfirm={confirmDelete}
        />
        {!formOpen && error && <p role="alert">{error}</p>}

        <div className="table-wrap">
          <table className="admins-table">
            <thead>
              <tr><th></th><th>Name</th><th>Price</th><th>Type</th><th className="col-actions">Actions</th></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>{r.image_url ? <img className="thumb" src={r.image_url} alt="" loading="lazy" /> : <span className="thumb" />}</td>
                  <td className="cell-strong">{r.name}{r.description && <div className="cell-muted">{r.description}</div>}</td>
                  <td>{formatMoney(Number(r.price))}</td>
                  <td><span className={r.meal_type === "veg" ? "pill pill-status-active" : "pill pill-blue"}>{r.meal_type}</span></td>
                  <td className="cell-actions">
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "edit", item: r })}>Edit</button>
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "delete", item: r })}>Delete</button>
                  </td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={5} className="cell-muted">No food items</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
