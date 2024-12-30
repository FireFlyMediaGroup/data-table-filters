import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { format } from 'date-fns';

import ErrorBoundary from './error-boundary';

export default async function DocumentViewPage({
  params,
}: {
  params: { id: string };
}) {
  console.log('DocumentViewPage: Starting to render with ID:', params.id);
  try {
    console.log('DocumentViewPage: Setting up Supabase client');
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

    // Get session instead of user
    console.log('DocumentViewPage: Getting session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session || sessionError) {
      console.error('DocumentViewPage: Session error:', sessionError);
      throw new Error('Authentication required');
    }
    
    console.log('DocumentViewPage: Session found:', {
      userId: session.user.id,
      role: session.user.user_metadata?.role
    });

    console.log('DocumentViewPage: Fetching document');
    const { data: document, error: documentError } = await supabase
      .from('Document')
      .select(`
        *,
        user:User (
          name,
          email
        )
      `)
      .eq('id', params.id)
      .single();

    console.log('DocumentViewPage: Supabase response:', { 
      hasDocument: !!document, 
      error: documentError?.message 
    });

    if (documentError) {
      console.error('DocumentViewPage: Error fetching document:', documentError);
      if (documentError.code === '42501' || documentError.message?.includes('permission denied')) {
        throw new Error('You do not have permission to view this document');
      }
      notFound();
    }

    if (!document) {
      console.log('DocumentViewPage: Document not found');
      notFound();
    }

    console.log('DocumentViewPage: Successfully retrieved document');

    return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{document.title}</h1>
        <Badge variant={
          document.status === 'APPROVED'
            ? 'default'
            : document.status === 'REJECTED'
            ? 'destructive'
            : document.status === 'PENDING'
            ? 'secondary'
            : 'outline'
        }>
          {document.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1">{format(new Date(document.createdAt), 'PPpp')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                <dd className="mt-1">{format(new Date(document.updatedAt), 'PPpp')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">RPIC</dt>
                <dd className="mt-1">
                  <div>{document.user.name || 'Unnamed'}</div>
                  <div className="text-sm text-gray-500">{document.user.email}</div>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{document.content}</div>
          </CardContent>
        </Card>
      </div>
    </div>
    );
  } catch (error) {
    console.error('Error in DocumentViewPage:', error);
    throw error; // Let error.tsx handle the display
  }
}
