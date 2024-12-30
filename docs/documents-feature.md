# Documents Feature Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [State Management](#state-management)
5. [Data Flow](#data-flow)
6. [Server Actions](#server-actions)
7. [Database Schema](#database-schema)
8. [Security & Authentication](#security--authentication)
9. [Error Handling](#error-handling)
10. [Audit Logging](#audit-logging)
11. [Filter Configuration](#filter-configuration)
12. [Loading States](#loading-states)
13. [Development Guidelines](#development-guidelines)
14. [Layout Structure](#layout-structure)
15. [Search and Filtering](#search-and-filtering)

## Overview

The documents feature is a comprehensive document management system built with Next.js 14, Prisma, and TanStack Table. It provides:

- Document creation, viewing, editing, and deletion
- Role-based access control
- PDF generation for download/print
- Advanced filtering and sorting with side panel
- Command palette for quick column search
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
    ├── data-table-filter-command.tsx   # Command palette for column search
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
- **Supabase**: Authentication and Row Level Security (RLS)
- **TanStack Table**: Data table with filtering and sorting
- **Shadcn/ui**: UI components
- **PDF-lib**: PDF generation for download/print
- **Sonner**: Toast notifications
- **Zod**: Schema validation
- **cmdk**: Command palette for search

### Database Access

The application uses a dual-database access approach:

1. **Prisma**: Direct database access for server-side operations
2. **Supabase**: RLS-protected access for client operations

For detailed information about authentication, authorization, and security, see [Document Feature Authentication & Security](./documents-auth-security.md).

### Client Creation

The application uses different Supabase client creation methods based on the context:

1. **Route Handlers**:
```typescript
// Use createRouteHandlerClient for route handlers
const supabase = createRouteHandlerClient({ 
  cookies: () => cookieStore 
});
```

2. **Middleware**:
```typescript
// Use createServerClient for middleware
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // Read-only error in server component
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        } catch (error) {
          // Read-only error in server component
        }
      },
    },
  }
);
```

3. **Server Components**:
```typescript
// Use createServerClient for server components
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // Read-only error in server component
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        } catch (error) {
          // Read-only error in server component
        }
      },
    },
  }
);
```

## Layout Structure

The dashboard uses a responsive layout with three main sections:

1. **Side Panel**:
   ```tsx
   // Left side filter panel
   <div className={cn(
     "w-full h-full sm:min-w-52 sm:max-w-52 sm:self-start md:min-w-72 md:max-w-72",
     "sm:sticky sm:top-0 sm:max-h-screen sm:overflow-y-scroll",
     !controlsOpen && "hidden"
   )}>
     <DataTableFilterControls />
   </div>
   ```

2. **Top Bar**:
   ```tsx
   // Sticky top bar with search and controls
   <div className="sticky top-0 z-10 bg-background">
     <DataTableFilterCommand /> {/* Command palette search */}
     <DataTableToolbar />      {/* Table controls */}
   </div>
   ```

3. **Main Content**:
   ```tsx
   // Table with sticky header
   <div className="relative flex-1 overflow-auto">
     <Table>
       <TableHeader className="sticky top-0 bg-muted z-20 border-b">
         {/* Column headers */}
       </TableHeader>
       <TableBody>
         {/* Table rows */}
       </TableBody>
     </Table>
   </div>
   ```

## Search and Filtering

### Command Palette Search
The command palette provides quick access to column search:

```tsx
// data-table-filter-command.tsx
export function DataTableFilterCommand<TData, TSchema extends z.ZodObject<any>>({
  table,
  filterFields,
  schema,
  isLoading,
}: DataTableFilterCommandProps<TData, TSchema>) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  // Filter out fields that shouldn't appear in command palette
  const commandFields = filterFields?.filter(
    (field) => !field.commandDisabled
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="outline" role="combobox">
          Search columns...
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandGroup>
            {commandFields?.map((field) => (
              <CommandItem
                key={field.value as string}
                value={field.value as string}
                onSelect={(value) => {
                  setValue(value);
                  setOpen(false);
                }}
              >
                {field.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Filter Configuration
Filters are configured with metadata to control their behavior. The following filter types are available:

1. **Checkbox Filter**:
```typescript
{
  type: "checkbox",
  label: "Status",
  value: "status",
  defaultOpen: true,
  options: Object.values(DocumentStatus).map(status => ({
    label: status,
    value: status,
  })),
  commandDisabled: true, // Hide from command palette
}
```
Used for multiple-choice selections like status or document type.

2. **Time Range Filter**:
```typescript
{
  type: "timerange",
  label: "Created At",
  value: "createdAt",
  defaultOpen: false,
  commandDisabled: true,
}
```
Used for date range selections with calendar picker.

3. **Input Filter**:
```typescript
{
  type: "input",
  label: "RPIC",
  value: "user",
  defaultOpen: false,
  commandDisabled: false, // Show in command palette
}
```
Used for text-based searches with debounced input.

4. **Slider Filter**:
```typescript
{
  type: "slider",
  label: "Progress",
  value: "progress",
  defaultOpen: false,
  commandDisabled: true,
}
```
Used for numeric range selections.

Each filter can be configured with:
- `type`: The type of filter component to use
- `label`: Display name in the UI
- `value`: The field key to filter on
- `defaultOpen`: Whether the filter is expanded by default
- `options`: For checkbox filters, the available choices
- `commandDisabled`: Whether to hide from command palette search

Example configuration:
```typescript
// filters.ts
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
    commandDisabled: true,
  },
  {
    type: "timerange",
    label: "Created At",
    value: "createdAt",
    defaultOpen: false,
    commandDisabled: true,
  },
  {
    type: "input",
    label: "RPIC",
    value: "user",
    defaultOpen: false,
    commandDisabled: false,
  },
];
```

## Document Type Detection

Documents are categorized based on their titles:

```typescript
// actions.ts
function detectDocumentType(title: string): DocumentType {
  if (title.includes('POWRA')) return 'POWRA';
  if (title.includes('FPL Mission')) return 'FPL_MISSION';
  return 'TAILBOARD';
}

// Used in fetchDocuments
return documents.map(doc => ({
  ...doc,
  documentType: detectDocumentType(doc.title)
}));
```

## State Management

The documents feature uses multiple state management approaches:

### URL State
```typescript
// URL state is managed using the useQueryStates hook
const [search, setSearch] = useQueryStates(searchParamsParser);

// Update URL when filters change
React.useEffect(() => {
  const columnFiltersWithNullable = filterFields.map((field) => {
    const filterValue = columnFilters.find(
      (filter) => filter.id === field.value
    );
    return { id: field.value, value: filterValue?.value ?? null };
  });

  setSearch(
    columnFiltersWithNullable.reduce((prev, curr) => {
      prev[curr.id] = curr.value;
      return prev;
    }, {} as Record<string, unknown>)
  );
}, [columnFilters]);
```

### Client State
```typescript
// Table state in data-table.tsx
const [rowSelection, setRowSelection] = React.useState({});
const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
const [sorting, setSorting] = React.useState<SortingState>([]);
const [controlsOpen, setControlsOpen] = React.useState(true);
const [columnOrder, setColumnOrder] = React.useState<string[]>([]);

// Loading states in client.tsx
const [documents, setDocuments] = useState<DocumentSchema[]>([]);
const [loading, setLoading] = useState(true);
const [actionInProgress, setActionInProgress] = useState<string | null>(null);
```

### State Persistence
```typescript
// Column visibility and order persistence
const [columnOrder, setColumnOrder] = useLocalStorage<string[]>(
  "data-table-column-order",
  []
);

const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
  "data-table-visibility",
  {
    uuid: false,
    "timing.dns": false,
    "timing.connection": false,
  }
);

// Filter panel state persistence
const [controlsOpen, setControlsOpen] = useLocalStorage(
  "data-table-controls",
  true
);
```

## Data Flow

### Initial Load
1. Server Component (`page.tsx`):
   ```typescript
   // 1. Get authenticated user
   const { data: { user } } = await supabase.auth.getUser();
   const userRole = user.user_metadata?.role || 'user';
   
   // 2. Render client component with user role
   return <DocumentsClient userRole={userRole} />;
   ```

2. Client Component (`client.tsx`):
   ```typescript
   // 1. Load documents on mount
   useEffect(() => {
     loadDocuments();
   }, []);

   // 2. Handle loading state
   async function loadDocuments() {
     try {
       setLoading(true);
       const data = await fetchDocuments();
       setDocuments(data);
     } finally {
       setLoading(false);
     }
   }
   ```

### Document Operations
1. User initiates action:
   ```typescript
   // In columns.tsx dropdown
   <DropdownMenuItem onClick={() => meta?.onApprove(document)}>
     Approve
   </DropdownMenuItem>
   ```

2. Action handler executes:
   ```typescript
   // In client.tsx
   const handleApprove = async (document: DocumentSchema) => {
     try {
       // 1. Set loading state
       setActionInProgress(`approve-${document.id}`);
       
       // 2. Call server action
       await approveDocument(document.id);
       
       // 3. Show success message
       toast.success('Document approved');
       
       // 4. Refresh data
       await loadDocuments();
     } catch (error) {
       toast.error('Failed to approve document');
     } finally {
       // 5. Clear loading state
       setActionInProgress(null);
     }
   };
   ```

### Filter Updates
1. User interacts with filter:
   ```typescript
   // In DataTableFilterCheckbox
   <Checkbox
     checked={isSelected}
     onCheckedChange={(checked) => {
       if (checked) {
         column?.setFilterValue([...(values || []), option.value]);
       } else {
         column?.setFilterValue(
           values?.filter((value) => value !== option.value)
         );
       }
     }}
   />
   ```

2. Table updates filter state:
   ```typescript
   // In data-table.tsx
   onColumnFiltersChange: (filters) => {
     setColumnFilters(filters);
     // URL state is updated via useEffect
   }
   ```

3. URL is updated:
   ```typescript
   // Updates URL with new filter state
   setSearch({ [filterId]: filterValue });
   ```

## Server Actions

### Document Operations
```typescript
// actions.ts
export async function approveDocument(documentId: string): Promise<DocumentSchema> {
  try {
    // Get current user for audit logging
    const supabase = createServerActionClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Update document status
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

    // Log the action
    await auditLogger.log({
      action: 'document.approve',
      userId: user.id,
      resourceId: documentId,
      details: {
        documentTitle: document.title,
        userRole: user.user_metadata?.role || 'user',
      },
    });

    return document;
  } catch (error) {
    console.error('Error approving document:', error);
    throw new Error(`Error approving document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### Error Handling
```typescript
// Centralized error handling
export class DocumentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DocumentError';
  }
}

// Usage in actions
try {
  // Operation code
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    // Handle database errors
    throw new DocumentError(
      'Database operation failed',
      'DB_ERROR',
      { prismaCode: error.code }
    );
  }
  // Re-throw other errors
  throw error;
}
```

### Audit Logging
```typescript
// auditLogger.ts
interface AuditEvent {
  action: string;
  userId: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export const auditLogger = {
  log: async (event: AuditEvent) => {
    await prismaClient.auditLog.create({
      data: {
        action: event.action,
        userId: event.userId,
        resourceId: event.resourceId,
        details: event.details,
        timestamp: new Date(),
      }
    });
  }
};
```

## Database Schema

### Prisma Models
```prisma
// schema.prisma
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
  @@index([status])
  @@index([createdAt])
}

model AuditLog {
  id         String   @id @default(uuid())
  action     String
  userId     String
  resourceId String?
  details    Json?
  timestamp  DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([timestamp])
}
```

## Loading States

The documents feature implements comprehensive loading states and error handling to provide a smooth user experience:

### Loading Indicators

1. **Initial Page Load**:
   ```tsx
   // loading.tsx - Skeleton loading state
   export default function Loading() {
     return (
       <div className="container mx-auto p-6">
         <Card>
           <CardHeader>
             <CardTitle>
               <Skeleton className="h-6 w-24" />
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="space-y-2">
                     <Skeleton className="h-4 w-48" />
                     <Skeleton className="h-3 w-32" />
                   </div>
                   <Skeleton className="h-8 w-24" />
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       </div>
     );
   }
   ```
   The loading component uses skeleton placeholders to indicate content loading, providing a smooth visual transition.

2. **Action Progress States**:
   ```typescript
   // client.tsx - Action progress tracking
   const [actionInProgress, setActionInProgress] = useState<string | null>(null);

   const handleApprove = async (document: DocumentSchema) => {
     try {
       setActionInProgress(`approve-${document.id}`);
       await approveDocument(document.id);
       toast.success('Document approved');
     } finally {
       setActionInProgress(null);
     }
   };

   // Usage in UI components
   <DropdownMenuItem
     onClick={() => handleApprove(document)}
     disabled={actionInProgress === `approve-${document.id}`}
   >
     {actionInProgress === `approve-${document.id}` ? 'Approving...' : 'Approve'}
   </DropdownMenuItem>
   ```
   Individual actions track their progress state to disable buttons and show loading indicators.

3. **Form Submission States**:
   ```typescript
   // edit-form.tsx - Form submission loading state
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (data: FormData) => {
     try {
       setLoading(true);
       await updateDocument(data);
       toast.success('Document updated');
     } finally {
       setLoading(false);
     }
   };

   return (
     <Button type="submit" disabled={loading}>
       {loading ? 'Saving...' : 'Save Changes'}
     </Button>
   );
   ```

### Error States

1. **Global Error Boundary**:
   ```tsx
   // error.tsx - Error boundary component
   export default function Error({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     useEffect(() => {
       console.error(error);
     }, [error]);

     return (
       <div className="container mx-auto p-6">
         <Card>
           <CardHeader>
             <CardTitle>Something went wrong!</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <p className="text-gray-500">
               {error.message || 'An error occurred while loading the documents.'}
             </p>
             <Button onClick={reset}>Try again</Button>
           </CardContent>
         </Card>
       </div>
     );
   }
   ```
   Catches and displays unhandled errors with a user-friendly message and retry option.

2. **Action Error Handling**:
   ```typescript
   // client.tsx - Action error handling
   const handleDelete = async (document: DocumentSchema) => {
     try {
       setActionInProgress(`delete-${document.id}`);
       await deleteDocument(document.id);
       toast.success('Document deleted');
     } catch (error) {
       toast.error(error instanceof Error ? error.message : 'Failed to delete document');
     } finally {
       setActionInProgress(null);
     }
   };
   ```
   Each action handles errors gracefully with user feedback via toast notifications.

3. **Form Validation Errors**:
   ```typescript
   // edit-form.tsx - Form validation error handling
   const handleSubmit = async (data: FormData) => {
     try {
       await documentSchema.parseAsync(data);
       await updateDocument(data);
     } catch (error) {
       if (error instanceof z.ZodError) {
         // Show validation errors
         error.errors.forEach(err => {
           toast.error(`${err.path.join('.')}: ${err.message}`);
         });
       } else {
         toast.error('Failed to update document');
       }
     }
   };
   ```
   Form submissions handle both validation errors and API errors with appropriate feedback.

## Security & Authentication

The document feature implements comprehensive security through:

1. **Role-Based Access Control**:
   - Three user roles: admin, supervisor, user
   - Permission checks at database, API, and UI levels
   - Row Level Security (RLS) policies

2. **Authentication Flow**:
   - Supabase Auth integration
   - Session management
   - User metadata handling

3. **Security Layers**:
   - Database-level RLS policies
   - API route protection
   - UI component guards
   - Middleware checks

For detailed information about security implementation, policies, and troubleshooting, see [Document Feature Authentication & Security](./documents-auth-security.md).

## Development Guidelines

### Common Tasks

Here are some common tasks and how to implement them:

1. **Adding a New Filter**:
   ```typescript
   // 1. Add to filterFields in filters.ts
   {
     type: "checkbox",
     label: "New Filter",
     value: "newField",
     defaultOpen: false,
     options: [/* options */],
     commandDisabled: true,
   }
   
   // 2. Update schema.ts if needed
   export const documentFilterSchema = z.object({
     newField: z.string().optional(),
     // ... other fields
   });
   ```

2. **Adding a New Column**:
   ```typescript
   // columns.tsx
   {
     accessorKey: "newField",
     header: ({ column }) => (
       <DataTableColumnHeader column={column} title="New Field" />
     ),
     cell: ({ row }) => {
       const value = row.getValue("newField");
       return <div>{value}</div>;
     },
   }
   ```

3. **Adding a New Action**:
   ```typescript
   // 1. Add handler in client.tsx
   const handleNewAction = async (document: DocumentSchema) => {
     try {
       setActionInProgress(`newAction-${document.id}`);
       await newActionServerFunction(document.id);
       toast.success('Action completed');
       await loadDocuments();
     } catch (error) {
       toast.error('Action failed');
     } finally {
       setActionInProgress(null);
     }
   };

   // 2. Add to dropdown in columns.tsx
   {canPerformAction && (
     <DropdownMenuItem
       onClick={() => meta?.onNewAction(document)}
       disabled={isLoading('newAction')}
     >
       New Action
     </DropdownMenuItem>
   )}
   ```

### Troubleshooting

Common issues and solutions:

1. **Filters Not Working**:
   - Check filter field value matches schema property
   - Verify filter function is properly registered
   - Check column accessor key matches filter value

2. **Actions Not Updating UI**:
   - Ensure loadDocuments() is called after action
   - Check actionInProgress state is being cleared
   - Verify error handling in try/catch

3. **Layout Issues**:
   - Check z-index values for sticky elements
   - Verify overflow settings on containers
   - Check responsive class names

4. **Type Errors**:
   - Ensure schema matches database types
   - Check for null/undefined handling
   - Verify generic type parameters

This documentation should help both junior developers and AI systems understand and work with the documents feature effectively.
