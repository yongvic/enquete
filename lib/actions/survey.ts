"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { makeSurveyCode, Question } from "@/lib/constants";
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
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { error: "exists" as const };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
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
});

const publishSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1),
});

export async function publishSurvey(input: {
  title: string;
  description?: string;
  questions: Question[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "unauthorized" as const };
  }

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "invalid" as const };
  }

  let code = makeSurveyCode(5);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.survey.findUnique({ where: { code } });
    if (!exists) break;
    code = makeSurveyCode(5);
  }

  const survey = await prisma.survey.create({
    data: {
      code,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      questions: parsed.data.questions.map((q) => ({
        ...q,
        options:
          q.type === "single" || q.type === "multi"
            ? (q.options || []).filter((o) => o.trim())
            : undefined,
      })),
      userId: session.user.id,
    },
  });

  revalidatePath("/");
  return { success: true as const, code: survey.code, id: survey.id };
}

export async function submitResponse(code: string, answers: Record<string, unknown>) {
  const survey = await prisma.survey.findUnique({ where: { code: code.toUpperCase() } });
  if (!survey) {
    return { error: "notFound" as const };
  }

  await prisma.response.create({
    data: {
      surveyId: survey.id,
      answers: answers as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/${"fr"}/resultats/${survey.code}`);
  return { success: true as const };
}

export async function getSurveyByCode(code: string) {
  const survey = await prisma.survey.findUnique({
    where: { code: code.toUpperCase() },
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
  if (!session?.user?.id) {
    return { error: "unauthorized" as const };
  }

  const survey = await prisma.survey.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      responses: { orderBy: { submittedAt: "asc" } },
    },
  });

  if (!survey) {
    return { error: "notFound" as const };
  }

  if (survey.userId !== session.user.id) {
    return { error: "forbidden" as const };
  }

  return {
    survey: {
      id: survey.id,
      code: survey.code,
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
  if (!session?.user?.id) return [];

  return prisma.survey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, code: true, title: true, createdAt: true },
  });
}
