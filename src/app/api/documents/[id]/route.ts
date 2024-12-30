import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auditLogger } from '../../../../utils/auditLogger';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user || userError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document using admin client
    const adminClient = createAdminClient();
    const { data: document, error: documentError } = await adminClient
      .from('Document')
      .select('*')
      .eq('id', params.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user owns the document or is admin/supervisor
    const userRole = user.user_metadata?.role || 'user';
    if (document.userId !== user.id && !['admin', 'supervisor'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Unauthorized to view this document' },
        { status: 403 }
      );
    }

    // Log the view action
    await auditLogger.log({
      action: 'document.view',
      userId: user.id,
      resourceId: params.id,
      details: {
        title: document.title,
        userRole,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Input validation schema
const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user || userError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document to check ownership using admin client
    const adminClient = createAdminClient();
    const { data: existingDocument, error: documentError } = await adminClient
      .from('Document')
      .select('userId, title')  // Added title for audit log
      .eq('id', params.id)
      .single();

    if (documentError || !existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user owns the document or is admin/supervisor
    const userRole = user.user_metadata?.role || 'user';
    if (existingDocument.userId !== user.id && !['admin', 'supervisor'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this document' },
        { status: 403 }
      );
    }

    // Get and validate request body
    const body = await request.json();
    const validationResult = updateDocumentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { title, content } = validationResult.data;

    // Update document using admin client
    const { data: updatedDocument, error: updateError } = await adminClient
      .from('Document')
      .update({
        title,
        content,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    // Log the update action
    await auditLogger.log({
      action: 'document.update',
      userId: user.id,
      resourceId: params.id,
      details: {
        previousTitle: existingDocument.title,
        newTitle: title,
        userRole,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
