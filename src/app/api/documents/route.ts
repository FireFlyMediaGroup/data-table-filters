import { NextResponse } from 'next/server';
import { PrismaClient, DocumentStatus, UserRole } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Get the user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from metadata
    const role = user.user_metadata?.role || 'user';

    // Fetch documents based on role
    const documents = await prisma.document.findMany({
      where: role === 'user' 
        ? { userId: user.id } // Regular users can only see their documents
        : undefined, // Admins and supervisors can see all documents
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Get the user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    const newDocument = await prisma.document.create({
      data: {
        title,
        content,
        userId: user.id,
      },
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Get the user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role || 'user';
    const body = await request.json();
    const { id, title, content } = body;

    // Check document ownership for regular users
    if (role === 'user') {
      const document = await prisma.document.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!document || document.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: { title, content },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role || 'user';
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Check document ownership for regular users
    if (role === 'user') {
      const document = await prisma.document.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!document || document.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Get the user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role || 'user';
    const body = await request.json();
    const { documentIds, status } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    if (!Object.values(DocumentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // For regular users, verify ownership of all documents
    if (role === 'user') {
      const documents = await prisma.document.findMany({
        where: { 
          id: { in: documentIds },
        },
        select: { id: true, userId: true }
      });

      const unauthorized = documents.some(doc => doc.userId !== user.id);
      if (unauthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const updatedDocuments = await prisma.document.updateMany({
      where: {
        id: {
          in: documentIds,
        },
        ...(role === 'user' ? { userId: user.id } : {}),
      },
      data: {
        status: status as DocumentStatus,
      },
    });

    return NextResponse.json({ message: 'Documents updated successfully', count: updatedDocuments.count });
  } catch (error) {
    console.error('Error updating documents:', error);
    return NextResponse.json({ error: 'Failed to update documents' }, { status: 500 });
  }
}
