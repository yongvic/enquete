import { auth } from "@/lib/auth";
import { Navbar } from "./Navbar";

export async function AppHeader() {
  const session = await auth();
  return <Navbar isLoggedIn={!!session?.user} role={session?.user?.role} />;
}
