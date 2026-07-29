"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const feedbackSchema = z.object({
  message: z.string().trim().min(5).max(2000),
  email: z.string().email().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5).optional(),
  page: z.string().max(500).optional(),
});

export async function submitFeedback(input: {
  message: string;
  email?: string;
  rating?: number;
  page?: string;
}) {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" as const };

  const session = await auth();

  await prisma.feedback.create({
    data: {
      message: parsed.data.message,
      email: parsed.data.email?.trim() || session?.user?.email || null,
      rating: parsed.data.rating ?? null,
      page: parsed.data.page?.trim() || null,
      userId: session?.user?.id ?? null,
    },
  });

  revalidatePath("/fr/admin");
  revalidatePath("/en/admin");
  return { success: true as const };
}

export async function getRecentFeedback(locale: string) {
  await requireSuperAdmin(locale);

  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      message: true,
      email: true,
      rating: true,
      page: true,
      createdAt: true,
    },
  });
}
