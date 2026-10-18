import type { ReactNode } from "react";
import { Alert } from "./Alert";
import { EmptyState } from "./EmptyState";
import { Spinner } from "./Spinner";

export interface Column<T> {
  key: string;
  label: string; // desktop header text and the label on a phone card
  cell: (row: T) => ReactNode;
  header?: ReactNode; // replaces the label in the desktop header (e.g. a select-all checkbox)
  align?: "right"; // numbers and actions
  // Slot on phones: title and amount share the first line, select goes before them, inline cells sit unlabeled
  // side by side, actions come last. Omit for a label/value pair.
  mobile?: "title" | "amount" | "select" | "inline" | "actions";
  nowrap?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean; // true until the first load finishes
  error?: string | null;
  emptyTitle?: string;
  rowTone?: (row: T) => "attn" | "bad" | undefined; // coloured edge: needs a human / went wrong
}

const cls = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ") || undefined;

export function DataTable<T>({ columns, rows, rowKey, loading = false, error, emptyTitle = "Nothing to show", rowTone }: DataTableProps<T>) {
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
                  <th key={c.key} role="columnheader" scope="col" className={cls(c.nowrap && "ui-nowrap", c.align === "right" && "ui-right")}>
                    {c.header ?? c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((r) => {
                const tone = rowTone?.(r);
                return (
                  <tr key={rowKey(r)} role="row" className={tone ? `ui-row--${tone}` : undefined}>
                    {columns.map((c) => (
                      <td key={c.key} role="cell" data-label={c.label} data-slot={c.mobile} className={cls(c.nowrap && "ui-nowrap", c.align === "right" && "ui-right")}>
                        {c.cell(r)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
