import { useState } from "react";
import type { ReactNode } from "react";
import { Alert, Badge, Button, Card, Chip, Chips, DataTable, EmptyState, Field, FilterBar, Menu, OrderTrack, PageHeader, PaymentMark, SelectionBar, Spinner, useToast } from "../../components/ui";
import type { Column } from "../../components/ui";
import type { OrderStatus, PaymentStatus } from "../../types/orders";

interface Row { id: string; name: string; meta: string; total: number; status: OrderStatus; pay: PaymentStatus }
const ROWS: Row[] = [
  { id: "ORD-20261018-0042", name: "Nimal Perera", meta: "Colombo 03 · 2 items · 8:42 AM", total: 970, status: "pending", pay: "pending" },
  { id: "ORD-20261018-0041", name: "Kumari Silva", meta: "Nugegoda · 1 item · 8:31 AM", total: 485, status: "preparing", pay: "paid" },
  { id: "ORD-20261018-0039", name: "Dilani Jayasinghe", meta: "Colombo 03 · 1 item · 7:58 AM", total: 555, status: "delivered", pay: "unpaid" },
  { id: "ORD-20261018-0038", name: "Chaminda Wickramasinghe", meta: "Nugegoda · 2 items · 7:40 AM", total: 1180, status: "delivery_failed", pay: "unpaid" },
  { id: "ORD-20261018-0036", name: "Tharindu Bandara", meta: "Colombo 03 · 2 items · 7:12 AM", total: 1320, status: "cancelled", pay: "ignored" },
  { id: "ORD-20261018-0035", name: "Anjali Gunawardena", meta: "Nugegoda · 4 items · 6:55 AM", total: 2240, status: "completed", pay: "paid" },
];
const COLUMNS: Column<Row>[] = [
  { key: "select", label: "Select", mobile: "select", header: <input type="checkbox" aria-label="Select all" />, cell: (r) => <input type="checkbox" aria-label={`Select ${r.name}`} /> },
  {
    key: "customer",
    label: "Customer",
    mobile: "title",
    cell: (r) => (
      <div>
        <b className="ui-cell__title">{r.name}</b>
        <div className="ui-cell__meta">{r.id} · {r.meta}</div>
      </div>
    ),
  },
  { key: "total", label: "Total", align: "right", mobile: "amount", cell: (r) => <strong>LKR {r.total.toLocaleString("en-LK")}</strong> },
  { key: "progress", label: "Progress", mobile: "inline", cell: (r) => <OrderTrack status={r.status} /> },
  { key: "payment", label: "Payment", mobile: "inline", cell: (r) => <PaymentMark status={r.pay} /> },
  {
    key: "actions",
    label: "Next step",
    align: "right",
    mobile: "actions",
    cell: (r) => (
      <div className="ui-actions">
        <Button size="sm" variant={r.pay === "unpaid" ? "primary" : "secondary"}>{r.pay === "unpaid" ? "Mark paid" : "Move to delivering"}</Button>
        <Menu label={`More actions for ${r.id}`} items={[{ label: "Update status…", onSelect: () => {} }, { label: "Cancel order", tone: "danger", onSelect: () => {} }]} />
      </div>
    ),
  },
];
const ALL: OrderStatus[] = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
const PAYS: PaymentStatus[] = ["paid", "unpaid", "pending", "ignored"];

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
    <h2 style={{ margin: 0, fontSize: "var(--text-lg)" }}>{title}</h2>
    {children}
  </section>
);

/** Dev-only gallery (route /ui-kit) so every kit component can be checked at desktop and phone width. */
export default function UiKit() {
  const toast = useToast();
  const [chip, setChip] = useState("All");
  const [bar, setBar] = useState(false);
  return (
    <div>
      <PageHeader title="UI kit" subtitle="Everything the pages are built from" actions={<Button variant="primary">Primary action</Button>} />
      <Section title="Buttons">
        <div className="ui-actions">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
        </div>
      </Section>
      <Section title="Chips">
        <Chips label="Example filter">
          {["All", "Pending", "Preparing", "Delivering"].map((c) => (
            <Chip key={c} selected={chip === c} onClick={() => setChip(c)} count={c === "All" ? undefined : 3}>{c}</Chip>
          ))}
          <Chip attention selected>Unpaid only</Chip>
        </Chips>
      </Section>
      <Section title="Order track and payment marks">
        <div className="ui-actions" style={{ gap: "var(--space-8)" }}>{ALL.map((s) => <OrderTrack key={s} status={s} />)}</div>
        <div className="ui-actions" style={{ gap: "var(--space-6)" }}>{PAYS.map((p) => <PaymentMark key={p} status={p} />)}</div>
      </Section>
      <Section title="Badges">
        <div className="ui-actions">
          <Badge>neutral</Badge>
          <Badge tone="success">success</Badge>
          <Badge tone="warning">warning</Badge>
          <Badge tone="danger">danger</Badge>
          <Badge tone="info">info</Badge>
        </div>
      </Section>
      <Section title="Alert, Spinner, EmptyState">
        <Alert>Couldn&apos;t load orders: Request failed (500)</Alert>
        <Alert tone="warning">Pick both dates to filter by date.</Alert>
        <Alert tone="success">Reminder sent to 3 customers.</Alert>
        <Alert tone="info">Refreshes every 30s.</Alert>
        <Spinner label="Loading" />
        <EmptyState title="No orders found" hint="Try clearing the filters." action={<Button>Clear filters</Button>} />
      </Section>
      <Section title="FilterBar, Card, Field">
        <FilterBar>
          <select aria-label="Area"><option>All areas</option></select>
          <input type="search" placeholder="Order id…" aria-label="Order id" />
          <label>From <input type="date" /></label>
        </FilterBar>
        <Card title="Card title" actions={<Button size="sm">Action</Button>}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <Field label="Name" hint="As shown to customers"><input /></Field>
            <Field label="Price" error="Enter a positive number"><input defaultValue="-1" /></Field>
          </div>
        </Card>
      </Section>
      <Section title="Toast and selection bar">
        <div className="ui-actions">
          <Button onClick={() => toast.show("Marked paid")}>Success toast</Button>
          <Button onClick={() => toast.show("Could not save", "danger")}>Error toast</Button>
          <Button onClick={() => setBar((b) => !b)}>{bar ? "Hide selection bar" : "Show selection bar"}</Button>
        </div>
        {bar && (
          <SelectionBar label="Selected customers">
            <span><strong>3 customers</strong> selected</span>
            <Button variant="primary">Send payment reminder</Button>
          </SelectionBar>
        )}
      </Section>
      <Section title="DataTable">
        <DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} rowTone={(r) => (r.status === "delivery_failed" ? "bad" : r.pay === "unpaid" || r.status === "pending" ? "attn" : undefined)} />
        <DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} loading />
        <DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} emptyTitle="No orders found" />
        <DataTable columns={COLUMNS} rows={ROWS.slice(0, 1)} rowKey={(r) => r.id} error="Refresh failed: Request failed (500)" />
      </Section>
    </div>
  );
}
