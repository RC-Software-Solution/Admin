import { Avatar, DataTable } from "../../components/ui";
import type { Column } from "../../components/ui";
import { formatMoney } from "../../utils/formatMoney";
import type { TopItemData } from "../../types/dashboard";

/** Best sellers in the selected range; the bar shows each item's revenue against the best seller's. */
export default function TopItemsList({ items }: { items: TopItemData[] }) {
  const max = Math.max(0, ...items.map((i) => i.total_revenue));
  const columns: Column<TopItemData>[] = [
    {
      key: "item",
      label: "Item",
      mobile: "title",
      cell: (r) => (
        <div className="dash-who">
          <Avatar name={r.food_name} src={r.image_url} size="md" square tone="auto" />
          <b>{r.food_name}</b>
        </div>
      ),
    },
    { key: "sold", label: "Sold", align: "right", mobile: "hide", cell: (r) => r.total_quantity },
    { key: "revenue", label: "Revenue", align: "right", mobile: "amount", nowrap: true, cell: (r) => <strong>{formatMoney(r.total_revenue)}</strong> },
    {
      key: "share",
      label: "Share of revenue",
      header: <span className="ui-sr-only">Share of revenue</span>,
      mobile: "hide",
      cell: (r) => (
        <div className="dash-meter" aria-hidden="true">
          <i style={{ width: `${max > 0 ? (r.total_revenue / max) * 100 : 0}%` }} />
        </div>
      ),
    },
  ];
  return <DataTable columns={columns} rows={items} rowKey={(r) => r.food_name} emptyTitle="No sales in this range" />;
}
