import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  filterKeys,
  pageSize = 8,
  toolbar,
  empty = "No results.",
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
      r = r.filter((row) =>
        filterKeys.some((k) =>
          String(row[k] ?? "")
            .toLowerCase()
            .includes(needle),
        ),
      );
    }
    if (sortKey) {
      r = [...r].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
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
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-white">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search..."
            className="h-9.5 pl-9 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all rounded-lg text-sm text-slate-900 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="bg-slate-50/75 border-b border-slate-200">
            <TableRow className="hover:bg-transparent border-none">
              {columns.map((c) => (
                <TableHead
                  key={String(c.key)}
                  className={cn("py-3.5 px-4 font-semibold text-[11px] tracking-wider uppercase text-slate-500", c.className)}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.sortable ? (
                    <button
                      onClick={() => onSort(String(c.key))}
                      className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      {c.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    <span>{c.header}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {slice.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-slate-400 font-medium"
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
            {slice.map((row, i) => (
              <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-none">
                {columns.map((c) => (
                  <TableCell key={String(c.key)} className={cn("py-3.5 px-4 text-sm text-slate-700 font-normal border-b border-slate-100", c.className)}>
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 bg-white">
        <div className="font-medium">
          Showing {slice.length ? page * pageSize + 1 : 0}–{page * pageSize + slice.length} of{" "}
          {filtered.length}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50 transition-colors"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div className="px-3 font-semibold text-slate-700">
            Page {page + 1} of {pages}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50 transition-colors"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
