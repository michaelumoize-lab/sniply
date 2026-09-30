"use server";

import { db, getPoolDb } from "@/lib/db";
import { folders, snippets } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createFolder(name: string, parentId?: string | null) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Folder name cannot be empty");
  }

  const [newFolder] = await db
    .insert(folders)
    .values({
      userId: user.id,
      name: cleanName,
      parentId: parentId || null,
    })
    .returning();

  revalidatePath("/dashboard");
  return newFolder;
}

export async function renameFolder(folderId: string, newName: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const cleanName = newName.trim();
  if (!cleanName) {
    throw new Error("Folder name cannot be empty");
  }

  await db
    .update(folders)
    .set({ name: cleanName })
    .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)));

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Safe folder deletion:
 * Moves subfolders to the deleted folder's parent.
 * Re-parents child snippets to root (folder_id = NULL).
 * Zero content loss guaranteed.
 */
export async function deleteFolder(folderId: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const poolDb = getPoolDb();
  await poolDb.transaction(async (tx) => {
    // 1. Fetch target folder to identify its parent
    const [targetFolder] = await tx
      .select({ id: folders.id, parentId: folders.parentId })
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)))
      .limit(1);

    if (!targetFolder) {
      throw new Error("Folder not found");
    }

    const newParentId = targetFolder.parentId;

    // 2. Re-parent all subfolders to this folder's parent
    await tx
      .update(folders)
      .set({ parentId: newParentId })
      .where(and(eq(folders.parentId, folderId), eq(folders.userId, user.id)));

    // 3. Move contained snippets to unorganized root (folder_id = NULL)
    await tx
      .update(snippets)
      .set({ folderId: null })
      .where(and(eq(snippets.folderId, folderId), eq(snippets.userId, user.id)));

    // 4. Delete the folder itself
    await tx
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, user.id)));
  });

  revalidatePath("/dashboard");
  return { success: true };
}
