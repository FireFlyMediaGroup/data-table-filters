import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DocumentsClient } from './client';

export default async function DocumentsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    return null; // Auth middleware will handle redirect
  }

  // Get user role from metadata
  const userRole = user.user_metadata?.role || 'user';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Documents</h1>
      <DocumentsClient userRole={userRole} />
    </div>
  );
}
