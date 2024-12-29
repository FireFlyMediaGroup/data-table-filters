# Authentication Test Plan

This document outlines the steps to test the authentication features implemented in our application, including magic link authentication, Google SSO, and role-based access control.

## 1. Magic Link Authentication

### Test Steps:
1. Navigate to the login page.
2. Enter a valid email address.
3. Click "Send Magic Link" button.
4. Check the email inbox for the magic link.
5. Click the magic link in the email.
6. Verify successful login and redirection to the dashboard.

### Expected Results:
- Magic link should be received in the email.
- Clicking the link should log the user in.
- User should be redirected to the dashboard after login.

## 2. Google SSO Authentication

### Test Steps:
1. Navigate to the login page.
2. Click "Sign in with Google" button.
3. Complete the Google authentication process.
4. Verify successful login and redirection to the dashboard.

### Expected Results:
- Google login window should appear.
- After successful Google authentication, user should be logged in.
- User should be redirected to the dashboard after login.

## 3. Role-Based Access Control (RBAC)

### Test Steps:
1. Create test users with different roles (admin, manager, user) in Supabase.
2. Log in with each user role.
3. Attempt to access different routes:
   - Admin: Try accessing /dashboard/admin, /dashboard/documents, /dashboard/forms
   - Manager: Try accessing /dashboard/documents, /dashboard/forms, /dashboard/admin
   - User: Try accessing /dashboard/documents, /dashboard/forms, /dashboard/admin

### Expected Results:
- Admin should have access to all routes.
- Manager should have access to /dashboard/documents and /dashboard/forms, but not /dashboard/admin.
- User should have access to /dashboard/documents and /dashboard/forms, but not /dashboard/admin.
- Unauthorized access attempts should redirect to an appropriate error page or the dashboard.

## 4. Authentication Middleware

### Test Steps:
1. Log out of the application.
2. Attempt to directly access protected routes (e.g., /dashboard/documents).
3. Verify redirection to the login page.
4. Log in and try accessing the same routes.

### Expected Results:
- Unauthenticated users should be redirected to the login page when trying to access protected routes.
- After logging in, users should be able to access the routes they're authorized for.

## 5. Edge Cases and Error Handling

### Test Steps:
1. Try logging in with an invalid email format.
2. Attempt to use an expired magic link.
3. Cancel the Google authentication process midway.
4. Test network disconnection scenarios during the authentication process.

### Expected Results:
- Appropriate error messages should be displayed for invalid inputs or failed authentication attempts.
- The application should handle interruptions gracefully and return users to a usable state.

## Notes for Testers:
- Ensure you have test users set up in Supabase with different roles before beginning the RBAC tests.
- Use incognito/private browsing mode or clear browser data between tests to ensure a clean testing environment.
- Document any unexpected behavior or errors encountered during testing.
