import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { DataTablePagination } from "../../../components/data-table/data-table-pagination";
import { DataTableToolbar } from "../../../components/data-table/data-table-toolbar";
import { DataTableFilterControls } from "../../../components/data-table/data-table-filter-controls";
import { DataTableFilterCommand } from "../../../components/data-table/data-table-filter-command";
import { filterFields } from "./filters";
import { DocumentSchema, documentFilterSchema } from "./schema";
import { cn } from "../../../lib/utils";
import { Separator } from "../../../components/ui/separator";

interface DocumentTableProps {
  columns: ColumnDef<DocumentSchema>[];
  data: DocumentSchema[];
  userRole: string;
  actionInProgress: string | null;
  onView: (document: DocumentSchema) => void;
  onEdit: (document: DocumentSchema) => void;
  onDownload: (document: DocumentSchema) => void;
  onPrint: (document: DocumentSchema) => void;
  onApprove: (document: DocumentSchema) => void;
  onDelete: (document: DocumentSchema) => void;
}

export function DocumentTable({
  columns,
  data,
  userRole,
  actionInProgress,
  onView,
  onEdit,
  onDownload,
  onPrint,
  onApprove,
  onDelete,
}: DocumentTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [controlsOpen, setControlsOpen] = React.useState(true);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const topBarRef = React.useRef<HTMLDivElement>(null);
  const [topBarHeight, setTopBarHeight] = React.useState(0);

  React.useEffect(() => {
    const observer = new ResizeObserver(() => {
      const rect = topBarRef.current?.getBoundingClientRect();
      if (rect) {
        setTopBarHeight(rect.height);
      }
    });

    const topBar = topBarRef.current;
    if (!topBar) return;

    observer.observe(topBar);
    return () => observer.unobserve(topBar);
  }, [topBarRef]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnOrder,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      userRole,
      actionInProgress,
      onView,
      onEdit,
      onDownload,
      onPrint,
      onApprove,
      onDelete,
    },
  });

  return (
    <div className="flex w-full min-h-screen h-full flex-col sm:flex-row">
      <div className={cn(
        "w-full h-full sm:min-w-52 sm:max-w-52 sm:self-start md:min-w-72 md:max-w-72 sm:sticky sm:top-0 sm:max-h-screen sm:overflow-y-scroll",
        !controlsOpen && "hidden"
      )}>
        <div className="p-2 flex-1">
          <DataTableFilterControls
            table={table}
            columns={columns}
            filterFields={filterFields}
          />
        </div>
        <Separator className="my-2" />
      </div>
      <div className={cn(
        "flex max-w-full flex-1 flex-col sm:border-l border-border overflow-clip",
        controlsOpen && "sm:max-w-[calc(100vw_-_208px)] md:max-w-[calc(100vw_-_288px)]"
      )}>
        <div
          ref={topBarRef}
          className={cn(
            "flex flex-col gap-4 bg-background p-2",
            "z-10 pb-4 sticky top-0"
          )}
        >
          <DataTableFilterCommand
            table={table}
            filterFields={filterFields}
            schema={documentFilterSchema}
            isLoading={false}
          />
          <DataTableToolbar
            table={table}
            controlsOpen={controlsOpen}
            setControlsOpen={setControlsOpen}
            isLoading={false}
            enableColumnOrdering={true}
          />
        </div>
        <div className="relative flex-1 overflow-auto">
          <Table>
            <TableHeader
              className="sticky top-0 bg-muted z-20 border-b"
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={header.column.columnDef.meta?.headerClassName}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cell.column.columnDef.meta?.headerClassName}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-auto p-2 border-t">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
