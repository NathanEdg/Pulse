import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { program } from "./programs";
import { cycle } from "./cycles";
import { project } from "./projects";
import { user } from "./schema";

export const taskStatus = pgEnum("task_status", [
  "backlog",
  "planned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const task = pgTable("task", {
  id: text("id").primaryKey(),
  program_id: text("program_id").notNull(),
  cycle_id: text("cycle_id").notNull(),
  project_id: text("project_id").notNull(),
  team_id: text("team_id"),
  title: text("title").notNull(),
  description: text("description"),
  lead_id: text("lead_id"),
  assignees_ids: text("assignees_ids").array().notNull(),
  status: taskStatus("status").notNull(),
  priority: text("priority").notNull(),
  tags: text("tags").array().notNull(),
  depends_on: text("depends_on").array().notNull(),
  start_date: timestamp("start_date"),
  due_date: timestamp("due_date"),
  subtasks_ids: text("subtasks_ids").array().notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const taskUpdate = pgTable("task_update", {
  id: text("id").primaryKey(),
  task_id: text("task_id")
    .notNull()
    .references(() => task.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id),
  update_type: text("update_type").notNull(),
  content: text("content").notNull(), // json
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const taskDependency = pgTable(
  "task_dependency",
  {
    task_id: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    dependency_id: text("dependency_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.task_id, table.dependency_id] }),
  }),
);

export const taskPriority = pgTable("task_priority", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  program_id: text("program_id").notNull(),
  color: text("color").notNull(),
  sort_order: text("sort_order").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const taskAssignee = pgTable(
  "task_assignee",
  {
    task_id: text("task_id")
      .notNull()
      .references(() => task.id),
    user_id: text("user_id")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.task_id, table.user_id] }),
  }),
);

export const taskRelations = relations(task, ({ one, many }) => ({
  program: one(program, {
    fields: [task.program_id],
    references: [program.id],
  }),
  cycle: one(cycle, {
    fields: [task.cycle_id],
    references: [cycle.id],
  }),
  project: one(project, {
    fields: [task.project_id],
    references: [project.id],
  }),
  priority: one(taskPriority, {
    fields: [task.priority],
    references: [taskPriority.id],
  }),
  assignees: many(taskAssignee),
  lead: one(user, {
    fields: [task.lead_id],
    references: [user.id],
  }),
  dependencies: many(taskDependency, {
    relationName: "taskDependencies",
  }),
  dependents: many(taskDependency, {
    relationName: "dependsOnTasks",
  }),
  parent: one(task, {
    fields: [task.id],
    references: [task.subtasks_ids],
    relationName: "taskSubtasks",
  }),
  subtasks: many(task, {
    relationName: "taskSubtasks",
  }),
}));

export const taskAssigneeRelations = relations(taskAssignee, ({ one }) => ({
  task: one(task, {
    fields: [taskAssignee.task_id],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskAssignee.user_id],
    references: [user.id],
  }),
}));

export const taskDependencyRelations = relations(taskDependency, ({ one }) => ({
  task: one(task, {
    fields: [taskDependency.task_id],
    references: [task.id],
    relationName: "taskDependencies",
  }),
  dependency: one(task, {
    fields: [taskDependency.dependency_id],
    references: [task.id],
    relationName: "dependsOnTasks",
  }),
}));

export const taskPriorityRelations = relations(taskPriority, ({ one }) => ({
  program: one(program, {
    fields: [taskPriority.program_id],
    references: [program.id],
  }),
}));
