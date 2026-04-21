import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function downloadAuditPDF(event: any, imageBase64?: string | null) {
  const doc = new jsPDF("p", "mm", "a4");
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(31, 41, 55); // Dark blue-gray
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("AuditAI - Audit Report", margin, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 35);
  doc.text(`Event ID: ${event.audit_event.id}`, pageWidth - margin - 50, 35);

  let cursorY = 55;

  // Transaction Summary
  const tx = event.audit_event.transaction || event.audit_event.extraction || {};
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Details", margin, cursorY);
  cursorY += 10;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const details = [
    ["Vendor:", tx.vendor || "Unknown"],
    ["Amount:", `INR ${Number(tx.amount || 0).toLocaleString()}`],
    ["Date/Time:", `${tx.date || ""} ${tx.time || ""}`],
    ["Category:", tx.category || "Uncategorized"],
    ["Payment Method:", tx.payment_method || "N/A"],
  ];
  
  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), margin + 40, cursorY);
    cursorY += 7;
  });

  cursorY += 10;

  // AI Verdict
  const det = event.audit_event.detection || {};
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("AI Fraud Verdict", margin, cursorY);
  cursorY += 10;

  const riskColor = det.risk_level === "HIGH" ? [220, 38, 38] : det.risk_level === "MEDIUM" ? [217, 119, 6] : [22, 163, 74];
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.rect(margin, cursorY - 5, 60, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`RISK LEVEL: ${det.risk_level}`, margin + 5, cursorY + 1.5);
  
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Anomaly Score: ${Math.round(det.anomaly_score)}/100`, margin + 70, cursorY + 1.5);
  
  cursorY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Evaluation Reason:", margin, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  const splitReason = doc.splitTextToSize(det.reason || "No reason provided.", pageWidth - 2 * margin);
  doc.text(splitReason, margin, cursorY);
  cursorY += (splitReason.length * 6) + 5;

  if (det.suspicious_signals?.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Suspicious Signals:", margin, cursorY);
    cursorY += 6;
    doc.setFont("helvetica", "normal");
    det.suspicious_signals.forEach((signal: string) => {
      doc.text(`- ${signal}`, margin + 5, cursorY);
      cursorY += 6;
    });
  }

  // Transaction Image Preview (if available)
  if (imageBase64) {
    try {
      cursorY += 10;
      if (cursorY + 60 > 280) {
        doc.addPage();
        cursorY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text("Document Evidence Preview", margin, cursorY);
      cursorY += 5;
      
      const imgProps = doc.getImageProperties(imageBase64);
      const imgWidth = 100;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      doc.addImage(imageBase64, 'JPEG', margin, cursorY, imgWidth, imgHeight);
    } catch (e) {
      console.warn("Failed to add image to PDF", e);
    }
  }

  // Footer on all pages? For now just simple
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`AuditAI Confidential - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`Audit_Report_${event.audit_event.id}_${tx.vendor || "Transaction"}.pdf`);
}
