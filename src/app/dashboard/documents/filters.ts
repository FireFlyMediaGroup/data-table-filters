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
  },
  {
    type: "timerange",
    label: "Created At",
    value: "createdAt",
    defaultOpen: false,
  },
  {
    type: "timerange",
    label: "Updated At",
    value: "updatedAt",
    defaultOpen: false,
  },
  {
    type: "input",
    label: "RPIC",
    value: "user",
    defaultOpen: false,
  },
];
