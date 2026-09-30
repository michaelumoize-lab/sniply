"use server";

import { db, getPoolDb } from "@/lib/db";
import { snippets, tags, snippetTags, folders } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { deriveTitleFromContent } from "@/lib/utils/title-generator";
import { isWithinByteLimit, MAX_SNIPPET_BYTES } from "@/lib/utils/bytes";
import { revalidatePath } from "next/cache";

export interface CreateSnippetInput {
  id?: string;
  title?: string;
  content: string;
  description?: string | null;
  type?: "code" | "terminal" | "sql" | "prompt" | "regex" | "text" | "other";
  language?: string | null;
  isFavorite?: boolean;
  folderId?: string | null;
  tags?: string[];
}

export async function createSnippet(input: CreateSnippetInput) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!input.content || !input.content.trim()) {
    throw new Error("Snippet content cannot be empty");
  }

  if (!isWithinByteLimit(input.content)) {
    throw new Error(`Snippet exceeds maximum size of ${MAX_SNIPPET_BYTES / 1024} KB`);
  }

  const finalTitle = input.title && input.title.trim()
    ? input.title.trim()
    : deriveTitleFromContent(input.content);

  const snippetId = input.id || crypto.randomUUID();

  // Use interactive WebSocket pool transaction for multi-table insertion
  const poolDb = getPoolDb();
  await poolDb.transaction(async (tx) => {
    // 1. Insert snippet
    await tx.insert(snippets).values({
      id: snippetId,
      userId: user.id,
      title: finalTitle,
      content: input.content,
      description: input.description?.trim() || null,
      type: input.type || "code",
      language: input.language?.trim().toLowerCase() || null,
      isFavorite: input.isFavorite || false,
      folderId: input.folderId || null,
    });

    // 2. Handle tags if provided
    if (input.tags && input.tags.length > 0) {
      const cleanTags = Array.from(
        new Set(input.tags.map((t) => t.trim().replace(/^#/, "")).filter((t) => t.length > 0))
      );

      for (const tagName of cleanTags) {
        const normalized = tagName.toLowerCase();

        // Find existing tag or create new one
        let existingTag = await tx
          .select({ id: tags.id })
          .from(tags)
          .where(and(eq(tags.userId, user.id), eq(tags.normalizedName, normalized)))
          .limit(1);

        let tagId: string;
        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const inserted = await tx
            .insert(tags)
            .values({
              userId: user.id,
              name: tagName,
              normalizedName: normalized,
            })
            .returning({ id: tags.id });
          tagId = inserted[0].id;
        }

        // Attach tag to snippet
        await tx
          .insert(snippetTags)
          .values({
            snippetId,
            tagId,
          })
          .onConflictDoNothing();
      }
    }
  });

  revalidatePath("/dashboard");
  return { id: snippetId, title: finalTitle };
}

export async function updateSnippet(
  snippetId: string,
  input: Partial<CreateSnippetInput>
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (input.content !== undefined) {
    if (!input.content.trim()) {
      throw new Error("Snippet content cannot be empty");
    }
    if (!isWithinByteLimit(input.content)) {
      throw new Error(`Snippet exceeds maximum size of ${MAX_SNIPPET_BYTES / 1024} KB`);
    }
  }

  const poolDb = getPoolDb();
  await poolDb.transaction(async (tx) => {
    // Ensure ownership
    const existing = await tx
      .select({ id: snippets.id })
      .from(snippets)
      .where(and(eq(snippets.id, snippetId), eq(snippets.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Snippet not found or unauthorized");
    }

    const updates: Partial<typeof snippets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.content !== undefined) updates.content = input.content;
    if (input.description !== undefined) updates.description = input.description?.trim() || null;
    if (input.type !== undefined) updates.type = input.type;
    if (input.language !== undefined) updates.language = input.language?.trim().toLowerCase() || null;
    if (input.isFavorite !== undefined) updates.isFavorite = input.isFavorite;
    if (input.folderId !== undefined) updates.folderId = input.folderId;

    await tx
      .update(snippets)
      .set(updates)
      .where(and(eq(snippets.id, snippetId), eq(snippets.userId, user.id)));

    // Sync tags if passed
    if (input.tags !== undefined) {
      // Remove current associations
      await tx.delete(snippetTags).where(eq(snippetTags.snippetId, snippetId));

      const cleanTags = Array.from(
        new Set(input.tags.map((t) => t.trim().replace(/^#/, "")).filter((t) => t.length > 0))
      );

      for (const tagName of cleanTags) {
        const normalized = tagName.toLowerCase();
        let existingTag = await tx
          .select({ id: tags.id })
          .from(tags)
          .where(and(eq(tags.userId, user.id), eq(tags.normalizedName, normalized)))
          .limit(1);

        let tagId: string;
        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const inserted = await tx
            .insert(tags)
            .values({
              userId: user.id,
              name: tagName,
              normalizedName: normalized,
            })
            .returning({ id: tags.id });
          tagId = inserted[0].id;
        }

        await tx
          .insert(snippetTags)
          .values({
            snippetId,
            tagId,
          })
          .onConflictDoNothing();
      }

      // Clean up orphaned tags for this user that no longer have any associated snippets
      const orphanedTags = await tx
        .select({ id: tags.id })
        .from(tags)
        .leftJoin(snippetTags, eq(tags.id, snippetTags.tagId))
        .where(and(eq(tags.userId, user.id), sql`${snippetTags.snippetId} IS NULL`));

      if (orphanedTags.length > 0) {
        await tx
          .delete(tags)
          .where(
            and(
              eq(tags.userId, user.id),
              inArray(tags.id, orphanedTags.map((t) => t.id))
            )
          );
      }
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleFavorite(snippetId: string, isFavorite: boolean) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fast single write via HTTP driver
  await db
    .update(snippets)
    .set({ isFavorite, updatedAt: new Date() })
    .where(and(eq(snippets.id, snippetId), eq(snippets.userId, user.id)));

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSnippet(snippetId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // 1. Cascade delete handles snippet_tags automatically via foreign key
  await db
    .delete(snippets)
    .where(and(eq(snippets.id, snippetId), eq(snippets.userId, user.id)));

  // 2. Clean up orphaned tags that no longer have any associated snippets
  const orphanedTags = await db
    .select({ id: tags.id })
    .from(tags)
    .leftJoin(snippetTags, eq(tags.id, snippetTags.tagId))
    .where(and(eq(tags.userId, user.id), sql`${snippetTags.snippetId} IS NULL`));

  if (orphanedTags.length > 0) {
    await db
      .delete(tags)
      .where(
        and(
          eq(tags.userId, user.id),
          inArray(tags.id, orphanedTags.map((t) => t.id))
        )
      );
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function duplicateSnippet(snippetId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const existing = await db
    .select()
    .from(snippets)
    .where(and(eq(snippets.id, snippetId), eq(snippets.userId, user.id)))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Snippet not found");
  }

  const original = existing[0];
  const newSnippetId = crypto.randomUUID();

  // Fetch original tags
  const origTags = await db
    .select({ name: tags.name })
    .from(snippetTags)
    .innerJoin(tags, eq(snippetTags.tagId, tags.id))
    .where(eq(snippetTags.snippetId, snippetId));

  return await createSnippet({
    id: newSnippetId,
    title: `${original.title} (Copy)`,
    content: original.content,
    description: original.description,
    type: original.type,
    language: original.language,
    isFavorite: false,
    folderId: original.folderId,
    tags: origTags.map((t) => t.name),
  });
}

export async function getSnippetFullContent(snippetId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await db
    .select({
      id: snippets.id,
      title: snippets.title,
      content: snippets.content,
      description: snippets.description,
      type: snippets.type,
      language: snippets.language,
      isFavorite: snippets.isFavorite,
      folderId: snippets.folderId,
      createdAt: snippets.createdAt,
      updatedAt: snippets.updatedAt,
      folderName: folders.name,
    })
    .from(snippets)
    .leftJoin(folders, eq(snippets.folderId, folders.id))
    .where(and(eq(snippets.id, snippetId), eq(snippets.userId, user.id)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const item = result[0];

  const tagRows = await db
    .select({ id: tags.id, name: tags.name })
    .from(snippetTags)
    .innerJoin(tags, eq(snippetTags.tagId, tags.id))
    .where(eq(snippetTags.snippetId, snippetId));

  return {
    ...item,
    tags: tagRows,
  };
}
