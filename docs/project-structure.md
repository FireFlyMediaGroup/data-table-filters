# Project Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── documents/
│   │   │   ├── components/
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   ├── DocumentFilters.tsx
│   │   │   │   └── CreateDocumentButtons.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   └── page.tsx
│   │   ├── forms/
│   │   │   ├── powra/
│   │   │   │   ├── components/
│   │   │   │   │   ├── POWRAForm.tsx
│   │   │   │   │   ├── POWRASections/
│   │   │   │   │   │   ├── Stop.tsx
│   │   │   │   │   │   ├── Think.tsx
│   │   │   │   │   │   ├── Act.tsx
│   │   │   │   │   │   └── Review.tsx
│   │   │   │   │   └── ValidationSchemas.ts
│   │   │   │   └── page.tsx
│   │   │   ├── tailboard/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TailboardForm.tsx
│   │   │   │   │   └── ValidationSchemas.ts
│   │   │   │   └── page.tsx
│   │   │   └── fpl-mission/
│   │   │       ├── components/
│   │   │       │   ├── MissionPlanningForm.tsx
│   │   │       │   ├── RiskMatrixForm.tsx
│   │   │       │   └── ValidationSchemas.ts
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   ├── components/
│   │   │   │   │   ├── UserList.tsx
│   │   │   │   │   ├── UserForm.tsx
│   │   │   │   │   └── UserFilters.tsx
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── documents/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── powra/
│   │   │   └── route.ts
│   │   ├── tailboard/
│   │   │   └── route.ts
│   │   ├── fpl-mission/
│   │   │   └── route.ts
│   │   └── users/
│   │       └── route.ts
│   └── layout.tsx
├── components/
│   ├── data-table/
│   │   ├── base/  # Existing data table components
│   │   └── document-table/  # Extended components for document management
│   │       ├── DocumentActions.tsx
│   │       ├── DocumentFilters.tsx
│   │       ├── DocumentColumns.tsx
│   │       └── BulkActions.tsx
│   ├── forms/
│   │   ├── FormProgress.tsx
│   │   ├── FormNavigation.tsx
│   │   ├── FormSection.tsx
│   │   └── ValidationMessage.tsx
│   └── ui/  # Existing shadcn components
├── lib/
│   ├── auth/
│   │   ├── google.ts
│   │   └── magic-link.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── admin.ts
│   ├── prisma/
│   │   └── client.ts
│   └── utils/
│       ├── document.ts
│       ├── form.ts
│       └── validation.ts
├── hooks/
│   ├── use-document.ts
│   ├── use-form-progress.ts
│   ├── use-auth.ts
│   └── use-rbac.ts
├── types/
│   ├── documents.ts
│   ├── forms.ts
│   └── user.ts
├── middleware/
│   ├── auth.ts
│   └── rbac.ts
└── config/
    ├── site.ts
    └── constants.ts

prisma/
├── schema.prisma
└── migrations/

public/
├── assets/
│   └── icons/
└── fonts/
```

## Key Structure Highlights

1. **App Organization**
   - Follows Next.js 14+ App Router conventions
   - Groups related features in route groups (auth), (dashboard)
   - Separates concerns between pages and components

2. **Component Structure**
   - Leverages existing data-table components
   - Extends with document-specific components
   - Maintains shadcn/ui components in ui directory

3. **Form Management**
   - Dedicated forms directory for each document type
   - Shared form components for common functionality
   - Organized validation schemas

4. **API Routes**
   - Structured by feature (documents, users, etc.)
   - Follows RESTful conventions
   - Separate routes for different document types

5. **Authentication & Authorization**
   - Dedicated auth directory for authentication logic
   - Middleware for protecting routes
   - RBAC implementation

6. **Database & External Services**
   - Prisma schema and migrations
   - Supabase client configuration
   - Utility functions for database operations

7. **Shared Resources**
   - Common hooks for reusable logic
   - Type definitions
   - Configuration files

## Integration with Existing Code

1. **Data Table Integration**
   - Extends existing data-table components
   - Maintains current filtering and sorting capabilities
   - Adds document-specific functionality

2. **UI Components**
   - Continues using shadcn/ui components
   - Maintains current styling patterns
   - Extends with new document-specific components

3. **State Management**
   - Follows existing patterns for state management
   - Adds document-specific hooks and utilities

## Mobile Considerations

- Responsive components maintained in existing structure
- Mobile-specific utilities and hooks
- Adaptive layouts for different screen sizes

## Security Integration

- Authentication middleware
- RBAC implementation
- Secure API routes
- Protected dashboard routes
