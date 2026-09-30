import { pgTable, uuid, text, timestamp, boolean, pgEnum, uniqueIndex, index, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const snippetTypeEnum = pgEnum("snippet_type", [
  "code",
  "terminal",
  "sql",
  "prompt",
  "regex",
  "text",
  "other",
]);

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("folders_user_id_idx").on(table.userId),
    index("folders_parent_id_idx").on(table.parentId),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "folders_parent_id_fk",
    }).onDelete("set null"),
  ]
);

export const snippets = pgTable(
  "snippets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    description: text("description"),
    type: snippetTypeEnum("type").default("code").notNull(),
    language: text("language"),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("snippets_user_id_idx").on(table.userId),
    index("snippets_folder_id_idx").on(table.folderId),
    index("snippets_is_favorite_idx").on(table.isFavorite),
    index("snippets_updated_at_idx").on(table.updatedAt),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tags_user_id_idx").on(table.userId),
    uniqueIndex("tags_user_id_normalized_name_unique_idx").on(table.userId, table.normalizedName),
  ]
);

export const snippetTags = pgTable(
  "snippet_tags",
  {
    snippetId: uuid("snippet_id")
      .notNull()
      .references(() => snippets.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.snippetId, table.tagId] }),
    index("snippet_tags_tag_id_idx").on(table.tagId),
  ]
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "folder_parent_child",
  }),
  children: many(folders, {
    relationName: "folder_parent_child",
  }),
  snippets: many(snippets),
}));

export const snippetsRelations = relations(snippets, ({ one, many }) => ({
  folder: one(folders, {
    fields: [snippets.folderId],
    references: [folders.id],
  }),
  snippetTags: many(snippetTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  snippetTags: many(snippetTags),
}));

export const snippetTagsRelations = relations(snippetTags, ({ one }) => ({
  snippet: one(snippets, {
    fields: [snippetTags.snippetId],
    references: [snippets.id],
  }),
  tag: one(tags, {
    fields: [snippetTags.tagId],
    references: [tags.id],
  }),
}));

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Snippet = typeof snippets.$inferSelect;
export type NewSnippet = typeof snippets.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type SnippetTag = typeof snippetTags.$inferSelect;
