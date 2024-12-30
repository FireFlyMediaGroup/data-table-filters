import { type ColumnDef, type Table } from "@tanstack/react-table";
import { DocumentSchema } from "./schema";
import { DocumentTableMeta } from "./types";
import { format } from "date-fns";
import { Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Badge } from "../../../components/ui/badge";
import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";

type TableMeta = Table<DocumentSchema>["options"]["meta"] & DocumentTableMeta;

export const columns: ColumnDef<DocumentSchema>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <div className="font-medium">
          {title}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="font-mono whitespace-nowrap">
          {format(date, "MMM dd, yyyy HH:mm")}
        </div>
      );
    },
    filterFn: "inDateRange",
  },
  {
    accessorKey: "documentType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("documentType") as string;
      return (
        <Badge variant="outline">
          {type.replace("_", " ")}
        </Badge>
      );
    },
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "APPROVED"
              ? "default"
              : status === "REJECTED"
              ? "destructive"
              : status === "PENDING"
              ? "secondary"
              : "outline"
          }
        >
          {status}
        </Badge>
      );
    },
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RPIC" />
    ),
    cell: ({ row }) => {
      const user = row.getValue("user") as { name: string | null; email: string };
      return (
        <div className="flex flex-col">
          <span className="font-medium">{user.name || "Unnamed"}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      );
    },
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Modified" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;
      return (
        <div className="font-mono whitespace-nowrap">
          {format(date, "MMM dd, yyyy HH:mm")}
        </div>
      );
    },
    filterFn: "inDateRange",
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const document = row.original;
      const meta = table.options.meta as TableMeta;
      const userRole = meta?.userRole;
      const actionInProgress = meta?.actionInProgress;
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
              onClick={() => meta?.onView(document)}
              disabled={isLoading('view')}
            >
              {isLoading('view') ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onEdit(document)}
              disabled={isLoading('edit')}
            >
              {isLoading('edit') ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDownload(document)}
              disabled={isLoading('download')}
            >
              {isLoading('download') ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onPrint(document)}
              disabled={isLoading('print')}
            >
              {isLoading('print') ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Print
            </DropdownMenuItem>
            {canApprove && (
              <DropdownMenuItem
                onClick={() => meta?.onApprove(document)}
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
                onClick={() => meta?.onDelete(document)}
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
