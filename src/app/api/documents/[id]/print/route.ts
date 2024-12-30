import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createAdminClient } from '../../../../../lib/supabase/admin';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';

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

    if (documentError) {
      console.error('Error fetching document:', documentError);
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: 500 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to print this document
    const userRole = user.user_metadata?.role || 'user';
    const canPrint = document.userId === user.id || ['admin', 'supervisor'].includes(userRole);
    
    if (!canPrint) {
      return NextResponse.json(
        { error: 'You do not have permission to print this document' },
        { status: 403 }
      );
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add content to the PDF
    const { width, height } = page.getSize();
    page.drawText(document.title, {
      x: 50,
      y: height - 50,
      size: 20,
      font,
    });

    page.drawText(document.content, {
      x: 50,
      y: height - 100,
      size: 12,
      font,
      maxWidth: width - 100,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Return the PDF as a response with inline disposition for printing
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
