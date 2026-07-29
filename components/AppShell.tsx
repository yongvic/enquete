import { getSiteConfig } from "@/lib/site";
import { SiteFooter } from "./SiteFooter";
import { FeedbackWidget } from "./FeedbackWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  const site = getSiteConfig();

  return (
    <div className="app-shell flex flex-col min-h-[100dvh] w-full overflow-x-hidden">
      <main className="flex-1 w-full">{children}</main>
      <SiteFooter
        authorName={site.authorName}
        whatsappUrl={site.whatsappUrl || undefined}
        linkedinUrl={site.linkedinUrl || undefined}
        githubUrl={site.githubUrl || undefined}
      />
      <FeedbackWidget />
    </div>
  );
}
