# Authentication Workflow and Admin User Management

## Authentication Workflow

1. **Login Options**:
   - Email/Password + Magic Link (2FA)
   - Google Workspace SSO (restricted to company email addresses)

2. **Email/Password + Magic Link Flow**:
   a. User enters email and password on the login page.
   b. If credentials are correct, a magic link is sent to the user's email.
   c. User clicks the magic link to complete authentication.
   d. User is redirected to the dashboard upon successful authentication.

3. **Google Workspace SSO Flow**:
   a. User clicks "Sign in with Google" on the login page.
   b. User is redirected to Google's authentication page.
   c. After successful authentication, user is redirected back to the application.
   d. If the user's email domain matches the company's domain, they are granted access.

4. **Security Measures**:
   - No public sign-ups to prevent unauthorized access.
   - Two-factor authentication for email/password login.
   - Restricted Google SSO to company email addresses only.

## Admin User Management

Admins have the ability to create and manage user accounts within the application. This is done through a secure admin interface that is only accessible to users with the 'admin' role.

### Creating New Users

1. Admin logs into the application using their credentials.
2. Admin navigates to the User Management section in the admin dashboard.
3. Admin clicks on "Add New User" and fills out the following information:
   - Email address
   - Initial password
   - User role (e.g., admin, manager, user)
4. The system creates the user account in Supabase with the provided details.
5. An email is sent to the new user with their initial login credentials and instructions to change their password upon first login.

### Managing Existing Users

Admins can perform the following actions on existing user accounts:

1. **View Users**: See a list of all users, their roles, and account status.
2. **Edit User Details**: Update user information, including email and role.
3. **Reset Password**: Trigger a password reset for a user, which sends them a password reset email.
4. **Disable/Enable Account**: Temporarily disable or re-enable a user's account.
5. **Delete User**: Permanently remove a user's account (with appropriate safeguards and confirmations).

### Role-Based Access Control

The application uses role-based access control to manage permissions:

1. **Admin**: Full access to all features, including user management.
2. **Manager**: Access to most features, but cannot manage users or access certain sensitive areas.
3. **User**: Basic access to use the application's core features.

Roles are assigned during user creation and can be modified by admins as needed.

## Initial Setup

To set up the initial admin user and configure the authentication system:

1. Run the `scripts/seed-users.ts` script to create the initial admin user:
   ```
   npx ts-node scripts/seed-users.ts
   ```
2. Configure Google Workspace SSO in the Supabase dashboard:
   a. Go to Authentication > Providers
   b. Enable and configure Google provider
   c. Set up OAuth consent screen in Google Cloud Console
   d. Add authorized domains and redirect URIs
3. Update the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the `.env.local` file with your Supabase project details.

After completing these steps, the authentication system will be ready to use, and the initial admin user can log in to manage additional users and roles.
