import { AppHeader } from "@/components/AppHeader";
import { SurveyWizard } from "@/components/SurveyWizard";
import { getDraft, getMyDrafts, getPublishedSurveyForEdit } from "@/lib/actions/survey";
import { requireAuth } from "@/lib/session";
import { canAccessEnqueteTemplate } from "@/lib/template-access";
import { buildPageMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    path: "/creer",
    title: locale === "en" ? "Create a survey" : "Créer un sondage",
    noIndex: true,
  });
}

export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ draft?: string; edit?: string }>;
}) {
  const { locale } = await params;
  const { draft: draftId, edit: editId } = await searchParams;
  setRequestLocale(locale);
  const session = await requireAuth(locale);

  const drafts = await getMyDrafts();
  const initialPublished = editId ? await getPublishedSurveyForEdit(editId) : null;
  const initialDraft = !initialPublished && draftId ? await getDraft(draftId) : null;
  const canUseTemplate = canAccessEnqueteTemplate(session.user.email);

  return (
    <>
      <AppHeader />
      <div className="sondage-page">
        <SurveyWizard
          drafts={drafts}
          initialDraft={initialDraft}
          initialPublished={initialPublished}
          canUseTemplate={canUseTemplate}
        />
      </div>
    </>
  );
}
