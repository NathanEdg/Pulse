import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { program } from "./programs";

export const cycleStatusEnum = pgEnum("cycle_status", [
  "planned",
  "active",
  "completed",
]);

export const cycle = pgTable("cycle", {
  id: text("id").primaryKey(),
  program_id: text("program_id")
    .notNull()
    .references(() => program.id),
  cycle_number: text("cycle_number").notNull(),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  goal: text("goal").notNull(),
  status: cycleStatusEnum("status").notNull(),
});

export const cycleRelations = relations(cycle, ({ one }) => ({
  program: one(program, {
    fields: [cycle.program_id],
    references: [program.id],
  }),
}));
