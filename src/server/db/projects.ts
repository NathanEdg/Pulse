import { create } from "domain";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

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

