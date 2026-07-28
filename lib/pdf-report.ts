import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Question, SurveyResponse } from "@/lib/constants";
import {
  buildCrosstab,
  buildSummarySheetRows,
  getPairwiseCrosstabs,
  rawResponseRows,
} from "@/lib/export-report";
import { computeQuestionStats } from "@/lib/stats";

const INK_RGB: [number, number, number] = [30, 42, 56];
const OCHRE_RGB: [number, number, number] = [201, 151, 28];

export function buildSurveyPdf(
  survey: { title: string; description: string | null; code: string | null },
  questions: Question[],
  responses: SurveyResponse[]
): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK_RGB);
  doc.text("Rapport de sondage", margin, y);
  y += 8;

  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(survey.title, 180);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Code: ${survey.code} · ${responses.length} réponse(s) · ${new Date().toLocaleDateString("fr-FR")}`,
    margin,
    y
  );
  y += 8;

  if (survey.description) {
    const desc = doc.splitTextToSize(survey.description, 180);
    doc.text(desc, margin, y);
    y += desc.length * 4.5 + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK_RGB);
  doc.text("1. Synthèse", margin, y);
  y += 4;

  const summary = buildSummarySheetRows(questions, responses);
  autoTable(doc, {
    startY: y,
    head: [summary[0].map(String)],
    body: summary.slice(1).map((r) => r.map(String)),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: INK_RGB },
    theme: "grid",
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. Statistiques et graphiques", margin, y);
  y += 8;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK_RGB);
    const qLabel = doc.splitTextToSize(`Q${i + 1}. ${q.text}`, 180);
    doc.text(qLabel, margin, y);
    y += qLabel.length * 5 + 3;

    const stats = computeQuestionStats(q, responses);

    if (stats.type === "text") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      if (stats.texts.length === 0) {
        doc.text("Aucune réponse textuelle.", margin, y);
        y += 10;
      } else {
        for (const t of stats.texts.slice(0, 6)) {
          const lines = doc.splitTextToSize(`• ${t}`, 175);
          doc.text(lines, margin, y);
          y += lines.length * 4.2;
        }
        y += 4;
      }
      continue;
    }

    if (stats.type === "number" || stats.type === "rating") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const avg =
        stats.avg !== null
          ? `Moyenne: ${stats.avg.toFixed(1)}${q.type === "rating" ? " / 5" : q.unit ? ` ${q.unit}` : ""}`
          : "Moyenne: —";
      doc.text(avg, margin, y);
      y += 6;
    }

    const crosstab = buildCrosstab(q, responses);
    if (crosstab.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Option", "Effectif", "%"]],
        body: crosstab.map((r) => [r.option, String(r.count), `${r.percent}%`]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: INK_RGB },
        theme: "striped",
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
      y = drawHorizontalBars(
        doc,
        margin,
        y,
        crosstab.map((r) => ({ label: r.option, value: r.count })),
        170
      );
      y += 6;
    }
  }

  const pairs = getPairwiseCrosstabs(questions, responses);
  if (pairs.length > 0) {
    doc.addPage();
    y = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK_RGB);
    doc.text("3. Tableaux croisés dynamiques", margin, y);
    y += 8;

    for (const pair of pairs) {
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const pairTitle = doc.splitTextToSize(`${pair.questionA} × ${pair.questionB}`, 180);
      doc.text(pairTitle, margin, y);
      y += pairTitle.length * 4.5 + 2;

      const head = ["", ...pair.cols, "Total"];
      const body = pair.rows.map((row, ri) => [row, ...pair.matrix[ri].map(String), String(pair.rowTotals[ri])]);
      body.push(["Total", ...pair.colTotals.map(String), String(responses.length)]);

      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: INK_RGB },
        theme: "grid",
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  const raw = rawResponseRows(questions, responses);
  if (raw.rows.length > 0) {
    doc.addPage();
    y = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("4. Réponses brutes (aperçu)", margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [raw.headers],
      body: raw.rows.slice(0, 20),
      margin: { left: margin, right: margin },
      styles: { fontSize: 6, cellPadding: 1.2, overflow: "linebreak" },
      headStyles: { fillColor: INK_RGB },
      theme: "striped",
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function drawHorizontalBars(
  doc: jsPDF,
  x: number,
  y: number,
  data: { label: string; value: number }[],
  maxWidth: number
): number {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barH = 4;
  const gap = 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  for (const d of data) {
    const barW = (d.value / maxVal) * (maxWidth - 50);
    doc.setTextColor(80, 80, 80);
    const label = d.label.length > 22 ? d.label.slice(0, 21) + "…" : d.label;
    doc.text(label, x, y + 3);
    doc.setFillColor(...OCHRE_RGB);
    doc.rect(x + 48, y, Math.max(barW, 0.5), barH, "F");
    doc.setTextColor(...INK_RGB);
    doc.text(String(d.value), x + 48 + barW + 2, y + 3.5);
    y += barH + gap;
  }

  return y;
}
