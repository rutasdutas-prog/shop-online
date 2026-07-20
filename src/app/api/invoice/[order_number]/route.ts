import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(request: NextRequest, { params }: { params: { order_number: string } }) {
  const { order_number } = params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      store:stores(name, logo_url),
      customer:customers(name, phone, email, address),
      order_items(id, quantity, unit_price, subtotal, product:products(name, sku))
    `)
    .eq('order_number', order_number)
    .single();

  if (!order) {
    return new NextResponse('Order not found', { status: 404 });
  }

  // Initialize a new PDF document using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  // Fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const drawText = (text: string, x: number, options?: { size?: number; font?: any; align?: 'left' | 'right' }) => {
    const size = options?.size ?? 12;
    const font = options?.font ?? helvetica;
    const align = options?.align ?? 'left';
    let drawX = x;
    if (align === 'right') {
      const textWidth = font.widthOfTextAtSize(text, size);
      drawX = width - x - textWidth;
    }
    page.drawText(text, { x: drawX, y, size, font });
  };

  // Header – store name
  drawText(order.store?.name || 'Toko', margin, { size: 20, font: helveticaBold, align: 'center' });
  y -= 30;
  // Invoice number
  drawText(`Invoice / Bukti Pesanan #${order.order_number}`, margin, { size: 12, font: helvetica, align: 'center' });
  y -= 30;

  // Customer info
  drawText('Diterbitkan Kepada:', margin, { font: helveticaBold });
  y -= 15;
  drawText(order.customer?.name ?? '', margin);
  y -= 15;
  drawText(order.customer?.phone ?? '', margin);
  if (order.customer?.address) { y -= 15; drawText(order.customer.address, margin); }
  y -= 25;

  // Table header
  drawText('Produk', margin, { font: helveticaBold });
  drawText('Harga', margin + 250, { align: 'right', font: helveticaBold });
  drawText('Qty', margin + 320, { align: 'right', font: helveticaBold });
  drawText('Subtotal', margin + 380, { align: 'right', font: helveticaBold });
  y -= 15;

  // Items
  (order.order_items || []).forEach((item: any) => {
    drawText(item.product?.name || 'Produk', margin);
    drawText(`Rp ${item.unit_price.toLocaleString('id-ID')}`, margin + 250, { align: 'right' });
    drawText(`${item.quantity}`, margin + 320, { align: 'right' });
    drawText(`Rp ${item.subtotal.toLocaleString('id-ID')}`, margin + 380, { align: 'right' });
    y -= 15;
  });
  y -= 15;

  // Total
  drawText('Total', margin + 320, { align: 'right', font: helveticaBold });
  drawText(`Rp ${order.total_amount.toLocaleString('id-ID')}`, margin + 380, { align: 'right', font: helveticaBold });

  // Finalize PDF
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${order.store?.name || 'invoice'}-${order.order_number}.pdf"`,
    },
  });
}
