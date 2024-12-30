# Documents Feature Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [State Management](#state-management)
5. [Data Flow](#data-flow)
6. [Server Actions](#server-actions)
7. [Database Schema](#database-schema)
8. [Role-Based Access Control](#role-based-access-control)
9. [Error Handling](#error-handling)
10. [Audit Logging](#audit-logging)
11. [Filter Configuration](#filter-configuration)
12. [Loading States](#loading-states)
13. [Development Guidelines](#development-guidelines)

## Overview

The documents feature is a comprehensive document management system built with Next.js 14, Prisma, and TanStack Table. It provides:

- Document creation, viewing, editing, and deletion
- Role-based access control
- PDF generation for download/print
- Advanced filtering and sorting
- Real-time updates and notifications
- Loading states and error handling
- Audit logging for document operations

## Architecture

### Directory Structure

```
src/
├── app/dashboard/documents/
│   ├── actions.ts              # Server actions for data operations
│   ├── client.tsx             # Client-side component for documents table
│   ├── columns.tsx            # Table column definitions
│   ├── data-table.tsx         # Main data table component
│   ├── error.tsx             # Error boundary component
│   ├── filters.ts            # Filter configurations
│   ├── loading.tsx           # Loading state component
│   ├── page.tsx              # Main page component
│   ├── schema.ts             # Zod schemas and types
│   ├── search-params.ts      # URL search params handling
│   ├── types.ts              # TypeScript type definitions
│   └── [id]/                 # Document-specific routes
│       ├── page.tsx          # Document view page
│       ├── edit/             # Document edit functionality
│       │   ├── page.tsx      # Edit page component
│       │   └── edit-form.tsx # Edit form component
│       └── route.ts          # API route for document operations
└── components/data-table/    # Reusable data table components
    ├── data-table-column-header.tsx    # Column header with sorting
    ├── data-table-filter-checkbox.tsx  # Checkbox filter component
    ├── data-table-filter-controls.tsx  # Filter controls panel
    ├── data-table-filter-input.tsx     # Text input filter
    ├── data-table-filter-timerange.tsx # Date range filter
    ├── data-table-pagination.tsx       # Pagination controls
    ├── data-table-toolbar.tsx          # Table toolbar with actions
    └── types.ts                        # Shared type definitions
```

### Key Technologies

- **Next.js 14**: App Router, Server Components, Server Actions
- **Prisma**: Database ORM
- **TanStack Table**: Data table with filtering and sorting
- **Shadcn/ui**: UI components
- **PDF-lib**: PDF generation for download/print
- **Sonner**: Toast notifications
- **Zod**: Schema validation

## Components

### 1. Main Page (page.tsx)
```typescript
// Server component that fetches user data and renders the client component
export default async function DocumentsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user.user_metadata?.role || 'user';

  return <DocumentsClient userRole={userRole} />;
}
```

### 2. Client Component (client.tsx)
```typescript
// Client-side component managing document list and interactions
export function DocumentsClient({ userRole }: { userRole: string }) {
  const [documents, setDocuments] = useState<DocumentSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  // Document operation handlers
  const handleView = async (document: DocumentSchema) => {
    router.push(`/dashboard/documents/${document.id}`);
  };

  const handleApprove = async (document: DocumentSchema) => {
    try {
      setActionInProgress(`approve-${document.id}`);
      await approveDocument(document.id);
      toast.success('Document approved successfully');
      await loadDocuments();
    } catch (error) {
      toast.error('Failed to approve document');
    } finally {
      setActionInProgress(null);
    }
  };

  // ... other handlers
}
```

### 3. Data Table (data-table.tsx)
```typescript
// Reusable table component with filtering and sorting
export function DocumentTable({
  columns,
  data,
  userRole,
  actionInProgress,
  ...actions
}: DocumentTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [controlsOpen, setControlsOpen] = React.useState(true);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      userRole,
      actionInProgress,
      ...actions,
    },
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        controlsOpen={controlsOpen} 
        setControlsOpen={setControlsOpen}
      />
      <Table>
        <TableHeader>{/* ... */}</TableHeader>
        <TableBody>{/* ... */}</TableBody>
      </Table>
      <DataTablePagination table={table} />
      <DataTableFilterControls 
        table={table} 
        filterFields={filterFields}
        columns={columns}
      />
    </div>
  );
}
```

## State Management

### URL State
```typescript
// search-params.ts
export const searchParamsSchema = {
  sort: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  documentType: z.array(z.string()).optional(),
  dateRange: z.array(z.date()).optional(),
};
```

### Client State
```typescript
// Types for document state
interface DocumentState {
  documents: DocumentSchema[];
  loading: boolean;
  actionInProgress: string | null;
}

// State management in client component
const [documents, setDocuments] = useState<DocumentSchema[]>([]);
const [loading, setLoading] = useState(true);
const [actionInProgress, setActionInProgress] = useState<string | null>(null);
```

## Data Flow

1. **Initial Load**:
   - Server component fetches user data from Supabase
   - Client component loads documents using Prisma
   - Data table renders with filters and sorting

2. **Document Operations**:
   - User initiates action (view, edit, etc.)
   - Loading state is set
   - Server action is called
   - Prisma performs database operation
   - State is updated
   - Loading state is cleared
   - UI is refreshed

3. **Error Handling**:
   - Errors are caught in try/catch blocks
   - Error messages are displayed via toast
   - Loading states are cleared
   - User can retry operation

## Server Actions

### Document Operations (actions.ts)
```typescript
// Server actions for document operations
export async function fetchDocuments(): Promise<DocumentSchema[]> {
  try {
    const documents = await prismaClient.document.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      userId: doc.userId,
      user: {
        email: doc.user.email,
        name: doc.user.name
      },
      documentType: doc.content.includes('POWRA') ? 'POWRA' : 
                   doc.content.includes('FPL_MISSION') ? 'FPL_MISSION' : 
                   'TAILBOARD'
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Error fetching documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function approveDocument(documentId: string): Promise<DocumentSchema> {
  try {
    const document = await prismaClient.document.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Audit logging
    await auditLogger.log({
      action: 'document.approve',
      userId: user.id,
      resourceId: documentId,
      details: {
        documentTitle: document.title,
        userRole: user.user_metadata?.role || 'user',
      },
    });

    return {
      ...document,
      documentType: document.content.includes('POWRA') ? 'POWRA' : 
                   document.content.includes('FPL_MISSION') ? 'FPL_MISSION' : 
                   'TAILBOARD'
    };
  } catch (error) {
    console.error('Error approving document:', error);
    throw new Error(`Error approving document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

## Database Schema

### Prisma Schema
```prisma
enum UserRole {
  user
  supervisor
  admin
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      UserRole @default(user)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  documents Document[]
}

enum DocumentStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
}

model Document {
  id        String   @id @default(uuid())
  title     String
  content   String
  status    DocumentStatus @default(DRAFT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  userId    String

  @@index([userId])
}
```

## Role-Based Access Control

### User Roles
```typescript
type UserRole = 'admin' | 'supervisor' | 'user';

// Role-based permissions in columns.tsx
const canApprove = (userRole === "admin" || userRole === "supervisor") && document.status === "PENDING";
const canDelete = userRole === "admin" || userRole === "supervisor";

// Conditional rendering of actions
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
```

## Error Handling

### Error Types
```typescript
interface DocumentError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Error handling in components
try {
  await approveDocument(documentId);
  toast.success('Document approved successfully');
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Failed to approve document');
  console.error(error);
} finally {
  setActionInProgress(null);
}
```

## Audit Logging

### Audit Events
```typescript
interface AuditEvent {
  action: string;
  userId: string;
  resourceId?: string;
  details?: Record<string, any>;
}

// Audit logger implementation
export const auditLogger = {
  log: async (event: AuditEvent) => {
    console.log('Audit Event:', {
      timestamp: new Date().toISOString(),
      ...event,
    });
    // In production, send to secure logging service
  }
};
```

## Filter Configuration

### Filter Fields (filters.ts)
```typescript
// Filter field definitions for the data table
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
```

### Filter Components

1. **Checkbox Filter**:
   - Used for status and document type filtering
   - Supports multiple selections
   - Shows count of items for each option

2. **Time Range Filter**:
   - Used for date-based filtering
   - Supports date range selection
   - Uses date-fns for formatting

3. **Input Filter**:
   - Used for text-based filtering
   - Supports fuzzy search
   - Debounced input handling

### Filter Controls Integration
```typescript
// In data-table.tsx
<DataTableFilterControls 
  table={table} 
  filterFields={filterFields}
  columns={columns}
/>

// In DataTableFilterControls component
export function DataTableFilterControls<TData>({
  table,
  filterFields,
}: DataTableFilterControlsProps<TData>) {
  return (
    <div className="space-y-4">
      {filterFields.map((field) => {
        switch (field.type) {
          case "checkbox":
            return <DataTableFilterCheckbox key={field.value} {...field} table={table} />;
          case "timerange":
            return <DataTableFilterTimerange key={field.value} {...field} table={table} />;
          case "input":
            return <DataTableFilterInput key={field.value} {...field} table={table} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
```

## Loading States

### Action Progress Tracking
```typescript
// In client component
const [actionInProgress, setActionInProgress] = useState<string | null>(null);

// In table component
const isLoading = (action: string) => actionInProgress === `${action}-${document.id}`;

// In dropdown menu
<DropdownMenuItem
  onClick={() => onAction(document)}
  disabled={isLoading('action')}
>
  {isLoading('action') ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : null}
  Action Label
</DropdownMenuItem>
```

## Development Guidelines

### Environment Setup
1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```env
# Database connection URLs
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Running the Project
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Seed test data
npm run seed
```

### Best Practices
1. **Error Handling**:
   - Always use try/catch blocks for async operations
   - Provide user-friendly error messages via toast
   - Log errors for debugging
   - Clear loading states in finally blocks

2. **State Management**:
   - Use URL state for filters and sorting
   - Keep loading states for each action
   - Update state atomically
   - Refresh data after mutations

3. **Performance**:
   - Use proper database indexes
   - Implement pagination
   - Optimize re-renders
   - Use proper Prisma includes

4. **Security**:
   - Validate all inputs with Zod
   - Implement proper RBAC
   - Use server actions for mutations
   - Keep sensitive operations server-side

5. **Audit Logging**:
   - Log all important operations
   - Include relevant context
   - Maintain user privacy
   - Log both success and failure cases

This documentation provides a comprehensive overview of the documents feature, including its architecture, components, and implementation details. It should serve as a complete guide for developers working with this feature.
