import ExcelJS from "exceljs";
import { Question } from "@/lib/constants";
import { SurveyResponse } from "@/lib/constants";
import {
  buildCrosstab,
  buildSummarySheetRows,
  getPairwiseCrosstabs,
  rawResponseRows,
} from "@/lib/export-report";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E2A38" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFF7F5EF" } };

export async function buildSurveyXlsx(
  survey: { title: string; code: string | null },
  questions: Question[],
  responses: SurveyResponse[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Enquête Sondage";
  wb.created = new Date();

  // --- Feuille Synthèse ---
  const synth = wb.addWorksheet("Synthèse", { views: [{ state: "frozen", ySplit: 1 }] });
  synth.addRow([survey.title]);
  synth.getCell("A1").font = { bold: true, size: 14 };
  synth.addRow([`Code: ${survey.code}`, `${responses.length} réponse(s)`]);
  synth.addRow([]);
  const summaryRows = buildSummarySheetRows(questions, responses);
  summaryRows.forEach((row, i) => {
    const r = synth.addRow(row);
    if (i === 0) styleHeaderRow(r);
  });
  synth.columns.forEach((col) => {
    col.width = 22;
  });
  synth.getColumn(1).width = 40;

  // --- Feuille Tableaux croisés (fréquences) ---
  const freq = wb.addWorksheet("Fréquences", { views: [{ state: "frozen", ySplit: 1 }] });
  freq.addRow(["Question", "Option", "Effectif", "%"]).eachCell((c) => styleHeaderCell(c));
  questions.forEach((q, i) => {
    const tab = buildCrosstab(q, responses);
    tab.forEach((row) => {
      freq.addRow([`Q${i + 1}: ${q.text}`, row.option, row.count, row.percent / 100]);
    });
    if (tab.length) freq.addRow([]);
  });
  freq.getColumn(1).width = 38;
  freq.getColumn(4).numFmt = "0.0%";

  // --- Feuille TCD (paires) ---
  const pairs = getPairwiseCrosstabs(questions, responses);
  const tcd = wb.addWorksheet("Tableaux croisés", { views: [{ state: "frozen", ySplit: 1 }] });
  if (pairs.length === 0) {
    tcd.addRow(["Aucun tableau croisé disponible (nécessite 2+ questions à choix unique)."]);
  } else {
    pairs.forEach((pair) => {
      tcd.addRow([`${pair.questionA} × ${pair.questionB}`]).getCell(1).font = { bold: true };
      const head = ["", ...pair.cols, "Total"];
      const headRow = tcd.addRow(head);
      headRow.eachCell((c) => styleHeaderCell(c));
      pair.rows.forEach((row, ri) => {
        tcd.addRow([row, ...pair.matrix[ri], pair.rowTotals[ri]]);
      });
      const totalRow = tcd.addRow(["Total", ...pair.colTotals, responses.length]);
      totalRow.font = { bold: true };
      tcd.addRow([]);
    });
  }
  tcd.getColumn(1).width = 28;

  // --- Feuille Réponses brutes ---
  const raw = wb.addWorksheet("Réponses brutes", { views: [{ state: "frozen", ySplit: 1 }] });
  const { headers, rows } = rawResponseRows(questions, responses);
  const hRow = raw.addRow(headers);
  hRow.eachCell((c) => styleHeaderCell(c));
  rows.forEach((row) => raw.addRow(row));
  raw.columns.forEach((col) => {
    col.width = 18;
  });
  raw.getColumn(1).width = 20;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((c) => styleHeaderCell(c));
}

function styleHeaderCell(cell: ExcelJS.Cell) {
  cell.fill = HEADER_FILL;
  cell.font = HEADER_FONT;
  cell.alignment = { vertical: "middle", wrapText: true };
}
