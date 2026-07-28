import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { redirect } from "next/navigation";

export async function requireAuth(locale: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/connexion`);
  }
  return session;
}

export async function requireSuperAdmin(locale: string) {
  const session = await requireAuth(locale);
  if (!isSuperAdmin(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }
  return session;
}
