'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DocumentSchema } from './schema';
import { auditLogger } from '../../../utils/auditLogger';

import prismaClient from '../../../lib/prisma/client';

export async function fetchDocuments(): Promise<DocumentSchema[]> {
  try {
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Unauthorized');
    }

    const documents = await prismaClient.document.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform documents to match DocumentSchema
    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      userId: doc.userId,
      user: {
        email: doc.user.email,
        name: doc.user.name
      },
      documentType: doc.title.includes('POWRA') ? 'POWRA' as const : 
                   doc.title.includes('FPL Mission') ? 'FPL_MISSION' as const : 
                   'TAILBOARD' as const
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Error fetching documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function approveDocument(documentId: string): Promise<DocumentSchema> {
  try {
    // Get current user
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Update document status and return full document
    const document = await prismaClient.document.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Transform to match DocumentSchema
    const result: DocumentSchema = {
      ...document,
      documentType: document.title.includes('POWRA') ? 'POWRA' as const : 
                   document.title.includes('FPL Mission') ? 'FPL_MISSION' as const : 
                   'TAILBOARD' as const
    };

    // Log the approve action
    await auditLogger.log({
      action: 'document.approve',
      userId: user.id,
      resourceId: documentId,
      details: {
        documentTitle: document.title,
        userRole: user.user_metadata?.role || 'user',
      },
    });

    return result;
  } catch (error) {
    console.error('Error approving document:', error);
    throw new Error(`Error approving document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteDocument(documentId: string): Promise<DocumentSchema> {
  try {
    // Get current user
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Delete document and return full document
    const document = await prismaClient.document.delete({
      where: { id: documentId },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Transform to match DocumentSchema
    const result: DocumentSchema = {
      ...document,
      documentType: document.title.includes('POWRA') ? 'POWRA' as const : 
                   document.title.includes('FPL Mission') ? 'FPL_MISSION' as const : 
                   'TAILBOARD' as const
    };

    // Log the delete action
    await auditLogger.log({
      action: 'document.delete',
      userId: user.id,
      resourceId: documentId,
      details: {
        documentTitle: document.title,
        userRole: user.user_metadata?.role || 'user',
      },
    });

    return result;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Error deleting document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
