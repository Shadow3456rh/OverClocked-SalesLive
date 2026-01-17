import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill, Shop } from '@/types';

export const exportBillToPDF = (bill: Bill, shop: Shop): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(shop.shopName, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', pageWidth / 2, 28, { align: 'center' });

  // Bill Info
  doc.setFontSize(10);
  doc.text(`Bill ID: ${bill.billId}`, 14, 40);
  doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 14, 46);
  doc.text(`Time: ${new Date(bill.createdAt).toLocaleTimeString()}`, 14, 52);
  doc.text(`Staff: ${bill.staffName}`, 14, 58);
  doc.text(`Status: ${bill.syncStatus}`, 14, 64);

  // Items Table
  const tableData = bill.items.map((item) => [
    item.name,
    item.qty.toString(),
    `₹${item.rate.toFixed(2)}`,
    `₹${item.lineTotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['Item', 'Qty', 'Rate', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || 100;

  // Totals
  const totalsStartY = finalY + 10;
  doc.setFontSize(10);
  
  doc.text('Subtotal:', 120, totalsStartY);
  doc.text(`₹${bill.subtotal.toFixed(2)}`, 180, totalsStartY, { align: 'right' });

  if (bill.discount > 0) {
    doc.text('Discount:', 120, totalsStartY + 6);
    doc.text(`-₹${bill.discount.toFixed(2)}`, 180, totalsStartY + 6, { align: 'right' });
  }

  if (bill.tax > 0) {
    doc.text('Tax:', 120, totalsStartY + 12);
    doc.text(`+₹${bill.tax.toFixed(2)}`, 180, totalsStartY + 12, { align: 'right' });
  }

  // Total Line
  doc.setDrawColor(0);
  doc.line(120, totalsStartY + 16, 180, totalsStartY + 16);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 120, totalsStartY + 24);
  doc.text(`₹${bill.totalAmount.toFixed(2)}`, 180, totalsStartY + 24, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', pageWidth / 2, totalsStartY + 40, { align: 'center' });
  doc.text('Powered by SalesLive', pageWidth / 2, totalsStartY + 46, { align: 'center' });

  // Save
  doc.save(`SalesLive_Bill_${bill.billId.slice(0, 8)}.pdf`);
};