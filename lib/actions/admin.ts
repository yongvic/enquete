"use server";

import { SurveyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export async function getPlatformStats(locale: string) {
  await requireSuperAdmin(locale);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    newUsersWeek,
    publishedSurveys,
    draftSurveys,
    totalResponses,
    responsesWeek,
    totalFeedback,
    feedbackWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.survey.count({ where: { status: SurveyStatus.PUBLISHED } }),
    prisma.survey.count({ where: { status: SurveyStatus.DRAFT } }),
    prisma.response.count(),
    prisma.response.count({ where: { submittedAt: { gte: sevenDaysAgo } } }),
    prisma.feedback.count(),
    prisma.feedback.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return {
    totalUsers,
    newUsersWeek,
    publishedSurveys,
    draftSurveys,
    totalResponses,
    responsesWeek,
    totalFeedback,
    feedbackWeek,
  };
}

export async function getRecentUsers(locale: string) {
  await requireSuperAdmin(locale);

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { surveys: true } },
    },
  });
}
