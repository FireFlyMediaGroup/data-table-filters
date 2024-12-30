import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
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

    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.title}.pdf"`,
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
