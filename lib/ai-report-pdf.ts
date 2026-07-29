import { jsPDF } from "jspdf";

const INK_RGB: [number, number, number] = [30, 42, 56];

export function buildAiReportPdf(
  surveyTitle: string,
  surveyCode: string,
  report: string
): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...INK_RGB);
  doc.text("Rapport analytique IA", margin, y);
  y += 8;

  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize(surveyTitle, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 5 + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Code: ${surveyCode} · ${new Date().toLocaleDateString("fr-FR")}`,
    margin,
    y
  );
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK_RGB);

  const lines = report.split("\n");
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed) {
      y += 4;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      y += 4;
      if (y > 270) {
        doc.addPage();
        y = 18;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const sectionLines = doc.splitTextToSize(trimmed.replace(/^##\s*/, ""), maxWidth);
      doc.text(sectionLines, margin, y);
      y += sectionLines.length * 5 + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      continue;
    }

    const wrapped = doc.splitTextToSize(trimmed.replace(/^[-*]\s*/, "• "), maxWidth);
    for (const wl of wrapped) {
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
      doc.text(wl, margin, y);
      y += 5;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
