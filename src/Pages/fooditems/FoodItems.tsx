import { useState } from "react";
import { LuDownload, LuPlus, LuX } from "react-icons/lu";
import "./food.css";
import { useFoodItems } from "../../hooks/useFoodItems";
import type { FoodItem, FoodItemForm, MealType, PriceChange } from "../../types/menu";
import { Alert, Button, DataTable, Field, FilterBar, Mark, PageHeader, SearchField, Switch, Who, useToast } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";
import { formatDateTime } from "../../utils/formatDate";

type Dialog = { kind: "add" } | { kind: "edit" | "delete"; item: FoodItem } | null;
const EMPTY: FoodItemForm = { name: "", description: "", price: "", meal_type: "veg", image_url: "", category: "", dietary_tags: "" };
const TYPE_MARK = { veg: { tone: "leaf", label: "Veg" }, "non-veg": { tone: "brick", label: "Non-veg" }, other: { tone: "mist", label: "Other" } } as const;

const csvCell = (v: string | number | boolean | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const tagsOf = (s: string | null) => (s ?? "").split(",").map((t) => t.trim()).filter(Boolean);

export default function FoodItemsPage() {
  const { rows, loaded, error, clearError, add, edit, setActive, remove, history, viewHistory, closeHistory } = useFoodItems();
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | MealType>("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState<number[]>([]); // items with an availability change in flight
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

  // A second click while the change is in flight would flip it back, so ignore it
  const toggle = async (r: FoodItem, active: boolean) => {
    if (busy.includes(r.id)) return;
    setBusy((b) => [...b, r.id]);
    try {
      if (await setActive(r.id, active)) toast.show(active ? `${r.name} is available again` : `${r.name} is hidden from customers`);
    } finally {
      setBusy((b) => b.filter((id) => id !== r.id));
    }
  };

  const categories = [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))].sort();
  const shown = rows.filter(
    (r) => (!type || r.meal_type === type) && (!category || r.category === category) && r.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit";
  const set = (k: keyof FoodItemForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  // Exports what the filters currently show, so staff can export "inactive vegan items" and the like.
  const exportCsv = () => {
    const head = ["Name", "Description", "Price (LKR)", "Type", "Category", "Dietary tags", "Active"];
    const lines = shown.map((r) => [r.name, r.description, Number(r.price), r.meal_type, r.category, r.dietary_tags, r.is_active ? "yes" : "no"].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[head.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "food-items.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<FoodItem>[] = [
    { key: "item", label: "Item", mobile: "title", cell: (r) => <Who name={r.name} meta={r.description} square tone="auto" size="md" src={r.image_url} /> },
    { key: "price", label: "Price", align: "right", mobile: "amount", cell: (r) => <strong>{formatMoney(Number(r.price))}</strong> },
    { key: "type", label: "Type", mobile: "hide", cell: (r) => <Mark tone={TYPE_MARK[r.meal_type].tone}>{TYPE_MARK[r.meal_type].label}</Mark> },
    {
      key: "category",
      label: "Category",
      mobile: "hide",
      cell: (r) => (
        <div>
          {r.category ?? "—"}
          {tagsOf(r.dietary_tags).length > 0 && (
            <span className="food-tags">
              {tagsOf(r.dietary_tags).map((t) => (
                <span key={t} className="ui-tag">
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "available",
      label: "Available",
      mobile: "inline",
      cell: (r) => <Switch label={`${r.name} available to customers`} checked={r.is_active} showState onChange={(v) => toggle(r, v)} />,
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (r) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${r.name}`} onClick={() => open({ kind: "edit", item: r })}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" aria-label={`Price history for ${r.name}`} onClick={() => viewHistory(r.id)}>
            Price history
          </Button>
          <Button size="sm" variant="danger-ghost" aria-label={`Delete ${r.name}`} onClick={() => open({ kind: "delete", item: r })}>
            <LuX aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns: Column<PriceChange>[] = [
    { key: "changed", label: "Changed", mobile: "title", nowrap: true, cell: (h) => formatDateTime(h.changed_at) },
    { key: "from", label: "From", align: "right", cell: (h) => (h.old_price === null ? "Starting price" : formatMoney(Number(h.old_price))) },
    { key: "to", label: "To", align: "right", cell: (h) => <strong>{formatMoney(Number(h.new_price))}</strong> },
  ];

  return (
    <div>
      <PageHeader
        title="Food Items"
        subtitle="The catalogue that sessions pick from"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> Add item
          </Button>
        }
      />

      <FilterBar label="Food item filters">
        <SearchField label="Search food items" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as "" | MealType)}>
          <option value="">All types</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-veg</option>
          <option value="other">Other</option>
        </select>
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button className="food-export" onClick={exportCsv} disabled={!shown.length}>
          <LuDownload aria-hidden="true" /> Export CSV
        </Button>
      </FilterBar>

      <DataTable columns={columns} rows={shown} rowKey={(r) => String(r.id)} loading={!loaded && !error} error={formOpen ? null : error} emptyTitle="No food items" />

      <Modal open={formOpen} title={dialog?.kind === "edit" ? `Edit ${dialog.item.name}` : "Add food item"} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          <Field label="Name">
            <input value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Description" optional>
            <textarea rows={2} value={form.description ?? ""} onChange={set("description")} />
          </Field>
          <div className="ui-form-row">
            <Field label="Price (LKR)">
              <input type="number" min="0.01" step="0.01" value={form.price} onChange={set("price")} required />
            </Field>
            <Field label="Type">
              <select value={form.meal_type} onChange={set("meal_type")}>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-veg</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field label="Category" optional>
            <input list="food-categories" maxLength={50} placeholder="Rice, Snacks…" value={form.category ?? ""} onChange={set("category")} />
          </Field>
          <datalist id="food-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Field label="Dietary tags" optional hint="Separate with commas">
            <input maxLength={255} placeholder="vegan, gluten-free" value={form.dietary_tags ?? ""} onChange={set("dietary_tags")} />
          </Field>
          <Field label="Image URL" optional>
            <input type="url" value={form.image_url ?? ""} onChange={set("image_url")} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save item
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={history !== null} title="Price history" onClose={closeHistory}>
        <DataTable columns={historyColumns} rows={history ?? []} rowKey={(h) => String(h.id)} emptyTitle="No price history" />
        <div className="modal__actions">
          <Button onClick={closeHistory}>Close</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title="Delete food item"
        message={dialog?.kind === "delete" ? `Delete ${dialog.item.name}? It is also removed from any session that uses it. To just hide it from customers, switch it off instead.` : ""}
        confirmLabel="Delete"
        onCancel={close}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
