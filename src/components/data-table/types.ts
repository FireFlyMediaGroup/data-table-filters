export interface DataTableFilterField<T> {
  type: "checkbox" | "timerange" | "input" | "slider";
  label: string;
  value: keyof T;
  defaultOpen: boolean;
  options?: { label: string; value: string }[];
  commandDisabled?: boolean;
}

export interface DocumentTableMeta {
  userRole: string;
  actionInProgress: string | null;
  onView: (document: any) => void;
  onEdit: (document: any) => void;
  onDownload: (document: any) => void;
  onPrint: (document: any) => void;
  onApprove: (document: any) => void;
  onDelete: (document: any) => void;
}
