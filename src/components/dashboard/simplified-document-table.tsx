'use client';

import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DocumentSchema } from "../../app/dashboard/documents/schema";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface SimplifiedDocumentTableProps {
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

export function SimplifiedDocumentTable({
  data,
  userRole,
  actionInProgress,
  onView,
  onEdit,
  onDownload,
  onPrint,
  onApprove,
  onDelete,
}: SimplifiedDocumentTableProps) {
  const columns: ColumnDef<DocumentSchema>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return <div className="font-medium">{title}</div>;
      },
    },
    {
      accessorKey: "documentType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("documentType") as string;
        return (
          <Badge variant="outline">
            {type.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={
              status === "APPROVED"
                ? "secondary"
                : status === "PENDING"
                ? "default"
                : "outline"
            }
            className={
              status === "APPROVED"
                ? "bg-green-500 hover:bg-green-500/80"
                : status === "PENDING"
                ? "bg-yellow-500 hover:bg-yellow-500/80 text-black"
                : ""
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="font-mono whitespace-nowrap">
            {format(date, "MMM dd, yyyy")}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const document = row.original;
        const canApprove = (userRole === "admin" || userRole === "supervisor") && document.status === "PENDING";
        const canDelete = userRole === "admin" || userRole === "supervisor";

        const isLoading = (action: string) => actionInProgress === `${action}-${document.id}`;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onView(document)}
                disabled={isLoading('view')}
              >
                {isLoading('view') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(document)}
                disabled={isLoading('edit')}
              >
                {isLoading('edit') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDownload(document)}
                disabled={isLoading('download')}
              >
                {isLoading('download') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onPrint(document)}
                disabled={isLoading('print')}
              >
                {isLoading('print') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Print
              </DropdownMenuItem>
              {canApprove && (
                <DropdownMenuItem
                  onClick={() => onApprove(document)}
                  disabled={isLoading('approve')}
                >
                  {isLoading('approve') ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Approve
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(document)}
                  disabled={isLoading('delete')}
                >
                  {isLoading('delete') ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No documents found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
