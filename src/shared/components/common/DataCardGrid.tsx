import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

/* ── Field descriptor ─────────────────────────────────────────── */

export interface CardField<T> {
  /** Unique key – also used to read data from the row when `render` is absent */
  key: keyof T | string;
  /** Small label shown above the value */
  label: string;
  /** Custom render – receives the full row */
  render?: (row: T) => ReactNode;
  /** When true this field spans the full width of the card (title area) */
  primary?: boolean;
  /** When true this field is rendered as a subtle secondary line below the primary */
  secondary?: boolean;
  /** Hide this field from the card (useful if you only need it for filtering) */
  hidden?: boolean;
}

/* ── Component props ──────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataCardGrid<T extends Record<string, any>>({
  rows,
  fields,
  filterKeys,
  pageSize = 12,
  toolbar,
  empty = "No results.",
  onCardClick,
  actions,
}: {
  rows: T[];
  fields: CardField<T>[];
  filterKeys?: (keyof T)[];
  pageSize?: number;
  toolbar?: ReactNode;
  empty?: string;
  /** When provided, clicking a card triggers this callback */
  onCardClick?: (row: T) => void;
  /** Render action buttons in the top-right corner of each card */
  actions?: (row: T) => ReactNode;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  /* ── Filter ──────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!q || !filterKeys?.length) return rows;
    const needle = q.toLowerCase();
    return rows.filter((row) =>
      filterKeys.some((k) =>
        String(row[k] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [rows, q, filterKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);

  /* ── Derive field groups ─────────────────────────────────────── */
  const primaryField = fields.find((f) => f.primary);
  const secondaryField = fields.find((f) => f.secondary);
  const metaFields = fields.filter((f) => !f.primary && !f.secondary && !f.hidden);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Search + toolbar */}
      <Card className="border-border/70 shadow-card">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search…"
              className="h-9 pl-8"
            />
          </div>
          <div className="flex items-center gap-2">{toolbar}</div>
        </div>
      </Card>

      {/* Grid */}
      {slice.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-14 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
          }}
        >
          {slice.map((row, i) => (
            <Card
              key={i}
              className={
                "group relative flex flex-col border-border/70 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-elegant hover:-translate-y-[1px]" +
                (onCardClick ? " cursor-pointer" : "")
              }
              onClick={() => onCardClick?.(row)}
            >
              {/* Actions (top-right) */}
              {actions && (
                <div
                  className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions(row)}
                </div>
              )}

              {/* Primary + secondary (title area) */}
              {primaryField && (
                <div className="mb-2.5 pr-6">
                  <div className="text-sm font-semibold leading-snug text-foreground">
                    {primaryField.render
                      ? primaryField.render(row)
                      : String(row[primaryField.key as keyof T] ?? "")}
                  </div>
                  {secondaryField && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {secondaryField.render
                        ? secondaryField.render(row)
                        : String(row[secondaryField.key as keyof T] ?? "")}
                    </div>
                  )}
                </div>
              )}

              {/* Separator */}
              {primaryField && metaFields.length > 0 && (
                <div className="mb-2.5 border-t border-border/60" />
              )}

              {/* Meta grid – auto 2-col on wider cards */}
              {metaFields.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {metaFields.map((f) => (
                    <div key={String(f.key)} className="min-w-0">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        {f.label}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium text-foreground">
                        {f.render ? f.render(row) : String(row[f.key as keyof T] ?? "—")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2.5 text-xs text-muted-foreground shadow-card">
        <div>
          Showing {slice.length ? page * pageSize + 1 : 0}–{page * pageSize + slice.length} of{" "}
          {filtered.length}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="px-2">
            Page {page + 1} of {pages}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
