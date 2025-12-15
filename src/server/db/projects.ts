import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  program_id: text("program_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  lead_id: text("lead_id").notNull(),
  sort_order: integer("sort_order").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});
