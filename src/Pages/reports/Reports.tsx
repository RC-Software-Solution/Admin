import React from "react";
import "../Dashboard/dashboard.css";
import RangeFilters from "../../components/common/RangeFilters";
import { useReports } from "../../hooks/useReports";
import { formatMoney } from "../../utils/formatMoney";
import { downloadCsv } from "./reports.service";
import type { AreaRow, ItemRow, ReportType, SalesDayRow } from "../../types/reports";

const TABS: { id: ReportType; label: string }[] = [
  { id: "sales", label: "Sales by day" },
  { id: "items", label: "Items" },
  { id: "areas", label: "Areas" },
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

const Reports: React.FC = () => {
  const r = useReports();
  const table = r.report ? toTable(r.type, r.report.data) : null;
  const show = (t: Table, row: (string | number)[], i: number) => (t.money.includes(i) ? formatMoney(row[i] as number) : r.type === "areas" && i === 3 ? `${row[i]}%` : row[i]);

  return (
    <div className="content">
      <h1 className="pageTitle">Reports</h1>
      <div className="pageSub">Revenue is the total value of orders in the range, whatever their payment status.</div>

      <RangeFilters f={r} />

      <section className="card">
        <div className="card__header">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`tab ${r.type === t.id ? "tab--active" : ""}`} onClick={() => r.setType(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <button
            disabled={!table || table.rows.length === 0}
            onClick={() => table && downloadCsv(`${r.type}-${r.range.from}_${r.range.to}.csv`, table.header, table.rows)}
          >
            Download CSV
          </button>
        </div>

        {r.error && (
          <div className="sectionNote">
            {table ? `Showing the last loaded data (refresh failed: ${r.error})` : `Couldn't load the report: ${r.error}`} <button onClick={r.refresh}>Retry</button>
          </div>
        )}

        <div className={`tableWrap ${r.loading ? "dim" : ""}`}>
          {!table && !r.error && <div className="sectionNote">Loading…</div>}
          {table && (
            <table className="table">
              <thead>
                <tr>{table.header.map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {table.rows.length === 0 && <tr><td colSpan={table.header.length} className="sectionNote">No orders in this range</td></tr>}
                {table.rows.map((row) => (
                  <tr key={row[0]}>{row.map((_, i) => <td key={i}>{show(table, row, i)}</td>)}</tr>
                ))}
                {table.rows.length > 0 && table.total && (
                  <tr><th>{table.total[0]}</th>{table.total.slice(1).map((_, i) => <th key={i}>{show(table, table.total!, i + 1)}</th>)}</tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;
