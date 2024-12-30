import { DocumentSchema } from "./schema";

export interface DocumentTableMeta {
  userRole: string;
  actionInProgress: string | null;
  onView: (document: DocumentSchema) => void;
  onEdit: (document: DocumentSchema) => void;
  onDownload: (document: DocumentSchema) => void;
  onPrint: (document: DocumentSchema) => void;
  onApprove: (document: DocumentSchema) => void;
  onDelete: (document: DocumentSchema) => void;
}
