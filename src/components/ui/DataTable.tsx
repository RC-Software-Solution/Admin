import type { ReactNode } from "react";
import { Alert } from "./Alert";
import { EmptyState } from "./EmptyState";
import { Spinner } from "./Spinner";

export interface Column<T> {
  key: string;
  label: string; // desktop header text and the label on a phone card
  cell: (row: T) => ReactNode;
  header?: ReactNode; // replaces the label in the desktop header (e.g. a select-all checkbox)
  mobile?: "title" | "select" | "actions"; // special slot on phones; omit for a label/value pair
  nowrap?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean; // true until the first load finishes
  error?: string | null;
  emptyTitle?: string;
}

export function DataTable<T>({ columns, rows, rowKey, loading = false, error, emptyTitle = "Nothing to show" }: DataTableProps<T>) {
  const waiting = loading && rows.length === 0;
  return (
    <div className="ui-datatable">
      {error && <Alert>{error}</Alert>}
      {waiting && (
        <div className="ui-datatable__state">
          <Spinner label="Loading" />
        </div>
      )}
      {!waiting && rows.length === 0 && !error && <EmptyState title={emptyTitle} />}
      {rows.length > 0 && (
        <div className="ui-datatable__scroll">
          {/* explicit roles keep table semantics when the phone layout turns cells into blocks */}
          <table className="ui-table" role="table">
            <thead role="rowgroup">
              <tr role="row">
                {columns.map((c) => (
                  <th key={c.key} role="columnheader" scope="col" className={c.nowrap ? "ui-nowrap" : undefined}>
                    {c.header ?? c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((r) => (
                <tr key={rowKey(r)} role="row">
                  {columns.map((c) => (
                    <td key={c.key} role="cell" data-label={c.label} data-slot={c.mobile} className={c.nowrap ? "ui-nowrap" : undefined}>
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
