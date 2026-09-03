import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type VoucherKind = "hotel" | "transport" | "umrah" | "visa" | "payment";

interface VoucherPayload {
  kind: VoucherKind;
  bookingId: string;
  customerName: string;
  lines: { label: string; value: string }[];
  amount?: string;
  note?: string;
}

export function generateVoucherPDF(payload: VoucherPayload) {
  const doc = new jsPDF();
  const titles: Record<VoucherKind, string> = {
    hotel: "Hotel Voucher",
    transport: "Transport Voucher",
    umrah: "Umrah Package Voucher",
    visa: "Visa Receipt",
    payment: "Payment Receipt",
  };

  doc.setFillColor(15, 28, 63);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("SSB Travel & Tours", 14, 16);
  doc.setFontSize(11);
  doc.text(titles[payload.kind], 14, 26);
  doc.setFontSize(10);
  doc.text(`Booking: ${payload.bookingId}`, 140, 16);
  doc.text(new Date().toLocaleDateString("en-GB"), 140, 26);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text(`Customer: ${payload.customerName}`, 14, 48);

  autoTable(doc, {
    startY: 56,
    head: [["Field", "Details"]],
    body: payload.lines.map((l) => [l.label, l.value]),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 10 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  if (payload.amount) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Amount: ${payload.amount}`, 14, finalY + 12);
  }
  if (payload.note) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(payload.note, 14, finalY + 22);
  }

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("This is a computer-generated voucher from SSB Travel & Tours Management System.", 14, 285);

  doc.save(`${payload.kind}-${payload.bookingId}.pdf`);
}
