import { DocumentSchema } from "./schema";
import { DataTableFilterField } from "../../../components/data-table/types";
import { DocumentStatus } from "@prisma/client";

export const filterFields: DataTableFilterField<DocumentSchema>[] = [
  {
    type: "checkbox",
    label: "Status",
    value: "status",
    defaultOpen: true,
    options: Object.values(DocumentStatus).map(status => ({
      label: status,
      value: status,
    })),
    commandDisabled: false,
  },
  {
    type: "checkbox",
    label: "Document Type",
    value: "documentType",
    defaultOpen: true,
    options: [
      { label: "POWRA", value: "POWRA" },
      { label: "FPL Mission", value: "FPL_MISSION" },
      { label: "Tailboard", value: "TAILBOARD" },
    ],
    commandDisabled: false,
  },
  {
    type: "timerange",
    label: "Created At",
    value: "createdAt",
    defaultOpen: false,
    commandDisabled: false,
  },
  {
    type: "timerange",
    label: "Updated At",
    value: "updatedAt",
    defaultOpen: false,
    commandDisabled: false,
  },
  {
    type: "input",
    label: "RPIC",
    value: "userId",
    defaultOpen: false,
    commandDisabled: false,
  },
];
