import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./schema";
import { relations } from "drizzle-orm";

export const program = pgTable("program", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active")
    .$default(() => true)
    .notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const programRelations = relations(program, ({ one }) => ({
  organization: one(organization, {
    fields: [program.organizationId],
    references: [organization.id],
  }),
}));
