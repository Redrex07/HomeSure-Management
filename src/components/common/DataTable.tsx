import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
};

export function DataTable<T extends Record<string, any>>({
  rows, columns, filterKeys, pageSize = 8, toolbar, empty = "No results.",
}: {
  rows: T[];
  columns: Column<T>[];
  filterKeys?: (keyof T)[];
  pageSize?: number;
  toolbar?: ReactNode;
  empty?: string;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let r = rows;
    if (q && filterKeys?.length) {
      const needle = q.toLowerCase();
      r = r.filter((row) => filterKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(needle)));
    }
    if (sortKey) {
      r = [...r].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (av == null) return 1; if (bv == null) return -1;
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return r;
  }, [rows, q, filterKeys, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const onSort = (k: string) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  return (
    <Card className="border-border/70 shadow-card">
      <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search…" className="h-9 pl-8" />
        </div>
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((c) => (
                <TableHead key={String(c.key)} className={c.className} style={c.width ? { width: c.width } : undefined}>
                  {c.sortable ? (
                    <button onClick={() => onSort(String(c.key))} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                      {c.header}<ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.header}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>
            )}
            {slice.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/40">
                {columns.map((c) => (
                  <TableCell key={String(c.key)} className={c.className}>
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
        <div>Showing {slice.length ? page * pageSize + 1 : 0}–{page * pageSize + slice.length} of {filtered.length}</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <div className="px-2">Page {page + 1} of {pages}</div>
          <Button variant="outline" size="sm" className="h-7 px-2" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </Card>
  );
}
