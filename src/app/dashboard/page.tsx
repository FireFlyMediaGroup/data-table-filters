import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { SidebarNav } from '../../components/dashboard/sidebar-nav';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get authenticated user with metadata
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    return null; // Auth middleware will handle redirect
  }

  // Get role from user metadata
  const userRole = user.user_metadata?.role || 'user';
  console.log('User role:', userRole); // Debug log

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Error Alert */}
      {searchParams.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {searchParams.error === 'insufficient-permissions'
              ? 'You do not have permission to access that resource.'
              : searchParams.message || 'An error occurred.'}
          </AlertDescription>
        </Alert>
      )}

      <DashboardContent userRole={userRole} />
    </>
  );
}
