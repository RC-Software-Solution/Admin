import type { ReactNode } from "react";
import { Alert, Badge, Button, Card, DataTable, EmptyState, Field, FilterBar, PageHeader, Spinner, useToast } from "../../components/ui";
import type { Column } from "../../components/ui";

interface Row { id: string; customer: string; total: string; status: "paid" | "unpaid" }
const ROWS: Row[] = [
  { id: "ORD-20261018-0001", customer: "Nimal Perera", total: "LKR 450.00", status: "paid" },
  { id: "ORD-20261018-0002", customer: "Kumari Silva", total: "LKR 485.00", status: "unpaid" },
];
const COLUMNS: Column<Row>[] = [
  { key: "select", label: "Select", mobile: "select", header: <input type="checkbox" aria-label="Select all" />, cell: (r) => <input type="checkbox" aria-label={`Select ${r.customer}`} /> },
  { key: "id", label: "Order", mobile: "title", cell: (r) => <span className="ui-mono">{r.id}</span> },
  { key: "customer", label: "Customer", cell: (r) => r.customer },
  { key: "total", label: "Total", cell: (r) => r.total },
  { key: "status", label: "Payment", cell: (r) => <Badge tone={r.status === "paid" ? "success" : "danger"}>{r.status}</Badge> },
  { key: "actions", label: "Actions", mobile: "actions", cell: () => <div className="ui-actions"><Button size="sm">Edit</Button><Button size="sm" variant="primary">Mark paid</Button></div> },
];

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
    <h2 style={{ margin: 0, fontSize: "var(--text-md)" }}>{title}</h2>
    {children}
  </section>
);

/** Dev-only gallery (route /ui-kit) so every kit component can be checked at desktop and phone width. */
export default function UiKit() {
  const toast = useToast();
  return (
    <div>
      <Section title="Button">
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
      <Section title="Badge">
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
      <Section title="PageHeader, FilterBar, Card, Field">
        <PageHeader title="Orders" subtitle="Refreshes every 30s" actions={<Button variant="primary">Add</Button>} />
        <FilterBar>
          <select aria-label="Status"><option>All statuses</option></select>
          <input type="search" placeholder="Order id…" aria-label="Order id" />
          <label>From <input type="date" /></label>
          <Button aria-pressed="true">Unpaid only</Button>
        </FilterBar>
        <Card title="Card title" actions={<Button size="sm">Action</Button>}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <Field label="Name" hint="As shown to customers"><input /></Field>
            <Field label="Price" error="Enter a positive number"><input defaultValue="-1" /></Field>
          </div>
        </Card>
      </Section>
      <Section title="Toast">
        <div className="ui-actions">
          <Button onClick={() => toast.show("Marked paid")}>Success toast</Button>
          <Button onClick={() => toast.show("Could not save", "danger")}>Error toast</Button>
          <Button onClick={() => toast.show("Refreshing…", "info")}>Info toast</Button>
        </div>
      </Section>
      <Section title="DataTable">
        <Card flush><DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} /></Card>
        <Card flush><DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} loading /></Card>
        <Card flush><DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} emptyTitle="No orders found" /></Card>
        <Card flush><DataTable columns={COLUMNS} rows={ROWS.slice(0, 1)} rowKey={(r) => r.id} error="Refresh failed: Request failed (500)" /></Card>
      </Section>
      {/* gallery:end */}
    </div>
  );
}
