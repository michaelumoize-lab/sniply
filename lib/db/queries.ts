import { db } from "@/lib/db";
import { snippets, folders, tags, snippetTags } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function getDashboardInitialData(userId: string) {
  // 1. Fetch all user folders
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      parentId: folders.parentId,
      createdAt: folders.createdAt,
    })
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(folders.name);

  // 2. Fetch tags with counts (only tags attached to at least 1 active snippet)
  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      normalizedName: tags.normalizedName,
      count: sql<number>`cast(count(${snippetTags.snippetId}) as integer)`,
    })
    .from(tags)
    .innerJoin(snippetTags, eq(tags.id, snippetTags.tagId))
    .where(eq(tags.userId, userId))
    .groupBy(tags.id, tags.name, tags.normalizedName)
    .having(sql`count(${snippetTags.snippetId}) > 0`)
    .orderBy(tags.name);

  // 3. Fetch snippets with full content for instant server rendering
  const snippetRows = await db
    .select({
      id: snippets.id,
      title: snippets.title,
      description: snippets.description,
      content: snippets.content,
      contentPreview: sql<string>`substring(${snippets.content} from 1 for 250)`,
      type: snippets.type,
      language: snippets.language,
      isFavorite: snippets.isFavorite,
      folderId: snippets.folderId,
      folderName: folders.name,
      createdAt: snippets.createdAt,
      updatedAt: snippets.updatedAt,
    })
    .from(snippets)
    .leftJoin(folders, eq(snippets.folderId, folders.id))
    .where(eq(snippets.userId, userId))
    .orderBy(desc(snippets.updatedAt));

  // 4. Fetch tag associations for these snippets
  const allSnippetTags = await db
    .select({
      snippetId: snippetTags.snippetId,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(snippetTags)
    .innerJoin(tags, eq(snippetTags.tagId, tags.id))
    .where(eq(tags.userId, userId));

  const tagsBySnippetId: Record<string, string[]> = {};
  const tagObjectsBySnippetId: Record<string, { id: string; name: string }[]> = {};
  for (const st of allSnippetTags) {
    if (!tagsBySnippetId[st.snippetId]) {
      tagsBySnippetId[st.snippetId] = [];
      tagObjectsBySnippetId[st.snippetId] = [];
    }
    tagsBySnippetId[st.snippetId].push(st.tagName);
    tagObjectsBySnippetId[st.snippetId].push({ id: st.tagId, name: st.tagName });
  }

  const searchIndex = snippetRows.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    content: s.content,
    contentPreview: s.contentPreview || "",
    type: s.type,
    language: s.language,
    isFavorite: s.isFavorite,
    folderId: s.folderId,
    folderName: s.folderName,
    tags: tagsBySnippetId[s.id] || [],
    tagObjects: tagObjectsBySnippetId[s.id] || [],
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
  }));

  return {
    folders: userFolders,
    tags: userTags,
    snippets: searchIndex,
  };
}
