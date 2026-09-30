"use server";

import { db } from "@/lib/db";
import { tags, snippetTags } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUserTagsWithCounts() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      normalizedName: tags.normalizedName,
      count: sql<number>`cast(count(${snippetTags.snippetId}) as integer)`,
    })
    .from(tags)
    .leftJoin(snippetTags, eq(tags.id, snippetTags.tagId))
    .where(eq(tags.userId, user.id))
    .groupBy(tags.id, tags.name, tags.normalizedName)
    .orderBy(tags.name);

  return result;
}

export async function renameTag(tagId: string, newName: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const cleanName = newName.trim().replace(/^#/, "");
  if (!cleanName) {
    throw new Error("Tag name cannot be empty");
  }

  const normalized = cleanName.toLowerCase();

  await db
    .update(tags)
    .set({
      name: cleanName,
      normalizedName: normalized,
    })
    .where(and(eq(tags.id, tagId), eq(tags.userId, user.id)));

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTag(tagId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, user.id)));

  revalidatePath("/dashboard");
  return { success: true };
}
