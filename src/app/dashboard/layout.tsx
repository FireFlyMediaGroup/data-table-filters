import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SidebarNav } from '../../components/dashboard/sidebar-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get authenticated user with metadata
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    return null; // Auth middleware will handle redirect
  }

  // Get role from user metadata
  const userRole = user.user_metadata?.role || 'user';

  return (
    <div className="flex h-screen">
      <SidebarNav userRole={userRole} />
      <div className="flex-1 overflow-auto p-4 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
