import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DocumentsClient } from './client';

export default async function DocumentsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    return null; // Auth middleware will handle redirect
  }

  // Get user role from metadata
  const userRole = user.user_metadata?.role || 'user';

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Documents</h1>
      <DocumentsClient userRole={userRole} />
    </>
  );
}
