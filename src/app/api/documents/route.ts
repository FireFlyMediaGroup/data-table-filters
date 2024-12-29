import { NextResponse } from 'next/server';
import { PrismaClient, DocumentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const documents = await prisma.document.findMany();
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, userId } = body;

    const newDocument = await prisma.document.create({
      data: {
        title,
        content,
        userId,
      },
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, content } = body;

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: { title, content },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { documentIds, status } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    if (!Object.values(DocumentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedDocuments = await prisma.document.updateMany({
      where: {
        id: {
          in: documentIds,
        },
      },
      data: {
        status: status as DocumentStatus,
      },
    });

    return NextResponse.json({ message: 'Documents updated successfully', count: updatedDocuments.count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update documents' }, { status: 500 });
  }
}
