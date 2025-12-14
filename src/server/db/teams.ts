import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { program } from "./programs";
import { user } from "./schema";

export const team = pgTable("team", {
  id: text("id").primaryKey(),
  program_id: text("program_id")
    .notNull()
    .references(() => program.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  lead_id: text("lead_id").references(() => user.id),
  colead_id: text("colead_id").references(() => user.id),
  private: boolean("private").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const team_member = pgTable("team_member", {
  id: text("id").primaryKey(),
  team_id: text("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const teamRelations = relations(team, ({ one, many }) => ({
  program: one(program, {
    fields: [team.program_id],
    references: [program.id],
  }),
  lead: one(user, {
    fields: [team.lead_id],
    references: [user.id],
    relationName: "teamLead",
  }),
  colead: one(user, {
    fields: [team.colead_id],
    references: [user.id],
    relationName: "teamColead",
  }),
  teamMembers: many(team_member),
}));

export const teamMemberRelations = relations(team_member, ({ one }) => ({
  team: one(team, {
    fields: [team_member.team_id],
    references: [team.id],
  }),
  user: one(user, {
    fields: [team_member.user_id],
    references: [user.id],
  }),
}));
