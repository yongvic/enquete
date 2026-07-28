import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INK, Question } from "@/lib/constants";
import { computeQuestionStats, formatAnswer } from "@/lib/stats";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NextRequest, NextResponse } from "next/server";

async function getAuthorizedSurvey(code: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const survey = await prisma.survey.findUnique({
    where: { code: code.toUpperCase() },
    include: { responses: { orderBy: { submittedAt: "asc" } } },
  });

  if (!survey || survey.userId !== session.user.id) return null;
  return survey;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const survey = await getAuthorizedSurvey(code);
  if (!survey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const questions = survey.questions as unknown as Question[];
  const responses = survey.responses.map((r) => ({
    id: r.id,
    surveyId: r.surveyId,
    answers: r.answers as Record<string, string | number | string[] | undefined>,
    submittedAt: r.submittedAt,
  }));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 42, 56);
  doc.text(survey.title, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Code: ${survey.code} · ${responses.length} réponse(s)`, margin, y);
  y += 10;

  if (survey.description) {
    const descLines = doc.splitTextToSize(survey.description, 180);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;
  }

  questions.forEach((q, i) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 42, 56);
    doc.text(`Q${i + 1}. ${q.text}`, margin, y);
    y += 6;

    const stats = computeQuestionStats(q, responses);

    if (stats.type === "text") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (stats.texts.length === 0) {
        doc.text("— Aucune réponse", margin, y);
        y += 8;
      } else {
        stats.texts.slice(0, 8).forEach((t) => {
          const lines = doc.splitTextToSize(`• ${t}`, 175);
          doc.text(lines, margin, y);
          y += lines.length * 4.5;
        });
        if (stats.texts.length > 8) {
          doc.text(`… +${stats.texts.length - 8} autres`, margin, y);
          y += 6;
        }
      }
      y += 4;
      return;
    }

    if (stats.type === "number" || stats.type === "rating") {
      const avgLabel =
        stats.avg !== null
          ? `Moyenne: ${stats.avg.toFixed(1)}${q.type === "rating" ? " / 5" : q.unit ? ` ${q.unit}` : ""}`
          : "Moyenne: —";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(avgLabel, margin, y);
      y += 5;
    }

    autoTable(doc, {
      startY: y,
      head: [["Option", "Nombre"]],
      body: stats.data.map((d) => [d.name, String(d.value)]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 42, 56] },
      theme: "grid",
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  });

  if (responses.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(INK));
    doc.text("Réponses brutes (aperçu)", margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Date", ...questions.map((_, i) => `Q${i + 1}`)]],
      body: responses.slice(0, 15).map((r) => [
        new Date(r.submittedAt).toLocaleString("fr-FR"),
        ...questions.map((q) => formatAnswer(r.answers[q.id])),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
      headStyles: { fillColor: [30, 42, 56] },
      theme: "striped",
    });
  }

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sondage-${survey.code}.pdf"`,
    },
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
