import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface LocalSnippetDraft {
  id: string;
  title: string;
  content: string;
  description?: string | null;
  type: string;
  language?: string | null;
  tags: string[];
  folderId?: string | null;
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
  syncStatus: "synced" | "syncing" | "failed";
}

export interface OutboxItem {
  id: string;
  action: "create" | "update" | "delete" | "favorite";
  payload: any;
  timestamp: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
}

interface SniplyDB extends DBSchema {
  drafts: {
    key: string;
    value: LocalSnippetDraft;
    indexes: { "by-status": string };
  };
  outbox: {
    key: string;
    value: OutboxItem;
    indexes: { "by-status": string };
  };
}

const DB_NAME = "sniply_vault_v1";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SniplyDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SniplyDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser environments"));
  }

  if (!dbPromise) {
    dbPromise = openDB<SniplyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("drafts")) {
          const draftStore = db.createObjectStore("drafts", { keyPath: "id" });
          draftStore.createIndex("by-status", "syncStatus");
        }
        if (!db.objectStoreNames.contains("outbox")) {
          const outboxStore = db.createObjectStore("outbox", { keyPath: "id" });
          outboxStore.createIndex("by-status", "status");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveLocalDraft(draft: LocalSnippetDraft): Promise<void> {
  try {
    const db = await getDb();
    await db.put("drafts", draft);
  } catch (err) {
    console.warn("Failed to persist draft to IndexedDB:", err);
  }
}

export async function getLocalDrafts(): Promise<LocalSnippetDraft[]> {
  try {
    const db = await getDb();
    return await db.getAll("drafts");
  } catch (err) {
    console.warn("Failed to read drafts from IndexedDB:", err);
    return [];
  }
}

export async function removeLocalDraft(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete("drafts", id);
  } catch (err) {
    console.warn("Failed to delete draft from IndexedDB:", err);
  }
}

export async function queueOutbox(action: OutboxItem["action"], payload: any): Promise<OutboxItem> {
  const item: OutboxItem = {
    id: payload.id || crypto.randomUUID(),
    action,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: "pending",
  };

  try {
    const db = await getDb();
    await db.put("outbox", item);
  } catch (err) {
    console.warn("Failed to queue item in IndexedDB outbox:", err);
  }

  return item;
}

export async function getPendingOutbox(): Promise<OutboxItem[]> {
  try {
    const db = await getDb();
    return await db.getAllFromIndex("outbox", "by-status", "pending");
  } catch (err) {
    console.warn("Failed to read pending outbox:", err);
    return [];
  }
}

export async function updateOutboxStatus(id: string, status: OutboxItem["status"]): Promise<void> {
  try {
    const db = await getDb();
    const item = await db.get("outbox", id);
    if (item) {
      item.status = status;
      if (status === "failed") {
        item.retryCount += 1;
      }
      await db.put("outbox", item);
    }
  } catch (err) {
    console.warn("Failed to update outbox status:", err);
  }
}

export async function removeOutboxItem(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete("outbox", id);
  } catch (err) {
    console.warn("Failed to delete outbox item:", err);
  }
}
