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
import { filterFields } from "./filters";
import { DocumentSchema } from "./schema";

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

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
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
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        controlsOpen={controlsOpen} 
        setControlsOpen={setControlsOpen}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
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
      <DataTablePagination table={table} />
      <DataTableFilterControls 
        table={table} 
        filterFields={filterFields}
        columns={columns}
      />
    </div>
  );
}
