"use server";

import { Prisma, SurveyStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { makeSurveyCode, Question } from "@/lib/constants";
import { resolveRoleForEmail } from "@/lib/roles";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export async function registerAdmin(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    return { error: "invalid" as const };
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: "exists" as const };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name,
      role: resolveRoleForEmail(normalizedEmail),
    },
  });

  return { success: true as const };
}

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["single", "multi", "rating", "number", "text"]),
  text: z.string(),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
  required: z.boolean().optional(),
});

const surveyInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1),
});

function normalizeQuestions(questions: Question[]) {
  return questions.map((q) => ({
    ...q,
    options:
      q.type === "single" || q.type === "multi"
        ? (q.options || []).filter((o) => o.trim())
        : undefined,
  }));
}

function validateSurveyInput(input: { title: string; description?: string; questions: Question[] }) {
  if (!input.title.trim()) return "title";
  if (input.questions.length === 0) return "questions";
  for (const q of input.questions) {
    if (!q.text.trim()) return "questionText";
    if (q.type === "single" || q.type === "multi") {
      const filled = (q.options || []).filter((o) => o.trim());
      if (filled.length < 2) return "options";
    }
  }
  return null;
}

async function generateUniqueCode() {
  let code = makeSurveyCode(5);
  for (let i = 0; i < 8; i++) {
    const exists = await prisma.survey.findUnique({ where: { code } });
    if (!exists) return code;
    code = makeSurveyCode(5);
  }
  throw new Error("Unable to generate survey code");
}

export async function saveDraft(input: {
  draftId?: string;
  title: string;
  description?: string;
  questions: Question[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" as const };

  const err = validateSurveyInput(input);
  if (err) return { error: err as "title" | "questions" | "questionText" | "options" };

  const data = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    questions: normalizeQuestions(input.questions) as Prisma.InputJsonValue,
    status: SurveyStatus.DRAFT,
  };

  if (input.draftId) {
    const existing = await prisma.survey.findFirst({
      where: { id: input.draftId, userId: session.user.id, status: SurveyStatus.DRAFT },
    });
    if (!existing) return { error: "notFound" as const };

    const survey = await prisma.survey.update({
      where: { id: existing.id },
      data,
    });
    revalidatePath("/dashboard");
    return { success: true as const, draftId: survey.id };
  }

  const survey = await prisma.survey.create({
    data: { ...data, userId: session.user.id },
  });
  revalidatePath("/dashboard");
  return { success: true as const, draftId: survey.id };
}

export async function publishSurvey(input: {
  draftId?: string;
  title: string;
  description?: string;
  questions: Question[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" as const };

  const parsed = surveyInputSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" as const };

  const err = validateSurveyInput(input);
  if (err) return { error: err as "title" | "questions" | "questionText" | "options" };

  const questions = normalizeQuestions(parsed.data.questions);
  const code = await generateUniqueCode();
  const payload = {
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() || null,
    questions: questions as Prisma.InputJsonValue,
    code,
    status: SurveyStatus.PUBLISHED,
    publishedAt: new Date(),
  };

  if (input.draftId) {
    const draft = await prisma.survey.findFirst({
      where: { id: input.draftId, userId: session.user.id, status: SurveyStatus.DRAFT },
    });
    if (!draft) return { error: "notFound" as const };

    const survey = await prisma.survey.update({
      where: { id: draft.id },
      data: payload,
    });
    revalidatePath("/dashboard");
    return { success: true as const, code: survey.code!, id: survey.id };
  }

  const survey = await prisma.survey.create({
    data: { ...payload, userId: session.user.id },
  });
  revalidatePath("/dashboard");
  return { success: true as const, code: survey.code!, id: survey.id };
}

export async function getDraft(draftId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const survey = await prisma.survey.findFirst({
    where: { id: draftId, userId: session.user.id, status: SurveyStatus.DRAFT },
  });
  if (!survey) return null;

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questions: survey.questions as unknown as Question[],
  };
}

export async function deleteSurvey(surveyId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" as const };

  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, userId: session.user.id },
  });
  if (!survey) return { error: "notFound" as const };

  await prisma.survey.delete({ where: { id: survey.id } });
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function submitResponse(code: string, answers: Record<string, unknown>) {
  const survey = await prisma.survey.findFirst({
    where: { code: code.toUpperCase(), status: SurveyStatus.PUBLISHED },
  });
  if (!survey) return { error: "notFound" as const };

  await prisma.response.create({
    data: {
      surveyId: survey.id,
      answers: answers as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/resultats/${survey.code}`);
  return { success: true as const };
}

export async function getSurveyByCode(code: string) {
  const survey = await prisma.survey.findFirst({
    where: { code: code.toUpperCase(), status: SurveyStatus.PUBLISHED },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      questions: true,
      createdAt: true,
    },
  });
  return survey;
}

export async function getSurveyResults(code: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" as const };

  const survey = await prisma.survey.findFirst({
    where: { code: code.toUpperCase(), status: SurveyStatus.PUBLISHED },
    include: {
      responses: { orderBy: { submittedAt: "asc" } },
    },
  });

  if (!survey) return { error: "notFound" as const };
  if (survey.userId !== session.user.id) return { error: "forbidden" as const };

  return {
    survey: {
      id: survey.id,
      code: survey.code!,
      title: survey.title,
      description: survey.description,
      questions: survey.questions as unknown as Question[],
      createdAt: survey.createdAt,
    },
    responses: survey.responses.map((r) => ({
      id: r.id,
      surveyId: r.surveyId,
      answers: r.answers as Record<string, string | number | string[] | undefined>,
      submittedAt: r.submittedAt,
    })),
  };
}

export async function getMySurveys() {
  const session = await auth();
  if (!session?.user?.id) return { published: [], drafts: [] };

  const surveys = await prisma.survey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      _count: { select: { responses: true } },
    },
  });

  // Prisma might not have updatedAt - let me check schema... I didn't add updatedAt. Use createdAt order only.
  return {
    published: surveys.filter((s) => s.status === SurveyStatus.PUBLISHED),
    drafts: surveys.filter((s) => s.status === SurveyStatus.DRAFT),
  };
}

export async function getMyDrafts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.survey.findMany({
    where: { userId: session.user.id, status: SurveyStatus.DRAFT },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });
}
