import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { DocumentEditForm } from './edit-form';

export default async function DocumentEditPage({
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
      <h1 className="text-3xl font-bold mb-8">Edit Document</h1>
      <DocumentEditForm document={document} />
    </div>
  );
}
