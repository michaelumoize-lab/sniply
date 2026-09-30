import { getAuthenticatedUser } from "@/lib/auth/server";
import { getDashboardInitialData } from "@/lib/db/queries";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ snippet?: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/");
  }

  const initialData = await getDashboardInitialData(user.id);
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialSnippetId =
    resolvedParams?.snippet ||
    (initialData.snippets.length > 0 ? initialData.snippets[0].id : null);

  const initialSnippet = initialSnippetId
    ? initialData.snippets.find((s) => s.id === initialSnippetId) ||
      (initialData.snippets.length > 0 ? initialData.snippets[0] : null)
    : null;

  const initialSnippetDetail = initialSnippet
    ? {
        id: initialSnippet.id,
        title: initialSnippet.title,
        content: initialSnippet.content,
        description: initialSnippet.description,
        type: initialSnippet.type,
        language: initialSnippet.language,
        isFavorite: initialSnippet.isFavorite,
        folderId: initialSnippet.folderId,
        folderName: initialSnippet.folderName,
        createdAt: initialSnippet.createdAt,
        updatedAt: initialSnippet.updatedAt,
        tags: (initialSnippet as any).tagObjects || [],
      }
    : null;

  return (
    <DashboardView
      initialData={initialData}
      initialActiveSnippetId={initialSnippet?.id || null}
      initialActiveSnippetDetail={initialSnippetDetail}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }}
    />
  );
}
