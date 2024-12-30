import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { AlertCircle } from 'lucide-react';

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
    <div className="container mx-auto p-6">
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

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">POWRA Form</h2>
          <p className="text-gray-600 mb-4">
            Plan of Work Risk Assessment - Evaluate and document job safety procedures.
          </p>
          <Link href="/dashboard/forms/powra" className="block">
            <Button className="w-full">Create POWRA</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">FPL Mission</h2>
          <p className="text-gray-600 mb-4">
            Flight Planning and Logging - Plan and document mission details.
          </p>
          <Link href="/dashboard/forms/fpl-mission" className="block">
            <Button className="w-full">Create FPL Mission</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Tailboard</h2>
          <p className="text-gray-600 mb-4">
            Pre-job briefing and safety discussion documentation.
          </p>
          <Link href="/dashboard/forms/tailboard" className="block">
            <Button className="w-full">Create Tailboard</Button>
          </Link>
        </Card>

        {/* Documents Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Documents</h2>
          <p className="text-gray-600 mb-4">
            Access and manage your documents and forms.
          </p>
          <Link href="/dashboard/documents" className="block">
            <Button className="w-full" variant="outline">View Documents</Button>
          </Link>
        </Card>

        {/* Admin Section - Only visible to admin users */}
        {userRole === 'admin' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
            <p className="text-gray-600 mb-4">
              Manage users and system settings.
            </p>
            <Link href="/dashboard/admin/users" className="block">
              <Button className="w-full" variant="outline">Admin Panel</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
