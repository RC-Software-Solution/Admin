import { LuDownload } from "react-icons/lu";
import RangeFilters from "../../components/common/RangeFilters";
import { Alert, Button, DataTable, PageHeader, Tabs } from "../../components/ui";
import type { Column } from "../../components/ui";
import { useReports } from "../../hooks/useReports";
import { formatMoney } from "../../utils/formatMoney";
import { downloadCsv } from "./reports.service";
import type { AreaRow, ItemRow, ReportType, SalesDayRow } from "../../types/reports";

const TABS: { value: ReportType; label: string }[] = [
  { value: "sales", label: "Sales by day" },
  { value: "items", label: "Items" },
  { value: "areas", label: "Areas" },
];

const avg = (revenue: number, orders: number) => (orders > 0 ? Math.round(revenue / orders) : 0);
const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

interface Table {
  header: string[];
  rows: (string | number)[][]; // raw numbers: the CSV gets these as-is
  total?: (string | number)[];
  money: number[]; // column indexes shown as LKR on screen
}

/** One report's rows as a table description; the page renders it and the CSV export reuses it. */
function toTable(type: ReportType, data: unknown[]): Table {
  if (type === "sales") {
    const rows = (data as SalesDayRow[]).map((r) => [r.date, r.orderCount, r.totalRevenue, avg(r.totalRevenue, r.orderCount)]);
    const orders = rows.reduce((n, r) => n + (r[1] as number), 0);
    const revenue = rows.reduce((n, r) => n + (r[2] as number), 0);
    return { header: ["Date", "Orders", "Revenue", "Avg order"], rows, total: ["Total", orders, revenue, avg(revenue, orders)], money: [2, 3] };
  }
  if (type === "items") {
    const rows = (data as ItemRow[]).map((r) => [r.food_name, r.total_quantity, r.total_revenue]);
    return { header: ["Item", "Sold", "Revenue"], rows, total: ["Total", rows.reduce((n, r) => n + (r[1] as number), 0), rows.reduce((n, r) => n + (r[2] as number), 0)], money: [2] };
  }
  const list = data as AreaRow[];
  const rows = list.map((r) => [r.area_name, r.orderCount, r.totalRevenue, pct(r.completedCount, r.orderCount)]);
  const orders = list.reduce((n, r) => n + r.orderCount, 0);
  return {
    header: ["Area", "Orders", "Revenue", "Completed %"],
    rows,
    total: ["Total", orders, list.reduce((n, r) => n + r.totalRevenue, 0), pct(list.reduce((n, r) => n + r.completedCount, 0), orders)],
    money: [2],
  };
}

export default function Reports() {
  const r = useReports();
  const table = r.report ? toTable(r.type, r.report.data) : null;
  const show = (t: Table, row: (string | number)[], i: number) =>
    t.money.includes(i) ? formatMoney(row[i] as number) : r.type === "areas" && i === 3 ? `${row[i]}%` : row[i];

  const columns: Column<(string | number)[]>[] = table
    ? table.header.map((h, i): Column<(string | number)[]> => ({
        key: h,
        label: h,
        align: i > 0 ? "right" : undefined,
        mobile: i === 0 ? "title" : undefined,
        cell: (row) => show(table, row, i),
        footer: table.total ? show(table, table.total, i) : undefined,
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Revenue is the total value of orders in the range, whatever their payment status."
        actions={
          <Button disabled={!table || table.rows.length === 0} onClick={() => table && downloadCsv(`${r.type}-${r.range.from}_${r.range.to}.csv`, table.header, table.rows)}>
            <LuDownload aria-hidden="true" /> Download CSV
          </Button>
        }
      />

      <RangeFilters f={r} />

      <Tabs label="Report" value={r.type} tabs={TABS} onChange={r.setType}>
        {r.error && table && (
          <Alert tone="warning">
            Showing the last loaded data (refresh failed: {r.error}){" "}
            <Button size="sm" onClick={r.refresh}>
              Retry
            </Button>
          </Alert>
        )}
        <div className={r.loading ? "ui-dim" : undefined}>
          <DataTable columns={columns} rows={table?.rows ?? []} rowKey={(row) => String(row[0])} loading={!table && !r.error} error={!table && r.error ? `Couldn't load the report: ${r.error}` : null} emptyTitle="No orders in this range" />
        </div>
        {!table && r.error && <Button onClick={r.refresh}>Retry</Button>}
      </Tabs>
    </div>
  );
}
