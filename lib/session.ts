import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth(locale: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/connexion`);
  }
  return session;
}
