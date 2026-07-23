import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(request: NextRequest, { params }: { params: Promise<{ order_number: string }> }) {
  const { order_number } = await params;
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

  // Colors
  const primaryColor = rgb(0.1, 0.15, 0.25); // Dark blue
  const secondaryColor = rgb(0.4, 0.45, 0.5); // Grayish
  const lightBg = rgb(0.95, 0.96, 0.98); // Light gray for headers
  const lineColor = rgb(0.85, 0.85, 0.88); // Light border

  const drawText = (text: string, x: number, options?: { size?: number; font?: any; align?: 'left' | 'right' | 'center'; color?: any }) => {
    const size = options?.size ?? 10;
    const font = options?.font ?? helvetica;
    const align = options?.align ?? 'left';
    const color = options?.color ?? primaryColor;
    let drawX = x;
    const textWidth = font.widthOfTextAtSize(text, size);
    
    if (align === 'right') {
      drawX = x - textWidth;
    } else if (align === 'center') {
      drawX = x - (textWidth / 2);
    }
    page.drawText(text, { x: drawX, y, size, font, color });
  };

  // Header background
  page.drawRectangle({ x: 0, y: height - 120, width: width, height: 120, color: primaryColor });

  // Header – store name
  y = height - 50;
  drawText(order.store?.name || 'Toko Kita', width / 2, { align: 'center', font: helveticaBold, size: 24, color: rgb(1, 1, 1) });
  y -= 25;
  drawText('INVOICE / BUKTI PESANAN', width / 2, { align: 'center', font: helvetica, size: 10, color: rgb(0.8, 0.85, 0.9) });
  
  y -= 60; // Move below header

  // Details Section
  const invoiceDate = new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  
  // Left side - Customer
  drawText('DITERBITKAN KEPADA:', margin, { font: helveticaBold, size: 9, color: secondaryColor });
  drawText('NOMOR PESANAN:', width - margin, { align: 'right', font: helveticaBold, size: 9, color: secondaryColor });
  
  y -= 15;
  drawText(order.customer?.name ?? 'Pelanggan', margin, { font: helveticaBold, size: 12 });
  drawText(`#${order.order_number}`, width - margin, { align: 'right', font: helveticaBold, size: 12 });
  
  y -= 15;
  drawText(order.customer?.phone ?? '', margin, { font: helvetica, size: 10 });
  drawText(`Tanggal: ${invoiceDate}`, width - margin, { align: 'right', font: helvetica, size: 10 });
  
  if (order.customer?.address) { 
    y -= 15; 
    drawText(order.customer.address, margin, { font: helvetica, size: 10 }); 
  }
  
  y -= 40;

  // Table header background
  page.drawRectangle({ x: margin, y: y - 8, width: width - (margin * 2), height: 25, color: lightBg });
  
  // Table header
  const colProduk = margin + 10;
  const colHarga = width - margin - 150;
  const colQty = width - margin - 90;
  const colSubtotal = width - margin - 10;

  drawText('PRODUK', colProduk, { font: helveticaBold, size: 9, color: secondaryColor });
  drawText('HARGA', colHarga, { align: 'right', font: helveticaBold, size: 9, color: secondaryColor });
  drawText('QTY', colQty, { align: 'right', font: helveticaBold, size: 9, color: secondaryColor });
  drawText('SUBTOTAL', colSubtotal, { align: 'right', font: helveticaBold, size: 9, color: secondaryColor });
  
  y -= 25;

  // Items
  (order.order_items || []).forEach((item: any) => {
    const isLongName = item.product?.name && item.product.name.length > 35;
    const displayProductName = isLongName ? item.product.name.substring(0, 35) + '...' : (item.product?.name || 'Produk');
    
    drawText(displayProductName, colProduk, { font: helveticaBold, size: 10 });
    drawText(`Rp ${item.unit_price.toLocaleString('id-ID')}`, colHarga, { align: 'right', size: 10 });
    drawText(`${item.quantity}`, colQty, { align: 'right', size: 10 });
    drawText(`Rp ${item.subtotal.toLocaleString('id-ID')}`, colSubtotal, { align: 'right', font: helveticaBold, size: 10 });
    
    if (item.product?.sku) {
        y -= 12;
        drawText(`SKU: ${item.product.sku}`, colProduk, { font: helvetica, size: 8, color: secondaryColor });
    }
    
    y -= 15;
    page.drawLine({
      start: { x: margin, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 1,
      color: lineColor,
    });
    y -= 15;
  });

  // Total Section
  y -= 10;
  page.drawRectangle({ x: width - margin - 220, y: y - 10, width: 220, height: 35, color: lightBg });
  
  drawText('TOTAL PEMBAYARAN', width - margin - 120, { align: 'right', font: helveticaBold, size: 10, color: secondaryColor });
  drawText(`Rp ${order.total_amount.toLocaleString('id-ID')}`, colSubtotal, { align: 'right', font: helveticaBold, size: 14 });

  // Footer
  y = 80;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: lineColor,
  });
  
  y -= 20;
  drawText(`Terima kasih telah berbelanja di ${order.store?.name || 'Toko Kita'}!`, width / 2, { align: 'center', font: helvetica, size: 10, color: secondaryColor });
  y -= 15;
  drawText('Invoice ini sah dan diproses secara komputerisasi.', width / 2, { align: 'center', font: helvetica, size: 9, color: secondaryColor });

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
