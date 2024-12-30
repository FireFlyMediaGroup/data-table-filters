import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SidebarNav } from '../../components/dashboard/sidebar-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('Dashboard layout: Setting up Supabase client');
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          const cookie = cookieStore.get(name);
          console.log(`Getting cookie ${name}:`, cookie?.value ? "Present" : "Not found");
          return cookie?.value;
        },
        set: () => {},
        remove: () => {},
      },
    }
  );
  
  console.log('Dashboard layout: Getting session');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!session || sessionError) {
    console.error('Dashboard layout: Session error:', sessionError);
    throw new Error('Authentication required');
  }

  console.log('Dashboard layout: Session found:', {
    userId: session.user.id,
    role: session.user.user_metadata?.role
  });

  const userRole = session.user.user_metadata?.role || 'user';

  return (
    <div className="flex h-screen">
      <SidebarNav userRole={userRole} />
      <div className="flex-1 overflow-auto p-4 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
