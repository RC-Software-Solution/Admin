import { DataTable } from "../../components/ui";
import type { Column } from "../../components/ui";
import { formatMoney } from "../../utils/formatMoney";
import type { AreaRow } from "../../types/dashboard";

const completed = (r: AreaRow) => (r.orderCount > 0 ? Math.round((r.completedCount / r.orderCount) * 100) : 0);

const columns: Column<AreaRow>[] = [
  { key: "area", label: "Area", mobile: "title", cell: (r) => <b className="ui-cell__title">{r.area_name}</b> },
  { key: "orders", label: "Orders", align: "right", mobile: "hide", cell: (r) => r.orderCount },
  { key: "revenue", label: "Revenue", align: "right", mobile: "amount", nowrap: true, cell: (r) => <strong>{formatMoney(r.totalRevenue)}</strong> },
  { key: "completed", label: "Completed", align: "right", mobile: "hide", cell: (r) => `${completed(r)}%` },
];

/** Orders, revenue and the share of orders completed, per delivery area. */
export default function AreaList({ rows }: { rows: AreaRow[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(r) => String(r.area_id)} emptyTitle="No orders in this range" />;
}
