import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    // In Next 15, we must await params
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        member: true,
        recordedBy: true,
        allocations: {
          include: {
            membership: {
              include: { plan: true }
            }
          }
        }
      }
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    const settingsRaw = await prisma.setting.findMany();
    const settings = settingsRaw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    
    const margin = 50;
    let y = height - margin;

    // Helper for drawing text
    const drawText = (rawText: string, x: number, yPos: number, size: number, isBold = false) => {
      const text = rawText.replace(/₹/g, 'Rs. ');
      page.drawText(text, {
        x,
        y: yPos,
        size,
        font: isBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
    };

    // Header (Gym Info)
    drawText(settings.gymName || "Fitness Monitoring", margin, y, 24, true);
    y -= 20;
    drawText(settings.gymAddress || "", margin, y, 10);
    y -= 15;
    drawText(`Phone: ${settings.gymPhone || ""}  |  Email: ${settings.gymEmail || ""}`, margin, y, 10);
    
    // Receipt Title
    y -= 50;
    const title = "PAYMENT RECEIPT";
    const titleWidth = boldFont.widthOfTextAtSize(title, 18);
    drawText(title, (width - titleWidth) / 2, y, 18, true);

    // Receipt Details
    y -= 40;
    drawText(`Receipt No: ${payment.id.split('-')[0].toUpperCase()}`, margin, y, 10, true);
    drawText(`Date: ${format(payment.date, 'dd MMM yyyy')}`, width - margin - 150, y, 10, true);
    
    y -= 20;
    drawText(`Member ID: ${payment.member.memberId}`, margin, y, 10);
    drawText(`Name: ${payment.member.fullName}`, margin, y - 15, 10);
    drawText(`Phone: ${payment.member.phoneNumber}`, margin, y - 30, 10);

    y -= 60;
    // Table Header
    page.drawLine({ start: { x: margin, y: y + 10 }, end: { x: width - margin, y: y + 10 }, thickness: 1 });
    drawText("Description", margin, y - 5, 12, true);
    drawText("Amount", width - margin - 100, y - 5, 12, true);
    page.drawLine({ start: { x: margin, y: y - 15 }, end: { x: width - margin, y: y - 15 }, thickness: 1 });

    y -= 40;
    
    // Membership description
    const currency = settings.currency || "₹";
    const allocation = payment.allocations[0];
    let desc = "Payment towards Membership";
    if (allocation && allocation.membership.plan) {
      desc = `Payment for ${allocation.membership.plan.name} (${format(allocation.membership.startDate, 'MMM dd, yyyy')} - ${format(allocation.membership.endDate, 'MMM dd, yyyy')})`;
    }
    
    drawText(desc, margin, y, 10);
    drawText(`${currency}${payment.amount.toFixed(2)}`, width - margin - 100, y, 10);
    
    y -= 40;
    page.drawLine({ start: { x: margin, y: y + 15 }, end: { x: width - margin, y: y + 15 }, thickness: 1 });
    drawText("Total Paid:", width - margin - 200, y, 12, true);
    drawText(`${currency}${payment.amount.toFixed(2)}`, width - margin - 100, y, 12, true);

    // Payment details
    y -= 50;
    drawText(`Payment Method: ${payment.method}`, margin, y, 10);
    if (payment.referenceNumber) {
      y -= 15;
      drawText(`Reference: ${payment.referenceNumber}`, margin, y, 10);
    }
    if (payment.notes) {
      y -= 15;
      drawText(`Notes: ${payment.notes}`, margin, y, 10);
    }

    y -= 30;
    drawText(`Received By: ${payment.recordedBy?.name || "System"}`, margin, y, 10);

    // Footer
    y = margin;
    page.drawLine({ start: { x: margin, y: y + 20 }, end: { x: width - margin, y: y + 20 }, thickness: 1 });
    const footerText = settings.receiptFooter || "Thank you for choosing Fitness Monitoring!";
    const footerWidth = font.widthOfTextAtSize(footerText, 10);
    drawText(footerText, (width - footerWidth) / 2, y, 10);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt_${payment.id.split('-')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
