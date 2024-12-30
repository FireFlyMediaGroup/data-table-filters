import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { format } from 'date-fns';

export default async function DocumentViewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    return null; // Auth middleware will handle redirect
  }

  // Get document
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select(`
      *,
      user:users (
        name,
        email
      )
    `)
    .eq('id', params.id)
    .single();

  if (documentError || !document) {
    notFound();
  }

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
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1">{document.documentType.replace('_', ' ')}</dd>
              </div>
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
}
