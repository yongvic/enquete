"use server";

import { auth } from "@/lib/auth";
import { ENQUETE_TEMPLATE } from "@/lib/templates/enquete";
import { canAccessEnqueteTemplate } from "@/lib/template-access";

export async function loadEnqueteTemplateForUser() {
  const session = await auth();
  if (!session?.user?.email || !canAccessEnqueteTemplate(session.user.email)) {
    return { error: "forbidden" as const };
  }
  return { template: ENQUETE_TEMPLATE };
}
