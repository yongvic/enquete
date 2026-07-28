import { Header } from "@/components/Header";
import { SurveyWizard } from "@/components/SurveyWizard";
import { getDraft, getMyDrafts } from "@/lib/actions/survey";
import { requireAuth } from "@/lib/session";
import { setRequestLocale } from "next-intl/server";

export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { locale } = await params;
  const { draft: draftId } = await searchParams;
  setRequestLocale(locale);
  const session = await requireAuth(locale);

  const drafts = await getMyDrafts();
  const initialDraft = draftId ? await getDraft(draftId) : null;

  return (
    <>
      <Header isLoggedIn role={session.user.role} />
      <div className="px-5 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto">
        <SurveyWizard drafts={drafts} initialDraft={initialDraft} />
      </div>
    </>
  );
}
