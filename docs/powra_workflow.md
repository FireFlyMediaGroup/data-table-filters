# POWRA (Point of Work Risk Assessment) Workflow Documentation

## Overview

The POWRA form is a multi-step risk assessment tool used in various industries to ensure safety before starting work. The implementation follows a structured approach with form sections, validation, and data persistence.

## File Structure and Components

```
src/
├── app/
│   └── dashboard/
│       └── forms/
│           └── powra/
│               ├── page.tsx                    # Main page component
│               ├── constants.ts                # Predefined hazard items and other constants
│               ├── types/
│               │   └── index.ts               # TypeScript types and Zod schemas
│               ├── components/
│               │   ├── POWRAForm.tsx          # Main form orchestrator
│               │   ├── ErrorDisplay.tsx       # Error message component
│               │   └── POWRASections/
│               │       ├── Stop.tsx           # Stop section implementation
│               │       ├── Think.tsx          # Think section implementation
│               │       ├── Act.tsx            # Act section implementation
│               │       └── Review.tsx         # Review section implementation
│               └── api/
│                   └── powra/
│                       └── route.ts           # API endpoints for POWRA operations
└── lib/
    └── prisma/
        └── client.ts                          # Prisma client for database operations
```

## Component Breakdown and Workflow

### 1. Entry Point (`page.tsx`)
- Route: `/dashboard/forms/powra`
- Simple wrapper that renders the POWRAForm component
- Location: `src/app/dashboard/forms/powra/page.tsx`
- Responsibilities:
  - Serves as the Next.js page component
  - Provides the entry point for the POWRA form

### 2. Main Form Component (`POWRAForm.tsx`)
- Location: `src/app/dashboard/forms/powra/components/POWRAForm.tsx`
- Responsibilities:
  - Manages form state using React Hook Form with Zod validation
  - Handles section navigation and progress tracking
  - Coordinates form submission and error handling
  - Manages form validation state and section transitions
- Key Functions:
  - `onSubmit`: Handles form submission to API with error handling
  - `nextSection`: Manages section transitions with validation
  - `prevSection`: Handles backward navigation
  - Special handling for Think → Act transition:
    - Validates Think section
    - Maps selected hazards to assessment rows
    - Preserves existing assessment data
- State Management:
  - Uses React Hook Form's useForm hook
  - Maintains current section index
  - Tracks submission status and errors
- Default Values:
  - Initializes all form sections with default values
  - Sets up initial job description with current date/time

### 3. Form Sections

#### Job Description Section (Embedded in POWRAForm)
- First section collecting basic job information
- Fields:
  - Site location (required)
  - Date (defaults to current date)
  - RPIC Name (required)
  - Time (defaults to current time)
  - Chief Pilot selection (enum: "Andrew Babcock" | "Dan Wilson")
  - HSE selection (enum: "Romeo Garza" | "Paul Roberts")
- Validation:
  - Required fields must be filled
  - Time must match HH:mm format
  - Chief Pilot and HSE must be selected from predefined options

#### Stop Section (`Stop.tsx`)
- Location: `src/app/dashboard/forms/powra/components/POWRASections/Stop.tsx`
- Pre-work checklist with yes/no/n/a options for each item:
  - Authorized location verification
  - Documentation check (RAMS, Pt. 107, First Aid)
  - PPE and safety equipment verification
  - Competency and authorization check
  - Equipment inspection status
  - Access/egress safety check
  - Environmental conditions assessment
- Validation:
  - All questions must be answered
  - Warning displayed for any "NO" answers
- UI Components:
  - Radio groups for each question
  - Error display for validation failures
  - Warning message for negative responses

#### Think Section (`Think.tsx`)
- Location: `src/app/dashboard/forms/powra/components/POWRASections/Think.tsx`
- Hazard identification component with:
  - 29 predefined hazards from constants.ts
  - Checkbox selection for each hazard
  - Additional fields for "Other" hazards
- Required Questions:
  - RAMS inclusion verification
  - Rescue/emergency plans confirmation
- State Management:
  - Uses useWatch for real-time hazard tracking
  - Conditional rendering for "Other" specifications
- Validation:
  - Required questions must be answered
  - Warning displays for negative responses
  - Other specifications required when selected

#### Act Section (`Act.tsx`)
- Location: `src/app/dashboard/forms/powra/components/POWRASections/Act.tsx`
- Control measures implementation with:
  - Standard control measure checkboxes
  - Dynamic assessment rows for identified hazards
  - Ability to add additional rows
- Features:
  - Character-limited control measure descriptions (250 chars)
  - Residual risk assessment for each hazard
  - Risk level indicators (Low/Medium/High)
- Validation:
  - Control measures required for identified hazards
  - Character limit enforcement
  - Warning for high residual risks
- State Management:
  - Tracks assessment rows dynamically
  - Preserves existing data during updates

#### Review Section (`Review.tsx`)
- Location: `src/app/dashboard/forms/powra/components/POWRASections/Review.tsx`
- Final review and sign-off with:
  - Briefing record with multiple name entries
  - Site manager review section (conditional)
  - End of task review
- Features:
  - Dynamic name field addition
  - Conditional site manager signature for supervisors
  - Lessons learned capture with comments
- Validation:
  - At least one briefing record name required
  - Site manager details required when applicable
  - Character limit on comments (250)
- State Management:
  - Tracks additional name fields
  - Manages conditional rendering based on user role
  - Handles character count for comments

### 4. Data Types and Validation (`types/index.ts`)
- Location: `src/app/dashboard/forms/powra/types/index.ts`
- Defines:
  - Zod validation schemas for each section
  - TypeScript interfaces
  - Form data types
  - Props interfaces for components

### 5. Constants (`constants.ts`)
- Location: `src/app/dashboard/forms/powra/constants.ts`
- Defines hazard items with:
  - Unique numbers
  - Internal names
  - Display labels

### 6. API Implementation (`route.ts`)
- Location: `src/app/api/powra/route.ts`
- Endpoints:
  - POST: Creates new POWRA records
    - Section-by-section validation
    - Detailed validation error reporting
    - JSON string storage for large fields
    - Returns 201 on success with record ID
  - GET: Retrieves existing POWRAs
    - Fetches user's POWRAs with pagination
    - Orders by creation date descending
    - Returns array of POWRA records
- Authentication:
  - Enhanced Supabase session management
  - Cookie presence verification
  - Session state validation
  - Token refresh handling
  - User context attachment
- Error Handling:
  - Authentication errors (401 with details)
  - Validation errors (400 with field-level details)
  - Server errors (500 with stack traces in dev)
  - Request parsing errors
  - Database connection errors
  - Detailed error context
- Database Operations:
  - Connection pooling support
  - Connection health checks
  - Retry logic with backoff
  - Text field storage for JSON
  - Transaction support
  - Connection error recovery

### 7. Database Schema (Prisma)
- Location: `prisma/schema.prisma`
- POWRA Model:
  ```prisma
  model POWRA {
    id              String   @id @default(uuid())
    jobDescription  String   @db.Text // Store as text for large JSON strings
    stopDetails     String   @db.Text
    thinkDetails    String   @db.Text
    actDetails      String   @db.Text
    reviewDetails   String   @db.Text
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    user            User     @relation(fields: [userId], references: [id])
    userId          String

    @@index([userId])
  }
  ```
- Relationships:
  - Belongs to User model (many-to-one)
  - User can have multiple POWRAs
  - Indexed userId for better performance
- Field Details:
  - Text fields for reliable JSON storage
  - Automatic timestamp management
  - UUID generation for IDs
  - Referential integrity with User model
  - Connection pooling configuration

## Data Flow

1. User Navigation:
   - User accesses `/dashboard/forms/powra`
   - Authentication check via middleware
   - `page.tsx` renders `POWRAForm`
   - Initial form state setup with defaults

2. Form Interaction:
   - User progresses through sections sequentially
   - Each section component manages local state
   - Real-time validation using Zod schemas
   - Dynamic UI updates based on user input
   - Error messages displayed immediately

3. Section Transitions:
   - Managed by `POWRAForm.tsx`
   - Pre-transition validation checks
   - Special handling for Think → Act transition:
     1. Validates Think section completely
     2. Extracts selected hazards
     3. Maps hazards to assessment rows
     4. Preserves existing assessment data
     5. Updates Act section state

4. Form Submission Process:
   - Triggered in `POWRAForm.tsx`
   - Complete form validation
   - Data transformation for API:
     1. Date conversion to ISO strings
     2. JSON structure preparation
   - API request with error handling
   - Success: Redirect to dashboard
   - Failure: Error display with details

## Key Functions and Their Locations

### 1. Form Management Functions
- Location: `src/app/dashboard/forms/powra/components/POWRAForm.tsx`
  ```typescript
  useForm<POWRAFormData>(): Manages form state
  handleSubmit(data: POWRAFormData): Handles form submission
  nextSection(): Validates and moves to next section
  prevSection(): Handles backward navigation
  ```

### 2. Validation Functions
- Schema Definitions: `src/app/dashboard/forms/powra/types/index.ts`
  ```typescript
  powraSchema: Complete form validation schema
  sectionSchemas: Individual section schemas
  ```
- Form Validation: Each section component
  ```typescript
  validateSection(): Section-specific validation
  handleFieldValidation(): Field-level validation
  ```
- API Validation: `src/app/api/powra/route.ts`
  ```typescript
  validateRequest(): Server-side validation
  handleValidationErrors(): Error response formatting
  ```

### 3. Data Persistence Functions
- API Handlers: `src/app/api/powra/route.ts`
  ```typescript
  POST /api/powra: Creates new POWRA records
  GET /api/powra: Retrieves existing POWRAs
  ```
- Database Operations:
  ```typescript
  createPOWRA(): Creates new record
  getPOWRAs(): Retrieves user's POWRAs
  updatePOWRA(): Updates existing record
  ```

### 4. Section-Specific Functions
- Stop Section: `Stop.tsx`
  ```typescript
  handleOptionChange(): Manages radio selections
  validateResponses(): Checks all responses
  ```
- Think Section: `Think.tsx`
  ```typescript
  handleHazardSelection(): Manages hazard checkboxes
  validateHazards(): Validates selected hazards
  ```
- Act Section: `Act.tsx`
  ```typescript
  handleAssessmentRow(): Manages assessment rows
  calculateRisk(): Determines risk levels
  ```
- Review Section: `Review.tsx`
  ```typescript
  handleNameAddition(): Adds briefing names
  validateSignatures(): Checks required signatures
  ```

## Authentication and Authorization

### Authentication Flow
- Implementation: Enhanced Supabase session management
- Location: `src/middleware/auth.ts`
- Process:
  1. Detailed request logging (path, method, headers)
  2. Cookie presence verification
  3. Session state validation with error handling
  4. Token validation and refresh
  5. User context attachment with logging
- Error Handling:
  - API routes: Returns 401 with detailed error
  - Dashboard routes: Redirects to login with error context
- Logging:
  - Request details logging
  - Cookie state tracking
  - Session validation results
  - Authentication errors with stack traces

### Authorization
- Location: `src/middleware/rbac.ts`
- Features:
  - Enhanced role-based access control
  - Granular permission checking
  - API route mapping to dashboard permissions
  - Detailed access logging
- Implementation:
  - User ID and role verification
  - Path-based permission mapping
  - API route permission inheritance
  - Comprehensive error handling
- Logging:
  - Access check results
  - Permission mapping details
  - Role verification process
  - Authorization errors with context

### Session Management
- Location: `src/lib/supabase/client.ts`
- Features:
  - Enhanced session persistence
  - Automatic token refresh
  - Debug storage implementation
  - Comprehensive error handling
  - Connection pooling support
- Implementation:
  - Custom storage with logging
  - Token state tracking
  - Session event monitoring
  - Error recovery mechanisms
  - Connection retry logic
- Logging:
  - Storage operations
  - Token refresh events
  - Session state changes
  - Authentication errors
  - Connection attempts
  - Database operations

## Error Handling

### Form Errors
- Location: `src/app/dashboard/forms/powra/components/ErrorDisplay.tsx`
- Features:
  - Field-level error messages
  - Section validation feedback
  - Custom error styling
  - Accessibility support
- Implementation:
  ```typescript
  displayError(): Renders error messages
  handleValidationError(): Processes validation errors
  ```

### API Errors
- Location: `src/app/api/powra/route.ts`
- Types:
  - Authentication failures (401)
  - Validation errors (400)
  - Server errors (500)
  - Database errors
  - Middleware chain errors
- Features:
  - Enhanced error messages
  - Stack traces in development
  - Request context in errors
  - Detailed logging
- Implementation:
  ```typescript
  // Error handling with context
  handleAPIError(error: Error, context: RequestContext): APIResponse {
    console.error("API Error:", {
      error: error.message,
      stack: error.stack,
      context: {
        path: context.path,
        method: context.method,
        userId: context.userId
      }
    });
    return formatErrorResponse(error, context);
  }

  // Error response formatting
  formatErrorResponse(error: Error, context: RequestContext): APIResponse {
    return {
      error: true,
      message: error.message,
      code: determineErrorCode(error),
      context: sanitizeContext(context),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
  }
  ```
- Logging:
  - Request details
  - Error context
  - Stack traces
  - Database state

### Validation Errors
- Location: Multiple files
- Implementation:
  - Zod schema validation
  - Real-time form validation
  - Server-side validation
  - Custom validation rules
- Error Types:
  ```typescript
  ValidationError: Schema validation errors
  FormError: Form-specific errors
  APIError: API response errors
  ```

## Future Improvements

1. Form State:
   - Implement auto-save functionality
   - Add draft saving capability
   - Add form state persistence
   - Add form recovery on errors

2. Validation:
   - Centralize validation logic
   - Add field-level validation
   - Add real-time validation feedback
   - Implement custom validation rules

3. Security:
   - ✓ Enhanced role-based access (Implemented)
   - ✓ Detailed audit logging (Implemented)
   - Add data encryption
   - Add rate limiting
   - Add request signing

4. UX:
   - Add progress persistence
   - Implement print/export
   - Add form templates
   - Add error recovery UI
   - Add offline support

5. Performance:
   - Implement caching
   - Add optimistic updates
   - Lazy load sections
   - Add request debouncing
   - Add connection resilience

6. Monitoring:
   - Add performance metrics
   - Add error tracking
   - Add usage analytics
   - Add health checks
   - Add status dashboard

7. Testing:
   - Add E2E tests
   - Add integration tests
   - Add load tests
   - Add security tests
   - Add accessibility tests
