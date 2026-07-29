import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";

export const AI_REPORT_DAILY_LIMIT = 2;

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getAiReportQuota(userId: string, role?: Role | string | null) {
  if (isSuperAdmin(role)) {
    return {
      unlimited: true as const,
      limit: null,
      usedToday: 0,
      remaining: null,
    };
  }

  const usedToday = await prisma.aiReport.count({
    where: {
      userId,
      createdAt: { gte: startOfUtcDay() },
    },
  });

  return {
    unlimited: false as const,
    limit: AI_REPORT_DAILY_LIMIT,
    usedToday,
    remaining: Math.max(0, AI_REPORT_DAILY_LIMIT - usedToday),
  };
}

export async function assertCanGenerateAiReport(userId: string, role?: Role | string | null) {
  const quota = await getAiReportQuota(userId, role);
  if (!quota.unlimited && (quota.remaining ?? 0) <= 0) {
    throw new Error("DAILY_LIMIT");
  }
  return quota;
}
